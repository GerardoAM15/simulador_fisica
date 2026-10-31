/**
 * Capas de dibujo 2D para sistemas de cargas puntuales. Las funciones `calcular*` hacen la parte
 * costosa (se cachean) y las `dibujar*` solo pintan en el lienzo.
 */
import { campoElectrico, potencialEn, type CargaPuntual } from '../../physics/electrostatics';
import { isolinea, muestrearMalla, nivelesGeometricos, type Segmento } from '../../physics/equipotential';
import { lineasCampoElectrico, type LineaCampo } from '../../physics/fieldLines';
import { MICRO } from '../../physics/constants';
import { aPantallaX, aPantallaY, dibujarFlecha, limitesMundo, type Vista } from '../../components/vista2d';

export const COLOR_POSITIVO = '#ef4444';
export const COLOR_NEGATIVO = '#3b82f6';

/** Radio con que se dibuja una carga [px] */
export const RADIO_CARGA_PX = 11;

// Escala de color del potencial: logarítmica y simétrica entre V_REF y V_SAT
const V_REF = 1500;
const V_SAT = 1e6;
const LOG_SAT = Math.log1p(V_SAT / V_REF);

/** Mapa de calor del potencial en un lienzo de baja resolución (una muestra cada `celdaPx` píxeles). */
export function calcularMapaPotencial(cargas: readonly CargaPuntual[], v: Vista, celdaPx = 3): HTMLCanvasElement {
  const nx = Math.ceil(v.ancho / celdaPx);
  const ny = Math.ceil(v.alto / celdaPx);
  const lienzo = document.createElement('canvas');
  lienzo.width = nx;
  lienzo.height = ny;
  const ctx = lienzo.getContext('2d')!;
  const img = ctx.createImageData(nx, ny);
  const d = img.data;
  for (let j = 0; j < ny; j++) {
    const y = (v.cy - (j + 0.5) * celdaPx) / v.escala;
    for (let i = 0; i < nx; i++) {
      const x = ((i + 0.5) * celdaPx - v.cx) / v.escala;
      const V = potencialEn(cargas, x, y, 0);
      const s = Math.min(1, Math.log1p(Math.abs(V) / V_REF) / LOG_SAT);
      const k = 4 * (j * nx + i);
      if (V >= 0) {
        d[k] = 239;
        d[k + 1] = 68;
        d[k + 2] = 68;
      } else {
        d[k] = 59;
        d[k + 1] = 130;
        d[k + 2] = 246;
      }
      d[k + 3] = Math.round(220 * Math.pow(s, 0.9));
    }
  }
  ctx.putImageData(img, 0, 0);
  return lienzo;
}

/** Escala el mapa de baja resolución al tamaño del lienzo con suavizado bilineal. */
export function dibujarMapaPotencial(ctx: CanvasRenderingContext2D, mapa: HTMLCanvasElement, celdaPx = 3) {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(mapa, 0, 0, mapa.width * celdaPx, mapa.height * celdaPx);
  ctx.restore();
}

export interface CurvaNivel {
  nivel: number;
  segmentos: Segmento[];
}

/** Niveles: 0 V y ±1 kV·(√2)^k — espaciado geométrico porque V ∝ 1/r. */
export const NIVELES_EQUIPOTENCIALES = nivelesGeometricos(1000, Math.SQRT2, 16);

export function calcularEquipotenciales(cargas: readonly CargaPuntual[], v: Vista, celdaPx = 5): CurvaNivel[] {
  if (cargas.length === 0) return [];
  const l = limitesMundo(v);
  const nx = Math.ceil(v.ancho / celdaPx) + 1;
  const ny = Math.ceil(v.alto / celdaPx) + 1;
  const malla = muestrearMalla((x, y) => potencialEn(cargas, x, y, 0), l.xMin, l.yMin, l.xMax, l.yMax, nx, ny);
  return NIVELES_EQUIPOTENCIALES.map((nivel) => ({ nivel, segmentos: isolinea(malla, nivel) }));
}

