/**
 * Álgebra vectorial mínima en 2D y 3D. Todas las funciones son puras:
 * nunca modifican sus argumentos y devuelven vectores nuevos.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ───────────────────────────── 2D ─────────────────────────────

export const vec2 = (x = 0, y = 0): Vec2 => ({ x, y });
export const sumar2 = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const restar2 = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const escalar2 = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
/** Producto punto a·b = aₓbₓ + a_yb_y */
export const punto2 = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
/** Norma euclidiana |a| */
export const norma2 = (a: Vec2): number => Math.hypot(a.x, a.y);
export const distancia2 = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
/** Vector unitario â = a/|a| (el vector nulo se devuelve sin cambios) */
export function normalizar2(a: Vec2): Vec2 {
  const n = norma2(a);
  return n === 0 ? { x: 0, y: 0 } : { x: a.x / n, y: a.y / n };
}

// ───────────────────────────── 3D ─────────────────────────────

export const vec3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const sumar3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const restar3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const escalar3 = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
/** Producto punto a·b */
export const punto3 = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
/** Producto cruz a×b = (a_y b_z − a_z b_y, a_z bₓ − aₓ b_z, aₓ b_y − a_y bₓ) */
export const cruz3 = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export const norma3 = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);
export const distancia3 = (a: Vec3, b: Vec3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export function normalizar3(a: Vec3): Vec3 {
  const n = norma3(a);
  return n === 0 ? { x: 0, y: 0, z: 0 } : { x: a.x / n, y: a.y / n, z: a.z / n };
}
