/**
 * Campo magnético de corrientes por la ley de Biot–Savart, fórmulas analíticas de referencia
 * y magnitudes del movimiento de cargas en campos magnéticos.
 *
 *   dB = (μ0 I / 4π) · dl × r̂ / r²
 *
 * El conductor se describe con polilíneas; cada tramo dl se integra con la regla del punto medio
 * (error O(Δl²)), suficiente para obtener errores < 1 % con unos cientos de tramos.
 */
import { MU_0 } from './constants';
import type { Vec3 } from './vector';

/** Fuente "compilada": puntos medios y vectores dl de todos los tramos en arreglos tipados. */
export interface FuenteMagnetica {
  n: number;
  mx: Float64Array;
  my: Float64Array;
  mz: Float64Array;
  dx: Float64Array;
  dy: Float64Array;
  dz: Float64Array;
  /** Constante μ0 I / 4π [T·m] */
  k: number;
}

/** Prepara las polilíneas por donde circula la corriente I (en el orden de los puntos). */
export function crearFuente(polilineas: readonly (readonly Vec3[])[], I: number): FuenteMagnetica {
  const n = polilineas.reduce((s, p) => s + Math.max(0, p.length - 1), 0);
  const f: FuenteMagnetica = {
    n,
    mx: new Float64Array(n),
    my: new Float64Array(n),
    mz: new Float64Array(n),
    dx: new Float64Array(n),
    dy: new Float64Array(n),
    dz: new Float64Array(n),
    k: (MU_0 * I) / (4 * Math.PI),
  };
  let i = 0;
  for (const p of polilineas)
    for (let j = 1; j < p.length; j++, i++) {
      const a = p[j - 1];
      const b = p[j];
      f.mx[i] = (a.x + b.x) / 2;
      f.my[i] = (a.y + b.y) / 2;
      f.mz[i] = (a.z + b.z) / 2;
      f.dx[i] = b.x - a.x;
      f.dy[i] = b.y - a.y;
      f.dz[i] = b.z - a.z;
    }
  return f;
}

/**
 * Campo B en p por Biot–Savart: B = k Σ dl × r / |r|³, con r = p − punto medio del tramo.
 * `rMin` evita la singularidad sobre el propio conductor.
 */
export function campoMagnetico(f: FuenteMagnetica, p: Vec3, rMin = 1e-3): Vec3 {
  let bx = 0;
  let by = 0;
  let bz = 0;
  const r2min = rMin * rMin;
  for (let i = 0; i < f.n; i++) {
    const rx = p.x - f.mx[i];
    const ry = p.y - f.my[i];
    const rz = p.z - f.mz[i];
    const r2 = Math.max(rx * rx + ry * ry + rz * rz, r2min);
    const inv = 1 / (r2 * Math.sqrt(r2));
    // dl × r
    bx += (f.dy[i] * rz - f.dz[i] * ry) * inv;
    by += (f.dz[i] * rx - f.dx[i] * rz) * inv;
    bz += (f.dx[i] * ry - f.dy[i] * rx) * inv;
  }
  return { x: f.k * bx, y: f.k * by, z: f.k * bz };
}

// ─────────────────────────── Geometrías (eje z) ───────────────────────────

/** Hilo recto de longitud L sobre el eje z; la corriente sube (+z). */
export function geometriaHilo(L: number, n = 400): Vec3[][] {
  return [Array.from({ length: n + 1 }, (_, i) => ({ x: 0, y: 0, z: -L / 2 + (L * i) / n }))];
}

/** Espira circular de radio R en el plano z = z0, recorrida en sentido antihorario visto desde +z (B apunta a +z). */
export function geometriaEspira(R: number, n = 96, z0 = 0): Vec3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / n;
    return { x: R * Math.cos(t), y: R * Math.sin(t), z: z0 };
  });
}

/** Solenoide helicoidal de N vueltas, radio R y longitud L centrado en el origen (B interior hacia +z). */
export function geometriaSolenoide(R: number, L: number, N: number, porVuelta = 48): Vec3[][] {
  const n = Math.round(N * porVuelta);
  return [
    Array.from({ length: n + 1 }, (_, i) => {
      const t = (2 * Math.PI * N * i) / n;
      return { x: R * Math.cos(t), y: R * Math.sin(t), z: -L / 2 + (L * i) / n };
    }),
  ];
}

