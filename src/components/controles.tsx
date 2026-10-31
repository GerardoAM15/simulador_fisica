import { useEffect, useId, useState } from 'react';

/** Casilla de activación con etiqueta. */
export function Interruptor({ etiqueta, activo, onChange }: { etiqueta: string; activo: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
      <input type="checkbox" className="h-4 w-4 accent-sky-500" checked={activo} onChange={(e) => onChange(e.target.checked)} />
      {etiqueta}
    </label>
  );
}

interface OpcionSegmentado<T extends string> {
  valor: T;
  etiqueta: string;
}

/** Grupo de botones excluyentes. */
export function Segmentado<T extends string>({ opciones, valor, onChange }: { opciones: OpcionSegmentado<T>[]; valor: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg bg-slate-800 p-1" role="radiogroup">
      {opciones.map((o) => (
        <button
          key={o.valor}
          role="radio"
          aria-checked={valor === o.valor}
          className={`flex-1 rounded-md px-2 py-1 text-sm transition ${
            valor === o.valor ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-700'
          }`}
          onClick={() => onChange(o.valor)}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

/** Lista desplegable con etiqueta. */
export function Selector<T extends string>({
  etiqueta,
  valor,
  opciones,
  onChange,
}: {
  etiqueta: string;
  valor: T;
  opciones: OpcionSegmentado<T>[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <label htmlFor={id} className="text-slate-300">
        {etiqueta}
      </label>
      <select
        id={id}
        className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 focus:border-sky-500 focus:outline-none"
        value={valor}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Notación científica con 5 cifras significativas y sin ceros sobrantes (1e+7, -1.6022e-19). */
const aTexto = (v: number) =>
  v !== 0 && (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e5) ? Number(v.toPrecision(5)).toExponential() : String(Number(v.toPrecision(6)));

/**
 * Campo numérico que acepta notación científica (p. ej. 9.109e-31).
 * El valor se confirma al presionar Enter o al salir del campo; si no es válido se descarta.
 */
export function EntradaNumero({
  etiqueta,
  valor,
  unidad,
  min = -Infinity,
  max = Infinity,
  onChange,
  deshabilitado = false,
}: {
  etiqueta: string;
  valor: number;
  unidad?: string;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  deshabilitado?: boolean;
}) {
  const id = useId();
  const [texto, setTexto] = useState(aTexto(valor));
  useEffect(() => setTexto(aTexto(valor)), [valor]);

  const confirmar = () => {
    const v = Number(texto.replace(',', '.').replace('×10^', 'e'));
    if (texto.trim() !== '' && Number.isFinite(v) && v >= min && v <= max) onChange(v);
    else setTexto(aTexto(valor));
  };

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <label htmlFor={id} className="text-slate-300">
        {etiqueta}
      </label>
      <div className="flex items-center gap-1">
        <input
          id={id}
          disabled={deshabilitado}
          className="w-32 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-right font-mono text-sky-300 focus:border-sky-500 focus:outline-none disabled:opacity-50"
          value={texto}
          inputMode="decimal"
          onChange={(e) => setTexto(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmar();
          }}
        />
        {unidad && <span className="w-10 text-slate-400">{unidad}</span>}
      </div>
    </div>
  );
}
