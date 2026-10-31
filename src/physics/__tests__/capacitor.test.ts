import { describe, expect, it } from 'vitest';
import { EPSILON_0 } from '../constants';
import {
  analizarAsociacion,
  balanceTramoRC,
  campoEntrePlacas,
  capacitanciaParalelo,
  capacitanciaParcial,
  capacitanciaPlacas,
  capacitanciaSerie,
  densidadCargaInducida,
  densidadCargaLibre,
  densidadEnergia,
  energiaCV,
  energiaQC,
  energiaQV,
  respuestaRC,
} from '../capacitor';
import { integrarRK4 } from '../integrators';

const errorRel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe('capacitor de placas paralelas', () => {
  it('C = ε0 A/d: A = 1 cm², d = 1 mm → 0.8854 pF', () => {
    expect(errorRel(capacitanciaPlacas(1e-4, 1e-3), 0.8854e-12)).toBeLessThan(1e-3);
  });

  it('un dieléctrico multiplica C por κ', () => {
    expect(errorRel(capacitanciaPlacas(0.02, 2e-3, 3.7), 3.7 * capacitanciaPlacas(0.02, 2e-3))).toBeLessThan(1e-12);
  });

  it('dieléctrico parcial: f = 0 → C₀, f = 1 → κC₀, f = ½ → promedio (paralelo)', () => {
    const C0 = capacitanciaPlacas(0.01, 1e-3);
    expect(errorRel(capacitanciaParcial(0.01, 1e-3, 5, 0), C0)).toBeLessThan(1e-12);
    expect(errorRel(capacitanciaParcial(0.01, 1e-3, 5, 1), 5 * C0)).toBeLessThan(1e-12);
    // Mitad con κ y mitad vacía = dos capacitores de área A/2 en paralelo
    const paralelo = capacitanciaParalelo([capacitanciaPlacas(0.005, 1e-3, 5), capacitanciaPlacas(0.005, 1e-3)]);
    expect(errorRel(capacitanciaParcial(0.01, 1e-3, 5, 0.5), paralelo)).toBeLessThan(1e-12);
  });

  it('ley de Gauss: σ = ε0 E y Q = σA coincide con CV', () => {
    const A = 0.03;
    const d = 2e-3;
    const V = 150;
    const E = campoEntrePlacas(V, d);
    expect(E).toBe(75000);
    const sigma = densidadCargaLibre(E);
    expect(errorRel(sigma * A, capacitanciaPlacas(A, d) * V)).toBeLessThan(1e-12);
  });

  it('carga inducida: σᵢ = σ(1 − 1/κ); con κ = 1 no hay carga inducida', () => {
    expect(densidadCargaInducida(1e-6, 1)).toBe(0);
    expect(densidadCargaInducida(1e-6, 4)).toBeCloseTo(0.75e-6, 18);
  });
});

describe('energía almacenada', () => {
  it('½CV² = Q²/2C = ½QV', () => {
    const C = 47e-6;
    const V = 12;
    const Q = C * V;
    expect(errorRel(energiaQC(Q, C), energiaCV(C, V))).toBeLessThan(1e-12);
    expect(errorRel(energiaQV(Q, V), energiaCV(C, V))).toBeLessThan(1e-12);
  });

  it('la densidad de energía por el volumen A·d da la energía total del capacitor', () => {
    const A = 0.05;
    const d = 1e-3;
    const kappa = 3.7;
    const V = 200;
    const U = energiaCV(capacitanciaPlacas(A, d, kappa), V);
    expect(errorRel(densidadEnergia(V / d, kappa) * A * d, U)).toBeLessThan(1e-12);
  });
});