export function dibujarEquipotenciales(ctx: CanvasRenderingContext2D, v: Vista, curvas: CurvaNivel[]) {
  ctx.save();
  ctx.lineWidth = 1.2;
  for (const { nivel, segmentos } of curvas) {
    if (segmentos.length === 0) continue;
    if (nivel === 0) {
      ctx.strokeStyle = 'rgba(226,232,240,0.55)';
      ctx.setLineDash([5, 4]);
    } else {
      ctx.strokeStyle = nivel > 0 ? 'rgba(252,165,165,0.6)' : 'rgba(147,197,253,0.6)';
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of segmentos) {
      ctx.moveTo(aPantallaX(v, x1), aPantallaY(v, y1));
      ctx.lineTo(aPantallaX(v, x2), aPantallaY(v, y2));
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Líneas de campo en el plano, integradas con RK4 sobre la región visible (más un margen). */
export function calcularLineas2D(cargas: readonly CargaPuntual[], v: Vista, lineasPorMicroC: number): LineaCampo[] {
  const l = limitesMundo(v);
  const margen = 0.5;
  return lineasCampoElectrico(cargas, {
    dimension: 2,
    lineasPorMicroC,
    paso: Math.min(0.02, Math.max(0.003, 2 / v.escala)),
    maxPasos: 4000,
    radioInicio: Math.max(0.03, (RADIO_CARGA_PX * 0.8) / v.escala),
    limites: { min: { x: l.xMin - margen, y: l.yMin - margen, z: -1 }, max: { x: l.xMax + margen, y: l.yMax + margen, z: 1 } },
  });
}

export function dibujarLineas(ctx: CanvasRenderingContext2D, v: Vista, lineas: LineaCampo[], opacidad = 0.85) {
  ctx.save();
  ctx.strokeStyle = `rgba(226,232,240,${opacidad})`;
  ctx.fillStyle = `rgba(226,232,240,${opacidad})`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (const { puntos } of lineas) {
    ctx.moveTo(aPantallaX(v, puntos[0].x), aPantallaY(v, puntos[0].y));
    for (let i = 1; i < puntos.length; i++) ctx.lineTo(aPantallaX(v, puntos[i].x), aPantallaY(v, puntos[i].y));
  }
  ctx.stroke();

  // Punta de flecha en el centro del tramo visible de cada línea (indica el sentido de E)
  for (const { puntos } of lineas) {
    let primero = -1;
    let ultimo = -1;
    for (let i = 0; i < puntos.length; i++) {
      const px = aPantallaX(v, puntos[i].x);
      const py = aPantallaY(v, puntos[i].y);
      if (px >= 0 && px <= v.ancho && py >= 0 && py <= v.alto) {
        if (primero < 0) primero = i;
        ultimo = i;
      }
    }
    if (primero < 0 || ultimo - primero < 6) continue;
    const m = Math.floor((primero + ultimo) / 2);
    const a = puntos[m];
    const b = puntos[m + 1];
    const ax = aPantallaX(v, a.x);
    const ay = aPantallaY(v, a.y);
    const ang = Math.atan2(aPantallaY(v, b.y) - ay, aPantallaX(v, b.x) - ax);
    ctx.beginPath();
    ctx.moveTo(ax + 5 * Math.cos(ang), ay + 5 * Math.sin(ang));
    ctx.lineTo(ax - 5 * Math.cos(ang - 0.5), ay - 5 * Math.sin(ang - 0.5));
    ctx.lineTo(ax - 5 * Math.cos(ang + 0.5), ay - 5 * Math.sin(ang + 0.5));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Vectores de campo en una cuadrícula: dirección de E y color según log₁₀|E|. */
export function dibujarVectores(ctx: CanvasRenderingContext2D, v: Vista, cargas: readonly CargaPuntual[], espaciadoPx = 34) {
  if (cargas.length === 0) return;
  ctx.save();
  ctx.lineWidth = 1.4;
  const largo = espaciadoPx * 0.4;
  for (let py = espaciadoPx / 2; py < v.alto; py += espaciadoPx) {
    for (let px = espaciadoPx / 2; px < v.ancho; px += espaciadoPx) {
      const x = (px - v.cx) / v.escala;
      const y = (v.cy - py) / v.escala;
      if (cargas.some((c) => Math.hypot(c.x - x, c.y - y) * v.escala < RADIO_CARGA_PX + 6)) continue;
      const E = campoElectrico(cargas, { x, y, z: 0 });
      const n = Math.hypot(E.x, E.y);
      if (n === 0) continue;
      // Intensidad: 10² N/C → tenue, 10⁶ N/C → brillante
      const t = Math.min(1, Math.max(0, (Math.log10(n) - 2) / 4));
      ctx.strokeStyle = ctx.fillStyle = `hsla(${45 - 20 * t}, 95%, ${35 + 35 * t}%, ${0.35 + 0.6 * t})`;
      const ux = E.x / n;
      const uy = -E.y / n; // en pantalla y crece hacia abajo
      dibujarFlecha(ctx, px - ux * largo, py - uy * largo, px + ux * largo, py + uy * largo, 5);
    }
  }
  ctx.restore();
}

export function dibujarCargas(ctx: CanvasRenderingContext2D, v: Vista, cargas: readonly (CargaPuntual & { id?: number })[], seleccionada: number | null = null) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const c of cargas) {
    const px = aPantallaX(v, c.x);
    const py = aPantallaY(v, c.y);
    const positiva = c.q >= 0;
    const g = ctx.createRadialGradient(px - 3, py - 3, 1, px, py, RADIO_CARGA_PX);
    g.addColorStop(0, positiva ? '#fecaca' : '#bfdbfe');
    g.addColorStop(1, positiva ? COLOR_POSITIVO : COLOR_NEGATIVO);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, RADIO_CARGA_PX, 0, 2 * Math.PI);
    ctx.fill();
    if (c.id !== undefined && c.id === seleccionada) {
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, RADIO_CARGA_PX + 4, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(positiva ? '+' : '−', px, py + 1);
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(226,232,240,0.85)';
    const qMicro = c.q / MICRO;
    ctx.fillText(`${qMicro > 0 ? '+' : ''}${Number(qMicro.toFixed(1))} μC`, px, py + RADIO_CARGA_PX + 10);
  }
  ctx.restore();
}
