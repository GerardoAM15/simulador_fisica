import { describe, expect, it } from 'vitest';
import {
  MATERIALES,
  areaCircular,
  corrientesEnCables,
  leyOhm,
  mallasFundamentales,
  potenciaResistencia,
  resistenciaConductor,
  resistividadTemperatura,
  residuosKCL,
  resolverCircuito,
  resolverSistemaLineal,
  type Rama,
  type ResultadoRama,
} from '../circuits';

const errorRel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);
const R = (id: string, a: number, b: number, valor: number): Rama => ({ id, tipo: 'R', a, b, valor });
const V = (id: string, a: number, b: number, valor: number): Rama => ({ id, tipo: 'V', a, b, valor });

function resolver(n: number, ramas: Rama[]) {
  const r = resolverCircuito(n, ramas);
  if (!r.ok) throw new Error(r.error);
  const por = (id: string) => r.ramas[ramas.findIndex((x) => x.id === id)];
  return { ...r, por };
}

/** Comprueba Kirchhoff y la conservación de la potencia (teorema de Tellegen: Σ P = 0). */
function verificarLeyes(n: number, ramas: Rama[], resultados: ResultadoRama[]) {
  for (const s of residuosKCL(n, ramas, resultados)) expect(Math.abs(s)).toBeLessThan(1e-9);
  for (const m of mallasFundamentales(n, ramas, resultados)) expect(Math.abs(m.suma)).toBeLessThan(1e-9);
  expect(Math.abs(resultados.reduce((s, x) => s + x.potencia, 0))).toBeLessThan(1e-9);
}

describe('eliminación de Gauss', () => {
  it('resuelve un sistema 3×3 que requiere pivoteo', () => {
    const x = resolverSistemaLineal(
      [
        [0, 2, 1],
        [1, -2, -3],
        [-1, 1, 2],
      ],
      [-8, 0, 3],
    )!;
    expect(x[0]).toBeCloseTo(-4, 10);
    expect(x[1]).toBeCloseTo(-5, 10);
    expect(x[2]).toBeCloseTo(2, 10);
  });

  it('detecta una matriz singular', () => {
    expect(resolverSistemaLineal([[1, 2], [2, 4]], [1, 2])).toBeNull();
  });
});

