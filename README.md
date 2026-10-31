# Simulador interactivo de campos eléctricos y magnéticos en 2D/3D

Producto final del curso **Física 2** — Ingeniería de Sistemas, Universidad Peruana Unión (UPeU).

Aplicación web para visualizar en tiempo real campos eléctricos, potencial, capacitores, circuitos,
campos magnéticos y trayectorias de partículas cargadas. Toda la física está implementada desde cero
en TypeScript y validada con más de 100 pruebas automáticas contra resultados analíticos (error < 1 %).

## Módulos

| Unidad | Módulo | Qué se puede hacer |
|---|---|---|
| 1. Campo y potencial eléctrico | 1. Cargas puntuales | Hasta 10 cargas arrastrables; líneas de campo (RK4), equipotenciales, mapa de potencial; vista 3D con isosuperficies |
| | 2. Calculadora de potencial | V, \|E\| y componentes en un punto; aporte de cada carga; trabajo W = q(V_A − V_B) |
| | 3. Trayectoria en campo eléctrico | Partícula en campo uniforme o de cargas (RK4); energía K + U conservada; comparación con la parábola |
| 2. Capacitores y dieléctricos | 4. Capacitores | Placas paralelas 3D, dieléctrico insertable con dipolos que se alinean, V o Q constante, serie/paralelo |
| | 5. Energía y circuito RC | Carga y descarga con interruptor, gráficas Q(t), I(t), V(t), balance y densidad de energía |
| 3. Corriente y ley de Ohm | 6. Circuitos | Editor visual sobre grilla resuelto con MNA; corriente animada; verificación de Kirchhoff |
| | 7. Ley de Ohm | Gráficas V–I y P–I; R = ρL/A con materiales y temperatura |
| 4. Campo magnético | 8. Campo magnético 3D | Hilo, espira, solenoide e imán por Biot–Savart; líneas de B cerradas; sonda vs fórmula analítica |
| | 9. Fuerza de Lorentz | Integrador de Boris: circular, hélice, deriva E×B, selector de velocidades, espectrómetro de masas |

## Uso local

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pruebas de la física (Vitest)
npm run build    # build de producción en dist/
npm run preview  # sirve el build en http://localhost:4173/simulador-em/
```

> En Windows, si PowerShell bloquea `npm`, usa `npm.cmd run dev` o ejecuta una vez
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Despliegue en GitHub Pages

El workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) ejecuta las pruebas, compila y publica
en cada push a `main`.

1. Crea un repositorio en GitHub (por ejemplo `simulador-em`) y sube el proyecto:
   ```bash
   git remote add origin https://github.com/<usuario>/<repositorio>.git
   git push -u origin main
   ```
2. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. La app quedará en `https://<usuario>.github.io/<repositorio>/`. La ruta base se toma automáticamente del
   nombre del repositorio (variable `BASE_PATH`).

Se usa `HashRouter` (rutas como `/#/lorentz`), así que recargar cualquier módulo funciona sin configuración extra.

## Tecnologías

Vite · React 18 · TypeScript (strict) · Three.js (@react-three/fiber, drei) · Canvas 2D · Recharts ·
Tailwind CSS · Zustand · KaTeX · React Router · Vitest.

## Arquitectura

```
src/
  physics/      física pura, sin React (constantes, vectores, electrostática, líneas de campo,
                equipotenciales, isosuperficies, capacitores, circuitos/MNA, magnetismo, integradores)
    __tests__/  pruebas contra soluciones analíticas
  modules/      un directorio por módulo + registry.ts (unidades, rutas, instrucciones)
  components/   UI reutilizable: ModuloLayout, Canvas2D, Escena3D, Slider, Formula, paneles…
  store/        estado global con Zustand (cargas y circuito, compartidos entre módulos)
docs/           manual de usuario e informe técnico
```

Rendimiento: cada módulo se carga bajo demanda y las librerías grandes van en archivos separados
(Three.js solo se descarga en los módulos 3D). Las líneas de campo magnético se calculan en un Web Worker.

## Estado del desarrollo

- [x] Fase 0 — Proyecto, layout, router, página de inicio
- [x] Fase 1 — Física base (vectores, electrostática, integradores) · módulos 1, 2 y 3
- [x] Fase 2 — Capacitores · módulos 4 y 5
- [x] Fase 3 — Circuitos (MNA) · módulos 6 y 7
- [x] Fase 4 — Magnetismo y Boris · módulos 8 y 9
- [x] Fase 5 — Pulido UX, rendimiento, teoría, responsive, despliegue en GitHub Pages
- [ ] Fase 6 — Documentación (manual, informe técnico, guion del video)
