/**
 * Líneas equipotenciales 2D con el algoritmo de "marching squares".
 *
 * 1. Se muestrea el potencial V en una malla regular.
 * 2. En cada celda se clasifican las 4 esquinas según V ≥ V₀ (1 bit por esquina → 16 casos).
 * 3. Para cada caso se sabe qué aristas cruza la curva V = V₀; el punto de cruce se ubica por
 *    interpolación lineal: t = (V₀ − V_a)/(V_b − V_a).
 * Los casos ambiguos (silla: esquinas opuestas iguales) se resuelven con el valor promedio
 * en el centro de la celda.
 */

export interface Malla2D {
  nx: number;
  ny: number;
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  /** valores[j·nx + i] = f(x0 + i·dx, y0 + j·dy) */
  valores: Float64Array;
}

/** Segmento [x₁, y₁, x₂, y₂] */
export type Segmento = [number, number, number, number];

/** Muestrea f en una malla de nx × ny puntos sobre el rectángulo [x0, x1] × [y0, y1]. */
export function muestrearMalla(
  f: (x: number, y: number) => number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  nx: number,
  ny: number,
): Malla2D {
  const dx = (x1 - x0) / (nx - 1);
  const dy = (y1 - y0) / (ny - 1);
  const valores = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    const y = y0 + j * dy;
    for (let i = 0; i < nx; i++) valores[j * nx + i] = f(x0 + i * dx, y);
  }
  return { nx, ny, x0, y0, dx, dy, valores };
}

// Aristas de una celda: 0 abajo (a-b), 1 derecha (b-c), 2 arriba (d-c), 3 izquierda (a-d)
// con esquinas a = (i, j), b = (i+1, j), c = (i+1, j+1), d = (i, j+1).
// Tabla caso → pares de aristas cruzadas (los casos 5 y 10 se resuelven aparte).
const TABLA: number[][] = [
  [], [3, 0], [0, 1], [3, 1], [1, 2], [], [0, 2], [3, 2],
  [2, 3], [0, 2], [], [1, 2], [1, 3], [0, 1], [0, 3], [],
];

/** Segmentos de la curva de nivel f = nivel. */
export function isolinea(m: Malla2D, nivel: number): Segmento[] {
  const { nx, ny, x0, y0, dx, dy, valores } = m;
  const segs: Segmento[] = [];

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const va = valores[j * nx + i];
      const vb = valores[j * nx + i + 1];
      const vc = valores[(j + 1) * nx + i + 1];
      const vd = valores[(j + 1) * nx + i];
      const caso = (va >= nivel ? 1 : 0) | (vb >= nivel ? 2 : 0) | (vc >= nivel ? 4 : 0) | (vd >= nivel ? 8 : 0);
      if (caso === 0 || caso === 15) continue;

      const xa = x0 + i * dx;
      const ya = y0 + j * dy;
      const t = (v1: number, v2: number) => (nivel - v1) / (v2 - v1);
      // Punto de cruce sobre la arista e
      const cruce = (e: number): [number, number] => {
        switch (e) {
          case 0:
            return [xa + t(va, vb) * dx, ya];
          case 1:
            return [xa + dx, ya + t(vb, vc) * dy];
          case 2:
            return [xa + t(vd, vc) * dx, ya + dy];
          default:
            return [xa, ya + t(va, vd) * dy];
        }
      };
      const agregar = (e1: number, e2: number) => {
        const [p1x, p1y] = cruce(e1);
        const [p2x, p2y] = cruce(e2);
        segs.push([p1x, p1y, p2x, p2y]);
      };

      if (caso === 5 || caso === 10) {
        // Silla: decide la conectividad con el valor en el centro de la celda
        const centroArriba = (va + vb + vc + vd) / 4 >= nivel;
        const separaAyC = (caso === 5) !== centroArriba; // segmentos alrededor de las esquinas a y c
        if (separaAyC) {
          agregar(3, 0);
          agregar(1, 2);
        } else {
          agregar(0, 1);
          agregar(2, 3);
        }
        continue;
      }
      const [e1, e2] = TABLA[caso];
      agregar(e1, e2);
    }
  }
  return segs;
}

/**
 * Niveles de potencial espaciados geométricamente: ±V_base · r^k, k = 0..n−1 (y opcionalmente 0 V).
 * Como V ∝ 1/r cerca de cada carga, un espaciado geométrico da curvas visualmente equidistantes.
 */
export function nivelesGeometricos(vBase: number, razon: number, n: number, incluirCero = true): number[] {
  const niveles: number[] = incluirCero ? [0] : [];
  for (let k = 0; k < n; k++) {
    const v = vBase * Math.pow(razon, k);
    niveles.push(v, -v);
  }
  return niveles;
}
