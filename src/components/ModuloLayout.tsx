import { useState, type ReactNode } from 'react';
import Modal from './Modal';

interface Props {
  titulo: string;
  /** Área central de simulación (Canvas 2D o escena 3D) */
  simulacion: ReactNode;
  /** Panel derecho: controles, fórmulas y resultados */
  panel: ReactNode;
  /** Contenido del modal de teoría */
  teoria?: ReactNode;
}

/** Plantilla común a los 9 módulos: simulación al centro y panel a la derecha. */
export default function ModuloLayout({ titulo, simulacion, panel, teoria }: Props) {
  const [verTeoria, setVerTeoria] = useState(false);

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <section className="relative min-h-[360px] flex-1 bg-slate-950">{simulacion}</section>
      <aside className="w-full shrink-0 space-y-4 overflow-y-auto border-t border-slate-800 bg-slate-900/50 p-4 lg:w-96 lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold">{titulo}</h1>
          {teoria && (
            <button className="boton" onClick={() => setVerTeoria(true)}>
              Teoría
            </button>
          )}
        </div>
        {panel}
      </aside>
      {teoria && (
        <Modal abierto={verTeoria} titulo={`Teoría — ${titulo}`} onCerrar={() => setVerTeoria(false)}>
          {teoria}
        </Modal>
      )}
    </div>
  );
}
