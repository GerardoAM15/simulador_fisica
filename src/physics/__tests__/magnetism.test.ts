import { describe, expect, it } from 'vitest';
import { MU_0 } from '../constants';
import { trazarLinea } from '../fieldLines';
import {
  campoDipolo,
  campoEspiraEje,
  campoHiloFinito,
  campoHiloInfinito,
  campoMagnetico,
  campoSolenoideEje,
  crearFuente,
  geometriaEspira,
  geometriaHilo,
  geometriaIman,
  geometriaSolenoide,
} from '../magnetism';
import { norma3 } from '../vector';

const errorRel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe('Biot–Savart numérico vs fórmulas analíticas', () => {
  it('hilo recto largo: B = μ0 I / 2πr (error < 1 %)', () => {
    const f = crearFuente(geometriaHilo(40, 4000), 10);
    for (const r of [0.05, 0.1, 0.3]) {
      const B = campoMagnetico(f, { x: r, y: 0, z: 0 });
      expect(errorRel(norma3(B), campoHiloInfinito(10, r))).toBeLessThan(0.01);
      // Dirección: regla de la mano derecha (I en +z, punto en +x → B en +y)
      expect(B.y).toBeGreaterThan(0);
      expect(Math.abs(B.x) + Math.abs(B.z)).toBeLessThan(1e-6 * B.y);
    }
  });

  it('hilo finito: Biot–Savart coincide con B = (μ0 I / 4πr)(sen θ₂ − sen θ₁) también cerca de los extremos', () => {
    const f = crearFuente(geometriaHilo(4, 400), 10);
    for (const [r, z] of [[0.5, 0], [0.3, 1.5], [1, -1.2]]) {
      const B = norma3(campoMagnetico(f, { x: r, y: 0, z }));
      expect(errorRel(B, campoHiloFinito(10, r, z, -2, 2))).toBeLessThan(0.01);
    }
  });

  it('espira: B = μ0 I / 2R en el centro y μ0 I R² / 2(R² + z²)^{3/2} en el eje', () => {
    const R = 0.2;
    const I = 5;
    const f = crearFuente([geometriaEspira(R, 200)], I);
    expect(errorRel(campoMagnetico(f, { x: 0, y: 0, z: 0 }).z, (MU_0 * I) / (2 * R))).toBeLessThan(0.01);
    for (const z of [0.1, 0.3, -0.5]) expect(errorRel(campoMagnetico(f, { x: 0, y: 0, z }).z, campoEspiraEje(I, R, z))).toBeLessThan(0.01);
  });

  it('solenoide finito en su eje: B = (μ0 n I / 2)(cos θ₁ − cos θ₂)', () => {
    const [R, L, N, I] = [0.1, 1, 50, 2];
    const f = crearFuente(geometriaSolenoide(R, L, N, 64), I);
    for (const z of [0, 0.3, 0.6]) expect(errorRel(campoMagnetico(f, { x: 0, y: 0, z }).z, campoSolenoideEje(N, I, L, R, z))).toBeLessThan(0.01);
    // En el centro de un solenoide largo (L = 10R) se aproxima a μ0 N I / L
    expect(errorRel(campoMagnetico(f, { x: 0, y: 0, z: 0 }).z, (MU_0 * N * I) / L)).toBeLessThan(0.03);
  });

  it('lejos de una espira pequeña el campo es el de un dipolo m = I π R² (error < 1 %)', () => {
    const R = 0.01;
    const I = 3;
    const f = crearFuente([geometriaEspira(R, 200)], I);
    const m = { x: 0, y: 0, z: I * Math.PI * R * R };
    for (const p of [{ x: 0, y: 0, z: 0.5 }, { x: 0.4, y: 0.1, z: 0.3 }]) {
      const B = campoMagnetico(f, p);
      const D = campoDipolo(m, p);
      expect(norma3({ x: B.x - D.x, y: B.y - D.y, z: B.z - D.z }) / norma3(D)).toBeLessThan(0.01);
    }
  });

  it('ley de Ampère: ∮ B·dl alrededor del hilo = μ0 I', () => {
    const I = 7;
    const f = crearFuente(geometriaHilo(40, 4000), I);
    const n = 200;
    const r = 0.15;
    let circulacion = 0;
    for (let k = 0; k < n; k++) {
      const t = (2 * Math.PI * (k + 0.5)) / n;
      const B = campoMagnetico(f, { x: r * Math.cos(t), y: r * Math.sin(t), z: 0.3 });
      circulacion += (B.x * -Math.sin(t) + B.y * Math.cos(t)) * ((2 * Math.PI * r) / n);
    }
    expect(errorRel(circulacion, MU_0 * I)).toBeLessThan(0.01);
  });

  it('el imán de barra (corriente amperiana) produce B hacia +z (polo norte arriba) en su interior y en el eje', () => {
    const f = crearFuente(geometriaIman(0.1, 0.4), 10);
    expect(campoMagnetico(f, { x: 0, y: 0, z: 0 }).z).toBeGreaterThan(0);
    expect(campoMagnetico(f, { x: 0, y: 0, z: 0.5 }).z).toBeGreaterThan(0);
    // Al costado del imán el campo vuelve hacia −z (las líneas se cierran por fuera)
    expect(campoMagnetico(f, { x: 0.4, y: 0, z: 0 }).z).toBeLessThan(0);
  });
});

describe('líneas de campo magnético', () => {
  it('alrededor de un hilo son circunferencias cerradas de radio constante', () => {
    const f = crearFuente(geometriaHilo(40, 2000), 5);
    const r0 = 0.3;
    const { puntos, motivo } = trazarLinea((p) => campoMagnetico(f, p), { x: r0, y: 0, z: 0 }, 1, {
      paso: 0.01,
      maxPasos: 1000,
      limites: { min: { x: -2, y: -2, z: -2 }, max: { x: 2, y: 2, z: 2 } },
      detectarCierre: true,
    });
    expect(motivo).toBe('cerrada');
    expect(puntos.length * 0.01).toBeGreaterThan(2 * Math.PI * r0 * 0.95);
    for (const p of puntos) expect(Math.abs(Math.hypot(p.x, p.y) - r0) / r0).toBeLessThan(0.01);
  });
});
