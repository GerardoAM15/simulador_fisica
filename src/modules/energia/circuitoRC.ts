/**
 * Dibujo del circuito RC con interruptor de dos posiciones:
 *   A (carga): batería → interruptor → R → C → batería
 *   B (descarga): C → R → interruptor → puente inferior → C (sin batería)
 */
import { dibujarFlecha } from '../../components/vista2d';
import { COLOR_NEGATIVO, COLOR_POSITIVO } from '../cargas/dibujo';

type P = [number, number];

export interface GeometriaRC {
  izq: number;
  der: number;
  arriba: number;
  abajo: number;
  /** Pivote del interruptor */
  pivote: P;
  contactoA: P;
  contactoB: P;
  xResistencia: number;
  yBateria: number;
  yCapacitor: number;
  escala: number;
}

export function geometriaRC(ancho: number, alto: number): GeometriaRC {
  // Se reserva espacio a la izquierda (etiqueta de la batería) y a la derecha (etiquetas del capacitor)
  const escala = Math.min(ancho / 760, alto / 380, 1.4);
  const w = 480 * escala;
  const h = 260 * escala;
  const izq = (ancho - w) / 2 + 10 * escala;
  const arriba = (alto - h) / 2 + 10 * escala;
  const xs = izq + 0.3 * w;
  return {
    izq,
    der: izq + w,
    arriba,
    abajo: arriba + h,
    pivote: [xs, arriba],
    contactoA: [xs - 55 * escala, arriba],
    contactoB: [xs - 55 * escala, arriba + 45 * escala],
    xResistencia: xs + 0.38 * w,
    yBateria: arriba + h / 2,
    yCapacitor: arriba + h / 2,
    escala,
  };
}

/** Camino cerrado que recorre la corriente convencional cuando I > 0 (sentido de carga). */
export function caminoCorriente(g: GeometriaRC, cargando: boolean): P[] {
  return cargando
    ? [[g.izq, g.abajo], [g.izq, g.arriba], g.contactoA, g.pivote, [g.der, g.arriba], [g.der, g.abajo], [g.izq, g.abajo]]
    : [[g.contactoB[0], g.abajo], g.contactoB, g.pivote, [g.der, g.arriba], [g.der, g.abajo], [g.contactoB[0], g.abajo]];
}

export function longitudCamino(c: P[]): number {
  let L = 0;
  for (let i = 1; i < c.length; i++) L += Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]);
  return L;
}

export function puntoEnCamino(c: P[], s: number): P {
  for (let i = 1; i < c.length; i++) {
    const l = Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]);
    if (s <= l) {
      const t = s / l;
      return [c[i - 1][0] + t * (c[i][0] - c[i - 1][0]), c[i - 1][1] + t * (c[i][1] - c[i - 1][1])];
    }
    s -= l;
  }
  return c[c.length - 1];
}

export interface DatosDibujoRC {
  cargando: boolean;
  /** Fracción de carga Q/(CV) entre 0 y 1 */
  nivel: number;
  /** Corriente relativa I/I₀ entre −1 y 1 */
  corrienteRel: number;
  /** Fase de la animación de la corriente [px] */
  fase: number;
  etiquetas: { bateria: string; resistencia: string; capacitor: string; corriente: string; vr: string; vc: string };
}

