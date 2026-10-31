import { describe, expect, it } from 'vitest';
import { MODULOS, UNIDADES, modulosDeUnidad } from './registry';

describe('registro de módulos', () => {
  it('tiene los 9 módulos con id y ruta únicos', () => {
    expect(MODULOS).toHaveLength(9);
    expect(new Set(MODULOS.map((m) => m.id)).size).toBe(9);
    expect(new Set(MODULOS.map((m) => m.ruta)).size).toBe(9);
  });

  it('cada unidad tiene al menos un módulo y todo módulo pertenece a una unidad', () => {
    for (const u of UNIDADES) expect(modulosDeUnidad(u.numero).length).toBeGreaterThan(0);
    const numeros = new Set(UNIDADES.map((u) => u.numero));
    for (const m of MODULOS) expect(numeros.has(m.unidad)).toBe(true);
  });
});