describe('MNA vs cálculo a mano', () => {
  it('serie: 12 V con 2 Ω y 4 Ω → I = 2 A, V₁ = 4 V, V₂ = 8 V', () => {
    // Nodos: 0 tierra, 1 (+ fuente), 2 (entre resistencias)
    const ramas = [V('V1', 1, 0, 12), R('R1', 1, 2, 2), R('R2', 2, 0, 4)];
    const r = resolver(3, ramas);
    expect(errorRel(r.por('R1').corriente, 2)).toBeLessThan(1e-9);
    expect(errorRel(r.por('R1').voltaje, 4)).toBeLessThan(1e-9);
    expect(errorRel(r.por('R2').voltaje, 8)).toBeLessThan(1e-9);
    // La fuente entrega 24 W (potencia absorbida negativa) y su corriente sale por el terminal +
    expect(errorRel(r.por('V1').potencia, -24)).toBeLessThan(1e-9);
    expect(r.por('V1').corriente).toBeCloseTo(-2, 9);
    verificarLeyes(3, ramas, r.ramas);
  });

  it('paralelo: 12 V con 3 Ω ∥ 6 Ω → I₁ = 4 A, I₂ = 2 A, I_total = 6 A', () => {
    const ramas = [V('V1', 1, 0, 12), R('R1', 1, 0, 3), R('R2', 1, 0, 6)];
    const r = resolver(2, ramas);
    expect(errorRel(r.por('R1').corriente, 4)).toBeLessThan(1e-9);
    expect(errorRel(r.por('R2').corriente, 2)).toBeLessThan(1e-9);
    expect(errorRel(-r.por('V1').corriente, 6)).toBeLessThan(1e-9);
    verificarLeyes(2, ramas, r.ramas);
  });

  it('mixto: 12 V, 2 Ω en serie con (6 Ω ∥ 3 Ω) → R_eq = 4 Ω, I = 3 A, I₂ = 1 A, I₃ = 2 A', () => {
    const ramas = [V('V1', 1, 0, 12), R('R1', 1, 2, 2), R('R2', 2, 0, 6), R('R3', 2, 0, 3)];
    const r = resolver(3, ramas);
    expect(errorRel(r.por('R1').corriente, 3)).toBeLessThan(1e-9);
    expect(errorRel(r.por('R2').corriente, 1)).toBeLessThan(1e-9);
    expect(errorRel(r.por('R3').corriente, 2)).toBeLessThan(1e-9);
    expect(errorRel(r.voltajes[2], 6)).toBeLessThan(1e-9);
    verificarLeyes(3, ramas, r.ramas);
  });

  it('puente de Wheatstone equilibrado (R₁/R₂ = R₃/R₄): no circula corriente por el galvanómetro', () => {
    // Nodos: 1 arriba, 2 izquierda, 3 derecha, 0 abajo
    const ramas = [V('V1', 1, 0, 10), R('R1', 1, 2, 100), R('R2', 2, 0, 200), R('R3', 1, 3, 50), R('R4', 3, 0, 100), R('Rg', 2, 3, 10)];
    const r = resolver(4, ramas);
    // Relativo a la corriente total (la conductancia mínima G_min deja un residuo de ~10⁻¹¹)
    expect(Math.abs(r.por('Rg').corriente / r.por('V1').corriente)).toBeLessThan(1e-9);
    verificarLeyes(4, ramas, r.ramas);
  });

  it('puente de Wheatstone desequilibrado coincide con el equivalente de Thévenin', () => {
    const [R1, R2, R3, R4, Rg, E] = [100, 200, 100, 100, 50, 10];
    const ramas = [V('V1', 1, 0, E), R('R1', 1, 2, R1), R('R2', 2, 0, R2), R('R3', 1, 3, R3), R('R4', 3, 0, R4), R('Rg', 2, 3, Rg)];
    const r = resolver(4, ramas);
    // Thévenin visto desde el galvanómetro
    const Vth = E * (R2 / (R1 + R2) - R4 / (R3 + R4));
    const Rth = (R1 * R2) / (R1 + R2) + (R3 * R4) / (R3 + R4);
    expect(errorRel(r.por('Rg').corriente, Vth / (Rth + Rg))).toBeLessThan(1e-9);
    verificarLeyes(4, ramas, r.ramas);
  });

  it('dos fuentes: resultado por superposición', () => {
    // E₁ = 10 V con R₁ = 2 Ω, E₂ = 5 V con R₂ = 4 Ω, ambas alimentan R₃ = 4 Ω en el nodo 3
    const ramas = [V('E1', 1, 0, 10), V('E2', 2, 0, 5), R('R1', 1, 3, 2), R('R2', 2, 3, 4), R('R3', 3, 0, 4)];
    const r = resolver(4, ramas);
    // Nodal a mano: (V−10)/2 + (V−5)/4 + V/4 = 0 → V = 6.25 V
    expect(errorRel(r.voltajes[3], 6.25)).toBeLessThan(1e-9);
    verificarLeyes(4, ramas, r.ramas);
  });

  it('un cable (fuente de 0 V) mide la corriente del tramo', () => {
    const ramas: Rama[] = [V('V1', 1, 0, 9), { id: 'c', tipo: 'cable', a: 1, b: 2, valor: 0 }, R('R1', 2, 0, 3)];
    const r = resolver(3, ramas);
    expect(errorRel(r.por('c').corriente, 3)).toBeLessThan(1e-9);
    expect(Math.abs(r.por('c').voltaje)).toBeLessThan(1e-12);
  });
});

