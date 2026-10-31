import { describe, expect, it } from 'vitest';
import { formatearSI } from './formato';

describe('formatearSI', () => {
  it('usa decimal en el rango intermedio', () => {
    expect(formatearSI(12.3456)).toBe('12.35');
    expect(formatearSI(-0.5)).toBe('−0.5');
  });
  it('usa notación científica para valores muy grandes o pequeños', () => {
    expect(formatearSI(8.9875e9)).toBe('8.988 × 10^9');
    expect(formatearSI(-1.602e-19)).toBe('−1.602 × 10^−19');
  });
  it('maneja casos especiales', () => {
    expect(formatearSI(0)).toBe('0');
    expect(formatearSI(Infinity)).toBe('∞');
  });
});
