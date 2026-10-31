import Formula from './Formula';

interface Props {
  formulas: { tex: string; descripcion?: string }[];
}

/** Lista de fórmulas del módulo renderizadas con KaTeX. */
export default function PanelFormulas({ formulas }: Props) {
  return (
    <div className="tarjeta space-y-2">
      <h3 className="text-sm font-semibold text-slate-300">Fórmulas</h3>
      {formulas.map((f, i) => (
        <div key={i}>
          <Formula tex={f.tex} bloque />
          {f.descripcion && <p className="-mt-2 text-center text-xs text-slate-400">{f.descripcion}</p>}
        </div>
      ))}
    </div>
  );
}
