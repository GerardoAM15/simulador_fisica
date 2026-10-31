import { create } from 'zustand';
import { MICRO } from '../physics/constants';
import type { CargaPuntual } from '../physics/electrostatics';

/**
 * Configuración de cargas puntuales compartida por los módulos 1, 2 y 3.
 * Las cargas se guardan en SI (C, m) y viven en el plano z = 0.
 */
export interface Carga extends CargaPuntual {
  id: number;
}

export const MAX_CARGAS = 10;
/** Rango editable de cada carga [μC] */
export const Q_MAX_MICRO = 10;

export type NombrePreset = 'dipolo' | 'iguales' | 'cuadrupolo' | 'placas';

/** Cada carga del preset es [q en μC, x en m, y en m] */
export const PRESETS: Record<NombrePreset, { nombre: string; cargas: [number, number, number][] }> = {
  dipolo: { nombre: 'Dipolo', cargas: [[2, -0.4, 0], [-2, 0.4, 0]] },
  iguales: { nombre: 'Dos cargas iguales', cargas: [[2, -0.4, 0], [2, 0.4, 0]] },
  cuadrupolo: {
    nombre: 'Cuadrupolo',
    cargas: [[2, -0.4, -0.4], [-2, 0.4, -0.4], [2, 0.4, 0.4], [-2, -0.4, 0.4]],
  },
  placas: {
    nombre: 'Placas paralelas',
    cargas: [-0.6, -0.3, 0, 0.3, 0.6].flatMap((y): [number, number, number][] => [[1, -0.35, y], [-1, 0.35, y]]),
  },
};

let siguienteId = 1;
const nueva = (qMicro: number, x: number, y: number): Carga => ({ id: siguienteId++, q: qMicro * MICRO, x, y, z: 0 });
const desdePreset = (p: NombrePreset) => PRESETS[p].cargas.map(([q, x, y]) => nueva(q, x, y));

/** Primer punto de una cuadrícula (ordenada por cercanía al origen) alejado al menos 0.2 m de las cargas. */
function posicionLibre(cargas: readonly Carga[]): [number, number] {
  const candidatos: [number, number][] = [];
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) candidatos.push([i * 0.2, j * 0.2]);
  candidatos.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
  return candidatos.find(([x, y]) => cargas.every((c) => Math.hypot(c.x - x, c.y - y) >= 0.2)) ?? [0, 0];
}

interface EstadoCargas {
  cargas: Carga[];
  seleccionada: number | null;
  agregar: (qMicro: number, x?: number, y?: number) => void;
  mover: (id: number, x: number, y: number) => void;
  cambiarCarga: (id: number, qMicro: number) => void;
  eliminar: (id: number) => void;
  seleccionar: (id: number | null) => void;
  cargarPreset: (p: NombrePreset) => void;
  limpiar: () => void;
}

export const useCargasStore = create<EstadoCargas>((set) => ({
  cargas: desdePreset('dipolo'),
  seleccionada: null,
  agregar: (qMicro, x, y) =>
    set((s) => {
      if (s.cargas.length >= MAX_CARGAS) return s;
      const [px, py] = x === undefined || y === undefined ? posicionLibre(s.cargas) : [x, y];
      const c = nueva(qMicro, px, py);
      return { cargas: [...s.cargas, c], seleccionada: c.id };
    }),
  mover: (id, x, y) => set((s) => ({ cargas: s.cargas.map((c) => (c.id === id ? { ...c, x, y } : c)) })),
  cambiarCarga: (id, qMicro) =>
    set((s) => ({ cargas: s.cargas.map((c) => (c.id === id ? { ...c, q: qMicro * MICRO } : c)) })),
  eliminar: (id) =>
    set((s) => ({ cargas: s.cargas.filter((c) => c.id !== id), seleccionada: s.seleccionada === id ? null : s.seleccionada })),
  seleccionar: (id) => set({ seleccionada: id }),
  cargarPreset: (p) => set({ cargas: desdePreset(p), seleccionada: null }),
  limpiar: () => set({ cargas: [], seleccionada: null }),
}));
