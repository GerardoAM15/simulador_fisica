import { useEffect, type ReactNode } from 'react';

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}

export default function Modal({ abierto, titulo, onCerrar, children }: Props) {
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <button className="boton px-2" onClick={onCerrar} aria-label="Cerrar" autoFocus>
            ✕
          </button>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-slate-300">{children}</div>
      </div>
    </div>
  );
}
