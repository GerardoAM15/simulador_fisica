/**
 * Simulación (sin React) de varias partículas bajo la fuerza de Lorentz con el método de Boris,
 * más una copia integrada con Euler para comparar.
 */
import { pasoBoris, pasoEulerLorentz } from '../../physics/integrators';
import type { Vec3 } from '../../physics/vector';
import type { Escenario, ParticulaEscenario } from './casos';

export interface EstadoParticula {
  cfg: ParticulaEscenario;
  r: Vec3;
  v: Vec3;
  /** Trayectoria en unidades de escala */
  tray: Vec3[];
  fin: string | null;
  /** Ángulo girado por v⊥ (en el plano xy, perpendicular a B) [rad] */
  angulo: number;
  /** Instante en que v⊥ completó la primera vuelta (período medido) [s] */
  periodo: number | null;
  /** Extremos en x e y durante la primera vuelta [m] */
  min: Vec3;
  max: Vec3;
  /** Desplazamiento durante la primera vuelta (Δz = paso de la hélice) [m] */
  desplazamientoVuelta: Vec3 | null;
  /** Cúspides de la cicloide (mínimos locales de |v|): instante y posición x [s, m] */
  cuspides: { t: number; x: number }[];
  rapidezPrevia: [number, number];
  /** Punto donde se detuvo [m] */
  final: Vec3 | null;
  euler: { r: Vec3; v: Vec3; tray: Vec3[] } | null;
}

/** Número máximo de puntos guardados por trayectoria */
export const MAX_PUNTOS = 40000;

export class SimulacionLorentz {
  t = 0;
  pasos = 0;
  readonly particulas: EstadoParticula[];
  readonly esc: Escenario;

  constructor(esc: Escenario, conEuler = false) {
    this.esc = esc;
    const s = esc.escala;
    this.particulas = esc.particulas.map((cfg) => ({
      cfg,
      r: cfg.r0,
      v: cfg.v0,
      tray: [{ x: cfg.r0.x / s, y: cfg.r0.y / s, z: cfg.r0.z / s }],
      fin: null,
      angulo: 0,
      periodo: null,
      min: { ...cfg.r0 },
      max: { ...cfg.r0 },
      desplazamientoVuelta: null,
      cuspides: [],
      rapidezPrevia: [Infinity, Infinity],
      final: null,
      euler: conEuler ? { r: cfg.r0, v: cfg.v0, tray: [{ x: cfg.r0.x / s, y: cfg.r0.y / s, z: cfg.r0.z / s }] } : null,
    }));
  }

  get terminada(): boolean {
    return this.particulas.every((p) => p.fin);
  }

  paso(): void {
    const { E, B, dt, escala: s } = this.esc;
    this.pasos++;
    this.t += dt;
    this.particulas.forEach((p, i) => {
      if (p.fin) return;
      const qm = p.cfg.q / p.cfg.m;
      const ang0 = Math.atan2(p.v.y, p.v.x);
      const sig = pasoBoris(p.r, p.v, qm, E, B, dt);
      p.r = sig.r;
      p.v = sig.v;

      // Ángulo girado por v⊥ (se ignora mientras v⊥ ≈ 0, p. ej. al partir del reposo)
      if (Math.hypot(p.v.x, p.v.y) > 0 && p.periodo === null) {
        let d = Math.atan2(p.v.y, p.v.x) - ang0;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        const antes = Math.abs(p.angulo);
        p.angulo += d;
        p.min = { x: Math.min(p.min.x, p.r.x), y: Math.min(p.min.y, p.r.y), z: Math.min(p.min.z, p.r.z) };
        p.max = { x: Math.max(p.max.x, p.r.x), y: Math.max(p.max.y, p.r.y), z: Math.max(p.max.z, p.r.z) };
        // Interpolación lineal del instante en que el ángulo acumulado alcanza 2π
        if (Math.abs(p.angulo) >= 2 * Math.PI) {
          p.periodo = this.t - dt + (dt * (2 * Math.PI - antes)) / (Math.abs(p.angulo) - antes);
          // Posición retrocedida al instante exacto del período: r(T) ≈ r − v (t − T)
          const atras = this.t - p.periodo;
          p.desplazamientoVuelta = {
            x: p.r.x - p.v.x * atras - p.cfg.r0.x,
            y: p.r.y - p.v.y * atras - p.cfg.r0.y,
            z: p.r.z - p.v.z * atras - p.cfg.r0.z,
          };
        }
      }

      // Cúspide: la rapidez del paso anterior es un mínimo local
      const rapidez = Math.hypot(p.v.x, p.v.y, p.v.z);
      const [r2, r1] = p.rapidezPrevia;
      if (r1 < r2 && r1 < rapidez) p.cuspides.push({ t: this.t - dt, x: p.r.x - p.v.x * dt });
      p.rapidezPrevia = [r1, rapidez];

      if (p.tray.length < MAX_PUNTOS) p.tray.push({ x: p.r.x / s, y: p.r.y / s, z: p.r.z / s });
      if (p.euler) {
        const e = pasoEulerLorentz(p.euler.r, p.euler.v, qm, E, B, dt);
        p.euler.r = e.r;
        p.euler.v = e.v;
        const pe = { x: e.r.x / s, y: e.r.y / s, z: e.r.z / s };
        if (p.euler.tray.length < MAX_PUNTOS && Math.max(Math.abs(pe.x), Math.abs(pe.y), Math.abs(pe.z)) < 30) p.euler.tray.push(pe);
      }

      const motivo = this.esc.detener({ x: p.r.x / s, y: p.r.y / s, z: p.r.z / s }, i);
      if (motivo) {
        p.fin = motivo;
        p.final = p.r;
      }
    });
  }

  /** Velocidad de deriva medida entre la primera y la última cúspide [m/s] */
  static derivaMedida(p: EstadoParticula): number | null {
    const c = p.cuspides;
    if (c.length < 2) return null;
    return (c[c.length - 1].x - c[0].x) / (c[c.length - 1].t - c[0].t);
  }

  /** Radio medido como la mitad de la extensión de la primera vuelta (promedio de x e y) [m] */
  static radioMedido(p: EstadoParticula): number | null {
    if (p.periodo === null) return null;
    return (p.max.x - p.min.x + (p.max.y - p.min.y)) / 4;
  }
}
