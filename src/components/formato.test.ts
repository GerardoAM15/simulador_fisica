import { describe, expect, it } from 'vitest';
import { formatearPrefijo, formatearSI, formatearTex, marcasEje } from './formato';

describe('formatearSI', () => {
  it('usa decimal en el rango intermedio', () => {
    expect(formatearSI(12.3456)).toBe('12.35');
    expect(formatearSI(-0.5)).toBe('−0.5');
  });
  it('usa notación científica para valores muy grandes o pequeños', () => {
    expect(formatearSI(8.9875e9)).toBe('8.988 × 10⁹');
    expect(formatearSI(-1.602e-19)).toBe('−1.602 × 10⁻¹⁹');
    expect(formatearTex(2.5e-6, 2)).toBe('2.5\\times10^{-6}');
  });
  it('usa prefijos SI', () => {
    expect(formatearPrefijo(4.7e-4, 'F')).toBe('470 μF');
    expect(formatearPrefijo(1000, 'Ω')).toBe('1 kΩ');
    expect(formatearPrefijo(2.5e-3, 's')).toBe('2.5 ms');
    expect(formatearPrefijo(12, 'V')).toBe('12 V');
  });
  it('marcas de eje redondas', () => {
    expect(marcasEje(4)).toEqual([0, 1, 2, 3, 4]);
    expect(marcasEje(0.7)).toEqual([0, 0.2, 0.4, 0.6]);
    expect(marcasEje(0)).toEqual([0]);
  });
  it('maneja casos especiales', () => {
    expect(formatearSI(0)).toBe('0');
    expect(formatearSI(Infinity)).toBe('∞');
  });
});
