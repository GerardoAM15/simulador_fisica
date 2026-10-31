import type { Vec2 } from '../physics/vector';

/**
 * Transformación entre coordenadas del mundo [m] (y hacia arriba) y píxeles del lienzo (y hacia abajo).
 * El origen del mundo queda en el centro del lienzo.
 */
export interface Vista {
  ancho: number;
  alto: number;
  /** píxeles por metro */
  escala: number;
  cx: number;
  cy: number;
}

/** `semiLado` es la mitad del lado visible en la dimensión menor del lienzo [m]. */
export function crearVista(ancho: number, alto: number, semiLado = 1.2): Vista {
  return { ancho, alto, escala: Math.min(ancho, alto) / (2 * semiLado), cx: ancho / 2, cy: alto / 2 };
}

export const aPantallaX = (v: Vista, x: number) => v.cx + x * v.escala;
export const aPantallaY = (v: Vista, y: number) => v.cy - y * v.escala;
export const aMundo = (v: Vista, px: number, py: number): Vec2 => ({ x: (px - v.cx) / v.escala, y: (v.cy - py) / v.escala });

export function limitesMundo(v: Vista) {
  return {
    xMin: -v.cx / v.escala,
    xMax: (v.ancho - v.cx) / v.escala,
    yMin: -(v.alto - v.cy) / v.escala,
    yMax: v.cy / v.escala,
  };
}

/** Flecha de (x1, y1) a (x2, y2) en píxeles. Usa el color de trazo y relleno actuales. */
export function dibujarFlecha(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, punta = 6) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - punta * Math.cos(ang - 0.45), y2 - punta * Math.sin(ang - 0.45));
  ctx.lineTo(x2 - punta * Math.cos(ang + 0.45), y2 - punta * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
}

/** Cuadrícula de referencia cada `paso` metros y barra de escala. */
export function dibujarCuadricula(ctx: CanvasRenderingContext2D, v: Vista, paso = 0.5) {
  const l = limitesMundo(v);
  ctx.save();
  ctx.lineWidth = 1;
  for (let x = Math.ceil(l.xMin / paso) * paso; x <= l.xMax; x += paso) {
    ctx.strokeStyle = Math.abs(x) < 1e-9 ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.08)';
    const px = Math.round(aPantallaX(v, x)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, v.alto);
    ctx.stroke();
  }
  for (let y = Math.ceil(l.yMin / paso) * paso; y <= l.yMax; y += paso) {
    ctx.strokeStyle = Math.abs(y) < 1e-9 ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.08)';
    const py = Math.round(aPantallaY(v, y)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(v.ancho, py);
    ctx.stroke();
  }
  // Barra de escala
  const largo = paso * v.escala;
  const x0 = 16;
  const y0 = v.alto - 16;
  ctx.strokeStyle = 'rgba(226,232,240,0.7)';
  ctx.fillStyle = 'rgba(226,232,240,0.7)';
  ctx.beginPath();
  ctx.moveTo(x0, y0 - 4);
  ctx.lineTo(x0, y0);
  ctx.lineTo(x0 + largo, y0);
  ctx.lineTo(x0 + largo, y0 - 4);
  ctx.stroke();
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(`${paso} m`, x0 + largo / 2 - 12, y0 - 6);
  ctx.restore();
}
