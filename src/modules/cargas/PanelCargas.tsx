import { useEffect } from 'react';
import Slider from '../../components/Slider';
import { MICRO } from '../../physics/constants';
import { MAX_CARGAS, PRESETS, Q_MAX_MICRO, useCargasStore, type NombrePreset } from '../../store/useCargasStore';

/** Presets, lista de cargas y editor de la carga seleccionada (compartido por los módulos 1 y 2). */
export default function PanelCargas() {
  const { cargas, seleccionada, agregar, cambiarCarga, eliminar, seleccionar, cargarPreset, limpiar } = useCargasStore();
  const sel = cargas.find((c) => c.id === seleccionada);
  const lleno = cargas.length >= MAX_CARGAS;

  // Tecla Supr / Retroceso elimina la carga seleccionada (salvo que se esté escribiendo en un campo)
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && seleccionada !== null) eliminar(seleccionada);
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [seleccionada, eliminar]);

  return (
    <div className="tarjeta space-y-3">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300">Configuraciones</h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PRESETS) as NombrePreset[]).map((p) => (
            <button key={p} className="boton justify-center" onClick={() => cargarPreset(p)}>
              {PRESETS[p].nombre}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">
            Cargas <span className="font-normal text-slate-500">({cargas.length}/{MAX_CARGAS})</span>
          </h3>
          <button className="text-xs text-slate-400 hover:text-slate-200" onClick={limpiar}>
            Quitar todas
          </button>
        </div>
        <div className="mb-2 flex gap-2">
          <button className="boton flex-1 justify-center" disabled={lleno} onClick={() => agregar(2)}>
            <span className="text-positiva">●</span> Agregar +
          </button>
          <button className="boton flex-1 justify-center" disabled={lleno} onClick={() => agregar(-2)}>
            <span className="text-negativa">●</span> Agregar −
          </button>
        </div>
        <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
          {cargas.map((c, i) => (
            <li key={c.id}>
              <button
                className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left ${
                  c.id === seleccionada ? 'bg-sky-600/20 text-sky-200' : 'hover:bg-slate-800'
                }`}
                onClick={() => seleccionar(c.id)}
              >
                <span>
                  <span className={c.q >= 0 ? 'text-positiva' : 'text-negativa'}>●</span> q<sub>{i + 1}</sub> ={' '}
                  <span className="font-mono">{(c.q / MICRO).toFixed(1)} μC</span>
                </span>
                <span className="font-mono text-xs text-slate-400">
                  ({c.x.toFixed(2)}, {c.y.toFixed(2)}) m
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {sel ? (
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <Slider
            etiqueta="Carga seleccionada"
            valor={Number((sel.q / MICRO).toFixed(1))}
            min={-Q_MAX_MICRO}
            max={Q_MAX_MICRO}
            paso={0.5}
            unidad="μC"
            onChange={(v) => cambiarCarga(sel.id, v)}
          />
          <button className="boton w-full justify-center text-red-300" onClick={() => eliminar(sel.id)}>
            Eliminar carga
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Arrastra una carga para moverla, haz clic para editarla y doble clic en un espacio vacío para agregar una.
        </p>
      )}
    </div>
  );
}
