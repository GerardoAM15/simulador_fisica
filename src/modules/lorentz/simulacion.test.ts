import { describe, expect, it } from 'vitest';
import { CARGA_ELEMENTAL } from '../../physics/constants';
import { periodoCiclotron, radioCiclotron } from '../../physics/magnetism';
import { PARTICULAS, crearEscenario, type Controles } from './casos';
import { SimulacionLorentz } from './simulacion';

const errorRel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);
const base: Controles = { caso: 'circular', particula: 'proton', B: 0.1, E: 2e4, v0: 1e6, angulo: 60 };

function correr(sim: SimulacionLorentz, max = 50000) {
  for (let i = 0; i < max && !sim.terminada; i++) sim.paso();
}

describe('simulación de Lorentz', () => {
  it('circular: radio y período medidos coinciden con r = mv/(|q|B) y T = 2πm/(|q|B)', () => {
    const sim = new SimulacionLorentz(crearEscenario(base));
    for (let i = 0; i < 300; i++) sim.paso();
    const p = sim.particulas[0];
    const { m, q } = PARTICULAS.proton;
    expect(errorRel(p.periodo!, periodoCiclotron(m, q, 0.1))).toBeLessThan(0.01);
    expect(errorRel(SimulacionLorentz.radioMedido(p)!, radioCiclotron(m, 1e6, q, 0.1))).toBeLessThan(0.01);
  });

  it('el electrón gira en sentido contrario al protón con el mismo período que predice T = 2πm/(|q|B)', () => {
    const sim = new SimulacionLorentz(crearEscenario({ ...base, particula: 'electron', B: 1e-3 }));
    for (let i = 0; i < 300; i++) sim.paso();
    const p = sim.particulas[0];
    expect(p.angulo).toBeGreaterThan(0); // antihorario
    expect(errorRel(p.periodo!, periodoCiclotron(PARTICULAS.electron.m, PARTICULAS.electron.q, 1e-3))).toBeLessThan(0.01);
  });

  it('selector: solo la partícula con v = E/B llega a la rendija sin desviarse', () => {
    const sim = new SimulacionLorentz(crearEscenario({ ...base, caso: 'selector' }));
    correr(sim);
    const [lenta, justa, rapida] = sim.particulas;
    expect(justa.fin).toMatch(/rendija/);
    expect(Math.abs(justa.final!.y) / sim.esc.escala).toBeLessThan(1e-6);
    expect(Math.abs(lenta.final!.y)).toBeGreaterThan(0.05 * sim.esc.escala);
    expect(Math.abs(rapida.final!.y)).toBeGreaterThan(0.05 * sim.esc.escala);
  });

  it('espectrómetro: cada ion impacta a 2r = 2mv/(qB) del origen (error < 1 %) y la masa se recupera', () => {
    const sim = new SimulacionLorentz(crearEscenario({ ...base, caso: 'espectrometro', v0: 1e5 }));
    correr(sim);
    for (const p of sim.particulas) {
      const r = radioCiclotron(p.cfg.m, 1e5, CARGA_ELEMENTAL, 0.1);
      expect(p.fin).toMatch(/detector/);
      expect(errorRel(p.final!.x, 2 * r)).toBeLessThan(0.01);
      const mMedida = (CARGA_ELEMENTAL * 0.1 * (p.final!.x / 2)) / 1e5;
      expect(errorRel(mMedida, p.cfg.m)).toBeLessThan(0.01);
    }
  });

  it('deriva: la partícula avanza en +x con velocidad media E/B', () => {
    const sim = new SimulacionLorentz(crearEscenario({ ...base, caso: 'deriva' }));
    const x0 = sim.particulas[0].r.x;
    const T = periodoCiclotron(PARTICULAS.proton.m, PARTICULAS.proton.q, 0.1);
    for (let i = 0; i < 5 * 120; i++) sim.paso();
    expect(errorRel((sim.particulas[0].r.x - x0) / (5 * T), 2e4 / 0.1)).toBeLessThan(0.01);
    // Medida entre cúspides de la cicloide (lo que muestra la interfaz)
    expect(errorRel(SimulacionLorentz.derivaMedida(sim.particulas[0])!, 2e4 / 0.1)).toBeLessThan(0.01);
  });

  it('hélice: el desplazamiento en z durante una vuelta es el paso p = v∥ T', () => {
    const sim = new SimulacionLorentz(crearEscenario({ ...base, caso: 'helicoidal', angulo: 60 }));
    for (let i = 0; i < 200; i++) sim.paso();
    const T = periodoCiclotron(PARTICULAS.proton.m, PARTICULAS.proton.q, 0.1);
    expect(errorRel(sim.particulas[0].desplazamientoVuelta!.z, 1e6 * Math.cos(Math.PI / 3) * T)).toBeLessThan(0.001);
  });
});
