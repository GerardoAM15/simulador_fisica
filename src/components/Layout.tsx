import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { MODULOS, UNIDADES, modulosDeUnidad } from '../modules/registry';
import { useAppStore } from '../store/useAppStore';

/** Estructura general: barra superior, menú lateral por unidades y área de contenido. */
export default function Layout() {
  const { menuAbierto, alternarMenu, cerrarMenu } = useAppStore();
  const { pathname } = useLocation();

  // En móvil, cerrar el menú al navegar
  useEffect(() => cerrarMenu(), [pathname, cerrarMenu]);

  const actual = MODULOS.find((m) => pathname === `/${m.ruta}`);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4">
        <button
          className="boton px-2 lg:hidden"
          onClick={alternarMenu}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
        >
          ☰
        </button>
        <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-positiva">●</span>
          <span className="text-negativa">●</span>
          <span>Simulador EM</span>
        </NavLink>
        {actual && (
          <span className="truncate text-sm text-slate-400">
            <span className="hidden sm:inline">/ Unidad {actual.unidad} / </span>
            {actual.titulo}
          </span>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1">
        {menuAbierto && (
          <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={cerrarMenu} aria-hidden />
        )}
        <nav
          className={`absolute inset-y-0 left-0 z-30 w-72 shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-900 p-3 transition-transform lg:static lg:translate-x-0 ${
            menuAbierto ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `mb-3 block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-sky-600/20 text-sky-300' : 'hover:bg-slate-800'}`
            }
          >
            Inicio
          </NavLink>
          {UNIDADES.map((u) => (
            <div key={u.numero} className="mb-4">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Unidad {u.numero}
              </p>
              <p className="px-3 pb-2 text-xs text-slate-400">{u.titulo}</p>
              {modulosDeUnidad(u.numero).map((m) => (
                <NavLink
                  key={m.id}
                  to={`/${m.ruta}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                      isActive ? 'bg-sky-600/20 text-sky-300' : 'text-slate-200 hover:bg-slate-800'
                    }`
                  }
                >
                  <span className="w-6 text-center text-slate-400">{m.icono}</span>
                  <span>
                    {m.id}. {m.titulo}
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
