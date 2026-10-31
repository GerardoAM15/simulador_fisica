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
