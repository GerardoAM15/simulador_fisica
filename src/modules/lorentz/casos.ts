/**
 * Escenarios del módulo 9 (sin React). En todos, B apunta a +z y E (si existe) a +y.
 */
import { CARGA_ELEMENTAL, MASA_ELECTRON, MASA_PROTON } from '../../physics/constants';
import { periodoCiclotron, radioCiclotron } from '../../physics/magnetism';
import type { Vec3 } from '../../physics/vector';

export type IdCaso = 'circular' | 'helicoidal' | 'deriva' | 'selector' | 'espectrometro';
export type IdParticula = 'proton' | 'electron' | 'alfa' | 'deuteron';

/** Unidad de masa atómica [kg] */
export const UMA = 1.6605390666e-27;

export const PARTICULAS: Record<IdParticula, { nombre: string; q: number; m: number }> = {
  proton: { nombre: 'Protón', q: CARGA_ELEMENTAL, m: MASA_PROTON },
  electron: { nombre: 'Electrón', q: -CARGA_ELEMENTAL, m: MASA_ELECTRON },
  alfa: { nombre: 'Partícula α', q: 2 * CARGA_ELEMENTAL, m: 6.6446573357e-27 },
  deuteron: { nombre: 'Deuterón', q: CARGA_ELEMENTAL, m: 3.3435837724e-27 },
};

export const CASOS: Record<IdCaso, { nombre: string; descripcion: string }> = {
  circular: { nombre: 'Circular', descripcion: 'v ⊥ B: la fuerza magnética es centrípeta y la partícula gira en un círculo.' },
  helicoidal: { nombre: 'Helicoidal', descripcion: 'v tiene una componente paralela a B que no cambia: la trayectoria es una hélice.' },
  deriva: { nombre: 'Deriva E×B', descripcion: 'Con E ⊥ B la partícula (que parte del reposo) describe una cicloide que avanza con v = E×B/B².' },
  selector: { nombre: 'Selector de velocidades', descripcion: 'qE equilibra a qvB solo si v = E/B: esa partícula pasa recta por la rendija.' },
  espectrometro: { nombre: 'Espectrómetro de masas', descripcion: 'Iones con la misma v y q describen semicírculos de radio r = mv/(qB): se separan por masa.' },
};

export interface Controles {
  caso: IdCaso;
  particula: IdParticula;
  /** |B| [T] */
  B: number;
  /** |E| [V/m] */
  E: number;
  /** Rapidez inicial [m/s] */
  v0: number;
  /** Ángulo entre v₀ y B [grados] (caso helicoidal) */
  angulo: number;
}

export interface ParticulaEscenario {
  nombre: string;
  q: number;
  m: number;
  r0: Vec3;
  v0: Vec3;
  color: string;
}

export interface Escenario {
  E: Vec3;
  B: Vec3;
  particulas: ParticulaEscenario[];
  /** Longitud característica [m]: 1 unidad de la escena (radio de giro, diámetro de la cicloide…) */
  escala: number;
  /** Paso temporal [s] */
  dt: number;
  /** Condición de término (posición en unidades de escala); devuelve un mensaje o null */
  detener: (p: Vec3, i: number) => string | null;
}

const COLORES = ['#38bdf8', '#f472b6', '#a3e635'];
/** Pasos de Boris por período ciclotrónico */
export const PASOS_POR_PERIODO = 120;

export function crearEscenario(c: Controles): Escenario {
  const B: Vec3 = { x: 0, y: 0, z: c.B };
  const par = PARTICULAS[c.particula];
  const T = periodoCiclotron(par.m, par.q, c.B);
  const dt = T / PASOS_POR_PERIODO;
  const lejos = (p: Vec3) => (Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)) > 12 ? 'La partícula salió de la región.' : null);

  switch (c.caso) {
    case 'circular': {
      const r = radioCiclotron(par.m, c.v0, par.q, c.B);
      return { E: { x: 0, y: 0, z: 0 }, B, escala: r, dt, detener: lejos, particulas: [{ ...par, r0: { x: 0, y: 0, z: 0 }, v0: { x: c.v0, y: 0, z: 0 }, color: COLORES[0] }] };
    }
    case 'helicoidal': {
      const a = (c.angulo * Math.PI) / 180;
      const vPerp = c.v0 * Math.sin(a);
      const r = radioCiclotron(par.m, vPerp, par.q, c.B);
      return {
        E: { x: 0, y: 0, z: 0 },
        B,
        escala: r,
        dt,
        detener: (p) => (p.z > 6 ? 'La partícula salió por arriba.' : lejos(p)),
        particulas: [{ ...par, r0: { x: 0, y: 0, z: -6 * r }, v0: { x: vPerp, y: 0, z: c.v0 * Math.cos(a) }, color: COLORES[0] }],
      };
    }
    case 'deriva': {
      // Diámetro de la cicloide: 2 m E / (|q| B²)
      const d = (2 * par.m * c.E) / (Math.abs(par.q) * c.B * c.B);
      return {
        E: { x: 0, y: c.E, z: 0 },
        B,
        escala: d,
        dt,
        detener: (p) => (p.x > 8 ? 'La partícula salió por la derecha.' : lejos(p)),
        particulas: [{ ...par, r0: { x: -8 * d, y: 0, z: 0 }, v0: { x: 0, y: 0, z: 0 }, color: COLORES[0] }],
      };
    }
    case 'selector': {
      // Tres partículas iguales con 0.8, 1 y 1.2 veces la velocidad seleccionada v = E/B
      const vSel = c.E / c.B;
      const r = radioCiclotron(par.m, vSel, par.q, c.B);
      const factores = [0.8, 1, 1.2];
      return {
        E: { x: 0, y: c.E, z: 0 },
        B,
        escala: r,
        dt,
        detener: (p) => (p.x > 5 ? 'Llegó a la rendija.' : Math.abs(p.y) > 1.5 ? 'Chocó con una placa.' : lejos(p)),
        particulas: factores.map((f, i) => ({ ...par, nombre: `${f} E/B`, r0: { x: -5 * r, y: 0, z: 0 }, v0: { x: f * vSel, y: 0, z: 0 }, color: COLORES[i] })),
      };
    }
    case 'espectrometro': {
      // Iones C⁺ de 12, 13 y 14 u con la misma rapidez
      const iones = [12, 13, 14].map((A, i) => ({
        nombre: `${{ 12: '¹²', 13: '¹³', 14: '¹⁴' }[A]}C⁺`,
        q: CARGA_ELEMENTAL,
        m: A * UMA - MASA_ELECTRON,
        r0: { x: 0, y: 0, z: 0 },
        v0: { x: 0, y: c.v0, z: 0 },
        color: COLORES[i],
      }));
      const r12 = radioCiclotron(iones[0].m, c.v0, CARGA_ELEMENTAL, c.B);
      const Tmin = periodoCiclotron(iones[0].m, CARGA_ELEMENTAL, c.B);
      return {
        E: { x: 0, y: 0, z: 0 },
        B,
        escala: r12,
        dt: Tmin / PASOS_POR_PERIODO,
        detener: (p) => (p.y < 0 ? 'Llegó al detector.' : lejos(p)),
        particulas: iones,
      };
    }
  }
}
