/**
 * Fuentes del módulo 8 (sin React): geometría, líneas de campo B y fórmula analítica de referencia.
 * Todas las fuentes tienen su eje sobre z.
 */
import { MU_0 } from '../../physics/constants';
import { trazarLinea, type OpcionesTrazado } from '../../physics/fieldLines';
import {
  campoDipolo,
  campoEspiraEje,
  campoHiloFinito,
  campoHiloInfinito,
  campoMagnetico,
  campoSolenoideEje,
  campoSolenoideIdeal,
  crearFuente,
  geometriaEspira,
  geometriaHilo,
  geometriaIman,
  geometriaSolenoide,
  type FuenteMagnetica,
} from '../../physics/magnetism';
import type { Vec3 } from '../../physics/vector';

export type TipoFuente = 'hilo' | 'espira' | 'solenoide' | 'iman';

export interface ParamsFuente {
  tipo: TipoFuente;
  /** Corriente [A] (en el imán, corriente superficial equivalente de cada espira) */
  I: number;
  /** Radio de la espira, solenoide o imán [m] */
  R: number;
  /** Longitud del solenoide o imán [m] */
  L: number;
  /** Número de vueltas del solenoide */
  N: number;
}

export const LONGITUD_HILO = 4;
/** Espiras con que se modela el imán */
export const ESPIRAS_IMAN = 24;
export const SEMILADO = 2.2;

export function geometria(p: ParamsFuente): Vec3[][] {
  switch (p.tipo) {
    case 'hilo':
      return geometriaHilo(LONGITUD_HILO, 400);
    case 'espira':
      return [geometriaEspira(p.R, 96)];
    case 'solenoide':
      return geometriaSolenoide(p.R, p.L, p.N, 40);
    case 'iman':
      return geometriaIman(p.R, p.L, ESPIRAS_IMAN, 32);
  }
}

export const construirFuente = (p: ParamsFuente): FuenteMagnetica => crearFuente(geometria(p), p.I);

/** Momento magnético del imán: m = M·I·πR² (dirigido a +z) */
export const momentoIman = (p: ParamsFuente) => ESPIRAS_IMAN * p.I * Math.PI * p.R * p.R;

/** Puntos de partida de las líneas de campo según la simetría de cada fuente. */
function semillas(p: ParamsFuente): Vec3[] {
  const s: Vec3[] = [];
  if (p.tipo === 'hilo') {
    for (const r of [0.25, 0.5, 0.8, 1.15]) for (const z of [-0.8, 0, 0.8]) s.push({ x: r, y: 0, z });
  } else if (p.tipo === 'espira') {
    s.push({ x: 0, y: 0, z: 0 });
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      for (const f of [0.3, 0.6, 0.85]) s.push({ x: f * p.R * Math.cos(a), y: f * p.R * Math.sin(a), z: 0 });
    }
  } else {
    s.push({ x: 0, y: 0, z: 0 });
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + Math.PI / 4;
      for (const f of [0.4, 0.75]) s.push({ x: f * p.R * Math.cos(a), y: f * p.R * Math.sin(a), z: 0 });
    }
  }
  return s;
}

/**
 * Líneas de B trazadas con RK4. Se integra hacia adelante; si la línea no se cierra sobre sí misma,
 * se integra también hacia atrás desde la semilla y se unen ambos tramos.
 */
export function lineasCampoB(p: ParamsFuente, f: FuenteMagnetica): Vec3[][] {
  const campo = (x: Vec3) => campoMagnetico(f, x, 0.01);
  const op: OpcionesTrazado = {
    paso: 0.02,
    maxPasos: 1200,
    detectarCierre: true,
    limites: { min: { x: -SEMILADO, y: -SEMILADO, z: -SEMILADO }, max: { x: SEMILADO, y: SEMILADO, z: SEMILADO } },
  };
  return semillas(p).map((s) => {
    const adelante = trazarLinea(campo, s, 1, op);
    if (adelante.motivo === 'cerrada') return adelante.puntos;
    const atras = trazarLinea(campo, s, -1, op);
    return [...atras.puntos.reverse(), ...adelante.puntos.slice(1)];
  });
}

export interface Analitica {
  /** Fórmula en LaTeX con los valores sustituidos */
  tex: string;
  /** Valor analítico de |B| [T] (null si no hay fórmula cerrada en ese punto) */
  valor: number | null;
  nota: string;
}

/** Fórmula analítica de |B| aplicable en el punto p (si existe). */
export function formulaAnalitica(prm: ParamsFuente, p: Vec3): Analitica {
  const rho = Math.hypot(p.x, p.y);
  const enEje = rho < 0.02 * Math.max(prm.R, 0.05);
  switch (prm.tipo) {
    case 'hilo':
      return {
        tex: 'B = \\frac{\\mu_0 I}{4\\pi r}\\left(\\sin\\theta_2-\\sin\\theta_1\\right)',
        valor: rho > 1e-6 ? campoHiloFinito(prm.I, rho, p.z, -LONGITUD_HILO / 2, LONGITUD_HILO / 2) : null,
        nota:
          rho > 1e-6
            ? `Hilo finito de ${LONGITUD_HILO} m. Si fuera infinito: μ0I/2πr = ${campoHiloInfinito(prm.I, rho).toExponential(3)} T.`
            : 'Sobre el propio hilo el campo no está definido.',
      };
    case 'espira':
      return enEje
        ? { tex: 'B = \\frac{\\mu_0 I R^2}{2\\,(R^2+z^2)^{3/2}}', valor: campoEspiraEje(prm.I, prm.R, p.z), nota: 'Válida sobre el eje de la espira.' }
        : {
            tex: 'B_{centro} = \\frac{\\mu_0 I}{2R}',
            valor: null,
            nota: `Fuera del eje no hay fórmula elemental (integrales elípticas). En el centro: ${((MU_0 * prm.I) / (2 * prm.R)).toExponential(3)} T. Coloca la sonda sobre el eje (x = y = 0) para comparar.`,
          };
    case 'solenoide':
      return enEje
        ? {
            tex: 'B = \\frac{\\mu_0 N I}{2L}\\left(\\cos\\theta_1-\\cos\\theta_2\\right)',
            valor: campoSolenoideEje(prm.N, prm.I, prm.L, prm.R, p.z),
            nota: `Solenoide finito, sobre el eje. Ideal (L ≫ R): μ0NI/L = ${campoSolenoideIdeal(prm.N, prm.I, prm.L).toExponential(3)} T.`,
          }
        : {
            tex: 'B \\approx \\frac{\\mu_0 N I}{L}',
            valor: rho < prm.R && Math.abs(p.z) < prm.L / 2 ? campoSolenoideIdeal(prm.N, prm.I, prm.L) : null,
            nota: 'Aproximación de solenoide ideal (solo dentro y lejos de los extremos). Sobre el eje se usa la fórmula exacta.',
          };
    case 'iman': {
      const B = campoDipolo({ x: 0, y: 0, z: momentoIman(prm) }, p);
      return {
        tex: '\\vec B = \\frac{\\mu_0}{4\\pi}\\,\\frac{3(\\vec m\\cdot\\hat r)\\hat r-\\vec m}{r^3}',
        valor: Math.hypot(B.x, B.y, B.z),
        nota: 'Aproximación de dipolo (m = N·I·πR²): solo es exacta lejos del imán (r ≫ L).',
      };
    }
  }
}
