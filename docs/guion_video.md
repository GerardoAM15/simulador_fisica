# Guion del video demostrativo

**Duración objetivo:** 8 minutos (mínimo 5, máximo 10).
**Formato:** grabación de pantalla con voz en off; opcionalmente cámara en una esquina durante la introducción y el
cierre.

## Antes de grabar

- Usar la versión publicada en GitHub Pages (o `npm run preview`) en Chrome, pantalla completa (F11), resolución
  1920 × 1080 y zoom del navegador al 100 %.
- Recargar la página justo antes de grabar, para que todos los módulos empiecen con sus valores por defecto.
- Tener abierta en otra pestaña la tabla de validación (`docs/informe_tecnico.md`, sección 5.2) y una terminal en la
  carpeta del proyecto.
- Ensayar los clics de cada escena; grabar cada escena por separado facilita la edición.
- Ocultar notificaciones del sistema.

## Escaleta

| # | Tiempo | Escena | Duración |
|---|---|---|---|
| 1 | 0:00 | Presentación y objetivo | 0:40 |
| 2 | 0:40 | Unidad 1: cargas, potencial y trayectoria | 1:40 |
| 3 | 2:20 | Unidad 2: capacitores y circuito RC | 1:20 |
| 4 | 3:40 | Unidad 3: circuitos y ley de Ohm | 1:20 |
| 5 | 5:00 | Unidad 4: campo magnético y Lorentz | 1:40 |
| 6 | 6:40 | Cómo está hecho y validación | 0:50 |
| 7 | 7:30 | Cierre | 0:30 |

---

### Escena 1 — Presentación (0:00 – 0:40)

**En pantalla:** página de inicio. Bajar lentamente por las tarjetas de las 4 unidades y la sección "Física
implementada desde cero".

**Narración:**
> Hola, somos [nombres] y este es nuestro producto final de Física 2: un simulador interactivo de campos eléctricos y
> magnéticos en 2D y 3D. Funciona en el navegador, sin instalar nada, y tiene 9 módulos organizados según las cuatro
> unidades del curso. Toda la física está programada por nosotros desde cero y validada con más de cien pruebas
> automáticas contra las fórmulas analíticas.

---

### Escena 2 — Unidad 1 (0:40 – 2:20)

**2a. Módulo 1, visualizador de cargas (0:40 – 1:20)**

**En pantalla:**
1. Abrir el módulo 1 (dipolo por defecto). Señalar líneas y equipotenciales.
2. Arrastrar la carga negativa; las líneas se recalculan en tiempo real.
3. Pulsar "Dos cargas iguales" y activar "Vectores E".
4. Cambiar a "Vista 3D", rotar la escena y activar "Superficies equipotenciales".

**Narración:**
> En el primer módulo vemos el campo de cargas puntuales. Las líneas de campo nacen en la carga positiva y mueren en
> la negativa, y siempre cortan en ángulo recto a las equipotenciales. Al mover una carga todo se recalcula: el campo
> se obtiene por superposición de la ley de Coulomb y las líneas se trazan integrando con Runge–Kutta de cuarto
> orden. Con dos cargas iguales aparece un punto donde el campo se anula. En 3D vemos las líneas en el espacio y las
> superficies equipotenciales.

**2b. Módulo 2, calculadora de potencial (1:20 – 1:45)**

**En pantalla:** volver a "Dipolo" desde el módulo 1, abrir el módulo 2, hacer clic para colocar A y B y señalar la
fórmula con los valores y el trabajo.

**Narración:**
> En la calculadora hacemos clic en dos puntos y obtenemos el potencial, el campo y sus componentes, con la fórmula
> y los valores reemplazados, y el trabajo para mover una carga de A a B.

**2c. Módulo 3, trayectoria (1:45 – 2:20)**

**En pantalla:** módulo 3 con el electrón en campo uniforme → Play. Señalar la comparación con la parábola. Cambiar a
"Cargas (módulo 1)", elegir Protón → Play, y señalar la gráfica de energía.

**Narración:**
> Aquí lanzamos partículas. En un campo uniforme el electrón describe una parábola, y la simulación coincide con la
> solución analítica. Con las cargas del primer módulo el protón es desviado; la gráfica muestra cómo la energía
> cinética se convierte en potencial mientras la energía total se mantiene constante.

---

### Escena 3 — Unidad 2 (2:20 – 3:40)

**3a. Módulo 4, capacitores (2:20 – 3:05)**

**En pantalla:**
1. Módulo 4 con vidrio. Pulsar "Insertar" y mostrar cómo se alinean los dipolos y C/C₀ = 5.6.
2. Cambiar a "Aislado (Q cte.)" y pulsar "Retirar": V sube de 100 a 560 V.
3. Pestaña "Serie / paralelo", elegir "Mixto".

**Narración:**
> Este es un capacitor de placas paralelas. Al insertar el dieléctrico sus moléculas se polarizan y se alinean con
> el campo, y la capacitancia aumenta κ veces. Si el capacitor está aislado, la carga se conserva: al retirar el
> vidrio el voltaje se multiplica por 5.6. También podemos armar asociaciones en serie, en paralelo y mixtas.

