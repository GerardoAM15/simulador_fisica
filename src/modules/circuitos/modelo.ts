/**
 * Modelo del editor de circuitos (sin React): componentes sobre una grilla, cables por tramos
 * unitarios y conversión del dibujo a un circuito eléctrico que se resuelve con MNA.
 */
import {
  corrientesEnCables,
  mallasFundamentales,
  residuosKCL,
  resolverCircuito,
  type Malla,
  type Rama,
  type ResultadoRama,
} from '../../physics/circuits';

export interface Punto {
  x: number;
  y: number;
}

export type TipoComponente = 'fuente' | 'resistencia' | 'capacitor' | 'interruptor';

/** Dirección del componente en la grilla (y crece hacia abajo): 0 →, 1 ↓, 2 ←, 3 ↑ */
export type Direccion = 0 | 1 | 2 | 3;

/** Todos los componentes miden 2 celdas */
export const LARGO = 2;

/**
 * Componente entre `p` y `extremo(c)`. En la fuente el terminal + está en el extremo.
 * Valores: fuente [V], resistencia [Ω], capacitor [μF].
 */
export interface Componente {
  id: string;
  tipo: TipoComponente;
  nombre: string;
  p: Punto;
  dir: Direccion;
  valor: number;
  cerrado: boolean;
}

/** Tramo de cable entre dos puntos vecinos de la grilla */
export interface Cable {
  id: string;
  a: Punto;
  b: Punto;
}

export interface Circuito {
  componentes: Componente[];
  cables: Cable[];
}

export const PREFIJO: Record<TipoComponente, string> = { fuente: 'V', resistencia: 'R', capacitor: 'C', interruptor: 'S' };
export const VALOR_INICIAL: Record<TipoComponente, number> = { fuente: 12, resistencia: 100, capacitor: 10, interruptor: 0 };