describe('asociaciones', () => {
  it('dos capacitores iguales: serie C/2, paralelo 2C', () => {
    expect(capacitanciaSerie([10e-6, 10e-6])).toBeCloseTo(5e-6, 15);
    expect(capacitanciaParalelo([10e-6, 10e-6])).toBeCloseTo(20e-6, 15);
  });

  it('serie: misma carga en todos y ΣVᵢ = V', () => {
    const r = analizarAsociacion([2e-6, 3e-6, 6e-6], 12, 'serie');
    expect(errorRel(r.Ceq, 1e-6)).toBeLessThan(1e-12); // 1/2 + 1/3 + 1/6 = 1
    for (const e of r.elementos) expect(errorRel(e.Q, 12e-6)).toBeLessThan(1e-12);
    expect(r.elementos.reduce((s, e) => s + e.V, 0)).toBeCloseTo(12, 10);
  });

  it('paralelo: mismo voltaje y ΣQᵢ = Q', () => {
    const r = analizarAsociacion([1e-6, 2e-6, 3e-6, 4e-6], 5, 'paralelo');
    expect(errorRel(r.Ceq, 10e-6)).toBeLessThan(1e-12);
    for (const e of r.elementos) expect(e.V).toBe(5);
    expect(errorRel(r.elementos.reduce((s, e) => s + e.Q, 0), r.Q)).toBeLessThan(1e-12);
  });

  it('mixto: C₁ en serie con (C₂ ∥ C₃), calculado a mano', () => {
    // C₂ ∥ C₃ = 4 μF; serie con 4 μF → 2 μF; Q = 24 μC; V₁ = 6 V; V₂ = V₃ = 6 V
    const r = analizarAsociacion([4e-6, 1e-6, 3e-6], 12, 'mixto');
    expect(errorRel(r.Ceq, 2e-6)).toBeLessThan(1e-12);
    expect(r.elementos[0].V).toBeCloseTo(6, 10);
    expect(r.elementos[1].Q).toBeCloseTo(6e-6, 15);
    expect(r.elementos[2].Q).toBeCloseTo(18e-6, 15);
  });

  it('la energía total es la suma de las energías individuales', () => {
    for (const tipo of ['serie', 'paralelo', 'mixto'] as const) {
      const r = analizarAsociacion([5e-6, 7e-6, 11e-6, 2e-6], 9, tipo);
      expect(errorRel(r.elementos.reduce((s, e) => s + e.U, 0), r.U)).toBeLessThan(1e-12);
    }
  });
});

describe('circuito RC', () => {
  const R = 1000;
  const C = 100e-6; // τ = 0.1 s
  const V = 10;

  it('en t = τ el capacitor alcanza el 63.2 % de su carga final; I(0) = V/R', () => {
    const tau = R * C;
    expect(errorRel(respuestaRC(tau, R, C, V, 0, true).Q, C * V * (1 - Math.exp(-1)))).toBeLessThan(1e-12);
    expect(respuestaRC(0, R, C, V, 0, true).I).toBeCloseTo(V / R, 12);
    // Descarga: en t = τ queda el 36.8 %
    expect(errorRel(respuestaRC(tau, R, C, V, C * V, false).Vc, V * Math.exp(-1))).toBeLessThan(1e-12);
  });

  it('Kirchhoff en la malla: V_R + V_C = ε en todo instante', () => {
    for (const t of [0, 0.03, 0.1, 0.4]) {
      const s = respuestaRC(t, R, C, V, 0, true);
      expect(s.Vr + s.Vc).toBeCloseTo(V, 10);
      const d = respuestaRC(t, R, C, V, C * V, false);
      expect(d.Vr + d.Vc).toBeCloseTo(0, 10);
    }
  });

  it('RK4 de R dQ/dt = ε − Q/C coincide con la solución analítica (error < 1 %)', () => {
    const { t, y } = integrarRK4((_t, q) => [(V - q[0] / C) / R], 0, [0], 1e-3, 500);
    for (const i of [50, 100, 300, 500]) expect(errorRel(y[i][0], respuestaRC(t[i], R, C, V, 0, true).Q)).toBeLessThan(0.01);
  });

  it('al cargar, la batería entrega CV² y la mitad se disipa en R (∫I²R dt = ½CV²)', () => {
    const b = balanceTramoRC(0, C * V, C, V, true);
    expect(errorRel(b.bateria, C * V * V)).toBeLessThan(1e-12);
    expect(errorRel(b.resistencia, 0.5 * C * V * V)).toBeLessThan(1e-12);
    // Integración numérica de I²R con la regla del trapecio hasta 20τ
    const n = 20000;
    const dt = (20 * R * C) / n;
    let calor = 0;
    for (let i = 0; i < n; i++) {
      const I1 = respuestaRC(i * dt, R, C, V, 0, true).I;
      const I2 = respuestaRC((i + 1) * dt, R, C, V, 0, true).I;
      calor += 0.5 * (I1 * I1 + I2 * I2) * R * dt;
    }
    expect(errorRel(calor, 0.5 * C * V * V)).toBeLessThan(0.01);
  });

  it('al descargar, toda la energía almacenada se disipa en R', () => {
    const b = balanceTramoRC(C * V, 0, C, V, false);
    expect(b.bateria).toBe(0);
    expect(errorRel(b.resistencia, 0.5 * C * V * V)).toBeLessThan(1e-12);
  });
});

it('ε0 es coherente con k = 1/(4π ε0)', () => {
  expect(errorRel(1 / (4 * Math.PI * EPSILON_0), 8.9875517923e9)).toBeLessThan(1e-9);
});
