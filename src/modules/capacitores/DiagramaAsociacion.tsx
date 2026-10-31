import type { ResultadoAsociacion, TipoAsociacion } from '../../physics/capacitor';
import { formatearSI } from '../../components/formato';

interface Props {
  tipo: TipoAsociacion;
  V: number;
  resultado: ResultadoAsociacion;
}

const TRAZO = '#94a3b8';
const ARRIBA = 90;
const ABAJO = 290;

/** Símbolo de capacitor. `vertical` = la corriente circula en vertical (placas horizontales). */
function SimboloC({ x, y, vertical, etiqueta, detalle }: { x: number; y: number; vertical: boolean; etiqueta: string; detalle: string[] }) {
  const g = 7; // media separación entre placas
  const l = 18; // media longitud de placa
  return (
    <g>
      {vertical ? (
        <>
          <rect x={x - l - 2} y={y - g - 2} width={2 * l + 4} height={2 * g + 4} fill="#020617" />
          <line x1={x - l} y1={y - g} x2={x + l} y2={y - g} stroke="#f87171" strokeWidth={4} />
          <line x1={x - l} y1={y + g} x2={x + l} y2={y + g} stroke="#60a5fa" strokeWidth={4} />
        </>
      ) : (
        <>
          <rect x={x - g - 2} y={y - l - 2} width={2 * g + 4} height={2 * l + 4} fill="#020617" />
          <line x1={x - g} y1={y - l} x2={x - g} y2={y + l} stroke="#f87171" strokeWidth={4} />
          <line x1={x + g} y1={y - l} x2={x + g} y2={y + l} stroke="#60a5fa" strokeWidth={4} />
        </>
      )}
      <text x={vertical ? x + l + 8 : x} y={vertical ? y - 12 : y - l - 34} fill="#e2e8f0" fontSize={14} fontWeight={600} textAnchor={vertical ? 'start' : 'middle'}>
        {etiqueta}
      </text>
      {detalle.map((d, i) => (
        <text
          key={i}
          x={vertical ? x + l + 8 : x}
          y={(vertical ? y + 4 : y - l - 18) + i * 14}
          fill="#94a3b8"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
          textAnchor={vertical ? 'start' : 'middle'}
        >
          {d}
        </text>
      ))}
    </g>
  );
}

/** Diagrama esquemático de la asociación con el voltaje y la carga de cada capacitor. */
export default function DiagramaAsociacion({ tipo, V, resultado }: Props) {
  const n = resultado.elementos.length;
  const xFin = 640;
  const etiqueta = (i: number) => `C${i + 1} = ${formatearSI(resultado.elementos[i].C * 1e6, 3)} μF`;
  const detalle = (i: number) => [`V = ${formatearSI(resultado.elementos[i].V, 3)} V`, `Q = ${formatearSI(resultado.elementos[i].Q * 1e6, 3)} μC`];

  // Posiciones de los elementos
  const enSerie: { x: number; y: number; vertical: boolean; i: number }[] = [];
  const ramas: { x: number; i: number }[] = [];
  if (tipo === 'serie') {
    for (let i = 0; i < n; i++) enSerie.push({ x: 170 + ((xFin - 200) * (i + 0.5)) / n, y: ARRIBA, vertical: false, i });
  } else if (tipo === 'paralelo') {
    for (let i = 0; i < n; i++) ramas.push({ x: 200 + ((xFin - 200) * i) / (n - 1), i });
  } else {
    enSerie.push({ x: 200, y: ARRIBA, vertical: false, i: 0 });
    for (let i = 1; i < n; i++) ramas.push({ x: 320 + ((xFin - 320) * (i - 1)) / Math.max(1, n - 2), i });
  }
  const xUltimaRama = ramas.length ? Math.max(...ramas.map((r) => r.x)) : xFin;
  const xDerecho = tipo === 'serie' ? xFin : xUltimaRama;

  return (
    <svg viewBox="0 0 760 380" className="h-full w-full" role="img" aria-label={`Asociación en ${tipo} de ${n} capacitores`}>
      {/* Lazo principal */}
      <polyline points={`80,${ARRIBA} ${xDerecho},${ARRIBA}`} stroke={TRAZO} strokeWidth={2} fill="none" />
      <polyline points={`80,${ABAJO} ${xDerecho},${ABAJO}`} stroke={TRAZO} strokeWidth={2} fill="none" />
      <line x1={80} y1={ARRIBA} x2={80} y2={ABAJO} stroke={TRAZO} strokeWidth={2} />
      {tipo === 'serie' && <line x1={xFin} y1={ARRIBA} x2={xFin} y2={ABAJO} stroke={TRAZO} strokeWidth={2} />}

      {/* Fuente */}
      <rect x={60} y={(ARRIBA + ABAJO) / 2 - 16} width={40} height={32} fill="#020617" />
      <line x1={62} y1={(ARRIBA + ABAJO) / 2 - 8} x2={98} y2={(ARRIBA + ABAJO) / 2 - 8} stroke="#e2e8f0" strokeWidth={3} />
      <line x1={70} y1={(ARRIBA + ABAJO) / 2 + 8} x2={90} y2={(ARRIBA + ABAJO) / 2 + 8} stroke="#e2e8f0" strokeWidth={5} />
      <text x={20} y={(ARRIBA + ABAJO) / 2 + 5} fill="#e2e8f0" fontSize={14} fontWeight={600}>
        {formatearSI(V, 3)} V
      </text>
      <text x={104} y={(ARRIBA + ABAJO) / 2 - 12} fill="#f87171" fontSize={13}>+</text>

      {ramas.map((r) => (
        <line key={r.i} x1={r.x} y1={ARRIBA} x2={r.x} y2={ABAJO} stroke={TRAZO} strokeWidth={2} />
      ))}
      {enSerie.map((e) => (
        <SimboloC key={e.i} x={e.x} y={e.y} vertical={false} etiqueta={etiqueta(e.i)} detalle={detalle(e.i)} />
      ))}
      {ramas.map((r) => (
        <SimboloC key={r.i} x={r.x} y={(ARRIBA + ABAJO) / 2} vertical etiqueta={etiqueta(r.i)} detalle={detalle(r.i)} />
      ))}

      <text x={380} y={350} fill="#e2e8f0" fontSize={15} textAnchor="middle">
        C<tspan fontSize={11} dy={4}>eq</tspan>
        <tspan dy={-4}> = {formatearSI(resultado.Ceq * 1e6, 4)} μF · Q = {formatearSI(resultado.Q * 1e6, 4)} μC · U = {formatearSI(resultado.U, 4)} J</tspan>
      </text>
    </svg>
  );
}
