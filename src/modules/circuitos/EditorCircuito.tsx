import { useCallback, useRef, useState } from 'react';
import Canvas2D, { type EventoLienzo } from '../../components/Canvas2D';
import { useCircuitoStore } from '../../store/useCircuitoStore';
import { aGrilla, aPx, crearGrilla, dibujarCircuito, distanciaSegmento } from './dibujoCircuito';
import { extremo, type Analisis, type Punto } from './modelo';

type Arrastre = { tipo: 'mover'; id: string; inicio: Punto; original: Punto } | { tipo: 'cable'; desde: Punto; hasta: Punto } | null;

interface Props {
  analisis: Analisis;
  mostrarValores: boolean;
  animar: boolean;
}

/** Lienzo del editor: colocar componentes, dibujar cables, seleccionar, mover y borrar. */
export default function EditorCircuito({ analisis, mostrarValores, animar }: Props) {
  const { circuito, seleccion, herramienta, seleccionar, agregarComponente, moverComponente, eliminar, agregarCable, alternarInterruptor } =
    useCircuitoStore();
  const [arrastre, setArrastre] = useState<Arrastre>(null);
  const [hover, setHover] = useState<Punto | null>(null);
  const inicio = useRef(performance.now());

  const dibujar = useCallback(
    (ctx: CanvasRenderingContext2D, ancho: number, alto: number) => {
      const g = crearGrilla(ancho, alto);
      dibujarCircuito(ctx, g, circuito.componentes, circuito.cables, {
        analisis,
        seleccion,
        mostrarValores,
        tiempo: animar ? (performance.now() - inicio.current) / 1000 : null,
        cablePrevio: arrastre?.tipo === 'cable' ? [arrastre.desde, arrastre.hasta] : null,
        puntoHover: herramienta !== 'seleccionar' && herramienta !== 'borrar' ? hover : null,
      });
    },
    [circuito, analisis, seleccion, mostrarValores, animar, arrastre, hover, herramienta],
  );

  /** Elemento bajo el cursor: primero componentes, luego cables. */
  const elementoEn = (e: EventoLienzo): string | null => {
    const g = crearGrilla(e.ancho, e.alto);
    for (const c of [...circuito.componentes].reverse())
      if (distanciaSegmento(e.px, e.py, aPx(g, c.p), aPx(g, extremo(c))) < g.celda * 0.35) return c.id;
    for (const w of circuito.cables) if (distanciaSegmento(e.px, e.py, aPx(g, w.a), aPx(g, w.b)) < g.celda * 0.22) return w.id;
    return null;
  };

  const alPresionar = (e: EventoLienzo) => {
    const g = crearGrilla(e.ancho, e.alto);
    const p = aGrilla(g, e.px, e.py);
    if (herramienta === 'cable') {
      setArrastre({ tipo: 'cable', desde: p, hasta: p });
    } else if (herramienta === 'borrar') {
      const id = elementoEn(e);
      if (id) eliminar(id);
    } else if (herramienta === 'seleccionar') {
      const id = elementoEn(e);
      seleccionar(id);
      const comp = circuito.componentes.find((c) => c.id === id);
      if (comp) setArrastre({ tipo: 'mover', id: comp.id, inicio: p, original: comp.p });
    } else {
      agregarComponente(herramienta, p);
    }
  };

  const alMover = (e: EventoLienzo) => {
    const g = crearGrilla(e.ancho, e.alto);
    const p = aGrilla(g, e.px, e.py);
    if (!hover || hover.x !== p.x || hover.y !== p.y) setHover(p);
    if (arrastre?.tipo === 'cable' && (arrastre.hasta.x !== p.x || arrastre.hasta.y !== p.y)) setArrastre({ ...arrastre, hasta: p });
    if (arrastre?.tipo === 'mover') {
      const nuevo = { x: arrastre.original.x + p.x - arrastre.inicio.x, y: arrastre.original.y + p.y - arrastre.inicio.y };
      const actual = circuito.componentes.find((c) => c.id === arrastre.id)?.p;
      if (actual && (actual.x !== nuevo.x || actual.y !== nuevo.y)) moverComponente(arrastre.id, nuevo);
    }
  };

  const alSoltar = () => {
    if (arrastre?.tipo === 'cable' && (arrastre.desde.x !== arrastre.hasta.x || arrastre.desde.y !== arrastre.hasta.y))
      agregarCable(arrastre.desde, arrastre.hasta);
    setArrastre(null);
  };

  const alDobleClic = (e: EventoLienzo) => {
    const id = elementoEn(e);
    const comp = circuito.componentes.find((c) => c.id === id);
    if (comp?.tipo === 'interruptor') alternarInterruptor(comp.id);
  };

  const cursor = herramienta === 'seleccionar' ? (arrastre ? 'grabbing' : 'default') : herramienta === 'borrar' ? 'not-allowed' : 'crosshair';

  return (
    <Canvas2D
      dibujar={dibujar}
      animado={animar}
      cursor={cursor}
      etiqueta="Editor de circuitos"
      onPointerDown={alPresionar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onDoubleClick={alDobleClic}
    />
  );
}