describe('casos especiales', () => {
  it('detecta una fuente en cortocircuito', () => {
    const r = resolverCircuito(2, [V('V1', 1, 0, 12), { id: 'c', tipo: 'cable', a: 1, b: 0, valor: 0 }]);
    expect(r.ok).toBe(false);
    expect(resolverCircuito(1, [V('V1', 0, 0, 12)]).ok).toBe(false);
  });

  it('en CC un capacitor es un circuito abierto con Q = CV', () => {
    const ramas: Rama[] = [V('V1', 1, 0, 12), R('R1', 1, 2, 1000), { id: 'C1', tipo: 'C', a: 2, b: 0, valor: 10e-6 }];
    const r = resolver(3, ramas);
    expect(Math.abs(r.por('R1').corriente)).toBeLessThan(1e-6);
    expect(errorRel(r.por('C1').voltaje, 12)).toBeLessThan(1e-3);
    expect(errorRel(r.por('C1').carga!, 120e-6)).toBeLessThan(1e-3);
  });

  it('capacitores en serie se reparten el voltaje en proporción a 1/C (error < 1 %)', () => {
    const ramas: Rama[] = [V('V1', 1, 0, 12), { id: 'C1', tipo: 'C', a: 1, b: 2, valor: 10e-6 }, { id: 'C2', tipo: 'C', a: 2, b: 0, valor: 20e-6 }];
    const r = resolver(3, ramas);
    expect(errorRel(r.por('C1').voltaje, 8)).toBeLessThan(0.01);
    expect(errorRel(r.por('C2').voltaje, 4)).toBeLessThan(0.01);
  });

  it('un nodo flotante no impide resolver el resto del circuito', () => {
    const ramas = [V('V1', 1, 0, 12), R('R1', 1, 0, 6), R('Rsuelta', 2, 3, 100)];
    const r = resolver(4, ramas);
    expect(errorRel(r.por('R1').corriente, 2)).toBeLessThan(1e-9);
    expect(r.por('Rsuelta').corriente).toBeCloseTo(0, 12);
  });

  it('número de mallas independientes = ramas − nodos + 1', () => {
    const ramas = [V('V1', 1, 0, 10), R('R1', 1, 2, 100), R('R2', 2, 0, 200), R('R3', 1, 3, 50), R('R4', 3, 0, 100), R('Rg', 2, 3, 10)];
    const r = resolver(4, ramas);
    expect(mallasFundamentales(4, ramas, r.ramas)).toHaveLength(6 - 4 + 1);
  });
});

describe('corriente en redes de cables', () => {
  it('en una cadena la corriente es la misma en todos los tramos', () => {
    expect(corrientesEnCables(3, [[0, 1], [1, 2]], [1, 0, -1])).toEqual([1, 1]);
  });

  it('en un lazo cuadrado se reparte por igual entre los dos caminos', () => {
    const I = corrientesEnCables(4, [[0, 1], [1, 2], [0, 3], [3, 2]], [2, 0, -2, 0]);
    for (const i of I) expect(i).toBeCloseTo(1, 10);
  });
});

describe('ley de Ohm y resistividad', () => {
  it('I = V/R y P = V²/R = I²R', () => {
    expect(leyOhm(12, 4)).toBe(3);
    expect(potenciaResistencia(12, 4)).toBe(36);
  });

  it('R = ρL/A: 10 m de cobre de 1 mm de diámetro ≈ 0.216 Ω', () => {
    const cobre = MATERIALES.find((m) => m.id === 'cobre')!;
    const Rc = resistenciaConductor(cobre.rho, 10, areaCircular(1e-3));
    expect(errorRel(Rc, (1.7e-8 * 10) / (Math.PI * 0.25e-6))).toBeLessThan(1e-12);
    expect(Rc).toBeCloseTo(0.2165, 3);
  });

  it('ρ(T) = ρ₀[1 + α(T − 20 °C)]', () => {
    expect(resistividadTemperatura(1.7e-8, 3.9e-3, 120)).toBeCloseTo(1.7e-8 * 1.39, 20);
  });
});
