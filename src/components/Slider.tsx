import { useId } from 'react';

interface Props {
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  paso?: number;
  /** Unidad SI mostrada junto al valor */
  unidad?: string;
  /** Formato personalizado del valor mostrado */
  formato?: (v: number) => string;
  onChange: (v: number) => void;
}

export default function Slider({ etiqueta, valor, min, max, paso = 0.01, unidad, formato, onChange }: Props) {
  const id = useId();
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <label htmlFor={id} className="text-slate-300">
          {etiqueta}
        </label>
        <span className="font-mono text-sky-300">
          {formato ? formato(valor) : valor}
          {unidad && <span className="ml-1 text-slate-400">{unidad}</span>}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="w-full accent-sky-500"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