/**
 * Imán de barra cilíndrico modelado por su corriente superficial equivalente (corriente amperiana):
 * una pila de M espiras. Su momento magnético es m = M·I·πR². El polo norte queda en +z.
 */
export function geometriaIman(R: number, L: number, M = 24, porEspira = 48): Vec3[][] {
  return Array.from({ length: M }, (_, k) => geometriaEspira(R, porEspira, -L / 2 + (L * (k + 0.5)) / M));
}

// ─────────────────────────── Fórmulas analíticas ───────────────────────────

/** Hilo recto infinito: B = μ0 I / (2π r) */
export const campoHiloInfinito = (I: number, r: number): number => (MU_0 * I) / (2 * Math.PI * r);

/**
 * Hilo recto finito sobre el eje z, entre z₁ y z₂, en un punto a distancia r del eje y altura z:
 *   B = (μ0 I / 4π r) (sen θ₂ − sen θ₁),  sen θᵢ = (zᵢ − z) / √(r² + (zᵢ − z)²)
 */
export function campoHiloFinito(I: number, r: number, z: number, z1: number, z2: number): number {
  const s2 = (z2 - z) / Math.hypot(r, z2 - z);
  const s1 = (z1 - z) / Math.hypot(r, z1 - z);
  return ((MU_0 * I) / (4 * Math.PI * r)) * (s2 - s1);
}

/** Espira en su eje, a distancia z del centro: B = μ0 I R² / [2 (R² + z²)^{3/2}] (en z = 0: μ0 I / 2R) */
export const campoEspiraEje = (I: number, R: number, z: number): number => (MU_0 * I * R * R) / (2 * Math.pow(R * R + z * z, 1.5));

/** Solenoide ideal (muy largo): B = μ0 N I / L */
export const campoSolenoideIdeal = (N: number, I: number, L: number): number => (MU_0 * N * I) / L;

/** Solenoide finito en su eje: B = (μ0 n I / 2) (cos θ₁ − cos θ₂) */
export function campoSolenoideEje(N: number, I: number, L: number, R: number, z: number): number {
  const a = z + L / 2;
  const b = z - L / 2;
  return ((MU_0 * N * I) / (2 * L)) * (a / Math.hypot(R, a) - b / Math.hypot(R, b));
}

/** Dipolo magnético de momento m: B = (μ0 / 4π) [3 (m·r̂) r̂ − m] / r³ */
export function campoDipolo(m: Vec3, p: Vec3): Vec3 {
  const r = Math.hypot(p.x, p.y, p.z);
  const ux = p.x / r;
  const uy = p.y / r;
  const uz = p.z / r;
  const mr = m.x * ux + m.y * uy + m.z * uz;
  const k = MU_0 / (4 * Math.PI * r * r * r);
  return { x: k * (3 * mr * ux - m.x), y: k * (3 * mr * uy - m.y), z: k * (3 * mr * uz - m.z) };
}

// ─────────────────────────── Fuerza de Lorentz ───────────────────────────

/** F = q (E + v × B)   [N] */
export function fuerzaLorentz(q: number, E: Vec3, v: Vec3, B: Vec3): Vec3 {
  return {
    x: q * (E.x + v.y * B.z - v.z * B.y),
    y: q * (E.y + v.z * B.x - v.x * B.z),
    z: q * (E.z + v.x * B.y - v.y * B.x),
  };
}

/** Radio de giro (de Larmor o ciclotrón): r = m v⊥ / (|q| B) */
export const radioCiclotron = (m: number, vPerp: number, q: number, B: number): number => (m * vPerp) / (Math.abs(q) * B);

/** Período del movimiento circular: T = 2π m / (|q| B), independiente de la rapidez */
export const periodoCiclotron = (m: number, q: number, B: number): number => (2 * Math.PI * m) / (Math.abs(q) * B);

/** Velocidad de deriva E × B: v_d = E × B / B² (no depende de la carga ni de la masa) */
export function velocidadDeriva(E: Vec3, B: Vec3): Vec3 {
  const B2 = B.x * B.x + B.y * B.y + B.z * B.z;
  return { x: (E.y * B.z - E.z * B.y) / B2, y: (E.z * B.x - E.x * B.z) / B2, z: (E.x * B.y - E.y * B.x) / B2 };
}