**3b. Módulo 5, circuito RC (3:05 – 3:40)**

**En pantalla:** Play; señalar la marca de τ en la gráfica; a mitad de la carga cambiar a "B · Descargar"; mostrar el
balance de energía.

**Narración:**
> En el circuito RC el capacitor se carga exponencialmente con constante de tiempo τ = RC. Podemos mover el
> interruptor en cualquier momento para descargarlo. El balance de energía muestra un resultado interesante: al
> cargar, la mitad de la energía de la batería siempre se disipa en la resistencia.

---

### Escena 4 — Unidad 3 (3:40 – 5:00)

**4a. Módulo 6, circuitos (3:40 – 4:35)**

**En pantalla:**
1. Circuito "Mixto": señalar los colores por potencial, los puntos de corriente y la tabla de resultados.
2. Doble clic en el interruptor para abrirlo y luego cerrarlo.
3. Cargar "Serie", elegir la herramienta Cable y dibujar dos cables que cortocircuiten R2: la corriente pasa de 20 a
   30 mA.
4. Bajar en el panel hasta "Verificación de Kirchhoff".

**Narración:**
> El simulador de circuitos es un editor visual. Los cables se colorean según su potencial y los puntos se mueven
> con rapidez proporcional a la corriente. El circuito se resuelve con Análisis Nodal Modificado, el mismo método
> de SPICE: se arma un sistema de ecuaciones lineales y se resuelve por eliminación de Gauss. Si cortocircuito esta
> resistencia, la corriente sube de 20 a 30 miliamperios, igual que en el cálculo a mano. Y el panel verifica las
> leyes de Kirchhoff: la suma de corrientes en cada nodo y de voltajes en cada malla es cero.

**4b. Módulo 7, ley de Ohm (4:35 – 5:00)**

**En pantalla:** mover V y R; señalar la recta V–I y la parábola de potencia; elegir cobre y luego nicrom.

**Narración:**
> En el módulo de ley de Ohm la gráfica V–I es una recta cuya pendiente es la resistencia, y la potencia crece con el
> cuadrado de la corriente. También calculamos la resistencia de un cable según su material y su temperatura.

---

### Escena 5 — Unidad 4 (5:00 – 6:40)

**5a. Módulo 8, campo magnético (5:00 – 5:45)**

**En pantalla:** solenoide (por defecto), rotar la escena; cambiar a Hilo y hacer clic en el plano para mover la
sonda; señalar la diferencia con la fórmula; cambiar a Imán.

**Narración:**
> Para el campo magnético integramos numéricamente la ley de Biot–Savart, dividiendo el conductor en cientos de
> tramos. Las líneas de B son lazos cerrados, porque no existen monopolos magnéticos. En el hilo, la sonda coincide
> con la fórmula analítica con un error menor a una diezmilésima de porcentaje. El imán de barra se modela como
> corrientes equivalentes, y por eso su campo se parece al de un solenoide.

**5b. Módulo 9, Lorentz (5:45 – 6:40)**

**En pantalla:**
1. Caso Circular; activar "Comparar con Euler explícito" y esperar a que la espiral roja se abra.
2. Señalar la tabla "Teoría vs simulación" y la conservación de |v|.
3. Mostrar brevemente Selector de velocidades y Espectrómetro de masas (tabla con 12, 13 y 14 u).

**Narración:**
> Finalmente, la fuerza de Lorentz. Aquí elegimos con cuidado el integrador. Con el método de Euler, en rojo, la
> órbita se abre en espiral y la energía crece sin parar, lo cual es físicamente imposible porque el campo magnético
> no realiza trabajo. Con el método de Boris la órbita se mantiene cerrada: la rapidez se conserva a precisión de
> máquina y el radio y el período coinciden con la teoría. Con el mismo integrador simulamos el selector de
> velocidades y el espectrómetro de masas, que separa los isótopos del carbono y recupera sus masas.

---

### Escena 6 — Cómo está hecho y validación (6:40 – 7:30)

**En pantalla:**
1. VS Code con la carpeta `src/physics` abierta (3 segundos).
2. Terminal: ejecutar `npm test` y mostrar "108 passed".
3. Tabla de validación del informe (sección 5.2).

**Narración:**
> Usamos React, TypeScript y Three.js, y separamos toda la física en funciones puras, sin interfaz. Eso nos permitió
> probarla de forma automática: 108 pruebas comparan cada resultado con su solución analítica, y todas tienen un error
> menor al uno por ciento. Las pruebas también se ejecutan en GitHub antes de cada publicación.

---

### Escena 7 — Cierre (7:30 – 8:00)

**En pantalla:** página de inicio con la dirección web visible.

**Narración:**
> El simulador está publicado en esta dirección para que cualquier estudiante pueda usarlo. Nos permitió conectar lo
> que vimos en Física 2 con la programación y los métodos numéricos de nuestra carrera. Gracias por su atención.

---

## Si hay que recortar a 5 minutos

Quitar 2b (calculadora), 3a parte 3 (asociaciones), 4b (ley de Ohm) y el selector/espectrómetro de 5b, y reducir la
escena 6 a mostrar solo la tabla.
