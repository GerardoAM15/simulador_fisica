import { describe, expect, it } from 'vitest';
import { cruz3, distancia2, norma2, norma3, normalizar2, normalizar3, punto3, restar3, sumar2, vec2, vec3 } from '../vector';

describe('vector', () => {
  it('operaciones básicas en 2D', () => {
    expect(sumar2(vec2(1, 2), vec2(3, 4))).toEqual({ x: 4, y: 6 });
    expect(norma2(vec2(3, 4))).toBe(5);
    expect(distancia2(vec2(1, 1), vec2(4, 5))).toBe(5);
    expect(norma2(normalizar2(vec2(10, -7)))).toBeCloseTo(1, 12);
    expect(normalizar2(vec2(0, 0))).toEqual({ x: 0, y: 0 });
  });

  it('producto cruz: î × ĵ = k̂ y a×b es perpendicular a ambos', () => {
    expect(cruz3(vec3(1, 0, 0), vec3(0, 1, 0))).toEqual({ x: 0, y: 0, z: 1 });
    const a = vec3(1.5, -2, 0.3);
    const b = vec3(-0.7, 4, 2);
    const c = cruz3(a, b);
    expect(punto3(c, a)).toBeCloseTo(0, 12);
    expect(punto3(c, b)).toBeCloseTo(0, 12);
  });

  it('norma y normalización en 3D', () => {
    expect(norma3(vec3(2, 3, 6))).toBe(7);
    expect(norma3(normalizar3(vec3(-1, 5, 2)))).toBeCloseTo(1, 12);
    expect(restar3(vec3(1, 2, 3), vec3(1, 1, 1))).toEqual({ x: 0, y: 1, z: 2 });
  });
});
