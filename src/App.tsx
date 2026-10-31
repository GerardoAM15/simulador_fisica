import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Inicio from './modules/Inicio';
import EnConstruccion from './modules/EnConstruccion';
import { MODULOS } from './modules/registry';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        {MODULOS.map((m) => (
          <Route key={m.id} path={m.ruta} element={<EnConstruccion modulo={m} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
