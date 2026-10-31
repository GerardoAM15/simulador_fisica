import { BlockMath, InlineMath } from 'react-katex';

interface Props {
  /** Expresión LaTeX */
  tex: string;
  /** true → fórmula centrada en su propia línea */
  bloque?: boolean;
}

/** Envoltorio de KaTeX para mostrar fórmulas físicas. */
export default function Formula({ tex, bloque = false }: Props) {
  return bloque ? <BlockMath math={tex} /> : <InlineMath math={tex} />;
}
