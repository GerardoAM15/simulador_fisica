import { describe, expect, it } from 'vitest';
import { MICRO } from '../constants';
import { direccionesEsfera, lineasCampoElectrico, trazarLinea, type OpcionesLineasE } from '../fieldLines';
import type { CargaPuntual } from '../electrostatics';
import { norma3 } from '../vector';

const caja = { min: { x: -2, y: -2, z: -2 }, max: { x: 2, y: 2, z: 2 } };
const opciones: OpcionesLineasE = {
  paso: 0.01,
  maxPasos: 2000,
  limites: caja,
  lineasPorMicroC: 4,
  dimension: 2,
  radioInicio: 0.03,
};
const carga = (q: number, x: number, y = 0): CargaPuntual => ({ q, x, y, z: 0 });

describe('trazador genérico', () => {
  it('en un campo uniforme la línea es recta y avanza Δs por paso', () => {
    const { puntos, motivo } = trazarLinea(() => ({ x: 3, y: 4, z: 0 }), { x: 0, y: 0, z: 0 }, 1, {
      paso: 0.1,
      maxPasos: 10,
      limites: caja,
    });
    expect(motivo).toBe('maxPasos');
    const fin = puntos[puntos.length - 1];
    expect(fin.x).toBeCloseTo(0.6, 10);
    expect(fin.y).toBeCloseTo(0.8, 10);
  });

  it('se detiene en un punto de campo nulo', () => {
    const r = trazarLinea(() => ({ x: 0, y: 0, z: 0 }), { x: 0, y: 0, z: 0 }, 1, { paso: 0.1, maxPasos: 10, limites: caja });
    expect(r.motivo).toBe('campoNulo');
  });
});

describe('líneas de campo eléctrico', () => {
  it('una carga positiva aislada produce líneas radiales que salen de la caja', () => {
    const lineas = lineasCampoElectrico([carga(2 * MICRO, 0)], opciones);
    expect(lineas).toHaveLength(8); // 4 líneas/μC × 2 μC
    for (const l of lineas) {
      expect(l.motivo).toBe('limite');
      const a = l.puntos[1];
      const b = l.puntos[l.puntos.length - 1];
      // Dirección constante: los puntos inicial y final son colineales con la carga
      expect(Math.abs(a.x * b.y - a.y * b.x)).toBeLessThan(1e-9);
    }
  });

  it('el número de líneas es proporcional a |q| (ley de Gauss)', () => {
    const lineas = lineasCampoElectrico([carga(3 * MICRO, -1), carga(1 * MICRO, 1)], opciones);
    const deCarga = (x: number) => lineas.filter((l) => l.puntos[0].x === x).length;
    expect(deCarga(-1)).toBe(12);
    expect(deCarga(1)).toBe(4);
  });

  it('en un dipolo las líneas nacen en + y mueren en −', () => {
    const lineas = lineasCampoElectrico([carga(MICRO, -0.3), carga(-MICRO, 0.3)], { ...opciones, lineasPorMicroC: 8 });
    const terminanEnNegativa = lineas.filter((l) => l.motivo === 'sumidero');
    // Las líneas que salen hacia el lado opuesto abandonan la caja antes de volver
    expect(terminanEnNegativa.length).toBeGreaterThanOrEqual(lineas.length / 2);
    expect(terminanEnNegativa.some((l) => l.puntos[1].x > -0.3 && Math.abs(l.puntos[1].y) < 1e-9)).toBe(true);
    for (const l of terminanEnNegativa) {
      expect(l.puntos[0]).toEqual({ x: -0.3, y: 0, z: 0 });
      expect(l.puntos[l.puntos.length - 1]).toEqual({ x: 0.3, y: 0, z: 0 });
    }
  });

  it('si predomina la carga negativa, las líneas se trazan desde ella pero apuntan como E', () => {
    const lineas = lineasCampoElectrico([carga(-MICRO, 0)], opciones);
    expect(lineas).toHaveLength(4);
    for (const l of lineas) {
      const fin = l.puntos[l.puntos.length - 1];
      expect(fin).toEqual({ x: 0, y: 0, z: 0 }); // terminan en la carga negativa
      expect(norma3(l.puntos[0])).toBeGreaterThan(1.9); // vienen desde lejos
    }
  });

  it('en 3D las semillas cubren la esfera de manera uniforme', () => {
    const dirs = direccionesEsfera(200);
    const media = dirs.reduce((s, d) => ({ x: s.x + d.x, y: s.y + d.y, z: s.z + d.z }), { x: 0, y: 0, z: 0 });
    expect(norma3(media) / 200).toBeLessThan(0.01);
    for (const d of dirs) expect(norma3(d)).toBeCloseTo(1, 12);
  });
});
