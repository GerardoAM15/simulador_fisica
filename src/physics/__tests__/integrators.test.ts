import { describe, expect, it } from 'vitest';
import { CARGA_ELEMENTAL, MASA_ELECTRON, MASA_PROTON, MICRO } from '../constants';
import { campoElectrico, potencialElectrico } from '../electrostatics';
import { derivadaParticulaCampoE, integrarRK4, pasoRK4, pasoTemporalAdaptativo } from '../integrators';

const errorRel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe('RK4', () => {
  it("y' = y desde y(0) = 1 llega a e en t = 1", () => {
    const { y } = integrarRK4((_t, s) => [s[0]], 0, [1], 0.01, 100);
    expect(errorRel(y[100][0], Math.E)).toBeLessThan(1e-9);
  });

  it('el error global es de orden 4: al dividir h entre 2 el error baja ≈ 16 veces', () => {
    const err = (h: number) => {
      const n = Math.round(1 / h);
      const { y } = integrarRK4((_t, s) => [s[0]], 0, [1], h, n);
      return Math.abs(y[n][0] - Math.E);
    };
    const razon = err(0.1) / err(0.05);
    expect(razon).toBeGreaterThan(14);
    expect(razon).toBeLessThan(18);
  });

  it('oscilador armónico: x(2π) = x(0) tras un período', () => {
    let s = [1, 0];
    const f = (_t: number, y: readonly number[]) => [y[1], -y[0]];
    const n = 1000;
    for (let i = 0; i < n; i++) s = pasoRK4(f, 0, s, (2 * Math.PI) / n);
    expect(s[0]).toBeCloseTo(1, 9);
    expect(s[1]).toBeCloseTo(0, 9);
  });
});

describe('partícula en campo eléctrico', () => {
  it('en E uniforme la trayectoria coincide con la parábola analítica (error < 1 %)', () => {
    // Electrón lanzado en +x dentro de E = 200 ŷ N/C: a = qE/m (hacia −y por ser negativo)
    const q = -CARGA_ELEMENTAL;
    const m = MASA_ELECTRON;
    const E = { x: 0, y: 200, z: 0 };
    const v0 = 1e7;
    const f = derivadaParticulaCampoE(q, m, () => E);
    const h = 1e-10;
    const n = 2000;
    const { t, y } = integrarRK4(f, 0, [-1, 0, 0, v0, 0, 0], h, n);
    const ay = (q * E.y) / m;
    for (const i of [500, 1000, 2000]) {
      const dxAn = v0 * t[i]; // x − x0 = v0 t
      const yAn = 0.5 * ay * t[i] ** 2; // y = ½ a t²
      expect(errorRel(y[i][0] + 1, dxAn)).toBeLessThan(0.01);
      expect(errorRel(y[i][1], yAn)).toBeLessThan(0.01);
    }
    // Ecuación de la parábola: y = a x'² / (2 v0²) con x' el avance horizontal
    const dx = y[n][0] + 1;
    expect(errorRel(y[n][1], (ay * dx * dx) / (2 * v0 * v0))).toBeLessThan(0.01);
  });

  it('se conserva la energía K + qV al dispersarse un protón en una carga puntual (paso adaptativo)', () => {
    const fuente = [{ q: 2 * MICRO, x: 0, y: 0, z: 0 }];
    const q = CARGA_ELEMENTAL;
    const m = MASA_PROTON;
    const f = derivadaParticulaCampoE(q, m, (p) => campoElectrico(fuente, p));
    const energia = (s: readonly number[]) =>
      0.5 * m * (s[3] ** 2 + s[4] ** 2) + q * potencialElectrico(fuente, { x: s[0], y: s[1], z: 0 });

    let s = [-1, 0.1, 0, 3e6, 0, 0];
    const E0 = energia(s);
    let t = 0;
    // Integra hasta que el protón vuelve a alejarse más de 1.5 m de la carga
    for (let i = 0; i < 20000 && Math.hypot(s[0], s[1]) < 1.5; i++) {
      const a = f(t, s);
      const dt = pasoTemporalAdaptativo(Math.hypot(s[3], s[4]), Math.hypot(a[3], a[4]), 0.002);
      s = pasoRK4(f, t, s, dt);
      t += dt;
    }
    expect(Math.hypot(s[0], s[1])).toBeGreaterThanOrEqual(1.5);
    expect(s[3]).toBeLessThan(0); // la repulsión lo hizo rebotar hacia −x
    expect(Math.abs(energia(s) - E0) / Math.abs(E0)).toBeLessThan(1e-4);
  });

  it('paso adaptativo: Δt = min(L/|v|, √(2L/|a|))', () => {
    expect(pasoTemporalAdaptativo(10, 0, 1)).toBeCloseTo(0.1, 12);
    expect(pasoTemporalAdaptativo(0, 2, 1)).toBeCloseTo(1, 12);
    expect(pasoTemporalAdaptativo(0, 0, 1, 0.5)).toBe(0.5);
  });
});
