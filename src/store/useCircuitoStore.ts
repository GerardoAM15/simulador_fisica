import { create } from 'zustand';
import {
  PRESETS_CIRCUITO,
  VALOR_INICIAL,
  agregarTramos,
  nuevoId,
  rotar,
  siguienteNombre,
  tramosEnL,
  type Circuito,
  type NombrePresetCircuito,
  type Punto,
  type TipoComponente,
} from '../modules/circuitos/modelo';

export type Herramienta = 'seleccionar' | 'cable' | 'borrar' | TipoComponente;

interface EstadoCircuito {
  circuito: Circuito;
  /** id del componente o cable seleccionado */
  seleccion: string | null;
  herramienta: Herramienta;
  setHerramienta: (h: Herramienta) => void;
  seleccionar: (id: string | null) => void;
  agregarComponente: (tipo: TipoComponente, p: Punto) => void;
  moverComponente: (id: string, p: Punto) => void;
  rotarSeleccion: () => void;
  cambiarValor: (id: string, valor: number) => void;
  alternarInterruptor: (id: string) => void;
  eliminar: (id: string) => void;
  agregarCable: (a: Punto, b: Punto) => void;
  cargarPreset: (p: NombrePresetCircuito) => void;
  limpiar: () => void;
}

/** Circuito del editor (módulo 6). Se conserva al navegar entre módulos. */
export const useCircuitoStore = create<EstadoCircuito>((set) => ({
  circuito: PRESETS_CIRCUITO.mixto.crear(),
  seleccion: null,
  herramienta: 'seleccionar',
  setHerramienta: (herramienta) => set({ herramienta }),
  seleccionar: (seleccion) => set({ seleccion }),
  agregarComponente: (tipo, p) =>
    set(({ circuito }) => {
      const c = { id: nuevoId('c'), tipo, nombre: siguienteNombre(circuito, tipo), p, dir: 0 as const, valor: VALOR_INICIAL[tipo], cerrado: true };
      return { circuito: { ...circuito, componentes: [...circuito.componentes, c] }, seleccion: c.id, herramienta: 'seleccionar' };
    }),
  moverComponente: (id, p) =>
    set(({ circuito }) => ({ circuito: { ...circuito, componentes: circuito.componentes.map((c) => (c.id === id ? { ...c, p } : c)) } })),
  rotarSeleccion: () =>
    set(({ circuito, seleccion }) => ({
      circuito: { ...circuito, componentes: circuito.componentes.map((c) => (c.id === seleccion ? rotar(c) : c)) },
    })),
  cambiarValor: (id, valor) =>
    set(({ circuito }) => ({ circuito: { ...circuito, componentes: circuito.componentes.map((c) => (c.id === id ? { ...c, valor } : c)) } })),
  alternarInterruptor: (id) =>
    set(({ circuito }) => ({
      circuito: { ...circuito, componentes: circuito.componentes.map((c) => (c.id === id ? { ...c, cerrado: !c.cerrado } : c)) },
    })),
  eliminar: (id) =>
    set(({ circuito, seleccion }) => ({
      circuito: { componentes: circuito.componentes.filter((c) => c.id !== id), cables: circuito.cables.filter((w) => w.id !== id) },
      seleccion: seleccion === id ? null : seleccion,
    })),
  agregarCable: (a, b) => set(({ circuito }) => ({ circuito: { ...circuito, cables: agregarTramos(circuito.cables, tramosEnL(a, b)) } })),
  cargarPreset: (p) => set({ circuito: PRESETS_CIRCUITO[p].crear(), seleccion: null }),
  limpiar: () => set({ circuito: { componentes: [], cables: [] }, seleccion: null }),
}));
