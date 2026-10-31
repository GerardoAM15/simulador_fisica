import { describe, expect, it } from 'vitest';
import { formatearSI, formatearTex } from './formato';

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
  it('maneja casos especiales', () => {
    expect(formatearSI(0)).toBe('0');
    expect(formatearSI(Infinity)).toBe('∞');
  });
});
