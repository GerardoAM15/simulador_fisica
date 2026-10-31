import { describe, expect, it } from 'vitest';
import { CARGA_ELEMENTAL, MASA_PROTON } from '../constants';
import { pasoBoris, pasoEulerLorentz } from '../integrators';
import { fuerzaLorentz, periodoCiclotron, radioCiclotron, velocidadDeriva } from '../magnetism';
import type { Vec3 } from '../vector';

const errorRel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);
const q = CARGA_ELEMENTAL;
const m = MASA_PROTON;
const B: Vec3 = { x: 0, y: 0, z: 0.1 };
const E0: Vec3 = { x: 0, y: 0, z: 0 };

/** Integra con Boris durante `periodos` períodos ciclotrónicos con `pasosPorPeriodo` pasos cada uno. */
function simular(v0: Vec3, E: Vec3, periodos: number, pasosPorPeriodo: number, metodo = pasoBoris) {
  const T = periodoCiclotron(m, q, B.z);
  const dt = T / pasosPorPeriodo;
  let r: Vec3 = { x: 0, y: 0, z: 0 };
  let v = v0;
  const tray: Vec3[] = [r];
  const vel: Vec3[] = [v];
  for (let i = 0; i < periodos * pasosPorPeriodo; i++) {
    ({ r, v } = metodo(r, v, q / m, E, B, dt));
    tray.push(r);
    vel.push(v);
  }
  return { tray, vel, dt, T };
}

describe('fuerza de Lorentz', () => {
  it('F = q v × B es perpendicular a v (no realiza trabajo)', () => {
    const v = { x: 3e5, y: -1e5, z: 2e5 };
    const F = fuerzaLorentz(q, E0, v, { x: 0.2, y: 0.5, z: -0.1 });
    const escala = Math.hypot(F.x, F.y, F.z) * Math.hypot(v.x, v.y, v.z);
    expect(Math.abs(F.x * v.x + F.y * v.y + F.z * v.z) / escala).toBeLessThan(1e-12);
  });
});

describe('integrador de Boris', () => {
  const v0 = 1e6;

  it('movimiento circular: radio r = mv/(|q|B) y período T = 2πm/(|q|B) con error < 1 %', () => {
    // Se simulan 2 períodos: Boris gira 2·atan(ωΔt/2) < ωΔt por paso, así que la vuelta termina
    // un instante después de T (error de fase ≈ (ωΔt)²/12 ≈ 0.03 %)
    const { tray, vel, dt, T } = simular({ x: v0, y: 0, z: 0 }, E0, 2, 200);
    // Radio: la mitad del diámetro recorrido en y
    const ys = tray.map((p) => p.y);
    const rSim = (Math.max(...ys) - Math.min(...ys)) / 2;
    expect(errorRel(rSim, radioCiclotron(m, v0, q, B.z))).toBeLessThan(0.01);
    // Período: el protón gira en sentido horario (ω = −qB/m ẑ), así que v_y es negativa en la primera
    // media vuelta y positiva en la segunda; la vuelta se completa cuando v_y cruza de + a −
    let tSim = 0;
    for (let i = 1; i < vel.length; i++)
      if (vel[i - 1].y > 0 && vel[i].y <= 0) {
        tSim = (i - 1 + vel[i - 1].y / (vel[i - 1].y - vel[i].y)) * dt;
        break;
      }
    expect(errorRel(tSim, T)).toBeLessThan(0.01);
  });

  it('en B puro conserva |v| (energía cinética) a precisión de máquina durante 1000 vueltas', () => {
    const { vel } = simular({ x: v0, y: 0, z: 0 }, E0, 1000, 20);
    const fin = vel[vel.length - 1];
    expect(errorRel(Math.hypot(fin.x, fin.y, fin.z), v0)).toBeLessThan(1e-12);
  });

  it('Euler explícito no conserva la energía: la órbita se abre en espiral', () => {
    const { vel } = simular({ x: v0, y: 0, z: 0 }, E0, 5, 20, pasoEulerLorentz);
    const fin = vel[vel.length - 1];
    // |v| crece en √(1 + (ωΔt)²) por paso → (1 + (2π/20)²)^{50} ≈ 120 % de aumento
    expect(Math.hypot(fin.x, fin.y) / v0).toBeGreaterThan(2);
  });

  it('hélice: paso p = v∥ · T', () => {
    const vPar = 4e5;
    const { tray, T } = simular({ x: v0, y: 0, z: vPar }, E0, 3, 200);
    expect(errorRel(tray[tray.length - 1].z, 3 * vPar * T)).toBeLessThan(1e-9);
  });

  it('deriva E × B: la velocidad media es E × B / B², sin importar la carga', () => {
    const E = { x: 0, y: 2e4, z: 0 };
    const vd = velocidadDeriva(E, B);
    expect(vd.x).toBeCloseTo(2e5, 6); // E/B = 2·10⁵ m/s en +x
    const n = 10;
    const { tray, T } = simular({ x: 0, y: 0, z: 0 }, E, n, 200);
    const fin = tray[tray.length - 1];
    expect(errorRel(fin.x / (n * T), vd.x)).toBeLessThan(0.01);
    expect(Math.abs(fin.y)).toBeLessThan(0.01 * Math.abs(fin.x));
  });

  it('selector de velocidades: con v = E/B la partícula no se desvía', () => {
    const Bz = B.z;
    const v = 3e5;
    const E = { x: 0, y: v * Bz, z: 0 };
    const { tray } = simular({ x: v, y: 0, z: 0 }, E, 2, 200);
    for (const p of tray) expect(Math.abs(p.y)).toBeLessThan(1e-9);
  });
});
