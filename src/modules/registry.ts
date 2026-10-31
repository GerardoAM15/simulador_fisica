/**
 * Registro central de unidades y módulos del simulador.
 * El menú lateral, la página de inicio y el router se generan a partir de aquí.
 */

export interface Unidad {
  numero: number;
  titulo: string;
}

export interface Modulo {
  id: number;
  unidad: number;
  titulo: string;
  ruta: string;
  descripcion: string;
  /** Ícono corto para tarjetas y menú */
  icono: string;
  /** Pasos de uso que se muestran en la ventana de teoría */
  instrucciones: string[];
}

export const UNIDADES: Unidad[] = [
  { numero: 1, titulo: 'Electricidad, Campo y Potencial Eléctrico' },
  { numero: 2, titulo: 'Capacitores y Dieléctricos' },
  { numero: 3, titulo: 'Corriente Eléctrica y Ley de Ohm' },
  { numero: 4, titulo: 'Fuerza y Campo Magnético' },
];

export const MODULOS: Modulo[] = [
  {
    id: 1,
    unidad: 1,
    titulo: 'Visualizador de cargas puntuales',
    ruta: 'cargas',
    descripcion: 'Líneas de campo, equipotenciales y mapa de potencial de hasta 10 cargas, en 2D y 3D.',
    icono: '⊕',
    instrucciones: [
      'Arrastra las cargas para moverlas; doble clic en un espacio vacío agrega una carga.',
      'Haz clic en una carga para editar su valor (μC) o elimínala con Supr.',
      'Activa o desactiva capas: líneas de campo, equipotenciales, mapa de potencial y vectores E.',
      'Cambia a la vista 3D para ver las líneas en el espacio y las superficies equipotenciales.',
    ],
  },
  {
    id: 2,
    unidad: 1,
    titulo: 'Calculadora de potencial',
    ruta: 'potencial',
    descripcion: 'V, |E| y sus componentes en cualquier punto; trabajo W = q(V_A − V_B).',
    icono: 'V',
    instrucciones: [
      'Haz clic en el lienzo para colocar el punto A y luego el punto B.',
      'El panel muestra V, |E| y sus componentes en A, y cuánto aporta cada carga.',
      'Ajusta la carga de prueba q para calcular el trabajo W = q(V_A − V_B).',
      'Las cargas se pueden arrastrar aquí mismo; los resultados se actualizan al instante.',
    ],
  },
  {
    id: 3,
    unidad: 1,
    titulo: 'Trayectoria en campo eléctrico',
    ruta: 'trayectoria-electrica',
    descripcion: 'Partícula cargada integrada con RK4 y verificación de conservación de energía.',
    icono: '↝',
    instrucciones: [
      'Elige el campo: uniforme (magnitud y dirección) o el de las cargas del módulo 1.',
      'Elige la partícula y ajusta su posición (clic en el lienzo), rapidez y ángulo de lanzamiento.',
      'Pulsa Play: la gráfica muestra K, U y la energía total, que debe mantenerse constante.',
      'En campo uniforme se compara la posición simulada con la parábola analítica.',
    ],
  },
  {
    id: 4,
    unidad: 2,
    titulo: 'Simulador de capacitores',
    ruta: 'capacitores',
    descripcion: 'Placas paralelas en 3D con dieléctricos, C, Q, E, σ y asociaciones serie/paralelo.',
    icono: '⊣⊢',
    instrucciones: [
      'Ajusta el área, la separación y el voltaje del capacitor de placas paralelas.',
      'Elige un dieléctrico y pulsa Insertar: observa cómo se alinean sus dipolos con E.',
      'Compara los modos con batería (V constante) y aislado (Q constante).',
      'En la pestaña Serie / paralelo arma asociaciones de hasta 4 capacitores.',
    ],
  },
  {
    id: 5,
    unidad: 2,
    titulo: 'Energía almacenada y circuito RC',
    ruta: 'energia',
    descripcion: 'U = ½CV², densidad de energía y curvas de carga/descarga con τ = RC.',
    icono: 'U',
    instrucciones: [
      'Ajusta R, C y la fuente ε; τ = RC fija la rapidez del proceso.',
      'Pulsa Play para cargar el capacitor (posición A del interruptor).',
      'Cambia a B en cualquier momento para descargarlo a través de R.',
      'Revisa el balance de energía y la densidad de energía en el panel.',
    ],
  },
  {
    id: 6,
    unidad: 3,
    titulo: 'Simulador de circuitos',
    ruta: 'circuitos',
    descripcion: 'Editor visual resuelto con Análisis Nodal Modificado y verificación de Kirchhoff.',
    icono: '⏚',
    instrucciones: [
      'Elige una herramienta y haz clic en la grilla para colocar componentes; con Cable, arrastra de un punto a otro.',
      'Con Seleccionar: clic para elegir, arrastrar para mover, R para rotar, Supr para eliminar.',
      'Doble clic sobre un interruptor lo abre o cierra.',
      'El panel muestra V, I y P de cada elemento y verifica las leyes de Kirchhoff.',
    ],
  },
  {
    id: 7,
    unidad: 3,
    titulo: 'Ley de Ohm y resistividad',
    ruta: 'ley-ohm',
    descripcion: 'I = V/R, gráfica V–I, potencia y R = ρL/A para distintos materiales.',
    icono: 'Ω',
    instrucciones: [
      'Mueve los sliders de V y R: I = V/R se actualiza en el circuito y en la gráfica V–I.',
      'La gráfica de potencia muestra la parábola P = I²R con el punto de operación.',
      'En Resistencia de un conductor elige material, longitud, diámetro y temperatura.',
      'Usa el botón para llevar esa resistencia al circuito.',
    ],
  },
  {
    id: 8,
    unidad: 4,
    titulo: 'Campo magnético 3D',
    ruta: 'campo-magnetico',
    descripcion: 'Hilo, espira, solenoide e imán: líneas de B por Biot–Savart numérico.',
    icono: 'B',
    instrucciones: [
      'Elige la fuente: hilo, espira, solenoide o imán, y ajusta sus parámetros.',
      'Arrastra para rotar la vista y usa la rueda para acercar.',
      'Haz clic en el plano vertical para ubicar la sonda y comparar Biot–Savart con la fórmula analítica.',
      'Activa las brújulas para ver la dirección de B en un plano.',
    ],
  },
  {
    id: 9,
    unidad: 4,
    titulo: 'Fuerza de Lorentz',
    ruta: 'lorentz',
    descripcion: 'F = q(E + v×B) con integrador de Boris: ciclotrón, hélice, deriva E×B y espectrómetro.',
    icono: '⟳',
    instrucciones: [
      'Elige un caso: circular, helicoidal, deriva E×B, selector de velocidades o espectrómetro.',
      'Ajusta B, E, la rapidez o la partícula; la simulación se reinicia sola.',
      'Compara r, T y las demás magnitudes teóricas con las medidas en la simulación.',
      'En los casos circular y helicoidal activa Euler para ver por qué se usa el método de Boris.',
    ],
  },
];

export function modulosDeUnidad(numero: number): Modulo[] {
  return MODULOS.filter((m) => m.unidad === numero);
}
