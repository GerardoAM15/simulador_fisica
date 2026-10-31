/**
 * Trazado de líneas de campo.
 *
 * Una línea de campo es una curva tangente al campo en cada punto. Parametrizada por la
 * longitud de arco s, cumple la EDO
 *   dr/ds = σ F(r) / |F(r)|        (σ = +1 a favor del campo, −1 en contra)
 * que se integra con RK4. El trazador es genérico: sirve para E (Unidad 1) y para B (Unidad 4).
 */
import { campoElectrico, R_SUAVIZADO, type CargaPuntual } from './electrostatics';
import { MICRO } from './constants';
import type { Vec3 } from './vector';

export type CampoVectorial = (p: Vec3) => Vec3;

export interface Caja {
  min: Vec3;
  max: Vec3;
}

export interface OpcionesTrazado {
  /** Longitud de arco por paso Δs [m] */
  paso: number;
  maxPasos: number;
  /** La línea se detiene al salir de esta caja */
  limites: Caja;
  /** Por debajo de esta magnitud se considera un punto de campo nulo y se detiene */
  campoMinimo?: number;
}

export type MotivoFin = 'sumidero' | 'limite' | 'maxPasos' | 'campoNulo';

export interface ResultadoTrazado {
  puntos: Vec3[];
  motivo: MotivoFin;
}

const dentro = (p: Vec3, c: Caja) =>
  p.x >= c.min.x && p.x <= c.max.x && p.y >= c.min.y && p.y <= c.max.y && p.z >= c.min.z && p.z <= c.max.z;

/**
 * Integra una línea de campo desde `inicio`.
 * `sumidero(p)` permite terminar la línea (p. ej. al llegar a una carga); si devuelve un punto,
 * este se agrega como último punto de la línea.
 */
export function trazarLinea(
  campo: CampoVectorial,
  inicio: Vec3,
  sentido: 1 | -1,
  op: OpcionesTrazado,
  sumidero?: (p: Vec3) => Vec3 | null,
): ResultadoTrazado {
  const minimo = op.campoMinimo ?? 1e-12;
  let nulo = false;

  // Dirección unitaria σF/|F|; marca `nulo` si el campo se anula
  const dir = (p: Vec3): Vec3 => {
    const F = campo(p);
    const n = Math.hypot(F.x, F.y, F.z);
    if (n < minimo) {
      nulo = true;
      return { x: 0, y: 0, z: 0 };
    }
    const s = sentido / n;
    return { x: F.x * s, y: F.y * s, z: F.z * s };
  };
  const mover = (p: Vec3, d: Vec3, h: number): Vec3 => ({ x: p.x + d.x * h, y: p.y + d.y * h, z: p.z + d.z * h });

  const h = op.paso;
  const puntos: Vec3[] = [inicio];
  let p = inicio;
  for (let i = 0; i < op.maxPasos; i++) {
    // RK4 sobre el campo de direcciones
    const k1 = dir(p);
    const k2 = dir(mover(p, k1, h / 2));
    const k3 = dir(mover(p, k2, h / 2));
    const k4 = dir(mover(p, k3, h));
    if (nulo) return { puntos, motivo: 'campoNulo' };
    p = {
      x: p.x + (h / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
      y: p.y + (h / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
      z: p.z + (h / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
    };
    puntos.push(p);

    const fin = sumidero?.(p);
    if (fin) {
      puntos.push(fin);
      return { puntos, motivo: 'sumidero' };
    }
    if (!dentro(p, op.limites)) return { puntos, motivo: 'limite' };
  }
  return { puntos, motivo: 'maxPasos' };
}

/** n direcciones casi uniformes sobre la esfera unitaria (espiral de Fibonacci). */
export function direccionesEsfera(n: number): Vec3[] {
  const dirs: Vec3[] = [];
  const dorado = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const z = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - z * z);
    const phi = i * dorado;
    dirs.push({ x: r * Math.cos(phi), y: r * Math.sin(phi), z });
  }
  return dirs;
}

export interface OpcionesLineasE extends OpcionesTrazado {
  /** Número de líneas por cada μC de carga (ley de Gauss: n ∝ |q|) */
  lineasPorMicroC: number;
  /** 2 → semillas en el plano z = 0; 3 → semillas sobre una esfera */
  dimension: 2 | 3;
  /** Distancia a la carga donde nacen las líneas y radio de captura en las cargas de signo opuesto [m] */
  radioInicio: number;
  rMin?: number;
}

export interface LineaCampo {
  /** Puntos ordenados en el sentido del campo (de + hacia −) */
  puntos: Vec3[];
  motivo: MotivoFin;
}

/**
 * Líneas de campo eléctrico de un sistema de cargas puntuales.
 *
 * Las líneas nacen en las cargas del signo con mayor carga total (normalmente las positivas) y
 * su número es proporcional a |q|, de modo que la densidad de líneas representa el flujo
 * (ley de Gauss: Φ = q/ε0). Terminan al llegar a una carga de signo opuesto o al salir de la caja.
 */
export function lineasCampoElectrico(cargas: readonly CargaPuntual[], op: OpcionesLineasE): LineaCampo[] {
  const rMin = op.rMin ?? R_SUAVIZADO;
  let totalPos = 0;
  let totalNeg = 0;
  for (const c of cargas) {
    if (c.q > 0) totalPos += c.q;
    else totalNeg -= c.q;
  }
  if (totalPos === 0 && totalNeg === 0) return [];

  const desdePositivas = totalPos >= totalNeg;
  const sentido: 1 | -1 = desdePositivas ? 1 : -1;
  const fuentes = cargas.filter((c) => (desdePositivas ? c.q > 0 : c.q < 0));
  const destinos = cargas.filter((c) => (desdePositivas ? c.q < 0 : c.q > 0));

  const campo: CampoVectorial = (p) => campoElectrico(cargas, p, rMin);
  const sumidero = (p: Vec3): Vec3 | null => {
    for (const c of destinos) {
      if (Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z) < op.radioInicio) return { x: c.x, y: c.y, z: c.z };
    }
    return null;
  };

  const lineas: LineaCampo[] = [];
  for (const c of fuentes) {
    const n = Math.max(1, Math.round((op.lineasPorMicroC * Math.abs(c.q)) / MICRO));
    const dirs =
      op.dimension === 3
        ? direccionesEsfera(n)
        : Array.from({ length: n }, (_, k) => {
            const ang = (2 * Math.PI * k) / n;
            return { x: Math.cos(ang), y: Math.sin(ang), z: 0 };
          });
    for (const d of dirs) {
      const inicio = { x: c.x + d.x * op.radioInicio, y: c.y + d.y * op.radioInicio, z: c.z + d.z * op.radioInicio };
      const { puntos, motivo } = trazarLinea(campo, inicio, sentido, op, sumidero);
      puntos.unshift({ x: c.x, y: c.y, z: c.z });
      // Las trazadas en contra del campo se invierten para que todas apunten como E
      if (sentido === -1) puntos.reverse();
      lineas.push({ puntos, motivo });
    }
  }
  return lineas;
}
