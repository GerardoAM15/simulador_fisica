/**
 * Formatea un número para mostrarlo con unidades SI:
 * notación científica si |x| < 1e-3 o |x| ≥ 1e4, decimal en otro caso.
 */
export function formatearSI(x: number, cifras = 4): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
  if (x === 0) return '0';
  const abs = Math.abs(x);
  if (abs < 1e-3 || abs >= 1e4) {
    const [mantisa, exponente] = x.toExponential(cifras - 1).split('e');
    return `${mantisa} × 10^${Number(exponente)}`.replace(/-/g, '−');
  }
  return Number(x.toPrecision(cifras)).toString().replace('-', '−');
}
