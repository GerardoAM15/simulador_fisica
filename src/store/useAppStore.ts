import { create } from 'zustand';

/** Estado global de la interfaz (no de la física: cada módulo tendrá su propio store). */
interface AppState {
  menuAbierto: boolean;
  alternarMenu: () => void;
  cerrarMenu: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  menuAbierto: false,
  alternarMenu: () => set((s) => ({ menuAbierto: !s.menuAbierto })),
  cerrarMenu: () => set({ menuAbierto: false }),
}));
