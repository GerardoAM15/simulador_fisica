# Informe técnico

## Simulador interactivo de campos eléctricos y magnéticos en 2D/3D

**Curso:** Física 2 — Ingeniería de Sistemas, Universidad Peruana Unión (UPeU)
**Producto:** aplicación web de simulación (9 módulos, 4 unidades)
**Tecnología:** TypeScript, React 18, Three.js, Canvas 2D, Vitest

---

## Índice

1. [Introducción y objetivos](#1-introducción-y-objetivos)
2. [Fundamentos físicos implementados](#2-fundamentos-físicos-implementados)
3. [Arquitectura del software](#3-arquitectura-del-software)
4. [Algoritmos numéricos](#4-algoritmos-numéricos)
5. [Pruebas y validación](#5-pruebas-y-validación)
6. [Limitaciones y trabajo futuro](#6-limitaciones-y-trabajo-futuro)
7. [Conclusiones](#7-conclusiones)
8. [Referencias](#8-referencias)

---

## 1. Introducción y objetivos

Los fenómenos electromagnéticos que estudia Física 2 (campos, potenciales, corrientes, fuerzas sobre cargas en
movimiento) son difíciles de imaginar a partir de las ecuaciones: los campos son vectoriales, llenan el espacio y
varían de un punto a otro. Este proyecto construye un simulador que permite *ver* y *manipular* esos fenómenos en
tiempo real, y que además *calcula* las magnitudes con métodos numéricos verificables.

**Objetivo general.** Desarrollar una aplicación web interactiva que visualice en 2D y 3D los campos eléctricos y
magnéticos y el comportamiento de cargas, capacitores y circuitos, con la física implementada desde cero y validada
contra soluciones analíticas.

**Objetivos específicos.**

1. Implementar en TypeScript, sin librerías de física, los modelos de las cuatro unidades del curso.
2. Implementar y justificar métodos numéricos adecuados a cada problema (RK4, Boris, MNA, marching squares,
   surface nets, Biot–Savart numérico).
3. Validar cada modelo con pruebas automáticas cuyo error frente al resultado analítico sea menor al 1 %.
4. Presentar los resultados con unidades SI, fórmulas y explicaciones teóricas en cada módulo.
5. Publicar la aplicación en la web (GitHub Pages) para que cualquiera pueda usarla desde el navegador.

**Alcance.** 9 módulos organizados según las unidades del sílabo:

| Unidad | Módulos |
|---|---|
| 1. Electricidad, campo y potencial eléctrico | 1. Visualizador de cargas puntuales · 2. Calculadora de potencial · 3. Trayectoria en campo eléctrico |
| 2. Capacitores y dieléctricos | 4. Simulador de capacitores · 5. Energía almacenada y circuito RC |
| 3. Corriente eléctrica y ley de Ohm | 6. Simulador de circuitos · 7. Ley de Ohm y resistividad |
| 4. Fuerza y campo magnético | 8. Campo magnético 3D · 9. Fuerza de Lorentz |

---

## 2. Fundamentos físicos implementados

Todas las magnitudes se manejan internamente en unidades SI. Constantes (CODATA 2018, `src/physics/constants.ts`):
$\varepsilon_0 = 8.8541878128\times10^{-12}\ \mathrm{C^2/(N\,m^2)}$, $k = 1/(4\pi\varepsilon_0) = 8.9875\times10^{9}\ \mathrm{N\,m^2/C^2}$,
$\mu_0 = 4\pi\times10^{-7}\ \mathrm{T\,m/A}$, $e = 1.602176634\times10^{-19}\ \mathrm{C}$, $m_e$ y $m_p$.

### 2.1 Unidad 1 — Campo y potencial eléctrico

**Ley de Coulomb y superposición** (`electrostatics.ts`). Para $N$ cargas puntuales $q_i$ en $\vec r_i$:

$$\vec E(\vec r)=\sum_{i=1}^{N}\frac{k\,q_i\,(\vec r-\vec r_i)}{|\vec r-\vec r_i|^{3}},\qquad V(\vec r)=\sum_{i=1}^{N}\frac{k\,q_i}{|\vec r-\vec r_i|}$$

Para evitar la singularidad en $r\to0$ se usa un **radio de suavizado** $r_{min}=2$ cm: si $|\vec r-\vec r_i|<r_{min}$ se
usa $r_{min}$ en el denominador. Fuera de ese radio el resultado es exacto.

**Líneas de campo y equipotenciales.** Una línea de campo es tangente a $\vec E$ en cada punto; su número es
proporcional a la carga (ley de Gauss, $\Phi_E=q/\varepsilon_0$). Las equipotenciales son las curvas $V=\text{cte}$ y
son perpendiculares a las líneas de campo porque $\vec E=-\nabla V$.

**Trabajo y energía.** El campo electrostático es conservativo: $W_{A\to B}=q\,(V_A-V_B)=-\Delta U$. La energía de
un sistema de cargas es $U=\sum_{i<j}k\,q_iq_j/r_{ij}$.

**Movimiento de una carga** (módulo 3). Segunda ley de Newton $m\,d\vec v/dt=q\vec E(\vec r)$. En campo uniforme la
solución es parabólica, $\vec r(t)=\vec r_0+\vec v_0t+\tfrac12(q\vec E/m)t^2$; con cargas puntuales se integra
numéricamente y se verifica la conservación de $E=\tfrac12mv^2+qV$.

### 2.2 Unidad 2 — Capacitores y dieléctricos

(`capacitor.ts`)

- Placas paralelas: $C=\kappa\varepsilon_0A/d$, $Q=CV$, $E=V/d$, $\sigma=\kappa\varepsilon_0E$.
- Dieléctrico insertado una fracción $f$ (dos capacitores en paralelo): $C=\dfrac{\varepsilon_0A}{d}\big[(1-f)+\kappa f\big]$.
- Carga inducida en el dieléctrico: $\sigma_i=\sigma\,(1-1/\kappa)$. Se compara con la rigidez dieléctrica para
  avisar de una ruptura.
- Energía: $U=\tfrac12CV^2=Q^2/2C=\tfrac12QV$; densidad $u=\tfrac12\kappa\varepsilon_0E^2$ (se verifica que
  $u\cdot Ad=U$).
- Asociaciones: serie $1/C_{eq}=\sum 1/C_i$ (misma carga), paralelo $C_{eq}=\sum C_i$ (mismo voltaje) y mixta.
- **Circuito RC.** La ley de mallas $\varepsilon=IR+Q/C$ con $I=dQ/dt$ da
  $Q(t)=Q_f+(Q_0-Q_f)\,e^{-t/\tau}$ con $\tau=RC$. Se implementa por tramos para poder conmutar entre carga
  ($Q_f=CV$) y descarga ($Q_f=0$) en cualquier instante, con un balance exacto de energía:
  $W_{bat}=\Delta U_C+Q_{disipado}$. Al cargar desde cero la batería entrega $CV^2$ y la mitad se disipa en $R$.

### 2.3 Unidad 3 — Corriente eléctrica y ley de Ohm

(`circuits.ts`)

- Ley de Ohm $V=IR$; potencia $P=VI=I^2R=V^2/R$.
- Resistencia de un conductor $R=\rho L/A$ con $\rho(T)=\rho_0[1+\alpha(T-T_0)]$ para 8 materiales.
- **Leyes de Kirchhoff:** $\sum I=0$ en cada nodo (conservación de la carga) y $\sum V=0$ en cada malla
  (conservación de la energía). El simulador de circuitos las usa en forma matricial (MNA, sección 4.5) y además
  las verifica numéricamente en el resultado.
- En régimen estacionario de CC el capacitor es un circuito abierto y almacena $Q=CV$.

### 2.4 Unidad 4 — Fuerza y campo magnético

(`magnetism.ts`)

- **Ley de Biot–Savart:** $d\vec B=\dfrac{\mu_0I}{4\pi}\dfrac{d\vec l\times\hat r}{r^2}$.
- Fórmulas de referencia: hilo $B=\mu_0I/2\pi r$ (infinito) y $B=\frac{\mu_0I}{4\pi r}(\sin\theta_2-\sin\theta_1)$
  (finito); espira en su eje $B=\mu_0IR^2/[2(R^2+z^2)^{3/2}]$; solenoide $B=\mu_0NI/L$ (ideal) y
  $B=\frac{\mu_0NI}{2L}(\cos\theta_1-\cos\theta_2)$ (finito, en el eje); dipolo
  $\vec B=\frac{\mu_0}{4\pi}\frac{3(\vec m\cdot\hat r)\hat r-\vec m}{r^3}$.
- **Imán de barra:** se modela con su corriente superficial equivalente (corriente amperiana), es decir, una pila de
  espiras. Así sus líneas de $\vec B$ son lazos cerrados que pasan por el interior (de S a N), consistente con
  $\nabla\cdot\vec B=0$.
- **Fuerza de Lorentz:** $\vec F=q(\vec E+\vec v\times\vec B)$. Con $\vec v\perp\vec B$: radio $r=mv/|q|B$ y período
  $T=2\pi m/|q|B$. Hélice de paso $p=v_\parallel T$. Deriva $\vec v_d=\vec E\times\vec B/B^2$. Selector de
  velocidades $v=E/B$. Espectrómetro de masas $m=qBr/v$.

---

## 3. Arquitectura del software

### 3.1 Tecnologías

| Componente | Tecnología | Uso |
|---|---|---|
| Lenguaje | TypeScript 5 (modo *strict*) | Todo el código; los tipos evitan errores de unidades y de forma |
| Interfaz | React 18 + React Router (HashRouter) | Páginas por módulo, navegación |
| Gráficos 2D | Canvas 2D nativo | Campos, equipotenciales, circuitos, trayectorias |
| Gráficos 3D | Three.js + @react-three/fiber + drei | Escenas 3D de cargas, capacitor, campo magnético y Lorentz |
| Gráficas | Recharts | Energía vs tiempo, Q(t), I(t), V–I, P–I |
| Fórmulas | KaTeX | Fórmulas con valores sustituidos |
| Estado | Zustand | Cargas (compartidas por los módulos 1–3) y circuito del editor |
| Estilos | Tailwind CSS | Tema oscuro, diseño responsive |
| Pruebas | Vitest | 108 pruebas automáticas |
| Construcción y despliegue | Vite + GitHub Actions + GitHub Pages | Build optimizado y publicación continua |

### 3.2 Capas

La regla central de diseño es **separar la física de la interfaz**:

```
┌───────────────────────────────────────────────────────────────┐
│  Interfaz (React)  src/modules/*, src/components/*            │
│   · ModuloLayout: simulación + panel + modal de teoría        │
│   · Canvas2D / Escena3D: dibujo y animación                   │
│   · Paneles: controles, fórmulas (KaTeX), resultados          │
├───────────────────────────────────────────────────────────────┤
│  Estado (Zustand)  src/store/*                                │
├───────────────────────────────────────────────────────────────┤
│  Lógica de simulación sin React                               │
│   src/modules/*/simulacion.ts, modelo.ts, casos.ts, fuentes.ts│
├───────────────────────────────────────────────────────────────┤
│  Física pura  src/physics/*  (sin dependencias, 100 % probada)│
│   constants · vector · electrostatics · fieldLines ·          │
│   equipotential · isosurface · capacitor · circuits ·         │
│   magnetism · integrators                                     │
└───────────────────────────────────────────────────────────────┘
```

Las capas inferiores no conocen a las superiores: `src/physics` no importa React ni Three.js, por lo que se prueba
en Node sin navegador y podría reutilizarse en otro proyecto. Lo mismo ocurre con la lógica de simulación de cada
módulo (por ejemplo `SimulacionLorentz` o el modelo del editor de circuitos), que también tiene pruebas propias.

### 3.3 Estructura de carpetas

```
src/
  physics/            física pura + __tests__/
  modules/
    registry.ts       unidades, rutas, descripciones e instrucciones de los 9 módulos
    cargas/           módulo 1 (y lienzo compartido con 2 y 3)
    potencial/        módulo 2
    trayectoria/      módulo 3 (+ simulacion.ts)
    capacitores/      módulo 4
    energia/          módulo 5
    circuitos/        módulo 6 (+ modelo.ts del editor)
    ohm/              módulo 7
    magnetico/        módulo 8 (+ fuentes.ts y Web Worker)
    lorentz/          módulo 9 (+ casos.ts, simulacion.ts)
  components/         ModuloLayout, Canvas2D, Escena3D, Slider, Formula, paneles, formato SI
  store/              useCargasStore, useCircuitoStore
scripts/validacion.ts genera la tabla de la sección 5
```

### 3.4 Flujo de datos

1. El usuario mueve un control → cambia el estado (React o Zustand).
2. El componente del módulo llama a funciones puras de `src/physics` (memorizadas con `useMemo` o cacheadas por
   clave cuando el cálculo es costoso).
3. El resultado se dibuja en Canvas 2D o Three.js; el panel muestra magnitudes con unidades SI y fórmulas KaTeX.
4. En las simulaciones temporales (módulos 3, 5 y 9) un bucle `requestAnimationFrame` avanza la integración varios
   pasos por cuadro; el panel se refresca cada pocos cuadros para no recargar React.

### 3.5 Decisiones de rendimiento

- **Carga bajo demanda:** cada módulo es un `lazy()` import; la página de inicio no descarga Three.js ni Recharts.
  Las librerías se separan en archivos `vendor-*` que el navegador guarda en caché.
- **Web Worker:** las líneas de campo magnético (miles de tramos de Biot–Savart × miles de pasos RK4) se calculan en
  un hilo aparte (`lineas.worker.ts`) para que la interfaz no se congele.
- **Cachés por clave:** el mapa de potencial, las equipotenciales y las líneas de campo 2D solo se recalculan si
  cambian las cargas o el tamaño del lienzo.
- **Arreglos tipados:** las fuentes magnéticas se "compilan" a `Float64Array` y las trayectorias 3D se escriben en
  un `BufferGeometry` preasignado (sin crear objetos por cuadro).
- Los lienzos solo se animan mientras la simulación está en marcha.

---

## 4. Algoritmos numéricos

### 4.1 Runge–Kutta de orden 4 (RK4)

Se usa para la trayectoria de una carga en $\vec E$ (módulo 3), las líneas de campo (módulos 1 y 8) y como
referencia en el circuito RC. Para $dy/dt=f(t,y)$:

$$k_1=f(t,y),\ k_2=f(t+\tfrac h2,y+\tfrac h2k_1),\ k_3=f(t+\tfrac h2,y+\tfrac h2k_2),\ k_4=f(t+h,y+hk_3)$$
$$y_{n+1}=y_n+\tfrac h6(k_1+2k_2+2k_3+k_4)$$

Error local $O(h^5)$ y global $O(h^4)$. Una prueba verifica el orden: al reducir $h$ a la mitad el error baja
≈ 16 veces.

**Paso adaptativo** (módulo 3). Como la aceleración crece mucho cerca de una carga, se elige
$\Delta t=\min\!\big(L/|v|,\ \sqrt{2L/|a|}\big)$, con $L=3$ mm, reducido a $0.05\,d_{min}$ cerca de las cargas: la
partícula nunca avanza más de $L$ por paso.

### 4.2 Trazado de líneas de campo

Una línea de campo, parametrizada por la longitud de arco $s$, cumple $d\vec r/ds=\sigma\,\vec F/|\vec F|$
($\sigma=\pm1$), y se integra con RK4. Detalles:

- **Semillas proporcionales a la carga:** $n_i=\text{round}(\lambda\,|q_i|)$ líneas por carga, distribuidas en una
  circunferencia (2D) o con la espiral de Fibonacci sobre una esfera (3D). Se siembra desde el signo con mayor carga
  total, para que el dibujo respete la ley de Gauss.
- **Terminación:** al llegar a una carga de signo opuesto (sumidero), al salir de la región, si el campo se anula o,
  para $\vec B$, cuando la línea vuelve a su punto de partida (**lazo cerrado**).
- Para $\vec B$ se integra hacia adelante y, si la línea no se cierra, también hacia atrás desde la semilla.

### 4.3 Marching squares (equipotenciales 2D)

1. Se muestrea $V$ en una malla regular (una muestra cada 5 px).
2. En cada celda las 4 esquinas se clasifican según $V\ge V_0$ (4 bits → 16 casos).
3. Una tabla indica qué aristas cruza la curva; el punto de cruce se interpola linealmente,
   $t=(V_0-V_a)/(V_b-V_a)$.
4. Los casos ambiguos (silla, casos 5 y 10) se resuelven con el valor medio de la celda.

Los niveles se espacian geométricamente ($0$ y $\pm1\,\text{kV}\cdot(\sqrt2)^k$) porque $V\propto1/r$.

### 4.4 Surface nets (equipotenciales 3D)

Alternativa a marching cubes que no necesita la tabla de 256 casos: (1) en cada cubo de la malla donde $V-V_0$ cambia
de signo se coloca un vértice en el promedio de los cruces sobre sus 12 aristas; (2) por cada arista de la malla
cruzada por la superficie se forma un cuadrilátero con los vértices de los 4 cubos que la comparten. La orientación
se fija con un orden cíclico de ejes, de modo que las normales son coherentes.

### 4.5 Análisis Nodal Modificado (MNA) + eliminación de Gauss

Es el método de SPICE. Incógnitas: voltajes de nodo $\mathbf v$ (respecto a tierra) y corrientes de las fuentes
$\mathbf i$:

$$\begin{bmatrix}G & B\\ B^{T} & 0\end{bmatrix}\begin{bmatrix}\mathbf v\\ \mathbf i\end{bmatrix}=\begin{bmatrix}\mathbf 0\\ \boldsymbol\varepsilon\end{bmatrix}$$

- Cada resistencia "estampa" su conductancia $G=1/R$ en $G$: $+G$ en $(a,a)$ y $(b,b)$, $-G$ en $(a,b)$ y $(b,a)$.
- Cada fuente agrega una columna/fila: la fila impone $V_a-V_b=\varepsilon$.
- El sistema se resuelve por **eliminación de Gauss con pivoteo parcial**; si un pivote es despreciable, el circuito
  es singular (por ejemplo, una fuente en cortocircuito) y se informa al usuario.
- Una conductancia mínima $G_{min}=10^{-12}$ S de cada nodo a tierra (como en SPICE) evita singularidades por nodos
  flotantes. Los capacitores reciben una "fuga" simbólica proporcional a $C$, de modo que en serie se reparten el
  voltaje como $1/C$ (igual carga).
- **Editor visual:** los puntos unidos por cables se agrupan en un solo nodo con *union-find*. Para animar la
  corriente dentro de cada cable se resuelve un laplaciano sobre la red de cables ($L\varphi=$ inyección de corriente).
- **Verificación de Kirchhoff:** se calcula el residuo de KCL en cada nodo y, construyendo un **árbol generador**
  del grafo, la suma de voltajes en cada malla fundamental (hay $m-n+1$ mallas independientes).

### 4.6 Biot–Savart numérico

El conductor se describe con polilíneas. Cada tramo $d\vec l$ se evalúa en su punto medio (regla del punto medio,
error $O(\Delta l^2)$):

$$\vec B(\vec p)\approx\frac{\mu_0 I}{4\pi}\sum_j\frac{d\vec l_j\times(\vec p-\vec m_j)}{|\vec p-\vec m_j|^3}$$

Con unos cientos de tramos el error es menor a 0.1 % (tabla de la sección 5).

### 4.7 Método de Boris (fuerza de Lorentz)

Integrar $m\,d\vec v/dt=q(\vec E+\vec v\times\vec B)$ con Euler hace que $|\vec v|$ crezca en un factor
$\sqrt{1+(\omega\Delta t)^2}$ por paso: la órbita circular **se abre en espiral** y la energía aumenta sin límite.
El método de Boris separa el efecto de $\vec E$ (dos medios impulsos) del de $\vec B$ (una rotación pura):

$$\vec v^-=\vec v_n+\frac{q\vec E}{m}\frac{\Delta t}{2},\quad \vec t=\frac{q\vec B}{m}\frac{\Delta t}{2},\quad \vec s=\frac{2\vec t}{1+|\vec t|^2}$$
$$\vec v'=\vec v^-+\vec v^-\times\vec t,\quad \vec v^+=\vec v^-+\vec v'\times\vec s,\quad \vec v_{n+1}=\vec v^++\frac{q\vec E}{m}\frac{\Delta t}{2},\quad \vec r_{n+1}=\vec r_n+\vec v_{n+1}\Delta t$$

Como la parte magnética es una rotación exacta, $|\vec v|$ se conserva a precisión de máquina sin importar
$\Delta t$. El método es de segundo orden y conserva el volumen en el espacio de fases; su único error es de fase
(gira $2\arctan(\omega\Delta t/2)$ por paso en lugar de $\omega\Delta t$), que con 120 pasos por vuelta es de
≈ 0.02 %.

---

## 5. Pruebas y validación

### 5.1 Metodología

- **108 pruebas automáticas** (Vitest) en 14 archivos. Se ejecutan con `npm test` y también en GitHub Actions antes
  de cada despliegue: si una falla, la versión no se publica.
- Cada prueba compara el resultado numérico con una solución analítica conocida. El criterio de aceptación es un
  error relativo menor al 1 %.
- Además de los valores puntuales se verifican **propiedades físicas**: conservación de la energía, leyes de
  Kirchhoff, teorema de Tellegen ($\sum P=0$), ley de Ampère, perpendicularidad de $\vec F_B$ y $\vec v$, orden de
  convergencia de RK4.

| Archivo de pruebas | Pruebas | Qué valida |
|---|---|---|
| `vector.test.ts` | 3 | Álgebra vectorial, producto cruz |
| `electrostatics.test.ts` | 11 | Carga puntual, dipolo (exacto y lejano), superposición, trabajo, energía |
| `fieldLines.test.ts` | 7 | Líneas radiales, número ∝ q, dipolo de + a −, semillas 3D |
| `equipotential.test.ts` | 5 | Marching squares exacto en funciones lineales, círculos y esferas equipotenciales |
| `integrators.test.ts` | 6 | RK4 (orden 4), parábola en E uniforme, conservación de la energía |
| `capacitor.test.ts` | 18 | C de placas, dieléctrico parcial, energía, asociaciones, RC (RK4 y ∫I²R) |
| `circuits.test.ts` | 19 | Gauss, MNA serie/paralelo/mixto/Wheatstone/dos fuentes, Kirchhoff, casos límite |
| `magnetism.test.ts` | 8 | Hilo, espira, solenoide, dipolo, Ampère, imán, líneas cerradas |
| `lorentz.test.ts` | 7 | Radio, período, \|v\| conservada, Euler diverge, hélice, deriva, selector |
| `trayectoria/simulacion.test.ts` | 4 | Simulación del módulo 3 |
| `circuitos/modelo.test.ts` | 7 | Editor de circuitos: presets, interruptor, cortocircuito |
| `lorentz/simulacion.test.ts` | 6 | Simulación del módulo 9 (medición de r, T, paso, deriva, espectrómetro) |
| `formato.test.ts`, `registry.test.ts` | 7 | Formato SI y registro de módulos |

### 5.2 Tabla analítico vs simulado

Generada con `npm run validacion` (`scripts/validacion.ts`), que ejecuta el mismo código de `src/physics` que usa la
aplicación. "< 10⁻⁶" indica un error menor a una millonésima de porcentaje (precisión de máquina).

| # | Unidad | Caso | Magnitud | Analítico | Simulado | Unidad SI | Método | Error (%) |
|---|---|---|---|---|---|---|---|---|
| 1 | U1 | Carga puntual (2 μC, r = 0.5 m) | \|E\| | 7.1900e+4 | 7.1900e+4 | N/C | Superposición | 0 |
| 2 | U1 | Dipolo en el eje (x = 0.4 m) | E | 5.7970e+4 | 5.7970e+4 | N/C | Superposición | < 10⁻⁶ |
| 3 | U1 | Equipotencial de carga puntual | radio | 0.5 | 0.500024 | m | Marching squares | 0.0048 |
| 4 | U1 | Superficie equipotencial 3D | radio | 0.6 | 0.5994 | m | Surface nets | 0.1 |
| 5 | U1 | Electrón en E uniforme (t = 0.2 μs) | y (parábola) | -0.703528 | -0.703528 | m | RK4 | < 10⁻⁶ |
| 6 | U1 | Protón dispersado (conservación) | K + qV | 1.0392e-14 | 1.0392e-14 | J | RK4 adaptativo | < 10⁻⁶ |
| 7 | U2 | Carga RC (R = 1 kΩ, C = 100 μF) | Q(τ) | 6.3212e-4 | 6.3212e-4 | C | RK4 | < 10⁻⁶ |
| 8 | U2 | Energía disipada al cargar | ∫I²R dt | 0.005 | 0.005 | J | Trapecio | 0.000033 |
| 9 | U2 | Capacitores en serie 10 y 20 μF (12 V) | V₁ | 8 | 8.00133 | V | MNA | 0.017 |
| 10 | U3 | Serie 12 V, 2 Ω + 4 Ω | I(R1) | 2 | 2 | A | MNA + Gauss | < 10⁻⁶ |
| 11 | U3 | Paralelo 12 V, 3 Ω ∥ 6 Ω | I(R2) | 2 | 2 | A | MNA + Gauss | 0 |
| 12 | U3 | Mixto 12 V, 2 Ω + (6 Ω ∥ 3 Ω) | I(R3) | 2 | 2 | A | MNA + Gauss | < 10⁻⁶ |
| 13 | U3 | Wheatstone desequilibrado | I galvanómetro | 0.01 | 0.01 | A | MNA vs Thévenin | < 10⁻⁶ |
| 14 | U4 | Hilo recto (r = 0.1 m) | \|B\| | 2.0000e-5 | 2.0000e-5 | T | Biot–Savart | 0.0012 |
| 15 | U4 | Espira, centro (R = 0.2 m) | B | 3.1416e-5 | 3.1422e-5 | T | Biot–Savart | 0.021 |
| 16 | U4 | Espira, eje (z = 0.3 m) | B | 5.3620e-6 | 5.3617e-6 | T | Biot–Savart | 0.0051 |
| 17 | U4 | Solenoide N = 50, L = 1 m (centro) | B | 1.2322e-4 | 1.2333e-4 | T | Biot–Savart | 0.085 |
| 18 | U4 | Espira pequeña lejos (dipolo) | \|B\| | 1.0150e-9 | 1.0150e-9 | T | Biot–Savart | 0.0017 |
| 19 | U4 | Ley de Ampère alrededor del hilo | ∮B·dl | 1.2566e-5 | 1.2566e-5 | T·m | Biot–Savart | 0.0028 |
| 20 | U4 | Movimiento circular (protón) | radio r | 0.104397 | 0.104399 | m | Boris | 0.0023 |
| 21 | U4 | Movimiento circular (protón) | período T | 6.5594e-7 | 6.5609e-7 | s | Boris | 0.023 |
| 22 | U4 | Hélice (60°) | paso p | 0.327972 | 0.328047 | m | Boris | 0.023 |
| 23 | U4 | Deriva E×B (E = 20 kV/m) | v_d | 2.0000e+5 | 2.0046e+5 | m/s | Boris | 0.23 |
| 24 | U4 | Espectrómetro (¹⁴C⁺) | masa m = qBr/v | 2.3247e-26 | 2.3247e-26 | kg | Boris | 0.00061 |
| 25 | U4 | B puro, 1000 vueltas (Boris) | \|v\| | 1.0000e+6 | 1.0000e+6 | m/s | Boris | < 10⁻⁶ |
| 26 | U4 | B puro, 5 vueltas (Euler explícito) | \|v\| | 1.0000e+6 | 1.1063e+8 | m/s | Euler | 11000 |

### 5.3 Análisis de resultados

- **25 de 26 casos tienen un error menor a 0.25 %**, y la mayoría menor a 0.03 %. Todos cumplen el criterio de 1 %.
- Los casos "exactos" (1, 2, 5, 7, 10–13) coinciden a precisión de máquina: la superposición es exacta y RK4 integra
  sin error un movimiento con aceleración constante (polinomio de grado 2).
- Los errores de las equipotenciales (3, 4) provienen de la resolución de la malla (interpolación lineal y, en 3D,
  del promedio de cruces en surface nets).
- En Biot–Savart (14–19) el error es el de la discretización del conductor y del número finito de vueltas del
  solenoide; disminuye como $\Delta l^2$.
- En Boris (20–25) el error de período es el error de fase conocido del método,
  $\approx(\omega\Delta t)^2/12=0.023\,\%$ con 120 pasos por vuelta; el radio y la rapidez se conservan casi
  exactamente. El 0.23 % de la deriva (23) proviene de detectar las cúspides de la cicloide con la resolución de un
  paso de tiempo.
- **Caso 26 (contraejemplo):** con el mismo paso (20 pasos por vuelta), Euler explícito multiplica la rapidez por
  110 en solo 5 vueltas, mientras Boris la conserva durante 1000 vueltas. Esto justifica la elección de Boris para
  el módulo 9, como se puede ver en la propia aplicación con la opción "Comparar con Euler".

### 5.4 Pruebas de la interfaz

Además de las pruebas automáticas, cada módulo se probó en Chrome con interacción real (clics, arrastres, cambio
de parámetros) mediante el protocolo de DevTools, verificando que no hubiera errores en consola y revisando
capturas de pantalla en escritorio (1440 × 900) y móvil (390 × 844). Ejemplos de comprobaciones: cortocircuitar una
resistencia dibujando cables en el editor (la corriente pasa de 20 mA a 30 mA, como predice el cálculo a mano),
insertar un dieléctrico con el capacitor aislado (V cae κ veces) y leer la masa de los isótopos del carbono en el
espectrómetro (12.00, 13.00 y 14.00 u).

---

## 6. Limitaciones y trabajo futuro

- **Mecánica clásica:** no se incluyen efectos relativistas. El módulo 3 avisa cuando $v>0.1c$ (situación frecuente
  con electrones cerca de cargas de μC).
- **Cargas en un plano:** en los módulos 1–3 las cargas viven en el plano $z=0$ (la vista 3D muestra su campo en
  todo el espacio).
- **Circuitos en régimen estacionario:** el editor resuelve circuitos de CC; los capacitores se tratan como abiertos.
  Una extensión natural es el análisis transitorio (integrar el sistema con capacitores e inductores en el tiempo).
- **Campos uniformes en Lorentz:** el módulo 9 usa $\vec E$ y $\vec B$ uniformes; podría combinarse con los campos
  de Biot–Savart del módulo 8 (por ejemplo, una botella magnética).
- **Editor de circuitos:** al mover un componente, los cables conectados no lo siguen.
- **Bordes del capacitor:** se ignora el campo de borde (*fringing*) de las placas.

---

## 7. Conclusiones

1. Se construyó un simulador web de 9 módulos que cubre las 4 unidades del curso, con visualizaciones 2D y 3D en
   tiempo real, fórmulas con valores sustituidos y explicaciones teóricas.
2. Toda la física se implementó desde cero en TypeScript (≈ 1400 líneas en `src/physics`), separada de la interfaz,
   lo que permitió probarla de forma aislada.
3. Cada problema se resolvió con un método numérico apropiado: RK4 para trayectorias y líneas de campo, Boris para la
   fuerza de Lorentz (conserva la energía donde Euler falla), MNA con eliminación de Gauss para circuitos, marching
   squares y surface nets para equipotenciales, e integración numérica de Biot–Savart.
4. Las 108 pruebas automáticas y la tabla de validación muestran errores menores al 1 % frente a las soluciones
   analíticas en todos los casos, y la verificación de leyes de conservación (energía, carga, Kirchhoff, Ampère).
5. El proyecto integra conceptos de Física 2 con prácticas de ingeniería de software: tipado estático, arquitectura
   por capas, pruebas automáticas, integración continua y despliegue en la web.

---

## 8. Referencias

1. Serway, R. A., & Jewett, J. W. (2018). *Física para ciencias e ingeniería*, Vol. 2 (10.ª ed.). Cengage Learning.
2. Young, H. D., & Freedman, R. A. (2019). *Física universitaria con física moderna*, Vol. 2 (14.ª ed.). Pearson.
3. Boris, J. P. (1970). Relativistic plasma simulation — optimization of a hybrid code. *Proceedings of the Fourth
   Conference on Numerical Simulation of Plasmas*, 3–67.
4. Qin, H., Zhang, S., Xiao, J., Liu, J., Sun, Y., & Tang, W. M. (2013). Why is Boris algorithm so good? *Physics of
   Plasmas*, 20(8), 084503.
5. Ho, C.-W., Ruehli, A. E., & Brennan, P. A. (1975). The modified nodal approach to network analysis. *IEEE
   Transactions on Circuits and Systems*, 22(6), 504–509.
6. Lorensen, W. E., & Cline, H. E. (1987). Marching cubes: A high resolution 3D surface construction algorithm.
   *ACM SIGGRAPH Computer Graphics*, 21(4), 163–169.
7. Gibson, S. F. F. (1998). Constrained elastic surface nets. *Medical Image Computing and Computer-Assisted
   Intervention (MICCAI)*, 888–898.
8. Press, W. H., Teukolsky, S. A., Vetterling, W. T., & Flannery, B. P. (2007). *Numerical Recipes: The Art of
   Scientific Computing* (3.ª ed.). Cambridge University Press.
9. Tiesinga, E., Mohr, P. J., Newell, D. B., & Taylor, B. N. (2021). CODATA recommended values of the fundamental
   physical constants: 2018. *Reviews of Modern Physics*, 93, 025010.
