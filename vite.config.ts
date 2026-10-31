/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base para GitHub Pages: https://<usuario>.github.io/simulador-em/
// En desarrollo se usa la raíz para que `npm run dev` funcione sin rutas extra;
// `vite preview` sirve el build, así que necesita la misma base que este.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/simulador-em/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
