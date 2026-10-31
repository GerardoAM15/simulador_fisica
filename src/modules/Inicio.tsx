import { Link } from 'react-router-dom';
import Formula from '../components/Formula';
import { MODULOS, UNIDADES, modulosDeUnidad } from './registry';

/** Métodos numéricos implementados en src/physics y los módulos que los usan */
const METODOS = [
  { nombre: 'Runge–Kutta 4', uso: 'Trayectorias en E y líneas de campo', modulos: [1, 3, 8] },
  { nombre: 'Método de Boris', uso: 'Fuerza de Lorentz sin pérdida de energía', modulos: [9] },
  { nombre: 'Análisis Nodal Modificado', uso: 'Circuitos de CC con eliminación de Gauss', modulos: [6] },
  { nombre: 'Marching squares', uso: 'Líneas equipotenciales en 2D', modulos: [1, 2] },
  { nombre: 'Surface nets', uso: 'Superficies equipotenciales en 3D', modulos: [1] },
  { nombre: 'Biot–Savart numérico', uso: 'Campo magnético de hilos, espiras y solenoides', modulos: [8] },
];

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
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [String(MODULOS.length), 'módulos interactivos'],
            [String(UNIDADES.length), 'unidades del curso'],
            ['+100', 'pruebas automáticas'],
            ['< 1 %', 'error vs teoría'],
          ].map(([valor, texto]) => (
            <div key={texto} className="tarjeta text-center">
              <dt className="sr-only">{texto}</dt>
              <dd className="text-2xl font-bold text-sky-300">{valor}</dd>
              <dd className="text-xs text-slate-400">{texto}</dd>
            </div>
          ))}
        </dl>
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Física implementada desde cero</h2>
        <p className="max-w-3xl text-sm text-slate-400">
          No se usan librerías de física: cada método está programado en TypeScript y probado contra soluciones analíticas.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {METODOS.map((m) => (
            <div key={m.nombre} className="tarjeta">
              <h3 className="font-semibold text-slate-100">{m.nombre}</h3>
              <p className="text-sm text-slate-400">{m.uso}</p>
              <p className="mt-1 text-xs text-slate-500">Módulo{m.modulos.length > 1 ? 's' : ''} {m.modulos.join(', ')}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
