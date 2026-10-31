/**
 * Capacitores: placas paralelas, dieléctricos, energía, asociaciones y circuito RC.
 */
import { EPSILON_0 } from './constants';

// ─────────────────────────── Dieléctricos ───────────────────────────

export interface Dielectrico {
  id: string;
  nombre: string;
  /** Constante dieléctrica κ (adimensional) */
  kappa: number;
  /** Rigidez dieléctrica: campo máximo antes de la ruptura [V/m] (null si no aplica) */
  rigidez: number | null;
  /** Color para la visualización */
  color: string;
}

/** Valores típicos a temperatura ambiente (Serway & Jewett, tabla 26.1, y fuentes técnicas). */
export const DIELECTRICOS: Dielectrico[] = [
  { id: 'vacio', nombre: 'Vacío', kappa: 1, rigidez: null, color: '#94a3b8' },
  { id: 'aire', nombre: 'Aire (seco)', kappa: 1.00059, rigidez: 3e6, color: '#cbd5e1' },
  { id: 'teflon', nombre: 'Teflón', kappa: 2.1, rigidez: 60e6, color: '#f1f5f9' },
  { id: 'papel', nombre: 'Papel', kappa: 3.7, rigidez: 16e6, color: '#fde68a' },
  { id: 'mica', nombre: 'Mica', kappa: 5.4, rigidez: 100e6, color: '#d6b98c' },
  { id: 'vidrio', nombre: 'Vidrio (Pyrex)', kappa: 5.6, rigidez: 14e6, color: '#67e8f9' },
  { id: 'porcelana', nombre: 'Porcelana', kappa: 6, rigidez: 12e6, color: '#e2e8f0' },
  { id: 'agua', nombre: 'Agua (destilada)', kappa: 80, rigidez: null, color: '#38bdf8' },
];

// ─────────────────────────── Placas paralelas ───────────────────────────

/** Capacitancia de placas paralelas: C = κ ε0 A / d   [F] */
export function capacitanciaPlacas(area: number, separacion: number, kappa = 1): number {
  return (kappa * EPSILON_0 * area) / separacion;
}

/**
 * Dieléctrico de espesor completo insertado una fracción f del área: las dos zonas
 * (con y sin dieléctrico) están a la misma diferencia de potencial → capacitores en paralelo:
 *   C = (ε0 A / d) · [(1 − f) + κ f]
 */
export function capacitanciaParcial(area: number, separacion: number, kappa: number, fraccion: number): number {
  return ((EPSILON_0 * area) / separacion) * (1 - fraccion + kappa * fraccion);
}

/** Carga almacenada Q = C V   [C] */
export const cargaCapacitor = (C: number, V: number): number => C * V;

/** Campo uniforme entre placas E = V / d   [V/m] */
export const campoEntrePlacas = (V: number, d: number): number => V / d;

/**
 * Densidad de carga libre en las placas donde hay un dieléctrico κ: σ = κ ε0 E   [C/m²]
 * (con κ = 1 se obtiene σ = ε0 E, ley de Gauss para un plano conductor).
 */
export const densidadCargaLibre = (E: number, kappa = 1): number => kappa * EPSILON_0 * E;

/** Densidad de carga inducida (ligada) en la superficie del dieléctrico: σᵢ = σ (1 − 1/κ)   [C/m²] */
export const densidadCargaInducida = (sigmaLibre: number, kappa: number): number => sigmaLibre * (1 - 1 / kappa);

// ─────────────────────────── Energía ───────────────────────────

/** U = ½ C V²   [J] */
export const energiaCV = (C: number, V: number): number => 0.5 * C * V * V;
/** U = Q² / 2C   [J] */
export const energiaQC = (Q: number, C: number): number => (Q * Q) / (2 * C);
/** U = ½ Q V   [J] */
export const energiaQV = (Q: number, V: number): number => 0.5 * Q * V;

/** Densidad de energía del campo eléctrico: u = ½ κ ε0 E²   [J/m³] */
export const densidadEnergia = (E: number, kappa = 1): number => 0.5 * kappa * EPSILON_0 * E * E;

// ─────────────────────────── Asociaciones ───────────────────────────

/** Serie: 1/C_eq = Σ 1/Cᵢ (todos tienen la misma carga) */
export function capacitanciaSerie(cs: readonly number[]): number {
  return 1 / cs.reduce((s, c) => s + 1 / c, 0);
}

