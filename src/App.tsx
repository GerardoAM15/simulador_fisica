import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import LimiteError from './components/LimiteError';
import Inicio from './modules/Inicio';
import { MODULOS } from './modules/registry';

// Cada módulo se carga bajo demanda para que la página de inicio no descargue Three.js ni Recharts
const COMPONENTES: Record<string, LazyExoticComponent<ComponentType>> = {
  cargas: lazy(() => import('./modules/cargas/VisualizadorCargas')),
  potencial: lazy(() => import('./modules/potencial/CalculadoraPotencial')),
  'trayectoria-electrica': lazy(() => import('./modules/trayectoria/TrayectoriaElectrica')),
  capacitores: lazy(() => import('./modules/capacitores/SimuladorCapacitores')),
  energia: lazy(() => import('./modules/energia/EnergiaRC')),
  circuitos: lazy(() => import('./modules/circuitos/SimuladorCircuitos')),
  'ley-ohm': lazy(() => import('./modules/ohm/LeyOhm')),
  'campo-magnetico': lazy(() => import('./modules/magnetico/CampoMagnetico')),
  lorentz: lazy(() => import('./modules/lorentz/FuerzaLorentz')),
};

function Cargando() {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-sky-400" />
      Cargando módulo…
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        {MODULOS.map((m) => {
          const Componente = COMPONENTES[m.ruta];
          return (
            <Route
              key={m.id}
              path={m.ruta}
              element={
                <LimiteError key={m.ruta}>
                  <Suspense fallback={<Cargando />}>
                    <Componente />
                  </Suspense>
                </LimiteError>
              }
            />
          );
        })}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
