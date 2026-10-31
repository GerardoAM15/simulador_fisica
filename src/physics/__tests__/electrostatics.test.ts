import { describe, expect, it } from 'vitest';
import { K_COULOMB, MICRO } from '../constants';
import {
  campoElectrico,
  campoYPotencial,
  energiaPotencialSistema,
  potencialCampoUniforme,
  potencialElectrico,
  trabajoCampo,
  type CargaPuntual,
} from '../electrostatics';
import { norma3 } from '../vector';

/** Error relativo |a − b| / |b| */
const errorRel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);
const carga = (q: number, x: number, y = 0, z = 0): CargaPuntual => ({ q, x, y, z });

describe('carga puntual', () => {
  const q = 1 * MICRO;
  const cargas = [carga(q, 0)];

  it('E = kq/r² y V = kq/r', () => {
    for (const r of [0.1, 0.5, 2]) {
      const { E, V } = campoYPotencial(cargas, { x: r, y: 0, z: 0 });
      expect(errorRel(E.x, (K_COULOMB * q) / r ** 2)).toBeLessThan(1e-12);
      expect(E.y).toBe(0);
      expect(errorRel(V, (K_COULOMB * q) / r)).toBeLessThan(1e-12);
    }
  });

  it('E es radial en cualquier dirección', () => {
    const p = { x: 0.3, y: -0.4, z: 1.2 };
    const E = campoElectrico(cargas, p);
    const r = norma3(p);
    expect(errorRel(norma3(E), (K_COULOMB * q) / r ** 2)).toBeLessThan(1e-12);
    expect(E.x / E.z).toBeCloseTo(p.x / p.z, 12);
  });

  it('el suavizado acota V dentro de rMin', () => {
    const V = potencialElectrico(cargas, { x: 0, y: 0, z: 0 }, 0.02);
    expect(V).toBeCloseTo((K_COULOMB * q) / 0.02, 3);
    expect(norma3(campoElectrico(cargas, { x: 0, y: 0, z: 0 }))).toBe(0);
  });
});

describe('dipolo eléctrico (+q en x = a, −q en x = −a)', () => {
  const q = 2 * MICRO;
  const a = 0.05;
  const p = 2 * a * q; // momento dipolar
  const dipolo = [carga(q, a), carga(-q, -a)];

  it('campo y potencial exactos en el eje', () => {
    const x = 0.4;
    const { E, V } = campoYPotencial(dipolo, { x, y: 0, z: 0 });
    // E = kq·4ax/(x² − a²)²,  V = kq·2a/(x² − a²)
    expect(errorRel(E.x, (K_COULOMB * q * 4 * a * x) / (x * x - a * a) ** 2)).toBeLessThan(1e-12);
    expect(errorRel(V, (K_COULOMB * q * 2 * a) / (x * x - a * a))).toBeLessThan(1e-12);
  });

  it('aproximación de dipolo lejano en el eje: E ≈ 2kp/x³, V ≈ kp/x² (error < 1 %)', () => {
    const x = 100 * a;
    const { E, V } = campoYPotencial(dipolo, { x, y: 0, z: 0 });
    expect(errorRel(E.x, (2 * K_COULOMB * p) / x ** 3)).toBeLessThan(0.01);
    expect(errorRel(V, (K_COULOMB * p) / x ** 2)).toBeLessThan(0.01);
  });

  it('en la mediatriz: V = 0 y E = −kp/(y² + a²)^{3/2} x̂', () => {
    const y = 0.3;
    const { E, V } = campoYPotencial(dipolo, { x: 0, y, z: 0 });
    expect(Math.abs(V)).toBeLessThan(1e-9);
    expect(errorRel(E.x, (-K_COULOMB * p) / (y * y + a * a) ** 1.5)).toBeLessThan(1e-12);
    expect(Math.abs(E.y)).toBeLessThan(1e-9 * Math.abs(E.x));
  });
});

describe('superposición', () => {
  it('campo nulo en el punto medio de dos cargas iguales, V = 2kq/a', () => {
    const q = 3 * MICRO;
    const a = 0.25;
    const { E, V } = campoYPotencial([carga(q, -a), carga(q, a)], { x: 0, y: 0, z: 0 });
    expect(norma3(E)).toBeLessThan(1e-9);
    expect(errorRel(V, (2 * K_COULOMB * q) / a)).toBeLessThan(1e-12);
  });

  it('el campo de un sistema es la suma de los campos individuales', () => {
    const c = [carga(1e-6, 0.1, 0.2), carga(-2e-6, -0.3, 0.1, 0.4), carga(0.5e-6, 0, -0.5)];
    const pto = { x: 0.7, y: 0.2, z: -0.1 };
    const total = campoElectrico(c, pto);
    const suma = c.map((ci) => campoElectrico([ci], pto)).reduce((s, e) => ({ x: s.x + e.x, y: s.y + e.y, z: s.z + e.z }));
    expect(total.x).toBeCloseTo(suma.x, 6);
    expect(total.y).toBeCloseTo(suma.y, 6);
    expect(total.z).toBeCloseTo(suma.z, 6);
  });
});

describe('energía y trabajo', () => {
  it('U = kq₁q₂/r para dos cargas', () => {
    const U = energiaPotencialSistema([carga(1e-6, 0), carga(-2e-6, 0.3)]);
    expect(errorRel(U, (K_COULOMB * 1e-6 * -2e-6) / 0.3)).toBeLessThan(1e-12);
  });

  it('W_campo = q(V_A − V_B) coincide con −ΔU = −q(V_B − V_A)', () => {
    const fuente = [carga(5e-6, 0)];
    const vA = potencialElectrico(fuente, { x: 0.1, y: 0, z: 0 });
    const vB = potencialElectrico(fuente, { x: 0.4, y: 0, z: 0 });
    const q = 1e-6;
    // Una carga positiva que se aleja de otra positiva: el campo hace trabajo positivo
    expect(trabajoCampo(q, vA, vB)).toBeGreaterThan(0);
    expect(trabajoCampo(q, vA, vB)).toBeCloseTo(-(q * vB - q * vA), 12);
  });

  it('potencial de campo uniforme: V = −E·r', () => {
    expect(potencialCampoUniforme({ x: 100, y: 0, z: 0 }, { x: 0.5, y: 3, z: 0 })).toBe(-50);
  });
});
