import ModuloLayout from '../components/ModuloLayout';
import type { Modulo } from './registry';

/** Marcador temporal para los módulos que se implementan en fases posteriores. */
export default function EnConstruccion({ modulo }: { modulo: Modulo }) {
  return (
    <ModuloLayout
      titulo={modulo.titulo}
      simulacion={
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="text-5xl text-slate-700">{modulo.icono}</span>
          <p className="text-slate-400">Área de simulación</p>
          <p className="text-sm text-slate-500">Este módulo se implementa en la Fase {modulo.fase}.</p>
        </div>
      }
      panel={
        <div className="tarjeta text-sm text-slate-400">
          <p>{modulo.descripcion}</p>
          <p className="mt-2">Aquí aparecerán los controles, las fórmulas y los resultados.</p>
        </div>
      }
      teoria={<p>La teoría de este módulo se añadirá en la Fase {modulo.fase}.</p>}
    />
  );
}
