import Formula from './Formula';
import { formatearSI } from './formato';

export interface Resultado {
  /** Símbolo en LaTeX, p. ej. "E_x" */
  simbolo: string;
  valor: number;
  /** Unidad SI, p. ej. "N/C" */
  unidad: string;
  descripcion?: string;
}

/** Tabla de magnitudes calculadas con sus unidades SI. */
export default function PanelResultados({ resultados }: { resultados: Resultado[] }) {
  return (
    <div className="tarjeta">
      <h3 className="mb-2 text-sm font-semibold text-slate-300">Resultados</h3>
      <dl className="space-y-1.5 text-sm">
        {resultados.map((r) => (
          <div key={r.simbolo} className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-400" title={r.descripcion}>
              <Formula tex={r.simbolo} />
            </dt>
            <dd className="font-mono text-slate-100">
              {formatearSI(r.valor)} <span className="text-slate-400">{r.unidad}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
