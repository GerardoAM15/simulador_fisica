/**
 * Circuitos de corriente continua: ley de Ohm, resistividad y resolución de redes con
 * Análisis Nodal Modificado (MNA).
 *
 * MNA plantea un sistema lineal  A x = z  con incógnitas:
 *   x = [ V₁ … V_{n−1} | i₁ … i_m ]
 * (voltajes de nodo respecto a tierra y corrientes de las fuentes de voltaje). Las filas de
 * nodo son la ley de corrientes de Kirchhoff (KCL) y las filas de fuente imponen V_a − V_b = ε.
 */

// ─────────────────────────── Ley de Ohm y resistividad ───────────────────────────

/** Ley de Ohm: I = V / R   [A] */
export const leyOhm = (V: number, R: number): number => V / R;

/** Potencia disipada: P = V I = I² R = V² / R   [W] */
export const potenciaResistencia = (V: number, R: number): number => (V * V) / R;

export interface Material {
  id: string;
  nombre: string;
  /** Resistividad a 20 °C [Ω·m] */
  rho: number;
  /** Coeficiente de temperatura α [1/°C] */
  alfa: number;
}

/** Valores típicos a 20 °C (Serway & Jewett, tabla 27.2). */
export const MATERIALES: Material[] = [
  { id: 'plata', nombre: 'Plata', rho: 1.59e-8, alfa: 3.8e-3 },
  { id: 'cobre', nombre: 'Cobre', rho: 1.7e-8, alfa: 3.9e-3 },
  { id: 'oro', nombre: 'Oro', rho: 2.44e-8, alfa: 3.4e-3 },
  { id: 'aluminio', nombre: 'Aluminio', rho: 2.82e-8, alfa: 3.9e-3 },
  { id: 'tungsteno', nombre: 'Tungsteno', rho: 5.6e-8, alfa: 4.5e-3 },
  { id: 'hierro', nombre: 'Hierro', rho: 10e-8, alfa: 5.0e-3 },
  { id: 'nicrom', nombre: 'Nicrom', rho: 1.0e-6, alfa: 0.4e-3 },
  { id: 'carbono', nombre: 'Carbono (grafito)', rho: 3.5e-5, alfa: -0.5e-3 },
];

/** Resistencia de un conductor uniforme: R = ρ L / A   [Ω] */
export const resistenciaConductor = (rho: number, L: number, A: number): number => (rho * L) / A;

/** Área de una sección circular de diámetro d: A = π d² / 4   [m²] */
export const areaCircular = (d: number): number => (Math.PI * d * d) / 4;

/** Variación lineal con la temperatura: ρ(T) = ρ₀ [1 + α (T − T₀)] */
export const resistividadTemperatura = (rho0: number, alfa: number, T: number, T0 = 20): number => rho0 * (1 + alfa * (T - T0));

// ─────────────────────────── Álgebra lineal ───────────────────────────

/**
 * Resuelve A x = b por eliminación de Gauss con pivoteo parcial.
 * Devuelve null si la matriz es singular (pivote despreciable frente a la escala de A).
 */