const DIRS: Punto[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

export const clave = (p: Punto) => `${p.x},${p.y}`;
export const vectorDir = (d: Direccion) => DIRS[d];
export const extremo = (c: Pick<Componente, 'p' | 'dir'>): Punto => ({ x: c.p.x + LARGO * DIRS[c.dir].x, y: c.p.y + LARGO * DIRS[c.dir].y });

/** Gira 90° alrededor del centro del componente (el centro queda sobre la grilla). */
export function rotar(c: Componente): Componente {
  const u = DIRS[c.dir];
  const centro = { x: c.p.x + u.x, y: c.p.y + u.y };
  const dir = ((c.dir + 1) % 4) as Direccion;
  const v = DIRS[dir];
  return { ...c, dir, p: { x: centro.x - v.x, y: centro.y - v.y } };
}

let contadorIds = 0;
export const nuevoId = (prefijo: string) => `${prefijo}${++contadorIds}`;

/** Siguiente nombre libre para un tipo (R1, R2, …). */
export function siguienteNombre(c: Circuito, tipo: TipoComponente): string {
  const pre = PREFIJO[tipo];
  const usados = c.componentes.filter((x) => x.tipo === tipo).map((x) => Number(x.nombre.slice(pre.length)) || 0);
  return `${pre}${Math.max(0, ...usados) + 1}`;
}

/** Tramos unitarios de un cable en L (primero horizontal, luego vertical) de a hasta b. */
export function tramosEnL(a: Punto, b: Punto): [Punto, Punto][] {
  const tramos: [Punto, Punto][] = [];
  let p = { ...a };
  const paso = (dx: number, dy: number) => {
    const q = { x: p.x + dx, y: p.y + dy };
    tramos.push([p, q]);
    p = q;
  };
  while (p.x !== b.x) paso(Math.sign(b.x - p.x), 0);
  while (p.y !== b.y) paso(0, Math.sign(b.y - p.y));
  return tramos;
}

/** Agrega tramos de cable evitando duplicados. */
export function agregarTramos(cables: Cable[], tramos: [Punto, Punto][]): Cable[] {
  const existentes = new Set(cables.flatMap((c) => [`${clave(c.a)}|${clave(c.b)}`, `${clave(c.b)}|${clave(c.a)}`]));
  const nuevos = tramos
    .filter(([a, b]) => !existentes.has(`${clave(a)}|${clave(b)}`))
    .map(([a, b]) => ({ id: nuevoId('w'), a, b }));
  return [...cables, ...nuevos];
}

// ─────────────────────────── Presets ───────────────────────────

type DefComp = [TipoComponente, number, number, Direccion, number, boolean?];

function construir(defs: DefComp[], polilineas: [number, number][][]): Circuito {
  const c: Circuito = { componentes: [], cables: [] };
  for (const [tipo, x, y, dir, valor, abierto] of defs)
    c.componentes.push({ id: nuevoId('c'), tipo, nombre: siguienteNombre(c, tipo), p: { x, y }, dir, valor, cerrado: !abierto });
  for (const linea of polilineas)
    for (let i = 1; i < linea.length; i++)
      c.cables = agregarTramos(c.cables, tramosEnL({ x: linea[i - 1][0], y: linea[i - 1][1] }, { x: linea[i][0], y: linea[i][1] }));
  return c;
}

export type NombrePresetCircuito = 'serie' | 'paralelo' | 'mixto' | 'wheatstone';

export const PRESETS_CIRCUITO: Record<NombrePresetCircuito, { nombre: string; crear: () => Circuito }> = {
  serie: {
    nombre: 'Serie',
    crear: () =>
      construir(
        [['fuente', 2, 6, 3, 12], ['resistencia', 5, 2, 0, 100], ['resistencia', 12, 4, 1, 200], ['resistencia', 8, 8, 2, 300]],
        [[[2, 4], [2, 2], [5, 2]], [[7, 2], [12, 2], [12, 4]], [[12, 6], [12, 8], [8, 8]], [[6, 8], [2, 8], [2, 6]]],
      ),
  },
  paralelo: {
    nombre: 'Paralelo',
    crear: () =>
      construir(
        [['fuente', 2, 6, 3, 12], ['resistencia', 6, 4, 1, 100], ['resistencia', 9, 4, 1, 200], ['resistencia', 12, 4, 1, 300]],
        [
          [[2, 4], [2, 2], [12, 2], [12, 4]],
          [[2, 6], [2, 8], [12, 8], [12, 6]],
          [[6, 2], [6, 4]], [[6, 6], [6, 8]], [[9, 2], [9, 4]], [[9, 6], [9, 8]],
        ],
      ),
  },
  mixto: {
    nombre: 'Mixto',
    crear: () =>
      construir(
        [['fuente', 2, 6, 3, 12], ['resistencia', 4, 2, 0, 2], ['resistencia', 9, 4, 1, 6], ['resistencia', 12, 4, 1, 3], ['interruptor', 6, 8, 2, 0]],
        [
          [[2, 4], [2, 2], [4, 2]],
          [[6, 2], [12, 2], [12, 4]],
          [[9, 2], [9, 4]], [[9, 6], [9, 8]],
          [[12, 6], [12, 8], [6, 8]],
          [[4, 8], [2, 8], [2, 6]],
        ],
      ),
  },
  wheatstone: {
    nombre: 'Puente de Wheatstone',
    crear: () =>
      construir(
        [
          ['fuente', 1, 7, 3, 10],
          ['resistencia', 4, 3, 1, 100],
          ['resistencia', 4, 7, 1, 200],
          ['resistencia', 10, 3, 1, 150],
          ['resistencia', 10, 7, 1, 300],
          ['resistencia', 6, 6, 0, 50],
        ],
        [
          [[1, 5], [1, 2], [10, 2], [10, 3]], [[4, 2], [4, 3]],
          [[1, 7], [1, 10], [10, 10], [10, 9]], [[4, 10], [4, 9]],
          [[4, 5], [4, 7]], [[4, 6], [6, 6]],
          [[10, 5], [10, 7]], [[8, 6], [10, 6]],
        ],
      ),
  },
};

// ─────────────────────────── Análisis eléctrico ───────────────────────────

export interface ResultadoComponente extends ResultadoRama {
  /** Corriente en el sentido p → extremo [A] */
  corrientePE: number;
}

export interface Analisis {
  ok: boolean;
  error?: string;
  /** Nodo eléctrico de cada punto de la grilla usado */
  nodoDe: Map<string, number>;
  nNodos: number;
  tierra: number;
  voltajes: number[];
  componentes: Map<string, ResultadoComponente>;
  /** Corriente de cada tramo de cable de a → b [A] */
  cables: Map<string, number>;
  ramas: Rama[];
  kcl: number[];
  mallas: Malla[];
}

/**
 * Convierte el dibujo en un circuito: los puntos unidos por cables o interruptores cerrados forman un
 * mismo nodo (union-find); resistencias, capacitores y fuentes son las ramas de MNA.
 */
export function analizar(circ: Circuito): Analisis {
  const puntos = new Map<string, number>();
  const idx = (p: Punto) => {
    const k = clave(p);
    if (!puntos.has(k)) puntos.set(k, puntos.size);
    return puntos.get(k)!;
  };
  const comps = circ.componentes.map((c) => ({ c, i: idx(c.p), j: idx(extremo(c)) }));
  const tramos = circ.cables.map((w) => ({ w, i: idx(w.a), j: idx(w.b) }));

  // Union-find
  const padre = Array.from({ length: puntos.size }, (_, i) => i);
  const raiz = (i: number): number => (padre[i] === i ? i : (padre[i] = raiz(padre[i])));
  const unir = (i: number, j: number) => {
    padre[raiz(i)] = raiz(j);
  };
  for (const t of tramos) unir(t.i, t.j);
  for (const { c, i, j } of comps) if (c.tipo === 'interruptor' && c.cerrado) unir(i, j);

  const nodoDeRaiz = new Map<number, number>();
  const nodoPunto = (i: number) => {
    const r = raiz(i);
    if (!nodoDeRaiz.has(r)) nodoDeRaiz.set(r, nodoDeRaiz.size);
    return nodoDeRaiz.get(r)!;
  };
  const nodoDe = new Map<string, number>();
  for (const [k, i] of puntos) nodoDe.set(k, nodoPunto(i));
  const nNodos = Math.max(1, nodoDeRaiz.size);

  // Ramas MNA (en la fuente, a = terminal + = extremo)
  const ramas: Rama[] = [];
  const ramaDe = new Map<string, number>();
  for (const { c, i, j } of comps) {
    if (c.tipo === 'interruptor') continue;
    ramaDe.set(c.id, ramas.length);
    const [a, b] = c.tipo === 'fuente' ? [nodoPunto(j), nodoPunto(i)] : [nodoPunto(i), nodoPunto(j)];
    ramas.push({ id: c.nombre, tipo: c.tipo === 'fuente' ? 'V' : c.tipo === 'resistencia' ? 'R' : 'C', a, b, valor: c.tipo === 'capacitor' ? c.valor * 1e-6 : c.valor });
  }
  const fuente = ramas.find((r) => r.tipo === 'V');
  const tierra = fuente ? fuente.b : 0;

  const vacio: Analisis = {
    ok: false,
    nodoDe,
    nNodos,
    tierra,
    voltajes: new Array(nNodos).fill(0),
    componentes: new Map(),
    cables: new Map(),
    ramas,
    kcl: [],
    mallas: [],
  };
  if (ramas.length === 0) return { ...vacio, ok: true };
  const res = resolverCircuito(nNodos, ramas, tierra);
  if (!res.ok) return { ...vacio, error: res.error };

  // Los residuos numéricos de G_min (~10⁻¹² relativo, o ~pA si el circuito está abierto) se muestran
  // como cero exacto. El piso de 10⁻¹⁰ A queda muy por debajo de cualquier corriente real del editor.
  const iRef = Math.max(...res.ramas.map((r) => Math.abs(r.corriente)), 0.1);
  const vRef = Math.max(...res.voltajes.map(Math.abs), 1e-300);
  const limpiar = (x: number, ref: number) => (Math.abs(x) < 1e-9 * ref ? 0 : x);

  // Corriente de cada componente en el sentido p → extremo (la fuente se define de extremo a p)
  const componentes = new Map<string, ResultadoComponente>();
  for (const { c } of comps) {
    const k = ramaDe.get(c.id);
    if (k === undefined) continue;
    const r = res.ramas[k];
    const I = limpiar(r.corriente, iRef);
    const V = limpiar(r.voltaje, vRef);
    componentes.set(c.id, { ...r, corriente: I, voltaje: V, potencia: I * V, corrientePE: c.tipo === 'fuente' ? -I : I });
  }

  // Reparto de la corriente en la red de cables (incluye interruptores cerrados como tramos)
  const inyeccion = new Array<number>(puntos.size).fill(0);
  for (const { c, i, j } of comps) {
    const I = componentes.get(c.id)?.corrientePE ?? 0;
    inyeccion[j] += I; // la corriente sale del componente por su extremo
    inyeccion[i] -= I;
  }
  const aristas: [number, number][] = tramos.map((t) => [t.i, t.j]);
  const interruptores = comps.filter(({ c }) => c.tipo === 'interruptor' && c.cerrado);
  for (const { i, j } of interruptores) aristas.push([i, j]);
  const Iaristas = corrientesEnCables(puntos.size, aristas, inyeccion);

  const cables = new Map<string, number>();
  tramos.forEach((t, k) => cables.set(t.w.id, limpiar(Iaristas[k], iRef)));
  interruptores.forEach(({ c }, k) => {
    const I = limpiar(Iaristas[tramos.length + k], iRef);
    componentes.set(c.id, { id: c.nombre, corriente: I, corrientePE: I, voltaje: 0, potencia: 0 });
  });
  // Interruptor abierto: no conduce, pero entre sus terminales puede haber voltaje
  for (const { c, i, j } of comps)
    if (c.tipo === 'interruptor' && !c.cerrado)
      componentes.set(c.id, { id: c.nombre, corriente: 0, corrientePE: 0, voltaje: res.voltajes[nodoPunto(i)] - res.voltajes[nodoPunto(j)], potencia: 0 });

  return {
    ok: true,
    nodoDe,
    nNodos,
    tierra,
    voltajes: res.voltajes,
    componentes,
    cables,
    ramas,
    kcl: residuosKCL(nNodos, ramas, res.ramas),
    mallas: mallasFundamentales(nNodos, ramas, res.ramas),
  };
}
