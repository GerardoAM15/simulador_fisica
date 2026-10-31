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
  /** Fase del plan de desarrollo en la que se implementa */
  fase: number;
  /** Ícono corto (emoji) para tarjetas y menú */
  icono: string;
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
    fase: 1,
    icono: '⊕',
  },
  {
    id: 2,
    unidad: 1,
    titulo: 'Calculadora de potencial',
    ruta: 'potencial',
    descripcion: 'V, |E| y sus componentes en cualquier punto; trabajo W = q(V_A − V_B).',
    fase: 1,
    icono: 'V',
  },
  {
    id: 3,
    unidad: 1,
    titulo: 'Trayectoria en campo eléctrico',
    ruta: 'trayectoria-electrica',
    descripcion: 'Partícula cargada integrada con RK4 y verificación de conservación de energía.',
    fase: 1,
    icono: '↝',
  },
  {
    id: 4,
    unidad: 2,
    titulo: 'Simulador de capacitores',
    ruta: 'capacitores',
    descripcion: 'Placas paralelas en 3D con dieléctricos, C, Q, E, σ y asociaciones serie/paralelo.',
    fase: 2,
    icono: '⊣⊢',
  },
  {
    id: 5,
    unidad: 2,
    titulo: 'Energía almacenada y circuito RC',
    ruta: 'energia',
    descripcion: 'U = ½CV², densidad de energía y curvas de carga/descarga con τ = RC.',
    fase: 2,
    icono: 'U',
  },
  {
    id: 6,
    unidad: 3,
    titulo: 'Simulador de circuitos',
    ruta: 'circuitos',
    descripcion: 'Editor visual resuelto con Análisis Nodal Modificado y verificación de Kirchhoff.',
    fase: 3,
    icono: '⏚',
  },
  {
    id: 7,
    unidad: 3,
    titulo: 'Ley de Ohm y resistividad',
    ruta: 'ley-ohm',
    descripcion: 'I = V/R, gráfica V–I, potencia y R = ρL/A para distintos materiales.',
    fase: 3,
    icono: 'Ω',
  },
  {
    id: 8,
    unidad: 4,
    titulo: 'Campo magnético 3D',
    ruta: 'campo-magnetico',
    descripcion: 'Hilo, espira, solenoide e imán: líneas de B por Biot–Savart numérico.',
    fase: 4,
    icono: 'B',
  },
  {
    id: 9,
    unidad: 4,
    titulo: 'Fuerza de Lorentz',
    ruta: 'lorentz',
    descripcion: 'F = q(E + v×B) con integrador de Boris: ciclotrón, hélice, deriva E×B y espectrómetro.',
    fase: 4,
    icono: '⟳',
  },
];

export function modulosDeUnidad(numero: number): Modulo[] {
  return MODULOS.filter((m) => m.unidad === numero);
}