export function dibujarCircuitoRC(ctx: CanvasRenderingContext2D, g: GeometriaRC, d: DatosDibujoRC) {
  const e = g.escala;
  const cable = '#94a3b8';
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.5 * e;
  ctx.strokeStyle = cable;
  ctx.font = `${13 * e}px system-ui, sans-serif`;

  const linea = (pts: P[]) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
    ctx.stroke();
  };

  // Cables
  linea([g.contactoA, [g.izq, g.arriba], [g.izq, g.abajo], [g.der, g.abajo], [g.der, g.arriba], g.pivote]);
  linea([g.contactoB, [g.contactoB[0], g.abajo]]);

  // Batería (placa larga = +, arriba)
  const yb = g.yBateria;
  ctx.fillStyle = '#020617';
  ctx.fillRect(g.izq - 26 * e, yb - 14 * e, 52 * e, 28 * e);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3 * e;
  linea([[g.izq - 22 * e, yb - 7 * e], [g.izq + 22 * e, yb - 7 * e]]);
  ctx.lineWidth = 6 * e;
  linea([[g.izq - 11 * e, yb + 7 * e], [g.izq + 11 * e, yb + 7 * e]]);
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'right';
  ctx.fillText(d.etiquetas.bateria, g.izq - 32 * e, yb + 5 * e);
  ctx.fillStyle = COLOR_POSITIVO;
  ctx.fillText('+', g.izq + 34 * e, yb - 10 * e);

  // Resistencia (zigzag)
  const xr = g.xResistencia;
  const ancho = 70 * e;
  ctx.fillStyle = '#020617';
  ctx.fillRect(xr - ancho / 2 - 2, g.arriba - 12 * e, ancho + 4, 24 * e);
  ctx.strokeStyle = '#fb923c';
  ctx.lineWidth = 2.5 * e;
  ctx.beginPath();
  ctx.moveTo(xr - ancho / 2, g.arriba);
  for (let i = 0; i < 6; i++) ctx.lineTo(xr - ancho / 2 + (ancho * (i + 0.5)) / 6, g.arriba + (i % 2 ? 9 : -9) * e);
  ctx.lineTo(xr + ancho / 2, g.arriba);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(d.etiquetas.resistencia, xr, g.arriba - 20 * e);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(d.etiquetas.vr, xr, g.arriba + 30 * e);

  // Capacitor: el brillo entre placas y el número de cargas crecen con Q
  const yc = g.yCapacitor;
  const gap = 10 * e;
  const placa = 30 * e;
  ctx.fillStyle = '#020617';
  ctx.fillRect(g.der - placa - 2, yc - gap - 4, 2 * placa + 4, 2 * gap + 8);
  ctx.fillStyle = `rgba(251,191,36,${0.5 * d.nivel})`;
  ctx.fillRect(g.der - placa, yc - gap, 2 * placa, 2 * gap);
  ctx.lineWidth = 4 * e;
  ctx.strokeStyle = COLOR_POSITIVO;
  linea([[g.der - placa, yc - gap], [g.der + placa, yc - gap]]);
  ctx.strokeStyle = COLOR_NEGATIVO;
  linea([[g.der - placa, yc + gap], [g.der + placa, yc + gap]]);
  const nCargas = Math.round(d.nivel * 7);
  ctx.font = `bold ${11 * e}px system-ui, sans-serif`;
  for (let i = 0; i < nCargas; i++) {
    const x = g.der - placa + ((i + 0.5) * 2 * placa) / 7;
    ctx.fillStyle = '#fecaca';
    ctx.fillText('+', x, yc - gap - 6 * e);
    ctx.fillStyle = '#bfdbfe';
    ctx.fillText('−', x, yc + gap + 14 * e);
  }
  ctx.font = `${13 * e}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(d.etiquetas.capacitor, g.der + placa + 10 * e, yc - 4 * e);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(d.etiquetas.vc, g.der + placa + 10 * e, yc + 14 * e);

  // Interruptor
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3 * e;
  const destino = d.cargando ? g.contactoA : g.contactoB;
  linea([g.pivote, destino]);
  for (const [p, nombre] of [
    [g.contactoA, 'A'],
    [g.contactoB, 'B'],
  ] as const) {
    ctx.fillStyle = p === destino ? '#38bdf8' : '#475569';
    ctx.beginPath();
    ctx.arc(p[0], p[1], 4.5 * e, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(nombre, p[0] - 8 * e, p[1] + (nombre === 'A' ? -8 : 4) * e);
  }
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(g.pivote[0], g.pivote[1], 4.5 * e, 0, 2 * Math.PI);
  ctx.fill();

  // Corriente: puntos que avanzan con rapidez ∝ |I| (no cruzan el espacio entre las placas)
  const camino = caminoCorriente(g, d.cargando);
  const L = longitudCamino(camino);
  const sep = 26 * e;
  ctx.fillStyle = '#fde047';
  for (let s0 = 0; s0 < L; s0 += sep) {
    const s = (((s0 + d.fase) % L) + L) % L;
    const [x, y] = puntoEnCamino(camino, s);
    const enCapacitor = Math.abs(x - g.der) < 1 && Math.abs(y - yc) < gap + 2;
    const enBateria = d.cargando && Math.abs(x - g.izq) < 1 && Math.abs(y - yb) < 9 * e;
    if (enCapacitor || enBateria || Math.abs(d.corrienteRel) < 1e-3) continue;
    ctx.beginPath();
    ctx.arc(x, y, 3 * e, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Flecha con el sentido de I junto a la resistencia
  if (Math.abs(d.corrienteRel) > 1e-3) {
    const dir = d.corrienteRel > 0 ? 1 : -1;
    const y = g.arriba + 50 * e;
    ctx.strokeStyle = ctx.fillStyle = '#fde047';
    ctx.lineWidth = 2 * e;
    dibujarFlecha(ctx, xr - dir * 25 * e, y, xr + dir * 25 * e, y, 7 * e);
    ctx.textAlign = 'center';
    ctx.fillText(d.etiquetas.corriente, xr, y + 20 * e);
  }
  ctx.restore();
}
