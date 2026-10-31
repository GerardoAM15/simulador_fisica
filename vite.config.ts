/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base para GitHub Pages: https://<usuario>.github.io/<repositorio>/
// El workflow de despliegue define BASE_PATH con el nombre real del repositorio.
// En desarrollo se usa la raíz para que `npm run dev` funcione sin rutas extra;
// `vite preview` sirve el build, así que necesita la misma base que este.
const BASE = process.env.BASE_PATH ?? '/simulador-em/';

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? BASE : '/',
  plugins: [react()],
  build: {
    // Three.js ocupa ~700 kB por sí solo; se carga únicamente en los módulos 3D
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Librerías grandes en archivos separados: se descargan una vez y quedan en caché
        manualChunks(id) {
          // Ayudantes virtuales de Vite/Rollup (precarga, CommonJS): van con React para que la página
          // de inicio no tenga que descargar el chunk 3D solo por ellos
          if (id.includes('vite/preload-helper') || id.includes('commonjsHelpers')) return 'vendor-react';
          const paquete = /node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/.exec(id)?.[1].replace('\\', '/');
          if (!paquete) return undefined;
          if (/^(three|three-stdlib|@react-three\/.*|react-reconciler|its-fine|suspend-react)$/.test(paquete)) return 'vendor-3d';
          if (/^(recharts|recharts-scale|victory-vendor|d3-.*|decimal\.js-light)$/.test(paquete)) return 'vendor-graficas';
          if (/^(katex|react-katex)$/.test(paquete)) return 'vendor-katex';
          if (/^(react|react-dom|scheduler|react-router|react-router-dom|@remix-run\/router|zustand|use-sync-external-store)$/.test(paquete))
            return 'vendor-react';
          // Dependencias compartidas (lodash, react-is…): aparte, para que un grupo no arrastre a otro
          return 'vendor-comun';
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
