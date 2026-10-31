/**
 * Núcleo (sin React) de la simulación de una partícula cargada en un campo eléctrico estático.
 * Integra  m dv/dt = q E(r)  con RK4 y paso temporal adaptativo.
 */
import { campoElectrico, potencialCampoUniforme, potencialElectrico, R_SUAVIZADO, type CargaPuntual } from '../../physics/electrostatics';
import { derivadaParticulaCampoE, pasoRK4, pasoTemporalAdaptativo, type Derivada } from '../../physics/integrators';
import type { Vec2, Vec3 } from '../../physics/vector';

export type FuenteCampo = 'uniforme' | 'cargas';

export interface ConfigSimulacion {
  /** Carga [C] y masa [kg] de la partícula */
  q: number;
  m: number;
  r0: Vec2;
  v0: Vec2;
  fuente: FuenteCampo;
  /** Campo uniforme [N/C] (si fuente = 'uniforme') */
  campoUniforme: Vec3;
  cargas: readonly CargaPuntual[];
}

export interface Energias {
  /** K = ½ m v² */
  K: number;
  /** U = q V(r) */
  U: number;
  total: number;
}

/** Máximo desplazamiento por paso [m] (se reduce cerca de las cargas) */
const LONGITUD_PASO = 0.003;
/** Si la partícula se acerca a menos de esta distancia de una carga, se considera un choque [m] */
export const RADIO_CHOQUE = 1.5 * R_SUAVIZADO;
/** Semilado de la región simulada [m] */
export const LIMITE_REGION = 3;

export class SimulacionParticula {
  t = 0;
  /** Estado [x, y, z, vₓ, v_y, v_z] */
  s: number[];
  pasos = 0;
  fin: string | null = null;
  readonly energiaInicial: Energias;
  private readonly f: Derivada;
  private readonly cfg: ConfigSimulacion;

  constructor(cfg: ConfigSimulacion) {
    this.cfg = cfg;
    const campo =
      cfg.fuente === 'uniforme' ? () => cfg.campoUniforme : (p: Vec3) => campoElectrico(cfg.cargas, p);
    this.f = derivadaParticulaCampoE(cfg.q, cfg.m, campo);
    this.s = [cfg.r0.x, cfg.r0.y, 0, cfg.v0.x, cfg.v0.y, 0];
    this.energiaInicial = this.energias();
    if (cfg.fuente === 'cargas' && this.distanciaMinima() < RADIO_CHOQUE) this.fin = 'La partícula parte dentro de una carga.';
  }

  /** Potencial V en la posición actual [V] */
  potencial(): number {
    const p = { x: this.s[0], y: this.s[1], z: this.s[2] };
    return this.cfg.fuente === 'uniforme' ? potencialCampoUniforme(this.cfg.campoUniforme, p) : potencialElectrico(this.cfg.cargas, p);
  }

  energias(): Energias {
    const v2 = this.s[3] ** 2 + this.s[4] ** 2 + this.s[5] ** 2;
    const K = 0.5 * this.cfg.m * v2;
    const U = this.cfg.q * this.potencial();
    return { K, U, total: K + U };
  }

  rapidez(): number {
    return Math.hypot(this.s[3], this.s[4], this.s[5]);
  }

  /** Aceleración actual a = qE/m [m/s²] */
  aceleracion(): Vec3 {
    const d = this.f(this.t, this.s);
    return { x: d[3], y: d[4], z: d[5] };
  }

  private distanciaMinima(): number {
    let d = Infinity;
    for (const c of this.cfg.cargas) d = Math.min(d, Math.hypot(this.s[0] - c.x, this.s[1] - c.y, this.s[2] - c.z));
    return d;
  }

  /** Avanza un paso de RK4. Δt se adapta para no avanzar más de L por paso. */
  paso(): void {
    if (this.fin) return;
    const a = this.aceleracion();
    const dMin = this.cfg.fuente === 'cargas' ? this.distanciaMinima() : Infinity;
    const L = Math.min(LONGITUD_PASO, 0.05 * dMin);
    const dt = pasoTemporalAdaptativo(this.rapidez(), Math.hypot(a.x, a.y, a.z), L);
    this.s = pasoRK4(this.f, this.t, this.s, dt);
    this.t += dt;
    this.pasos++;

    if (Math.abs(this.s[0]) > LIMITE_REGION || Math.abs(this.s[1]) > LIMITE_REGION) this.fin = 'La partícula salió de la región simulada.';
    else if (this.cfg.fuente === 'cargas' && this.distanciaMinima() < RADIO_CHOQUE) this.fin = 'La partícula chocó con una carga.';
  }

  /**
   * Solución analítica en campo uniforme (movimiento parabólico):
   *   r(t) = r₀ + v₀ t + ½ (qE/m) t²
   */
  posicionAnalitica(t = this.t): Vec2 {
    const { r0, v0, q, m, campoUniforme: E } = this.cfg;
    return {
      x: r0.x + v0.x * t + 0.5 * ((q * E.x) / m) * t * t,
      y: r0.y + v0.y * t + 0.5 * ((q * E.y) / m) * t * t,
    };
  }
}
