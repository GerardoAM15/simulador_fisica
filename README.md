# Simulador interactivo de campos eléctricos y magnéticos en 2D/3D

Producto final del curso **Física 2** — Ingeniería de Sistemas, Universidad Peruana Unión (UPeU).

Aplicación web para visualizar en tiempo real campos eléctricos, potencial, capacitores, circuitos,
campos magnéticos y trayectorias de partículas cargadas. Toda la física está implementada desde cero
en TypeScript y validada con pruebas automáticas contra resultados analíticos.

## Módulos

| Unidad | Módulo |
|---|---|
| 1. Electricidad, campo y potencial eléctrico | 1. Visualizador de cargas puntuales · 2. Calculadora de potencial · 3. Trayectoria en campo eléctrico |
| 2. Capacitores y dieléctricos | 4. Simulador de capacitores · 5. Energía almacenada y circuito RC |
| 3. Corriente eléctrica y ley de Ohm | 6. Simulador de circuitos (MNA) · 7. Ley de Ohm y resistividad |
| 4. Fuerza y campo magnético | 8. Campo magnético 3D (Biot–Savart) · 9. Fuerza de Lorentz (Boris) |

## Tecnologías

Vite · React 18 · TypeScript · Three.js (@react-three/fiber, drei) · Canvas 2D · Recharts ·
Tailwind CSS · Zustand · KaTeX · React Router · Vitest.

## Uso

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev      # abre http://localhost:5173
npm test         # pruebas de la física
npm run build    # build de producción en dist/
```

## Estructura

```
src/
  physics/      física pura (sin React) + pruebas en __tests__/
  modules/      un componente por módulo + registry.ts
  components/   UI reutilizable (layout de módulo, sliders, fórmulas, resultados)
  store/        estado global (Zustand)
docs/           manual de usuario e informe técnico
```

## Estado del desarrollo

- [x] Fase 0 — Proyecto, layout, router, página de inicio
- [ ] Fase 1 — Física base (vectores, electrostática, integradores) · módulos 1, 2 y 3
- [ ] Fase 2 — Capacitores · módulos 4 y 5
- [ ] Fase 3 — Circuitos (MNA) · módulos 6 y 7
- [ ] Fase 4 — Magnetismo y Boris · módulos 8 y 9
- [ ] Fase 5 — Pulido UX, rendimiento, teoría, despliegue en GitHub Pages
- [ ] Fase 6 — Documentación (manual, informe técnico, guion del video)
