import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';

export interface EventoLienzo {
  /** Coordenadas en píxeles CSS relativas al lienzo */
  px: number;
  py: number;
  ancho: number;
  alto: number;
}

interface Props {
  /** Dibuja un cuadro completo; el contexto ya está escalado por devicePixelRatio */
  dibujar: (ctx: CanvasRenderingContext2D, ancho: number, alto: number) => void;
  /** true → redibuja en cada cuadro con requestAnimationFrame */
  animado?: boolean;
  onPointerDown?: (e: EventoLienzo) => void;
  onPointerMove?: (e: EventoLienzo) => void;
  onPointerUp?: (e: EventoLienzo) => void;
  onDoubleClick?: (e: EventoLienzo) => void;
  cursor?: string;
  etiqueta: string;
}

/**
 * Lienzo 2D que ocupa todo su contenedor, nítido en pantallas de alta densidad.
 * Redibuja cuando cambia `dibujar` o el tamaño, o en cada cuadro si `animado`.
 */
export default function Canvas2D({ dibujar, animado = false, onPointerDown, onPointerMove, onPointerUp, onDoubleClick, cursor, etiqueta }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [tam, setTam] = useState({ ancho: 0, alto: 0 });
  const dibujarRef = useRef(dibujar);
  dibujarRef.current = dibujar;

  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const obs = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect;
      setTam({ ancho: Math.floor(width), alto: Math.floor(height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pintar = useCallback(() => {
    const c = lienzo.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx || tam.ancho === 0 || tam.alto === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(tam.ancho * dpr);
    const h = Math.round(tam.alto * dpr);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, tam.ancho, tam.alto);
    dibujarRef.current(ctx, tam.ancho, tam.alto);
  }, [tam]);

  useEffect(() => {
    if (!animado) pintar();
  }, [dibujar, pintar, animado]);

  useEffect(() => {
    if (!animado) return;
    let id = 0;
    const ciclo = () => {
      pintar();
      id = requestAnimationFrame(ciclo);
    };
    id = requestAnimationFrame(ciclo);
    return () => cancelAnimationFrame(id);
  }, [animado, pintar]);

  const evento = (e: PointerEvent<HTMLCanvasElement> | MouseEvent<HTMLCanvasElement>): EventoLienzo => {
    const r = e.currentTarget.getBoundingClientRect();
    return { px: e.clientX - r.left, py: e.clientY - r.top, ancho: tam.ancho, alto: tam.alto };
  };

  return (
    <div ref={contenedor} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={lienzo}
        role="img"
        aria-label={etiqueta}
        className="block h-full w-full touch-none select-none"
        style={{ cursor }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onPointerDown?.(evento(e));
        }}
        onPointerMove={(e) => onPointerMove?.(evento(e))}
        onPointerUp={(e) => onPointerUp?.(evento(e))}
        onDoubleClick={(e) => onDoubleClick?.(evento(e))}
      />
    </div>
  );
}
