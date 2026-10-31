/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colores físicos usados en toda la app (carga +, carga −, campo B)
        positiva: '#ef4444',
        negativa: '#3b82f6',
        magnetico: '#a855f7',
      },
    },
  },
  plugins: [],
};
