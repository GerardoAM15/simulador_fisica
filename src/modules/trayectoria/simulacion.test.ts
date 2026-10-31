import { describe, expect, it } from 'vitest';
import { CARGA_ELEMENTAL, MASA_ELECTRON, MASA_PROTON, MICRO } from '../../physics/constants';
import { SimulacionParticula, type ConfigSimulacion } from './simulacion';

const base: ConfigSimulacion = {
  q: -CARGA_ELEMENTAL,
  m: MASA_ELECTRON,
  r0: { x: -1, y: 0 },
  v0: { x: 1e7, y: 0 },
  fuente: 'uniforme',
  campoUniforme: { x: 0, y: 200, z: 0 },
  cargas: [],
};

describe('simulación de trayectoria', () => {
  it('en campo uniforme sigue la parábola analítica y conserva la energía', () => {
    const sim = new SimulacionParticula(base);
    while (!sim.fin && sim.s[0] < 0.9) sim.paso();
    const an = sim.posicionAnalitica();
    const desplazamiento = Math.hypot(an.x - base.r0.x, an.y - base.r0.y);
    expect(Math.hypot(sim.s[0] - an.x, sim.s[1] - an.y) / desplazamiento).toBeLessThan(0.01);
    expect(sim.s[1]).toBeLessThan(0); // el electrón se desvía en contra de E
    const { total } = sim.energias();
    const E0 = sim.energiaInicial.total;
    expect(Math.abs(total - E0) / Math.abs(E0)).toBeLessThan(1e-6);
  });

  it('detecta la salida de la región', () => {
    const sim = new SimulacionParticula({ ...base, campoUniforme: { x: 0, y: 0, z: 0 } });
    for (let i = 0; i < 1e5 && !sim.fin; i++) sim.paso();
    expect(sim.fin).toMatch(/salió/);
  });

  it('un electrón lanzado lentamente hacia una carga positiva choca con ella, conservando la energía', () => {
    const sim = new SimulacionParticula({
      ...base,
      fuente: 'cargas',
      v0: { x: 1e5, y: 0 },
      cargas: [{ q: 1 * MICRO, x: 0, y: 0, z: 0 }],
    });
    for (let i = 0; i < 1e5 && !sim.fin; i++) sim.paso();
    expect(sim.fin).toMatch(/chocó/);
    const E0 = sim.energiaInicial;
    const E = sim.energias();
    expect(Math.abs(E.total - E0.total) / Math.max(Math.abs(E.K), Math.abs(E.U))).toBeLessThan(1e-3);
  });

  it('un protón rápido se dispersa en una carga positiva y sale con la misma rapidez', () => {
    const sim = new SimulacionParticula({
      ...base,
      q: CARGA_ELEMENTAL,
      m: MASA_PROTON,
      fuente: 'cargas',
      r0: { x: -2.5, y: 0.2 },
      v0: { x: 4e6, y: 0 },
      cargas: [{ q: 2 * MICRO, x: 0, y: 0, z: 0 }],
    });
    for (let i = 0; i < 2e5 && !sim.fin; i++) sim.paso();
    expect(sim.fin).toMatch(/salió/);
    expect(Math.abs(sim.energias().total - sim.energiaInicial.total) / sim.energiaInicial.total).toBeLessThan(1e-4);
  });
});
