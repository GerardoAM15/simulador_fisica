import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Inicio from './modules/Inicio';
import EnConstruccion from './modules/EnConstruccion';
import { MODULOS } from './modules/registry';

// Cada módulo se carga bajo demanda para que la página de inicio no descargue Three.js ni Recharts
const IMPLEMENTADOS: Record<string, LazyExoticComponent<ComponentType>> = {
  cargas: lazy(() => import('./modules/cargas/VisualizadorCargas')),
  potencial: lazy(() => import('./modules/potencial/CalculadoraPotencial')),
  'trayectoria-electrica': lazy(() => import('./modules/trayectoria/TrayectoriaElectrica')),
  capacitores: lazy(() => import('./modules/capacitores/SimuladorCapacitores')),
  energia: lazy(() => import('./modules/energia/EnergiaRC')),
};

function Cargando() {
  return <div className="flex h-full items-center justify-center text-slate-500">Cargando módulo…</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        {MODULOS.map((m) => {
          const Componente = IMPLEMENTADOS[m.ruta];
          return (
            <Route
              key={m.id}
              path={m.ruta}
              element={
                Componente ? (
                  <Suspense fallback={<Cargando />}>
                    <Componente />
                  </Suspense>
                ) : (
                  <EnConstruccion modulo={m} />
                )
              }
            />
          );
        })}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
