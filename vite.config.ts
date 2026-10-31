/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base para GitHub Pages: https://<usuario>.github.io/simulador-em/
// En desarrollo se usa la raíz para que `npm run dev` funcione sin rutas extra.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/simulador-em/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
