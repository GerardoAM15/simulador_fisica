import { useEffect, useRef, useState } from 'react';
import type { Vec3 } from '../../physics/vector';
import { construirFuente, lineasCampoB, type ParamsFuente } from './fuentes';
import type { PedidoLineas, RespuestaLineas } from './lineas.worker';

const desempaquetar = (a: Float32Array): Vec3[] => Array.from({ length: a.length / 3 }, (_, i) => ({ x: a[3 * i], y: a[3 * i + 1], z: a[3 * i + 2] }));

/**
 * Líneas de B calculadas en un Web Worker. Mientras se calcula, se conservan las líneas anteriores
 * (`calculando` = true). Si el navegador no admite workers, se calculan en el hilo principal.
 */
export function useLineasB(params: ParamsFuente): { lineas: Vec3[][]; paramsLineas: ParamsFuente | null; calculando: boolean } {
  const [estado, setEstado] = useState<{ lineas: Vec3[][]; params: ParamsFuente | null }>({ lineas: [], params: null });
  const worker = useRef<Worker | null>(null);
  const ultimo = useRef(0);
  const pedidos = useRef(new Map<number, ParamsFuente>());

  useEffect(() => {
    if (typeof Worker === 'undefined') return;
    const w = new Worker(new URL('./lineas.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<RespuestaLineas>) => {
      const p = pedidos.current.get(e.data.id);
      pedidos.current.delete(e.data.id);
      // Se descartan respuestas de pedidos ya superados por otro más reciente
      if (e.data.id === ultimo.current && p) setEstado({ lineas: e.data.lineas.map(desempaquetar), params: p });
    };
    worker.current = w;
    return () => w.terminate();
  }, []);

  useEffect(() => {
    const id = ++ultimo.current;
    if (worker.current) {
      pedidos.current.set(id, params);
      worker.current.postMessage({ id, params } satisfies PedidoLineas);
    } else {
      setEstado({ lineas: lineasCampoB(params, construirFuente(params)), params });
    }
  }, [params]);

  return { lineas: estado.lineas, paramsLineas: estado.params, calculando: estado.params !== params };
}
