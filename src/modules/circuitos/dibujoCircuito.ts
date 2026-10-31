/**
 * Dibujo del editor de circuitos sobre Canvas 2D.
 */
import { formatearPrefijo } from '../../components/formato';
import { clave, extremo, type Analisis, type Cable, type Componente, type Punto } from './modelo';

export interface Grilla {
  celda: number;
  ox: number;
  oy: number;
  ancho: number;
  alto: number;
}

/** La celda se adapta para que quepa un área de 13 × 11 celdas (la de los presets). */
export function crearGrilla(ancho: number, alto: number): Grilla {
  const celda = Math.max(26, Math.min(52, (ancho - 30) / 14, (alto - 30) / 12));
  return { celda, ox: (ancho - 13 * celda) / 2, oy: (alto - 11 * celda) / 2, ancho, alto };
}

export const aPx = (g: Grilla, p: Punto): [number, number] => [g.ox + p.x * g.celda, g.oy + p.y * g.celda];
export const aGrilla = (g: Grilla, px: number, py: number): Punto => ({ x: Math.round((px - g.ox) / g.celda), y: Math.round((py - g.oy) / g.celda) });

/** Distancia de un punto (px) al segmento a–b */
export function distanciaSegmento(px: number, py: number, a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

/** Letra de un nodo: A, B, C, … */
export const nombreNodo = (i: number) => String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : '');

export function textoValor(c: Componente): string {
  switch (c.tipo) {
    case 'fuente':
      return formatearPrefijo(c.valor, 'V');
    case 'resistencia':
      return formatearPrefijo(c.valor, 'Ω');
    case 'capacitor':
      return formatearPrefijo(c.valor * 1e-6, 'F');
    default:
      return c.cerrado ? 'cerrado' : 'abierto';
  }
}

interface Opciones {
  analisis: Analisis;
  seleccion: string | null;
  mostrarValores: boolean;
  /** Tiempo [s] para la animación de la corriente (null = sin animación) */
  tiempo: number | null;
  cablePrevio: [Punto, Punto] | null;
  puntoHover: Punto | null;
}

