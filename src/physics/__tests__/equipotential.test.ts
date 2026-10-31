import { describe, expect, it } from 'vitest';
import { K_COULOMB, MICRO } from '../constants';
import { potencialEn } from '../electrostatics';
import { isolinea, muestrearMalla, nivelesGeometricos } from '../equipotential';
import { isosuperficie, muestrearMalla3D } from '../isosurface';

describe('marching squares', () => {
  it('reproduce exactamente las curvas de nivel de una función lineal', () => {
    const malla = muestrearMalla((x, y) => x + 2 * y, -1, -1, 1, 1, 21, 21);
    const segs = isolinea(malla, 0.3);
    expect(segs.length).toBeGreaterThan(10);
    for (const [x1, y1, x2, y2] of segs) {
      expect(x1 + 2 * y1).toBeCloseTo(0.3, 10);
      expect(x2 + 2 * y2).toBeCloseTo(0.3, 10);
    }
  });

  it('la equipotencial de una carga puntual es una circunferencia r = kq/V₀ (error < 1 %)', () => {
    const q = MICRO;
    const r0 = 0.5;
    const V0 = (K_COULOMB * q) / r0;
    const cargas = [{ q, x: 0, y: 0, z: 0 }];
    const malla = muestrearMalla((x, y) => potencialEn(cargas, x, y, 0), -1, -1, 1, 1, 161, 161);
    const segs = isolinea(malla, V0);
    expect(segs.length).toBeGreaterThan(50);
    for (const [x1, y1] of segs) expect(Math.abs(Math.hypot(x1, y1) - r0) / r0).toBeLessThan(0.01);
  });

  it('resuelve las sillas sin dejar huecos (función x·y)', () => {
    const malla = muestrearMalla((x, y) => x * y, -1, -1, 1, 1, 20, 20);
    expect(isolinea(malla, 0.001).length).toBeGreaterThan(0);
  });

  it('niveles geométricos simétricos', () => {
    expect(nivelesGeometricos(1, 2, 3)).toEqual([0, 1, -1, 2, -2, 4, -4]);
  });
});

describe('isosuperficie (surface nets)', () => {
  it('la superficie equipotencial de una carga puntual es una esfera r = kq/V₀', () => {
    const q = MICRO;
    const r0 = 0.6;
    const V0 = (K_COULOMB * q) / r0;
    const cargas = [{ q, x: 0, y: 0, z: 0 }];
    const n = 41;
    const malla = muestrearMalla3D((x, y, z) => potencialEn(cargas, x, y, z), { x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 }, n, n, n);
    const { posiciones, indices } = isosuperficie(malla, V0);
    const nv = posiciones.length / 3;
    expect(nv).toBeGreaterThan(100);
    expect(indices.length % 3).toBe(0);
    expect(Math.max(...indices)).toBeLessThan(nv);

    let suma = 0;
    for (let i = 0; i < nv; i++) {
      const r = Math.hypot(posiciones[3 * i], posiciones[3 * i + 1], posiciones[3 * i + 2]);
      expect(Math.abs(r - r0)).toBeLessThan(malla.dx); // cada vértice a menos de una celda
      suma += r;
    }
    expect(Math.abs(suma / nv - r0) / r0).toBeLessThan(0.01); // radio medio con error < 1 %
  });
});
