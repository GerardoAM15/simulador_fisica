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
 * Método de Boris para la fuerza de Lorentz  m dv/dt = q (E + v × B).
 *
 * Separa el efecto de E (dos medios impulsos) y el de B (una rotación pura de v):
 *   v⁻ = v + (q E / m) Δt/2
 *   t  = (q B / m) Δt/2,   s = 2t / (1 + |t|²)
 *   v' = v⁻ + v⁻ × t,      v⁺ = v⁻ + v' × s          (rotación: |v⁺| = |v⁻|)
 *   v_{n+1} = v⁺ + (q E / m) Δt/2,   r_{n+1} = r_n + v_{n+1} Δt
 * Como la parte magnética es una rotación exacta, la energía cinética se conserva sin error
 * acumulado aunque Δt sea grande: el movimiento circular no se "abre" en espiral como con Euler.
 * Es simpléctico y de segundo orden (el ángulo girado por paso es 2·atan(ωΔt/2) ≈ ωΔt).
 */
export function pasoBoris(r: Vec3, v: Vec3, qm: number, E: Vec3, B: Vec3, dt: number): { r: Vec3; v: Vec3 } {
  const h = (qm * dt) / 2;
  const vmx = v.x + h * E.x;
  const vmy = v.y + h * E.y;
  const vmz = v.z + h * E.z;
  const tx = h * B.x;
  const ty = h * B.y;
  const tz = h * B.z;
  const s = 2 / (1 + tx * tx + ty * ty + tz * tz);
  // v' = v⁻ + v⁻ × t
  const vpx = vmx + (vmy * tz - vmz * ty);
  const vpy = vmy + (vmz * tx - vmx * tz);
  const vpz = vmz + (vmx * ty - vmy * tx);
  // v⁺ = v⁻ + v' × s
  const vx = vmx + s * (vpy * tz - vpz * ty) + h * E.x;
  const vy = vmy + s * (vpz * tx - vpx * tz) + h * E.y;
  const vz = vmz + s * (vpx * ty - vpy * tx) + h * E.z;
  return { r: { x: r.x + vx * dt, y: r.y + vy * dt, z: r.z + vz * dt }, v: { x: vx, y: vy, z: vz } };
}

/**
 * Euler explícito para la fuerza de Lorentz (solo para comparación didáctica):
 *   v_{n+1} = v_n + (q/m)(E + v_n × B) Δt,   r_{n+1} = r_n + v_n Δt
 * En un campo B puro |v| crece en un factor √(1 + (ωΔt)²) por paso: la órbita se abre en espiral.
 */
export function pasoEulerLorentz(r: Vec3, v: Vec3, qm: number, E: Vec3, B: Vec3, dt: number): { r: Vec3; v: Vec3 } {
  const ax = qm * (E.x + v.y * B.z - v.z * B.y);
  const ay = qm * (E.y + v.z * B.x - v.x * B.z);
  const az = qm * (E.z + v.x * B.y - v.y * B.x);
  return {
    r: { x: r.x + v.x * dt, y: r.y + v.y * dt, z: r.z + v.z * dt },
    v: { x: v.x + ax * dt, y: v.y + ay * dt, z: v.z + az * dt },
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