export function dibujarCircuito(ctx: CanvasRenderingContext2D, g: Grilla, comps: Componente[], cables: Cable[], o: Opciones) {
  const { analisis: an } = o;
  const c = g.celda;
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, g.ancho, g.alto);

  // Puntos de la grilla
  ctx.fillStyle = 'rgba(148,163,184,0.25)';
  const x0 = Math.floor(-g.ox / c);
  const y0 = Math.floor(-g.oy / c);
  for (let x = x0; g.ox + x * c < g.ancho; x++) for (let y = y0; g.oy + y * c < g.alto; y++) ctx.fillRect(g.ox + x * c - 1, g.oy + y * c - 1, 2, 2);

  // Color según el potencial del nodo: azul (mínimo) → rojo (máximo)
  const vs = an.voltajes;
  const vMin = Math.min(0, ...vs);
  const vMax = Math.max(0, ...vs);
  const color = (p: Punto) => {
    const n = an.nodoDe.get(clave(p));
    if (!an.ok || n === undefined || vMax - vMin < 1e-9) return '#94a3b8';
    const t = (vs[n] - vMin) / (vMax - vMin);
    return `hsl(${220 - 220 * t}, 75%, 62%)`;
  };

  // Corriente máxima para escalar la rapidez de los puntos (velocidad ∝ I)
  let iMax = 0;
  for (const r of an.componentes.values()) iMax = Math.max(iMax, Math.abs(r.corrientePE));
  const puntosCorriente = (a: [number, number], b: [number, number], I: number) => {
    if (o.tiempo === null || iMax === 0 || Math.abs(I) < 1e-6 * iMax) return;
    const largo = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const sep = c * 0.5;
    const v = (2.5 * c * I) / iMax; // px/s con signo
    const desfase = (((o.tiempo * v) % sep) + sep) % sep;
    ctx.fillStyle = '#fde047';
    for (let s = desfase; s < largo; s += sep) {
      const t = s / largo;
      ctx.beginPath();
      ctx.arc(a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), Math.max(2, c * 0.06), 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Cables
  ctx.lineCap = 'round';
  for (const w of cables) {
    const a = aPx(g, w.a);
    const b = aPx(g, w.b);
    if (w.id === o.seleccion) {
      ctx.strokeStyle = 'rgba(56,189,248,0.5)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(...a);
      ctx.lineTo(...b);
      ctx.stroke();
    }
    ctx.strokeStyle = color(w.a);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
  }
  for (const w of cables) puntosCorriente(aPx(g, w.a), aPx(g, w.b), an.cables.get(w.id) ?? 0);

  // Componentes (dibujados en coordenadas locales: eje x a lo largo del componente)
  for (const comp of comps) {
    const a = aPx(g, comp.p);
    const b = aPx(g, extremo(comp));
    const L = 2 * c;
    ctx.save();
    ctx.translate(a[0], a[1]);
    ctx.rotate((comp.dir * Math.PI) / 2);
    if (comp.id === o.seleccion) {
      ctx.fillStyle = 'rgba(56,189,248,0.18)';
      ctx.strokeStyle = 'rgba(56,189,248,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-4, -c * 0.45, L + 8, c * 0.9, 6);
      ctx.fill();
      ctx.stroke();
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = color(comp.p);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(L * 0.3, 0);
    ctx.stroke();
    ctx.strokeStyle = color(extremo(comp));
    ctx.beginPath();
    ctx.moveTo(L * 0.7, 0);
    ctx.lineTo(L, 0);
    ctx.stroke();

    const h = c * 0.22;
    switch (comp.tipo) {
      case 'resistencia': {
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(L * 0.3, 0);
        for (let i = 0; i < 6; i++) ctx.lineTo(L * 0.3 + (L * 0.4 * (i + 0.5)) / 6, i % 2 ? h : -h);
        ctx.lineTo(L * 0.7, 0);
        ctx.stroke();
        break;
      }
      case 'fuente': {
        // Placa corta y gruesa = −, placa larga = + (hacia el extremo)
        ctx.strokeStyle = color(comp.p);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(L * 0.3, 0);
        ctx.lineTo(L * 0.45, 0);
        ctx.stroke();
        ctx.strokeStyle = color(extremo(comp));
        ctx.beginPath();
        ctx.moveTo(L * 0.55, 0);
        ctx.lineTo(L * 0.7, 0);
        ctx.stroke();
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(L * 0.45, -h * 0.8);
        ctx.lineTo(L * 0.45, h * 0.8);
        ctx.stroke();
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(L * 0.55, -h * 1.7);
        ctx.lineTo(L * 0.55, h * 1.7);
        ctx.stroke();
        ctx.fillStyle = '#f87171';
        ctx.font = `bold ${Math.round(c * 0.3)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.translate(L * 0.66, -h * 1.5);
        ctx.rotate((-comp.dir * Math.PI) / 2);
        ctx.fillText('+', 0, 0);
        ctx.restore();
        break;
      }
      case 'capacitor': {
        ctx.strokeStyle = color(comp.p);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(L * 0.3, 0);
        ctx.lineTo(L * 0.45, 0);
        ctx.stroke();
        ctx.strokeStyle = color(extremo(comp));
        ctx.beginPath();
        ctx.moveTo(L * 0.55, 0);
        ctx.lineTo(L * 0.7, 0);
        ctx.stroke();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        for (const x of [0.45, 0.55]) {
          ctx.beginPath();
          ctx.moveTo(L * x, -h * 1.4);
          ctx.lineTo(L * x, h * 1.4);
          ctx.stroke();
        }
        break;
      }
      case 'interruptor': {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(L * 0.3, 0);
        if (comp.cerrado) ctx.lineTo(L * 0.7, 0);
        else ctx.lineTo(L * 0.3 + L * 0.4 * Math.cos(0.5), -L * 0.4 * Math.sin(0.5));
        ctx.stroke();
        ctx.fillStyle = '#e2e8f0';
        for (const x of [0.3, 0.7]) {
          ctx.beginPath();
          ctx.arc(L * x, 0, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
        break;
      }
    }
    ctx.restore();

    const r = an.componentes.get(comp.id);
    if (r && comp.tipo !== 'capacitor' && (comp.tipo !== 'interruptor' || comp.cerrado)) puntosCorriente(a, b, r.corrientePE);

    // Etiquetas (sin rotar): arriba si es horizontal, a la derecha si es vertical
    const horizontal = comp.dir % 2 === 0;
    const cx = (a[0] + b[0]) / 2;
    const cy = (a[1] + b[1]) / 2;
    const tam = Math.max(10, Math.round(c * 0.26));
    ctx.font = `600 ${tam}px system-ui, sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = horizontal ? 'center' : 'left';
    const lx = horizontal ? cx : cx + c * 0.55;
    let ly = horizontal ? cy - c * 0.5 : cy - tam * 0.3;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(`${comp.nombre} ${textoValor(comp)}`, lx, ly);
    if (o.mostrarValores && r && an.ok) {
      ctx.font = `${tam - 1}px ui-monospace, monospace`;
      ctx.fillStyle = '#94a3b8';
      ly = horizontal ? cy + c * 0.5 + tam * 0.6 : ly + tam * 1.2;
      const lineas = comp.tipo === 'capacitor'
        ? [`V=${formatearPrefijo(r.voltaje, 'V')}`, `Q=${formatearPrefijo(r.carga ?? 0, 'C')}`]
        : [`I=${formatearPrefijo(Math.abs(r.corriente), 'A')}`, `V=${formatearPrefijo(Math.abs(r.voltaje), 'V')}`];
      for (const t of lineas) {
        ctx.fillText(t, lx, ly);
        ly += tam * 1.15;
      }
    }
  }

  // Letras de nodo (en el punto con más conexiones de cada nodo con al menos 2 terminales)
  if (an.ok && comps.length) {
    const grado = new Map<string, number>();
    const sumar = (p: Punto) => grado.set(clave(p), (grado.get(clave(p)) ?? 0) + 1);
    for (const w of cables) {
      sumar(w.a);
      sumar(w.b);
    }
    const terminales = new Map<number, number>();
    for (const comp of comps)
      for (const p of [comp.p, extremo(comp)]) {
        sumar(p);
        const n = an.nodoDe.get(clave(p))!;
        terminales.set(n, (terminales.get(n) ?? 0) + 1);
      }
    const mejor = new Map<number, { k: string; g: number }>();
    for (const [k, gr] of grado) {
      const n = an.nodoDe.get(k)!;
      if ((terminales.get(n) ?? 0) < 2) continue;
      if (!mejor.has(n) || gr > mejor.get(n)!.g) mejor.set(n, { k, g: gr });
    }
    ctx.font = `bold ${Math.max(10, Math.round(c * 0.24))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [n, { k }] of mejor) {
      const [x, y] = k.split(',').map(Number);
      const [px, py] = aPx(g, { x, y });
      const r = c * 0.2;
      ctx.fillStyle = n === an.tierra ? '#334155' : '#0f172a';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px - r * 1.3, py - r * 1.3, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(nombreNodo(n), px - r * 1.3, py - r * 1.3 + 1);
    }
  }

  // Vista previa del cable que se está dibujando
  if (o.cablePrevio) {
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    const [a, b] = o.cablePrevio;
    const esquina = { x: b.x, y: a.y };
    ctx.beginPath();
    ctx.moveTo(...aPx(g, a));
    ctx.lineTo(...aPx(g, esquina));
    ctx.lineTo(...aPx(g, b));
    ctx.stroke();
    ctx.restore();
  }
  if (o.puntoHover) {
    const [px, py] = aPx(g, o.puntoHover);
    ctx.strokeStyle = 'rgba(56,189,248,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, 2 * Math.PI);
    ctx.stroke();
  }
}