export function resolverSistemaLineal(A: readonly (readonly number[])[], b: readonly number[]): number[] | null {
  const n = b.length;
  const M = A.map((fila, i) => [...fila, b[i]]);
  let escala = 0;
  for (const fila of A) for (const v of fila) escala = Math.max(escala, Math.abs(v));
  const tolerancia = 1e-15 * (escala || 1);

  for (let k = 0; k < n; k++) {
    // Pivoteo parcial: fila con el mayor |M[i][k]|
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (Math.abs(M[p][k]) <= tolerancia) return null;
    [M[k], M[p]] = [M[p], M[k]];
    for (let i = k + 1; i < n; i++) {
      const f = M[i][k] / M[k][k];
      if (f === 0) continue;
      for (let j = k; j <= n; j++) M[i][j] -= f * M[k][j];
    }
  }
  // Sustitución hacia atrás
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

// ─────────────────────────── MNA ───────────────────────────

/**
 * Rama del circuito entre los nodos a y b:
 *  - 'R': resistencia [Ω]
 *  - 'V': fuente de voltaje ideal [V], con a = terminal + y b = terminal −
 *  - 'C': capacitor [F]; en régimen estacionario de CC es un circuito abierto
 *  - 'cable': conductor ideal (fuente de 0 V), útil para medir la corriente de un tramo
 */
export interface Rama {
  id: string;
  tipo: 'R' | 'V' | 'C' | 'cable';
  a: number;
  b: number;
  valor: number;
}

export interface ResultadoRama {
  id: string;
  /** Corriente que atraviesa el elemento de a hacia b [A] */
  corriente: number;
  /** Diferencia de potencial V_a − V_b [V] */
  voltaje: number;
  /** Potencia absorbida (V_a − V_b)·I [W]; negativa si el elemento entrega energía */
  potencia: number;
  /** Carga almacenada (solo capacitores) [C] */
  carga?: number;
}

export type ResultadoCircuito =
  | { ok: true; voltajes: number[]; ramas: ResultadoRama[] }
  | { ok: false; error: string };

/** Conductancia mínima de cada nodo a tierra (como en SPICE): evita matrices singulares por nodos flotantes. */
const G_MIN = 1e-12;
/**
 * Fuga simbólica de un capacitor, proporcional a C [S/F]. No altera el resultado de forma apreciable,
 * pero hace que capacitores en serie se repartan el voltaje como 1/C (igual carga), como en la realidad.
 */
const FUGA_CAPACITOR = 1e-4;

export function resolverCircuito(nNodos: number, ramas: readonly Rama[], tierra = 0): ResultadoCircuito {
  for (const r of ramas)
    if ((r.tipo === 'V' || r.tipo === 'cable') && r.a === r.b && (r.tipo === 'cable' || r.valor !== 0))
      return { ok: false, error: 'Cortocircuito: hay una fuente cuyos terminales están unidos por un cable.' };

  // Índice de fila de cada nodo (la tierra no tiene incógnita)
  const fila = (n: number) => (n === tierra ? -1 : n < tierra ? n : n - 1);
  const fuentes = ramas.filter((r) => r.tipo === 'V' || r.tipo === 'cable');
  const nV = nNodos - 1;
  const N = nV + fuentes.length;
  const A = Array.from({ length: N }, () => new Array<number>(N).fill(0));
  const z = new Array<number>(N).fill(0);

  /** Estampa una conductancia G entre a y b */
  const conductancia = (a: number, b: number, G: number) => {
    const i = fila(a);
    const j = fila(b);
    if (i >= 0) A[i][i] += G;
    if (j >= 0) A[j][j] += G;
    if (i >= 0 && j >= 0) {
      A[i][j] -= G;
      A[j][i] -= G;
    }
  };

  for (let i = 0; i < nV; i++) A[i][i] += G_MIN;
  for (const r of ramas) {
    if (r.tipo === 'R') conductancia(r.a, r.b, 1 / r.valor);
    else if (r.tipo === 'C') conductancia(r.a, r.b, FUGA_CAPACITOR * r.valor);
  }
  fuentes.forEach((r, k) => {
    const col = nV + k;
    const i = fila(r.a);
    const j = fila(r.b);
    // La corriente de la fuente sale del nodo a (KCL) y la fila de la fuente impone V_a − V_b = ε
    if (i >= 0) {
      A[i][col] += 1;
      A[col][i] += 1;
    }
    if (j >= 0) {
      A[j][col] -= 1;
      A[col][j] -= 1;
    }
    z[col] = r.tipo === 'V' ? r.valor : 0;
  });

  const x = resolverSistemaLineal(A, z);
  if (!x) return { ok: false, error: 'El circuito no tiene solución única: revisa si hay lazos formados solo por fuentes y cables.' };

  const voltajes = Array.from({ length: nNodos }, (_, n) => (fila(n) < 0 ? 0 : x[fila(n)]));
  const resultados = ramas.map((r): ResultadoRama => {
    const V = voltajes[r.a] - voltajes[r.b];
    let I = 0;
    if (r.tipo === 'R') I = V / r.valor;
    else if (r.tipo === 'V' || r.tipo === 'cable') I = x[nV + fuentes.indexOf(r)];
    const res: ResultadoRama = { id: r.id, corriente: I, voltaje: V, potencia: V * I };
    if (r.tipo === 'C') res.carga = r.valor * V;
    return res;
  });
  return { ok: true, voltajes, ramas: resultados };
}

// ─────────────────────────── Verificación de Kirchhoff ───────────────────────────

/** KCL: suma de corrientes que salen de cada nodo (debe ser ≈ 0). */
export function residuosKCL(nNodos: number, ramas: readonly Rama[], resultados: readonly ResultadoRama[]): number[] {
  const suma = new Array<number>(nNodos).fill(0);
  ramas.forEach((r, k) => {
    const I = resultados[k].corriente;
    suma[r.a] += I; // sale de a
    suma[r.b] -= I; // entra a b
  });
  return suma;
}

export interface Malla {
  /** Ramas recorridas; sentido = +1 si se recorren de a hacia b */
  ramas: { id: string; sentido: 1 | -1 }[];
  /** Σ caídas de voltaje a lo largo de la malla (debe ser ≈ 0) */
  suma: number;
}

/**
 * KVL en las mallas fundamentales: se construye un árbol generador del grafo; cada rama que no
 * pertenece al árbol cierra exactamente una malla independiente (hay m − n + c de ellas).
 */
export function mallasFundamentales(nNodos: number, ramas: readonly Rama[], resultados: readonly ResultadoRama[]): Malla[] {
  const ady: { vecino: number; rama: number; sentido: 1 | -1 }[][] = Array.from({ length: nNodos }, () => []);
  ramas.forEach((r, k) => {
    if (r.a === r.b) return;
    ady[r.a].push({ vecino: r.b, rama: k, sentido: 1 });
    ady[r.b].push({ vecino: r.a, rama: k, sentido: -1 });
  });

  // BFS: padre de cada nodo en el árbol y la rama que los une
  const padre = new Array<{ nodo: number; rama: number; sentido: 1 | -1 } | null>(nNodos).fill(null);
  const profundidad = new Array<number>(nNodos).fill(-1);
  const enArbol = new Set<number>();
  for (let raiz = 0; raiz < nNodos; raiz++) {
    if (profundidad[raiz] >= 0) continue;
    profundidad[raiz] = 0;
    const cola = [raiz];
    while (cola.length) {
      const u = cola.shift()!;
      for (const { vecino, rama, sentido } of ady[u]) {
        if (profundidad[vecino] >= 0) continue;
        profundidad[vecino] = profundidad[u] + 1;
        // Rama recorrida de vecino hacia u (subiendo al padre)
        padre[vecino] = { nodo: u, rama, sentido: (-sentido) as 1 | -1 };
        enArbol.add(rama);
        cola.push(vecino);
      }
    }
  }

  const mallas: Malla[] = [];
  ramas.forEach((r, k) => {
    if (enArbol.has(k) || r.a === r.b) return;
    // Malla: a → b por la cuerda, luego de b sube hasta el ancestro común y baja hasta a
    const subida: { rama: number; sentido: 1 | -1 }[] = [];
    const bajada: { rama: number; sentido: 1 | -1 }[] = [];
    let u = r.b;
    let v = r.a;
    while (u !== v) {
      if (profundidad[u] >= profundidad[v]) {
        const p = padre[u]!;
        subida.push({ rama: p.rama, sentido: p.sentido });
        u = p.nodo;
      } else {
        const p = padre[v]!;
        bajada.unshift({ rama: p.rama, sentido: (-p.sentido) as 1 | -1 });
        v = p.nodo;
      }
    }
    const recorrido = [{ rama: k, sentido: 1 as const }, ...subida, ...bajada];
    const suma = recorrido.reduce((s, x) => s + x.sentido * resultados[x.rama].voltaje, 0);
    mallas.push({ ramas: recorrido.map((x) => ({ id: ramas[x.rama].id, sentido: x.sentido })), suma });
  });
  return mallas;
}

// ─────────────────────────── Corriente en redes de cables ───────────────────────────

/**
 * Reparte la corriente dentro de una red de cables ideales unidos entre sí.
 * Como todos los cables están al mismo potencial eléctrico, MNA no distingue cuánta corriente va
 * por cada tramo; para visualizarla se supone que cada tramo tiene la misma resistencia mínima
 * y se resuelve L φ = inyección (L = laplaciano del grafo de cables). Corriente p→q = φ_p − φ_q.
 *
 * @param inyeccion corriente que los elementos inyectan en cada punto [A]
 * @param cables pares [p, q] de puntos unidos por un tramo de cable
 * @returns corriente de cada tramo, de p hacia q
 */
export function corrientesEnCables(nPuntos: number, cables: readonly [number, number][], inyeccion: readonly number[]): number[] {
  const ady: number[][] = Array.from({ length: nPuntos }, () => []);
  cables.forEach(([p, q], k) => {
    ady[p].push(k);
    ady[q].push(k);
  });
  const phi = new Array<number>(nPuntos).fill(0);
  const visitado = new Array<boolean>(nPuntos).fill(false);

  for (let inicio = 0; inicio < nPuntos; inicio++) {
    if (visitado[inicio] || ady[inicio].length === 0) continue;
    // Componente conexa de la red de cables
    const comp: number[] = [];
    const pila = [inicio];
    visitado[inicio] = true;
    while (pila.length) {
      const u = pila.pop()!;
      comp.push(u);
      for (const k of ady[u]) {
        const [p, q] = cables[k];
        const w = p === u ? q : p;
        if (!visitado[w]) {
          visitado[w] = true;
          pila.push(w);
        }
      }
    }
    if (comp.length < 2) continue;
    // Laplaciano reducido: el primer punto de la componente es la referencia (φ = 0)
    const idx = new Map(comp.slice(1).map((p, i) => [p, i]));
    const n = comp.length - 1;
    const L = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    const b = comp.slice(1).map((p) => inyeccion[p]);
    for (const p of comp)
      for (const k of ady[p]) {
        const [c1, c2] = cables[k];
        if (c1 !== p) continue; // cada tramo una sola vez
        const i = idx.get(c1);
        const j = idx.get(c2);
        if (i !== undefined) L[i][i] += 1;
        if (j !== undefined) L[j][j] += 1;
        if (i !== undefined && j !== undefined) {
          L[i][j] -= 1;
          L[j][i] -= 1;
        }
      }
    const sol = resolverSistemaLineal(L, b);
    if (sol) comp.slice(1).forEach((p, i) => (phi[p] = sol[i]));
  }
  return cables.map(([p, q]) => phi[p] - phi[q]);
}
