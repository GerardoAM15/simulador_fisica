import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import './index.css';
import App from './App';

// Se usa HashRouter porque GitHub Pages no reescribe rutas: con hash,
// recargar /#/cargas no produce un 404.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
