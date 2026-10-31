# Manual de usuario

## Simulador interactivo de campos eléctricos y magnéticos

Este manual explica cómo abrir el simulador, cómo está organizada la pantalla y cómo usar cada uno de sus 9 módulos.
Al final de cada módulo hay **experimentos sugeridos** para practicar los temas de Física 2.

---

## Contenido

1. [Requisitos y cómo abrirlo](#1-requisitos-y-cómo-abrirlo)
2. [La pantalla](#2-la-pantalla)
3. [Unidad 1 — Campo y potencial eléctrico](#3-unidad-1--campo-y-potencial-eléctrico)
4. [Unidad 2 — Capacitores y dieléctricos](#4-unidad-2--capacitores-y-dieléctricos)
5. [Unidad 3 — Corriente eléctrica y ley de Ohm](#5-unidad-3--corriente-eléctrica-y-ley-de-ohm)
6. [Unidad 4 — Fuerza y campo magnético](#6-unidad-4--fuerza-y-campo-magnético)
7. [Atajos de teclado](#7-atajos-de-teclado)
8. [Preguntas frecuentes y solución de problemas](#8-preguntas-frecuentes-y-solución-de-problemas)

---

## 1. Requisitos y cómo abrirlo

**Requisitos:** un navegador actualizado (Chrome, Edge o Firefox) con WebGL activado (viene activado por defecto).
Funciona en computadoras, tabletas y celulares; en pantallas pequeñas la simulación aparece arriba y los controles
debajo.

**En línea:** abre https://gerardoam15.github.io/simulador_fisica/. No hay que instalar nada.

**En tu computadora** (necesitas Node.js 20 o superior):

```bash
npm install
npm run dev
```

y abre `http://localhost:5173`. En Windows, si PowerShell muestra "la ejecución de scripts está deshabilitada", usa
`npm.cmd run dev`.

---

## 2. La pantalla

```
┌──────────────────────────────────────────────────────────────────────┐
│ ☰  ● ● Simulador EM   / Unidad 1 / Visualizador de cargas puntuales  │  ← barra superior
├──────────────┬────────────────────────────────────┬──────────────────┤
│ Inicio       │                                    │ Título  [Teoría] │
│ UNIDAD 1     │                                    │ Controles        │
│  1. …        │        ÁREA DE SIMULACIÓN          │ Resultados       │
│  2. …        │   (lienzo 2D o escena 3D)          │ Fórmulas         │
│ UNIDAD 2 …   │                                    │                  │
└──────────────┴────────────────────────────────────┴──────────────────┘
   menú lateral          centro                          panel derecho
```

- **Menú lateral:** los 9 módulos agrupados por unidad. En el celular se abre con el botón ☰.
- **Área de simulación:** lienzo 2D o escena 3D. En las escenas 3D: **arrastra** para rotar, usa la **rueda** (o
  pellizca) para acercar y **clic derecho** para desplazar.
- **Panel derecho:** controles (deslizadores, botones, listas), resultados con unidades SI y fórmulas.
- **Botón Teoría:** abre una ventana con la sección **"Cómo usar este módulo"** y una explicación breve de la física
  con sus fórmulas. Se cierra con ✕ o con la tecla Esc.

**Cómo leer los números.** Los valores muy grandes o muy pequeños se muestran en notación científica
(`2.47 × 10⁻⁵ T`) o con prefijos SI (`470 μF`, `12 mA`, `1 kΩ`). En los campos de texto puedes escribir valores
como `9.109e-31`.

---

## 3. Unidad 1 — Campo y potencial eléctrico

### Módulo 1 · Visualizador de cargas puntuales

Muestra el campo eléctrico de hasta 10 cargas puntuales.

**Cómo usarlo**

- **Mover** una carga: arrástrala.
- **Agregar:** botones *Agregar +* / *Agregar −*, o doble clic en un espacio vacío.
- **Editar:** haz clic en una carga; en el panel aparece un deslizador para su valor (−10 a +10 μC).
- **Eliminar:** botón *Eliminar carga* o tecla Supr.
- **Configuraciones listas:** Dipolo, Dos cargas iguales, Cuadrupolo, Placas paralelas.
- **Capas (vista 2D):**
  - *Líneas de campo*: blancas, con flechas en el sentido de E.
  - *Equipotenciales*: rojas si V > 0, azules si V < 0, discontinua si V = 0.
  - *Mapa de potencial*: color de fondo.
  - *Vectores E*: flechas en una cuadrícula; más brillantes donde el campo es más intenso.
- **Densidad de líneas:** cuántas líneas salen por cada μC.
- **Vista 3D:** líneas de campo en el espacio y, opcionalmente, *superficies equipotenciales* (rojo V = +V₀, azul
  V = −V₀), con un deslizador para elegir V₀.

**Experimentos sugeridos**

1. Con el *Dipolo*, comprueba que las líneas salen de + y llegan a −, y que cortan a las equipotenciales en ángulo
   recto.
2. Con *Dos cargas iguales*, busca el punto entre ellas donde el campo es nulo (los vectores desaparecen).
3. Cambia una carga a +6 μC y la otra a −2 μC: ¿cuántas líneas llegan a la carga negativa y cuántas se van lejos?
   (Ley de Gauss.)
4. En 3D, sube y baja V₀ y observa cómo las superficies pasan de esferas separadas a una sola superficie.

### Módulo 2 · Calculadora de potencial

Usa las mismas cargas que el módulo 1.

**Cómo usarlo**

- Haz **clic** en el lienzo para colocar el punto **A** (amarillo) y luego el punto **B** (verde). También puedes
  elegir qué punto colocar con los botones *Colocar A / Colocar B*.
- El panel muestra en A: **V, |E|, Eₓ, E_y, E_z**, la fórmula con los números reemplazados y una tabla con el aporte
  de cada carga (qᵢ, rᵢ, Vᵢ, |Eᵢ|).
- En *Trabajo de A a B*, elige la carga de prueba q: se calculan **W = q(V_A − V_B)**, el trabajo externo y ΔU.

**Experimentos sugeridos**

1. Coloca A y B sobre la misma equipotencial: el trabajo debe ser cero.
2. Con el dipolo, coloca A en la mediatriz (la línea entre las cargas): V_A = 0 pero |E| ≠ 0.
3. Cambia el signo de la carga de prueba y observa cómo cambia el signo del trabajo.

### Módulo 3 · Trayectoria en campo eléctrico

**Cómo usarlo**

1. **Campo:** *Uniforme* (magnitud y dirección de E) o *Cargas (módulo 1)*.
2. **Partícula:** electrón, protón, partícula α o *Personalizada* (escribe q en C y m en kg).
3. **Lanzamiento:** posición x₀, y₀ (o clic en el lienzo), rapidez v₀ y ángulo.
4. Pulsa **▶ Play**. *Velocidad de simulación* controla cuántos pasos se calculan por cuadro.

Resultados: tiempo, rapidez, K, U = qV, energía total y su variación relativa |ΔE|/E₀ (debe ser muy pequeña). La
gráfica muestra K, U y E en el tiempo. En campo uniforme aparece la **comparación con la parábola analítica**.

**Experimentos sugeridos**

1. Electrón con E hacia arriba (90°): se desvía hacia abajo. Cambia a protón (rapidez sugerida 2.5 × 10⁵ m/s): ¿hacia
   dónde se desvía?
2. Con cargas del módulo 1, lanza un protón hacia una carga positiva y observa cómo K se convierte en U y viceversa
   mientras E total permanece constante.

> Si la rapidez supera 0.1c aparece un aviso: a esas velocidades la mecánica clásica deja de ser precisa.

---

## 4. Unidad 2 — Capacitores y dieléctricos

### Módulo 4 · Simulador de capacitores

**Pestaña "Placas paralelas"** (escena 3D)

- Deslizadores de **área A**, **separación d** y **voltaje V**.
- **Conexión:**
  - *Con batería (V cte.)*: el voltaje lo fija la batería.
  - *Aislado (Q cte.)*: la carga queda fija al desconectarlo y V pasa a ser el resultado de Q/C.
- **Dieléctrico:** elige el material (vacío, aire, teflón, papel, mica, vidrio, porcelana, agua) y pulsa **Insertar**
  o usa el deslizador *Insertado (%)*. Los conos blancos son dipolos moleculares: desordenados fuera y alineados con E
  entre las placas. Las capas de color en las caras del dieléctrico representan la carga inducida.
- Resultados: C₀, C, C/C₀, Q, V, E, σ, σ inducida, U y u. Si E supera la rigidez dieléctrica del material aparece un
  aviso de **ruptura**.

**Pestaña "Serie / paralelo"**

- Elige *Serie*, *Paralelo* o *Mixto* (C₁ en serie con el paralelo de los demás), el número de capacitores (2 a 4),
  sus valores y la fuente. El diagrama y la tabla muestran C, V, Q y U de cada uno y el equivalente.

**Experimentos sugeridos**

1. Con batería, inserta vidrio (κ = 5.6): ¿cuánto aumentan C y Q?
2. Cambia a *Aislado* y retira el dieléctrico: ¿qué le pasa a V? (Debe multiplicarse por κ.)
3. Duplica la separación con el capacitor aislado: V y U aumentan. ¿De dónde sale esa energía?
4. En serie, comprueba que todos tienen la misma carga y que los voltajes suman V.

### Módulo 5 · Energía almacenada y circuito RC

**Cómo usarlo**

- Ajusta **R**, **C** y la fuente **ε**; el panel muestra τ = RC.
- Pulsa **▶ Play** para cargar el capacitor (interruptor en **A**).
- Cambia a **B · Descargar** en cualquier momento: el capacitor se descarga a través de R. La corriente cambia de
  sentido (mira los puntos amarillos y la flecha).
- Gráficas: Q(t), I(t) y V_C, V_R; la línea discontinua marca t₀ + τ. La simulación se pausa sola al llegar a 7τ.
- **Energía:** U = ½CV² = Q²/2C = ½QV (los tres valores coinciden) y un balance: energía entregada por la batería,
  almacenada en C y disipada en R.
- **Densidad de energía:** elige separación y dieléctrico para ver qué área tendrían unas placas con esa C y comprobar
  que u·A·d = U.

**Experimentos sugeridos**

1. Mide en la gráfica el valor de Q cuando t = τ: debe ser el 63 % de CV.
2. Carga por completo y compara la energía de la batería con la almacenada: exactamente la mitad se disipa en R.
   Repite con otra R: el resultado no cambia.
3. Descarga a mitad de la carga y observa cómo continúa el balance de energía.

---

## 5. Unidad 3 — Corriente eléctrica y ley de Ohm

### Módulo 6 · Simulador de circuitos

**Herramientas**

| Herramienta | Uso |
|---|---|
| Seleccionar | Clic para elegir un elemento, arrastrar para moverlo |
| Cable | Arrastra de un punto de la grilla a otro (traza en forma de L) |
| Fuente DC, Resistencia, Capacitor, Interruptor | Clic en un punto de la grilla para colocarlo (mide 2 cuadros) |
| Borrar | Clic sobre un elemento para eliminarlo |
| Rotar / Eliminar / Limpiar | Botones del panel (también R y Supr) |

- Para **editar un valor**, selecciona el elemento y escribe el valor (Ω, V o μF) o usa el ajuste rápido.
- **Interruptor:** doble clic sobre él o botón *Abrir/Cerrar interruptor*.
- **Circuitos de ejemplo:** Serie, Paralelo, Mixto y Puente de Wheatstone.
- **Colores:** los cables se colorean según su potencial (azul = más bajo, rojo = más alto). Los puntos amarillos
  representan la corriente: su rapidez es proporcional a I. Las letras A, B, C… identifican los nodos.
- **Panel:** tabla con V, I y P de cada elemento y la **verificación de Kirchhoff**: residuo de corrientes en los
  nodos, ΣV de cada malla independiente y balance de potencia (fuentes = resistencias).
- Si una fuente queda en cortocircuito aparece un mensaje en rojo.

**Experimentos sugeridos**

1. Carga *Serie* y calcula a mano I = 12 V / 600 Ω = 20 mA. Luego dibuja un cable sobre R2 (cortocircuito): la
   corriente sube a 30 mA.
2. En *Mixto*, abre el interruptor: toda la corriente se anula y entre sus terminales aparecen 12 V.
3. En *Wheatstone*, el puente está equilibrado (I = 0 en R5). Cambia R4 y observa cómo aparece corriente en el
   puente.

### Módulo 7 · Ley de Ohm y resistividad

- Deslizadores de **V** y **R**: el amperímetro, la resistencia (que brilla según la potencia) y las gráficas se
  actualizan.
- **Curva V–I:** recta de pendiente R (también se muestran R/2 y 2R) con el punto de operación.
- **Potencia P = I²R:** parábola con el punto actual. El panel muestra P calculada de tres formas.
- **Resistencia de un conductor:** material, longitud, diámetro y temperatura → R = ρL/A. El botón *Usar esta R en
  el circuito* la pasa al circuito.

**Experimentos sugeridos**

1. Duplica V con R fija: I se duplica y P se cuadruplica.
2. Compara 10 m de cobre y 10 m de nicrom del mismo diámetro.
3. Sube la temperatura de un cable de tungsteno de 20 °C a 300 °C: ¿cuánto aumenta su resistencia?

---

## 6. Unidad 4 — Fuerza y campo magnético

### Módulo 8 · Campo magnético 3D

- **Fuente:** Hilo, Espira, Solenoide o Imán. Ajusta la corriente I y, según la fuente, el radio R, la longitud L y
  las vueltas N.
- **Escena:** el conductor (cobre) con puntos amarillos que indican el sentido de la corriente, las **líneas de B**
  (violeta, con conos que indican su sentido) y, si activas *Brújulas*, agujas que señalan la dirección de B en el
  plano vertical. El imán muestra el polo N en rojo y el S en azul.
- **Sonda:** haz clic en el plano vertical (y = 0) o usa los deslizadores x, y, z. El panel muestra |B| y sus
  componentes calculados con Biot–Savart, la **fórmula analítica** aplicable y la diferencia porcentual.
- Mientras se recalculan las líneas aparece "Calculando líneas de campo…".

**Experimentos sugeridos**

1. Hilo: mueve la sonda alejándote del hilo y comprueba que B ∝ 1/r. Usa la regla de la mano derecha para predecir el
   sentido de las líneas.
2. Espira: coloca la sonda en el eje (x = y = 0) y compara con μ₀IR²/2(R² + z²)^{3/2}.
3. Solenoide: aumenta N y observa cómo el campo interior se vuelve más uniforme y se acerca a μ₀NI/L.
4. Imán: compara sus líneas con las del solenoide. ¿Por qué se parecen?

### Módulo 9 · Fuerza de Lorentz

- **Casos:**

  | Caso | Qué muestra |
  |---|---|
  | Circular | v ⊥ B: movimiento circular uniforme |
  | Helicoidal | v con componente paralela a B: hélice (ajusta el ángulo entre v y B) |
  | Deriva E×B | Partícula que parte del reposo en E ⊥ B: cicloide que avanza con v = E/B |
  | Selector de velocidades | Tres partículas con 0.8, 1 y 1.2 veces E/B: solo una pasa recta por la rendija |
  | Espectrómetro de masas | Iones ¹²C⁺, ¹³C⁺ y ¹⁴C⁺: radios distintos según la masa |

- **Controles:** partícula, |B|, |E|, rapidez v₀, ángulo, velocidad de simulación, ▶ Play / Pausa / Reiniciar.
- **Escala:** la escena se ajusta automáticamente; el recuadro superior indica cuánto mide cada cuadro de la grilla.
- **Teoría vs simulación:** tabla con r, T, paso de la hélice o velocidad de deriva, teóricos y medidos, con su error.
- **Comparar con Euler** (casos circular y helicoidal): dibuja en rojo la trayectoria calculada con Euler explícito,
  que se abre en espiral, y muestra cuánto cambia |v| con cada método.

**Experimentos sugeridos**

1. Duplica v₀ en el caso circular: el radio se duplica pero el período no cambia (principio del ciclotrón).
2. Cambia de protón a electrón: gira en sentido contrario y mucho más rápido.
3. En la deriva, cambia la partícula por un electrón: la cicloide se invierte, pero avanza en el mismo sentido y con la
   misma velocidad E/B.
4. En el espectrómetro, lee la masa calculada de cada ion en la tabla del detector.

---

## 7. Atajos de teclado

| Tecla | Módulo | Acción |
|---|---|---|
| Supr / Retroceso | 1, 2 | Eliminar la carga seleccionada |
| R | 6 | Rotar el componente seleccionado |
| Supr / Retroceso | 6 | Eliminar el elemento seleccionado |
| Esc | 6 | Volver a la herramienta Seleccionar |
| Esc | Todos | Cerrar la ventana de teoría |
| Enter | Campos numéricos | Confirmar el valor escrito |

---

## 8. Preguntas frecuentes y solución de problemas

**La vista 3D aparece en blanco o muestra "No se pudo mostrar este módulo".**
Tu navegador o tarjeta gráfica no tiene WebGL activo. Actualiza el navegador o prueba con Chrome/Edge. En Chrome
puedes revisar `chrome://gpu`.

**`npm` no funciona en PowerShell.**
Usa `npm.cmd run dev`, o ejecuta una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

**En el editor de circuitos moví un componente y el circuito dejó de conducir.**
Los cables no siguen al componente al moverlo: vuelve a dibujar los cables hasta sus terminales.

**El circuito muestra "Cortocircuito".**
Hay un cable (o un interruptor cerrado) que une directamente los dos terminales de una fuente. Elimínalo con la
herramienta Borrar.

**¿Se guardan mis cambios?**
Las cargas del módulo 1 y el circuito del módulo 6 se conservan mientras navegas entre módulos, pero se pierden al
recargar la página.

**¿Por qué el electrón necesita velocidades tan altas en el módulo 3 con cargas?**
Las cargas son de microcoulombs: la energía potencial cerca de ellas es enorme comparada con la energía cinética
de un electrón lento, que termina atrapado. Usa un protón o reduce las cargas.

**¿Qué tan precisos son los resultados?**
Cada modelo se valida contra soluciones analíticas con más de 100 pruebas automáticas; el error es menor al 1 %
en todos los casos (ver el informe técnico, sección 5).
