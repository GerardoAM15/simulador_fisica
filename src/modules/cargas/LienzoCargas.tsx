import { useCallback, useRef, useState } from 'react';
import Canvas2D, { type EventoLienzo } from '../../components/Canvas2D';
import { aMundo, aPantallaX, aPantallaY, crearVista, dibujarCuadricula, limitesMundo, type Vista } from '../../components/vista2d';
import type { LineaCampo } from '../../physics/fieldLines';
import type { Vec2 } from '../../physics/vector';
import { MAX_CARGAS, useCargasStore, type Carga } from '../../store/useCargasStore';
import {
  RADIO_CARGA_PX,
  calcularEquipotenciales,
  calcularLineas2D,
  calcularMapaPotencial,
  dibujarCargas,
  dibujarEquipotenciales,
  dibujarLineas,
  dibujarMapaPotencial,
  dibujarVectores,
  type CurvaNivel,
} from './dibujo';

export interface Capas {
  mapa?: boolean;
  vectores?: boolean;
  lineas?: boolean;
  equipotenciales?: boolean;
}

interface Props {
  cargas: readonly Carga[];
  capas: Capas;
  /** Líneas de campo por μC */
  densidadLineas?: number;
  opacidadLineas?: number;
  /** Permite seleccionar, arrastrar y agregar cargas (doble clic) */
  editable?: boolean;
  /** Clic en una zona sin cargas, en coordenadas del mundo [m] */
  onClicVacio?: (p: Vec2) => void;
  /** Dibujo adicional sobre las capas (marcadores, trayectorias…) */
  dibujarExtra?: (ctx: CanvasRenderingContext2D, v: Vista) => void;
  animado?: boolean;
  etiqueta: string;
}

/** Caché simple: recalcula solo si cambia la clave. */
function useCache<T>() {
  const ref = useRef<{ clave: string; valor: T } | null>(null);
  return (clave: string, calcular: () => T): T => {
    if (ref.current?.clave !== clave) ref.current = { clave, valor: calcular() };
    return ref.current.valor;
  };
}

/** Lienzo 2D del sistema de cargas, compartido por los módulos 1, 2 y 3. */
export default function LienzoCargas({
  cargas,
  capas,
  densidadLineas = 6,
  opacidadLineas = 0.85,
  editable = false,
  onClicVacio,
  dibujarExtra,
  animado,
  etiqueta,
}: Props) {
  const { seleccionada, seleccionar, mover, agregar } = useCargasStore();
  const arrastrando = useRef<number | null>(null);
  const [cursor, setCursor] = useState('default');

  const cacheMapa = useCache<HTMLCanvasElement>();
  const cacheEquip = useCache<CurvaNivel[]>();
  const cacheLineas = useCache<LineaCampo[]>();

  const dibujar = useCallback(
    (ctx: CanvasRenderingContext2D, ancho: number, alto: number) => {
      const v = crearVista(ancho, alto);
      const clave = `${ancho}x${alto}|${cargas.map((c) => `${c.q},${c.x},${c.y}`).join(';')}`;

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, ancho, alto);
      if (capas.mapa && cargas.length) dibujarMapaPotencial(ctx, cacheMapa(clave, () => calcularMapaPotencial(cargas, v)));
      dibujarCuadricula(ctx, v);
      if (capas.equipotenciales) dibujarEquipotenciales(ctx, v, cacheEquip(clave, () => calcularEquipotenciales(cargas, v)));
      if (capas.vectores) dibujarVectores(ctx, v, cargas);
      if (capas.lineas)
        dibujarLineas(ctx, v, cacheLineas(`${clave}|${densidadLineas}`, () => calcularLineas2D(cargas, v, densidadLineas)), opacidadLineas);
      dibujarExtra?.(ctx, v);
      dibujarCargas(ctx, v, cargas, editable ? seleccionada : null);
    },
    // Las cachés son refs estables, por eso no figuran como dependencias
    [cargas, capas.mapa, capas.vectores, capas.lineas, capas.equipotenciales, densidadLineas, opacidadLineas, dibujarExtra, seleccionada, editable],
  );

  const cargaBajo = (e: EventoLienzo, v: Vista): Carga | undefined =>
    [...cargas].reverse().find((c) => Math.hypot(aPantallaX(v, c.x) - e.px, aPantallaY(v, c.y) - e.py) <= RADIO_CARGA_PX + 4);

  const alPresionar = (e: EventoLienzo) => {
    const v = crearVista(e.ancho, e.alto);
    const c = editable ? cargaBajo(e, v) : undefined;
    if (c) {
      seleccionar(c.id);
      arrastrando.current = c.id;
      setCursor('grabbing');
      return;
    }
    if (editable) seleccionar(null);
    onClicVacio?.(aMundo(v, e.px, e.py));
  };

  const alMover = (e: EventoLienzo) => {
    const v = crearVista(e.ancho, e.alto);
    if (arrastrando.current !== null) {
      const l = limitesMundo(v);
      const p = aMundo(v, e.px, e.py);
      mover(arrastrando.current, Math.min(l.xMax, Math.max(l.xMin, p.x)), Math.min(l.yMax, Math.max(l.yMin, p.y)));
      return;
    }
    const sobreCarga = editable && cargaBajo(e, v);
    const nuevo = sobreCarga ? 'grab' : onClicVacio ? 'crosshair' : 'default';
    if (nuevo !== cursor) setCursor(nuevo);
  };

  const alSoltar = () => {
    if (arrastrando.current !== null) setCursor('grab');
    arrastrando.current = null;
  };

  const alDobleClic = (e: EventoLienzo) => {
    if (!editable || cargas.length >= MAX_CARGAS) return;
    const v = crearVista(e.ancho, e.alto);
    if (cargaBajo(e, v)) return;
    const p = aMundo(v, e.px, e.py);
    agregar(1, p.x, p.y);
  };

  return (
    <Canvas2D
      dibujar={dibujar}
      animado={animado}
      etiqueta={etiqueta}
      cursor={cursor}
      onPointerDown={alPresionar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onDoubleClick={alDobleClic}
    />
  );
}
