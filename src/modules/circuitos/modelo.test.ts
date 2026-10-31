import { describe, expect, it } from 'vitest';
import { PRESETS_CIRCUITO, analizar, extremo, rotar, tramosEnL, type Circuito } from './modelo';

const porNombre = (c: Circuito, a: ReturnType<typeof analizar>, nombre: string) => a.componentes.get(c.componentes.find((x) => x.nombre === nombre)!.id)!;

describe('editor de circuitos', () => {
  it('rotar gira 90° alrededor del centro del componente', () => {
    const c = { id: 'x', tipo: 'resistencia' as const, nombre: 'R1', p: { x: 4, y: 4 }, dir: 0 as const, valor: 1, cerrado: true };
    const r = rotar(c);
    expect(r.dir).toBe(1);
    expect(r.p).toEqual({ x: 5, y: 3 });
    expect(extremo(r)).toEqual({ x: 5, y: 5 });
    expect(rotar(rotar(rotar(rotar(c))))).toEqual(c);
  });

  it('un cable en L se divide en tramos unitarios', () => {
    const t = tramosEnL({ x: 0, y: 0 }, { x: 2, y: -1 });
    expect(t).toHaveLength(3);
    expect(t[2][1]).toEqual({ x: 2, y: -1 });
  });

  it('preset serie: I = 12 V / 600 Ω = 20 mA en todos los elementos y cables', () => {
    const c = PRESETS_CIRCUITO.serie.crear();
    const a = analizar(c);
    expect(a.ok).toBe(true);
    for (const n of ['R1', 'R2', 'R3']) expect(Math.abs(porNombre(c, a, n).corriente)).toBeCloseTo(0.02, 9);
    for (const I of a.cables.values()) expect(Math.abs(I)).toBeCloseTo(0.02, 9);
    expect(a.mallas).toHaveLength(1);
    for (const s of a.kcl) expect(Math.abs(s)).toBeLessThan(1e-9);
  });

  it('preset paralelo: cada rama recibe 12 V', () => {
    const c = PRESETS_CIRCUITO.paralelo.crear();
    const a = analizar(c);
    expect(Math.abs(porNombre(c, a, 'R1').corriente)).toBeCloseTo(0.12, 9);
    expect(Math.abs(porNombre(c, a, 'R3').corriente)).toBeCloseTo(0.04, 9);
    expect(Math.abs(porNombre(c, a, 'V1').corriente)).toBeCloseTo(0.22, 9);
  });

  it('preset mixto: I = 3 A por R1 y por el interruptor; al abrirlo la corriente se anula', () => {
    const c = PRESETS_CIRCUITO.mixto.crear();
    const a = analizar(c);
    expect(Math.abs(porNombre(c, a, 'R1').corriente)).toBeCloseTo(3, 9);
    expect(Math.abs(porNombre(c, a, 'S1').corriente)).toBeCloseTo(3, 9);
    expect(Math.abs(porNombre(c, a, 'R3').corriente)).toBeCloseTo(2, 9);

    const abierto = { ...c, componentes: c.componentes.map((x) => (x.tipo === 'interruptor' ? { ...x, cerrado: false } : x)) };
    const b = analizar(abierto);
    expect(Math.abs(porNombre(abierto, b, 'R1').corriente)).toBeLessThan(1e-9);
    expect(Math.abs(porNombre(abierto, b, 'S1').voltaje)).toBeCloseTo(12, 6);
  });

  it('preset Wheatstone equilibrado: sin corriente por el puente; 2 + 1 mallas', () => {
    const c = PRESETS_CIRCUITO.wheatstone.crear();
    const a = analizar(c);
    const total = Math.abs(porNombre(c, a, 'V1').corriente);
    expect(Math.abs(porNombre(c, a, 'R5').corriente) / total).toBeLessThan(1e-9);
    expect(a.mallas).toHaveLength(3);
  });

  it('un cable que une los terminales de la fuente se informa como cortocircuito', () => {
    const c = PRESETS_CIRCUITO.serie.crear();
    const v = c.componentes.find((x) => x.tipo === 'fuente')!;
    const corto = { ...c, cables: [...c.cables, { id: 'corto', a: v.p, b: { x: v.p.x - 1, y: v.p.y } }, { id: 'c2', a: { x: v.p.x - 1, y: v.p.y }, b: { x: v.p.x - 1, y: v.p.y - 2 } }, { id: 'c3', a: { x: v.p.x - 1, y: v.p.y - 2 }, b: extremo(v) }] };
    // Los tramos de 2 celdas no son unitarios, pero igual unen los puntos en el mismo nodo
    expect(analizar(corto).ok).toBe(false);
  });
});
