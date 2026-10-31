/**
 * Integradores numéricos de ecuaciones diferenciales ordinarias dy/dt = f(t, y).
 */
import type { Vec3 } from './vector';

/** Función derivada f(t, y) de un sistema de EDOs */
export type Derivada = (t: number, y: readonly number[]) => number[];

/**
 * Un paso de Runge–Kutta clásico de orden 4 (error local O(h⁵), global O(h⁴)):
 *   k₁ = f(t, y)
 *   k₂ = f(t + h/2, y + h k₁/2)
 *   k₃ = f(t + h/2, y + h k₂/2)
 *   k₄ = f(t + h,   y + h k₃)
 *   y(t + h) = y + h (k₁ + 2k₂ + 2k₃ + k₄) / 6
 */
export function pasoRK4(f: Derivada, t: number, y: readonly number[], h: number): number[] {
  const n = y.length;
  const tmp = new Array<number>(n);

  const k1 = f(t, y);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + (h / 2) * k1[i];
  const k2 = f(t + h / 2, tmp);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + (h / 2) * k2[i];
  const k3 = f(t + h / 2, tmp);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + h * k3[i];
  const k4 = f(t + h, tmp);

  const sig = new Array<number>(n);
  for (let i = 0; i < n; i++) sig[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return sig;
}

/** Integra n pasos de tamaño h con RK4 y devuelve todos los estados (incluido el inicial). */
export function integrarRK4(f: Derivada, t0: number, y0: readonly number[], h: number, n: number) {
  const t: number[] = [t0];
  const y: number[][] = [[...y0]];
  for (let i = 0; i < n; i++) {
    y.push(pasoRK4(f, t[i], y[i], h));
    t.push(t[i] + h);
  }
  return { t, y };
}

/**
 * Ecuación de movimiento de una partícula en un campo eléctrico estático (2.ª ley de Newton):
 *   dr/dt = v,   dv/dt = a = q E(r) / m
 * Estado y = [x, y, z, vₓ, v_y, v_z].
 */
export function derivadaParticulaCampoE(q: number, m: number, campoE: (p: Vec3) => Vec3): Derivada {
  const qm = q / m;
  return (_t, s) => {
    const E = campoE({ x: s[0], y: s[1], z: s[2] });
    return [s[3], s[4], s[5], qm * E.x, qm * E.y, qm * E.z];
  };
}

/**
 * Paso temporal adaptativo para que la partícula no recorra más de una longitud L por paso:
 *   Δt = min( L/|v| , √(2L/|a|) , Δt_max )
 * El primer término limita el avance por velocidad y el segundo el avance por aceleración
 * (½|a|Δt² = L), útil cuando la partícula parte del reposo.
 */
export function pasoTemporalAdaptativo(rapidez: number, aceleracion: number, longitud: number, dtMax = Infinity): number {
  const porVelocidad = rapidez > 0 ? longitud / rapidez : Infinity;
  const porAceleracion = aceleracion > 0 ? Math.sqrt((2 * longitud) / aceleracion) : Infinity;
  const dt = Math.min(porVelocidad, porAceleracion, dtMax);
  return Number.isFinite(dt) ? dt : 1;
}
