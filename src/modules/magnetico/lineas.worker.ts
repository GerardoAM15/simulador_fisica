/**
 * Web Worker: traza las líneas de campo B fuera del hilo principal para que la interfaz
 * siga respondiendo mientras se integra Biot–Savart (miles de tramos × miles de pasos RK4).
 */
import { construirFuente, lineasCampoB, type ParamsFuente } from './fuentes';

export interface PedidoLineas {
  id: number;
  params: ParamsFuente;
}

export interface RespuestaLineas {
  id: number;
  /** Puntos de cada línea empaquetados como [x, y, z, x, y, z, …] */
  lineas: Float32Array[];
}

const ctx = self as unknown as Worker;

ctx.onmessage = (e: MessageEvent<PedidoLineas>) => {
  const { id, params } = e.data;
  const lineas = lineasCampoB(params, construirFuente(params)).map((l) => {
    const a = new Float32Array(l.length * 3);
    l.forEach((p, i) => a.set([p.x, p.y, p.z], 3 * i));
    return a;
  });
  // Los buffers se transfieren (sin copiarlos) al hilo principal
  ctx.postMessage({ id, lineas } satisfies RespuestaLineas, lineas.map((a) => a.buffer));
};
