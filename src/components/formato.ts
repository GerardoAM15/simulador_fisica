const SUPERINDICES: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
};

/**
 * Formatea un número para mostrarlo con unidades SI:
 * notación científica (con exponente en superíndice) si |x| < 1e-3 o |x| ≥ 1e4, decimal en otro caso.
 */
export function formatearSI(x: number, cifras = 4): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
  if (x === 0) return '0';
  const abs = Math.abs(x);
  if (abs < 1e-3 || abs >= 1e4) {
    const [mantisa, exponente] = x.toExponential(cifras - 1).split('e');
    const sup = String(Number(exponente)).replace(/./g, (c) => SUPERINDICES[c]);
    return `${mantisa.replace('-', '−')} × 10${sup}`;
  }
  return Number(x.toPrecision(cifras)).toString().replace('-', '−');
}

const PREFIJOS: [number, string][] = [
  [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'], [1e-12, 'p'],
];

/** Valor con prefijo SI: formatearPrefijo(4.7e-4, 'F') → "470 μF". */
export function formatearPrefijo(x: number, unidad: string, cifras = 3): string {
  if (x === 0 || !Number.isFinite(x)) return `${formatearSI(x)} ${unidad}`;
  const abs = Math.abs(x);
  const [factor, prefijo] = PREFIJOS.find(([f]) => abs >= f * 0.9995) ?? PREFIJOS[PREFIJOS.length - 1];
  return `${Number((x / factor).toPrecision(cifras)).toString().replace('-', '−')} ${prefijo}${unidad}`;
}

/** Marcas "redondas" (1, 2 o 5 × 10ⁿ) para un eje de 0 a `max`, unas `n` marcas. */
export function marcasEje(max: number, n = 4): number[] {
  if (!(max > 0) || !Number.isFinite(max)) return [0];
  const bruto = max / n;
  const base = Math.pow(10, Math.floor(Math.log10(bruto)));
  const paso = ([1, 2, 5, 10].find((m) => m * base >= bruto) ?? 10) * base;
  const marcas: number[] = [];
  for (let v = 0; v <= max * 1.0001; v += paso) marcas.push(Number(v.toPrecision(12)));
  return marcas;
}

/** Igual que formatearSI pero en LaTeX, para insertar valores numéricos en fórmulas KaTeX. */
export function formatearTex(x: number, cifras = 4): string {
  if (!Number.isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const abs = Math.abs(x);
  if (abs < 1e-3 || abs >= 1e4) {
    const [mantisa, exponente] = x.toExponential(cifras - 1).split('e');
    return `${mantisa}\\times10^{${Number(exponente)}}`;
  }
  return Number(x.toPrecision(cifras)).toString();
}
