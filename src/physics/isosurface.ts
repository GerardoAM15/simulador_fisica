/**
 * Isosuperficies 3D (superficies equipotenciales) con el método "surface nets".
 *
 * 1. Se muestrea el escalar f en una malla 3D regular.
 * 2. En cada celda (cubo) donde f − nivel cambia de signo se coloca un vértice en el promedio
 *    de los cruces interpolados sobre sus 12 aristas.
 * 3. Por cada arista de la malla cruzada por la superficie se forma un cuadrilátero con los
 *    vértices de las 4 celdas que la comparten (2 triángulos).
 * Es más simple que marching cubes (no necesita tablas de 256 casos) y produce mallas cerradas.
 */
import type { Vec3 } from './vector';

export interface Malla3D {
  nx: number;
  ny: number;
  nz: number;
  min: Vec3;
  dx: number;
  dy: number;
  dz: number;
  /** valores[i + nx·(j + ny·k)] */
  valores: Float32Array;
}

export function muestrearMalla3D(
  f: (x: number, y: number, z: number) => number,
  min: Vec3,
  max: Vec3,
  nx: number,
  ny: number,
  nz: number,
): Malla3D {
  const dx = (max.x - min.x) / (nx - 1);
  const dy = (max.y - min.y) / (ny - 1);
  const dz = (max.z - min.z) / (nz - 1);
  const valores = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) valores[i + nx * (j + ny * k)] = f(min.x + i * dx, min.y + j * dy, min.z + k * dz);
  return { nx, ny, nz, min, dx, dy, dz, valores };
}

export interface GeometriaIso {
  /** [x, y, z, x, y, z, …] */
  posiciones: Float32Array;
  /** Índices de triángulos */
  indices: Uint32Array;
}

// Desplazamientos de las 8 esquinas de un cubo y sus 12 aristas (pares de esquinas)
const ESQUINAS = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];
const ARISTAS = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

export function isosuperficie(m: Malla3D, nivel: number): GeometriaIso {
  const { nx, ny, nz, min, dx, dy, dz, valores } = m;
  const cx = nx - 1;
  const cy = ny - 1;
  const cz = nz - 1;
  const idx = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const celda = (i: number, j: number, k: number) => i + cx * (j + cy * k);

  const verticeDeCelda = new Int32Array(cx * cy * cz).fill(-1);
  const pos: number[] = [];
  const v = new Float64Array(8);

  // Paso 2: un vértice por celda cruzada
  for (let k = 0; k < cz; k++)
    for (let j = 0; j < cy; j++)
      for (let i = 0; i < cx; i++) {
        let mascara = 0;
        for (let c = 0; c < 8; c++) {
          const [a, b, d] = ESQUINAS[c];
          v[c] = valores[idx(i + a, j + b, k + d)] - nivel;
          if (v[c] >= 0) mascara |= 1 << c;
        }
        if (mascara === 0 || mascara === 255) continue;

        let sx = 0;
        let sy = 0;
        let sz = 0;
        let n = 0;
        for (const [c1, c2] of ARISTAS) {
          if (v[c1] >= 0 === v[c2] >= 0) continue;
          const t = v[c1] / (v[c1] - v[c2]);
          const p1 = ESQUINAS[c1];
          const p2 = ESQUINAS[c2];
          sx += p1[0] + t * (p2[0] - p1[0]);
          sy += p1[1] + t * (p2[1] - p1[1]);
          sz += p1[2] + t * (p2[2] - p1[2]);
          n++;
        }
        verticeDeCelda[celda(i, j, k)] = pos.length / 3;
        pos.push(min.x + (i + sx / n) * dx, min.y + (j + sy / n) * dy, min.z + (k + sz / n) * dz);
      }

  // Paso 3: un cuadrilátero por arista cruzada. Para la arista en el eje a, (u, w) son los otros
  // dos ejes en orden cíclico, lo que da una orientación coherente de todas las caras.
  const tri: number[] = [];
  const quad = (q0: number, q1: number, q2: number, q3: number, invertir: boolean) => {
    if (q0 < 0 || q1 < 0 || q2 < 0 || q3 < 0) return;
    if (invertir) tri.push(q0, q2, q1, q0, q3, q2);
    else tri.push(q0, q1, q2, q0, q2, q3);
  };
  const vc = (i: number, j: number, k: number) => verticeDeCelda[celda(i, j, k)];

  // Solo aristas interiores: las 4 celdas que la rodean deben existir (en el borde la
  // superficie queda abierta, lo cual es aceptable para visualizar).
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const s0 = valores[idx(i, j, k)] >= nivel;
        // Arista en x: celdas vecinas en (y, z)
        if (i < cx && j > 0 && j < cy && k > 0 && k < cz && s0 !== valores[idx(i + 1, j, k)] >= nivel)
          quad(vc(i, j - 1, k - 1), vc(i, j, k - 1), vc(i, j, k), vc(i, j - 1, k), s0);
        // Arista en y: celdas vecinas en (z, x)
        if (j < cy && k > 0 && k < cz && i > 0 && i < cx && s0 !== valores[idx(i, j + 1, k)] >= nivel)
          quad(vc(i - 1, j, k - 1), vc(i - 1, j, k), vc(i, j, k), vc(i, j, k - 1), s0);
        // Arista en z: celdas vecinas en (x, y)
        if (k < cz && i > 0 && i < cx && j > 0 && j < cy && s0 !== valores[idx(i, j, k + 1)] >= nivel)
          quad(vc(i - 1, j - 1, k), vc(i, j - 1, k), vc(i, j, k), vc(i - 1, j, k), s0);
      }

  return { posiciones: new Float32Array(pos), indices: new Uint32Array(tri) };
}
