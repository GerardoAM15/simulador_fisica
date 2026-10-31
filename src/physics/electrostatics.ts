/**
 * Electrostática de cargas puntuales por superposición.
 *
 *   E(r) = Σᵢ k qᵢ (r − rᵢ) / |r − rᵢ|³        [N/C]
 *   V(r) = Σᵢ k qᵢ / |r − rᵢ|                   [V]
 *
 * Suavizado: a distancias menores que rMin se usa rMin en el denominador.
 * Así V queda acotado (k q / rMin) y E tiende a cero en el centro de la carga
 * en lugar de divergir, lo que evita singularidades numéricas al dibujar.
 * Fuera de rMin los resultados son exactos.
 */
import { K_COULOMB } from './constants';
import type { Vec3 } from './vector';

export interface CargaPuntual {
  /** Carga [C] */
  q: number;
  /** Posición [m] */
  x: number;
  y: number;
  z: number;
}

/** Radio de suavizado por defecto [m] */
export const R_SUAVIZADO = 0.02;

export interface CampoYPotencial {
  E: Vec3;
  V: number;
}

/** Calcula E y V en el punto p en una sola pasada sobre las cargas. */
export function campoYPotencial(cargas: readonly CargaPuntual[], p: Vec3, rMin = R_SUAVIZADO): CampoYPotencial {
  let ex = 0;
  let ey = 0;
  let ez = 0;
  let v = 0;
  for (const c of cargas) {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const dz = p.z - c.z;
    const r = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), rMin);
    const kq = K_COULOMB * c.q;
    v += kq / r; // V = k q / r
    const f = kq / (r * r * r); // E = k q (r − rᵢ) / r³
    ex += f * dx;
    ey += f * dy;
    ez += f * dz;
  }
  return { E: { x: ex, y: ey, z: ez }, V: v };
}

/** Campo eléctrico E(p) [N/C] */
export function campoElectrico(cargas: readonly CargaPuntual[], p: Vec3, rMin = R_SUAVIZADO): Vec3 {
  return campoYPotencial(cargas, p, rMin).E;
}

/** Potencial eléctrico V(p) [V], con referencia V = 0 en el infinito */
export function potencialElectrico(cargas: readonly CargaPuntual[], p: Vec3, rMin = R_SUAVIZADO): number {
  return potencialEn(cargas, p.x, p.y, p.z, rMin);
}

/** Versión sin objetos de potencialElectrico, para muestrear mallas grandes rápidamente. */
export function potencialEn(cargas: readonly CargaPuntual[], x: number, y: number, z: number, rMin = R_SUAVIZADO): number {
  let v = 0;
  for (const c of cargas) {
    const dx = x - c.x;
    const dy = y - c.y;
    const dz = z - c.z;
    v += (K_COULOMB * c.q) / Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), rMin);
  }
  return v;
}

/**
 * Energía potencial electrostática del sistema de cargas [J]:
 *   U = Σ_{i<j} k qᵢ qⱼ / rᵢⱼ
 */
export function energiaPotencialSistema(cargas: readonly CargaPuntual[], rMin = R_SUAVIZADO): number {
  let u = 0;
  for (let i = 0; i < cargas.length; i++) {
    for (let j = i + 1; j < cargas.length; j++) {
      const a = cargas[i];
      const b = cargas[j];
      const r = Math.max(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z), rMin);
      u += (K_COULOMB * a.q * b.q) / r;
    }
  }
  return u;
}

/**
 * Trabajo realizado por el campo eléctrico al llevar una carga q de A a B [J]:
 *   W_campo = q (V_A − V_B) = −ΔU
 * El trabajo de un agente externo (a velocidad constante) es el opuesto.
 */
export function trabajoCampo(q: number, vA: number, vB: number): number {
  return q * (vA - vB);
}

/**
 * Potencial de un campo uniforme E con referencia V(0) = 0:
 *   V(r) = −E · r
 */
export function potencialCampoUniforme(E: Vec3, p: Vec3): number {
  return -(E.x * p.x + E.y * p.y + E.z * p.z);
}
