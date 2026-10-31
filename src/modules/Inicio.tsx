import { Link } from 'react-router-dom';
import Formula from '../components/Formula';
import { UNIDADES, modulosDeUnidad } from './registry';

/** Página de inicio: presentación del proyecto y tarjetas de los 9 módulos. */
export default function Inicio() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <section className="space-y-3">
        <p className="text-sm font-medium text-sky-400">Física 2 · Ingeniería de Sistemas · UPeU</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simulador interactivo de campos eléctricos y magnéticos
        </h1>
        <p className="max-w-3xl text-slate-400">
          Visualiza en tiempo real campos eléctricos, potencial, capacitores, circuitos, campos magnéticos y
          trayectorias de partículas cargadas, en 2D y 3D. Toda la física está implementada desde cero y
          validada contra resultados analíticos.
        </p>
        <div className="overflow-x-auto text-slate-300">
          <Formula bloque tex="\vec F = q\left(\vec E + \vec v \times \vec B\right)" />
        </div>
      </section>

      {UNIDADES.map((u) => (
        <section key={u.numero} className="space-y-3">
          <h2 className="text-lg font-semibold">
            <span className="text-slate-500">Unidad {u.numero} · </span>
            {u.titulo}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modulosDeUnidad(u.numero).map((m) => (
              <Link
                key={m.id}
                to={`/${m.ruta}`}
                className="tarjeta group flex flex-col gap-2 transition hover:border-sky-600 hover:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-lg text-sky-300 group-hover:bg-sky-600/20">
                    {m.icono}
                  </span>
                  <h3 className="font-semibold">
                    {m.id}. {m.titulo}
                  </h3>
                </div>
                <p className="text-sm text-slate-400">{m.descripcion}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