/** Paralelo: C_eq = Σ Cᵢ (todos tienen el mismo voltaje) */
export function capacitanciaParalelo(cs: readonly number[]): number {
  return cs.reduce((s, c) => s + c, 0);
}

export type TipoAsociacion = 'serie' | 'paralelo' | 'mixto';

export interface ElementoAsociacion {
  C: number;
  Q: number;
  V: number;
  U: number;
}

export interface ResultadoAsociacion {
  Ceq: number;
  /** Carga entregada por la fuente */
  Q: number;
  /** Energía total ½ C_eq V² */
  U: number;
  elementos: ElementoAsociacion[];
}

/**
 * Reparto de carga y voltaje en una asociación conectada a una fuente V.
 * 'mixto': C₁ en serie con el paralelo (C₂ ∥ C₃ ∥ …).
 */
export function analizarAsociacion(cs: readonly number[], V: number, tipo: TipoAsociacion): ResultadoAsociacion {
  const el = (C: number, Vi: number): ElementoAsociacion => ({ C, Q: C * Vi, V: Vi, U: 0.5 * C * Vi * Vi });
  let Ceq: number;
  let elementos: ElementoAsociacion[];

  if (tipo === 'serie') {
    Ceq = capacitanciaSerie(cs);
    const Q = Ceq * V; // misma carga en todos: Vᵢ = Q/Cᵢ
    elementos = cs.map((C) => el(C, Q / C));
  } else if (tipo === 'paralelo') {
    Ceq = capacitanciaParalelo(cs);
    elementos = cs.map((C) => el(C, V));
  } else {
    const [c1, ...resto] = cs;
    const Cp = capacitanciaParalelo(resto);
    Ceq = capacitanciaSerie([c1, Cp]);
    const Q = Ceq * V;
    const Vp = Q / Cp;
    elementos = [el(c1, Q / c1), ...resto.map((C) => el(C, Vp))];
  }
  return { Ceq, Q: Ceq * V, U: 0.5 * Ceq * V * V, elementos };
}

// ─────────────────────────── Circuito RC ───────────────────────────

export interface EstadoRC {
  /** Carga del capacitor [C] */
  Q: number;
  /** Corriente I = dQ/dt [A] (negativa durante la descarga) */
  I: number;
  /** Voltaje del capacitor V_C = Q/C [V] */
  Vc: number;
  /** Voltaje de la resistencia V_R = I R [V] */
  Vr: number;
}

/**
 * Solución de la ecuación del circuito RC  R dQ/dt + Q/C = ε  (ε = V al cargar, 0 al descargar):
 *   Q(t) = Q_f + (Q₀ − Q_f) e^{−t/τ},   τ = RC,   Q_f = C ε
 *   I(t) = dQ/dt = −(Q₀ − Q_f)/τ · e^{−t/τ}
 * Con Q₀ = 0 y carga: Q = CV(1 − e^{−t/τ}), I = (V/R) e^{−t/τ}.
 * Con Q₀ = CV y descarga: Q = CV e^{−t/τ}, I = −(V/R) e^{−t/τ}.
 */
export function respuestaRC(t: number, R: number, C: number, V: number, Q0: number, cargando: boolean): EstadoRC {
  const tau = R * C;
  const Qf = cargando ? C * V : 0;
  const ex = Math.exp(-t / tau);
  const Q = Qf + (Q0 - Qf) * ex;
  const I = (-(Q0 - Qf) / tau) * ex;
  return { Q, I, Vc: Q / C, Vr: I * R };
}

export interface BalanceEnergiaRC {
  /** Energía entregada por la batería W = ε ΔQ [J] */
  bateria: number;
  /** Energía almacenada en el capacitor Q²/2C [J] */
  capacitor: number;
  /** Energía disipada en la resistencia ∫ I² R dt [J] */
  resistencia: number;
}

/**
 * Balance de energía de un tramo (carga o descarga) que empieza con carga Q₀ y llega a Q.
 * Por conservación: W_batería = ΔU_C + Q_disipado. Al cargar desde cero hasta CV, la batería
 * entrega CV² y exactamente la mitad (½CV²) se disipa en R, sin importar el valor de R.
 */
export function balanceTramoRC(Q0: number, Q: number, C: number, V: number, cargando: boolean): BalanceEnergiaRC {
  const bateria = cargando ? V * (Q - Q0) : 0;
  const deltaU = (Q * Q - Q0 * Q0) / (2 * C);
  return { bateria, capacitor: (Q * Q) / (2 * C), resistencia: bateria - deltaU };
}
