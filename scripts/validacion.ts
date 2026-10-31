/**
 * Genera la tabla de validación del informe técnico: valor analítico vs valor obtenido con el
 * código de src/physics, con su error porcentual.
 *
 *   npm run validacion            → imprime la tabla en Markdown
 *   npm run validacion > tabla.md → la guarda en un archivo
 */
import { CARGA_ELEMENTAL, K_COULOMB, MASA_ELECTRON, MASA_PROTON, MICRO, MU_0 } from '../src/physics/constants';
import { campoElectrico, campoYPotencial, potencialElectrico, potencialEn } from '../src/physics/electrostatics';
import { isolinea, muestrearMalla } from '../src/physics/equipotential';
import { isosuperficie, muestrearMalla3D } from '../src/physics/isosurface';
import { derivadaParticulaCampoE, integrarRK4, pasoBoris, pasoEulerLorentz, pasoRK4, pasoTemporalAdaptativo } from '../src/physics/integrators';
import { respuestaRC } from '../src/physics/capacitor';
import { resolverCircuito, type Rama } from '../src/physics/circuits';
import {
  campoDipolo,
  campoEspiraEje,
  campoHiloInfinito,
  campoMagnetico,
  campoSolenoideEje,
  crearFuente,
  geometriaEspira,
  geometriaHilo,
  geometriaSolenoide,
  periodoCiclotron,
  radioCiclotron,
} from '../src/physics/magnetism';
import { crearEscenario } from '../src/modules/lorentz/casos';
import { SimulacionLorentz } from '../src/modules/lorentz/simulacion';
import { norma3, type Vec3 } from '../src/physics/vector';

interface Fila {
  unidad: string;
  caso: string;
  magnitud: string;
  analitico: number;
  simulado: number;
  unidadSI: string;
  metodo: string;
}

const filas: Fila[] = [];
const agregar = (f: Fila) => filas.push(f);

// ─────────────────── Unidad 1 ───────────────────
{
  const q = 2 * MICRO;
  const r = 0.5;
  agregar({ unidad: 'U1', caso: 'Carga puntual (2 μC, r = 0.5 m)', magnitud: '|E|', analitico: (K_COULOMB * q) / r ** 2, simulado: norma3(campoElectrico([{ q, x: 0, y: 0, z: 0 }], { x: r, y: 0, z: 0 })), unidadSI: 'N/C', metodo: 'Superposición' });

  const a = 0.05;
  const x = 0.4;
  const { E } = campoYPotencial([{ q, x: a, y: 0, z: 0 }, { q: -q, x: -a, y: 0, z: 0 }], { x, y: 0, z: 0 });
  agregar({ unidad: 'U1', caso: 'Dipolo en el eje (x = 0.4 m)', magnitud: 'E', analitico: (K_COULOMB * q * 4 * a * x) / (x * x - a * a) ** 2, simulado: E.x, unidadSI: 'N/C', metodo: 'Superposición' });

  // Equipotencial: radio medio de los puntos de la curva V = V0
  const r0 = 0.5;
  const V0 = (K_COULOMB * MICRO) / r0;
  const cargas = [{ q: MICRO, x: 0, y: 0, z: 0 }];
  const segs = isolinea(muestrearMalla((x, y) => potencialEn(cargas, x, y, 0), -1, -1, 1, 1, 161, 161), V0);
  const rMedio = segs.reduce((s, [x1, y1]) => s + Math.hypot(x1, y1), 0) / segs.length;
  agregar({ unidad: 'U1', caso: 'Equipotencial de carga puntual', magnitud: 'radio', analitico: r0, simulado: rMedio, unidadSI: 'm', metodo: 'Marching squares' });

  const r3 = 0.6;
  const iso = isosuperficie(
    muestrearMalla3D((x, y, z) => potencialEn(cargas, x, y, z), { x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 }, 41, 41, 41),
    (K_COULOMB * MICRO) / r3,
  );
  let suma = 0;
  const nv = iso.posiciones.length / 3;
  for (let i = 0; i < nv; i++) suma += Math.hypot(iso.posiciones[3 * i], iso.posiciones[3 * i + 1], iso.posiciones[3 * i + 2]);
  agregar({ unidad: 'U1', caso: 'Superficie equipotencial 3D', magnitud: 'radio', analitico: r3, simulado: suma / nv, unidadSI: 'm', metodo: 'Surface nets' });

  // Electrón en campo uniforme: desviación vertical tras 2·10⁻⁷ s
  const Eu = { x: 0, y: 200, z: 0 };
  const f = derivadaParticulaCampoE(-CARGA_ELEMENTAL, MASA_ELECTRON, () => Eu);
  const { t, y } = integrarRK4(f, 0, [-1, 0, 0, 1e7, 0, 0], 1e-10, 2000);
  const n = t.length - 1;
  agregar({ unidad: 'U1', caso: 'Electrón en E uniforme (t = 0.2 μs)', magnitud: 'y (parábola)', analitico: 0.5 * ((-CARGA_ELEMENTAL * Eu.y) / MASA_ELECTRON) * t[n] ** 2, simulado: y[n][1], unidadSI: 'm', metodo: 'RK4' });

  // Protón dispersado por una carga positiva: energía final vs inicial
  const fuente = [{ q: 2 * MICRO, x: 0, y: 0, z: 0 }];
  const fp = derivadaParticulaCampoE(CARGA_ELEMENTAL, MASA_PROTON, (p) => campoElectrico(fuente, p));
  const energia = (s: readonly number[]) => 0.5 * MASA_PROTON * (s[3] ** 2 + s[4] ** 2) + CARGA_ELEMENTAL * potencialElectrico(fuente, { x: s[0], y: s[1], z: 0 });
  let s = [-1, 0.1, 0, 3e6, 0, 0];
  const E0 = energia(s);
  let tt = 0;
  for (let i = 0; i < 20000 && Math.hypot(s[0], s[1]) < 1.5; i++) {
    const d = fp(tt, s);
    const dt = pasoTemporalAdaptativo(Math.hypot(s[3], s[4]), Math.hypot(d[3], d[4]), 0.002);
    s = pasoRK4(fp, tt, s, dt);
    tt += dt;
  }
  agregar({ unidad: 'U1', caso: 'Protón dispersado (conservación)', magnitud: 'K + qV', analitico: E0, simulado: energia(s), unidadSI: 'J', metodo: 'RK4 adaptativo' });
}

// ─────────────────── Unidad 2 ───────────────────
{
  const [R, C, V] = [1000, 100e-6, 10];
  const tau = R * C;
  const { y } = integrarRK4((_t, q) => [(V - q[0] / C) / R], 0, [0], 1e-3, 100);
  agregar({ unidad: 'U2', caso: 'Carga RC (R = 1 kΩ, C = 100 μF)', magnitud: 'Q(τ)', analitico: respuestaRC(tau, R, C, V, 0, true).Q, simulado: y[100][0], unidadSI: 'C', metodo: 'RK4' });

  // Calor disipado en R al cargar: integral numérica de I²R
  const n = 20000;
  const dt = (20 * tau) / n;
  let calor = 0;
  for (let i = 0; i < n; i++) {
    const I1 = respuestaRC(i * dt, R, C, V, 0, true).I;
    const I2 = respuestaRC((i + 1) * dt, R, C, V, 0, true).I;
    calor += 0.5 * (I1 * I1 + I2 * I2) * R * dt;
  }
  agregar({ unidad: 'U2', caso: 'Energía disipada al cargar', magnitud: '∫I²R dt', analitico: 0.5 * C * V * V, simulado: calor, unidadSI: 'J', metodo: 'Trapecio' });

  const r = resolverCircuito(3, [
    { id: 'V', tipo: 'V', a: 1, b: 0, valor: 12 },
    { id: 'C1', tipo: 'C', a: 1, b: 2, valor: 10e-6 },
    { id: 'C2', tipo: 'C', a: 2, b: 0, valor: 20e-6 },
  ]);
  if (r.ok) agregar({ unidad: 'U2', caso: 'Capacitores en serie 10 y 20 μF (12 V)', magnitud: 'V₁', analitico: 8, simulado: r.ramas[1].voltaje, unidadSI: 'V', metodo: 'MNA' });
}

// ─────────────────── Unidad 3 ───────────────────
{
  const R_ = (id: string, a: number, b: number, valor: number): Rama => ({ id, tipo: 'R', a, b, valor });
  const V_ = (a: number, b: number, valor: number): Rama => ({ id: 'V', tipo: 'V', a, b, valor });
  const casos: [string, number, Rama[], string, number][] = [
    ['Serie 12 V, 2 Ω + 4 Ω', 3, [V_(1, 0, 12), R_('R1', 1, 2, 2), R_('R2', 2, 0, 4)], 'R1', 2],
    ['Paralelo 12 V, 3 Ω ∥ 6 Ω', 2, [V_(1, 0, 12), R_('R1', 1, 0, 3), R_('R2', 1, 0, 6)], 'R2', 2],
    ['Mixto 12 V, 2 Ω + (6 Ω ∥ 3 Ω)', 3, [V_(1, 0, 12), R_('R1', 1, 2, 2), R_('R2', 2, 0, 6), R_('R3', 2, 0, 3)], 'R3', 2],
  ];
  for (const [nombre, n, ramas, id, I] of casos) {
    const r = resolverCircuito(n, ramas);
    if (r.ok) agregar({ unidad: 'U3', caso: nombre, magnitud: `I(${id})`, analitico: I, simulado: r.ramas[ramas.findIndex((x) => x.id === id)].corriente, unidadSI: 'A', metodo: 'MNA + Gauss' });
  }
  const [R1, R2, R3, R4, Rg, E] = [100, 200, 100, 100, 50, 10];
  const ramas = [V_(1, 0, E), R_('R1', 1, 2, R1), R_('R2', 2, 0, R2), R_('R3', 1, 3, R3), R_('R4', 3, 0, R4), R_('Rg', 2, 3, Rg)];
  const r = resolverCircuito(4, ramas);
  const Vth = E * (R2 / (R1 + R2) - R4 / (R3 + R4));
  const Rth = (R1 * R2) / (R1 + R2) + (R3 * R4) / (R3 + R4);
  if (r.ok) agregar({ unidad: 'U3', caso: 'Wheatstone desequilibrado', magnitud: 'I galvanómetro', analitico: Vth / (Rth + Rg), simulado: r.ramas[5].corriente, unidadSI: 'A', metodo: 'MNA vs Thévenin' });
}

// ─────────────────── Unidad 4 ───────────────────
{
  const I = 10;
  const hilo = crearFuente(geometriaHilo(40, 4000), I);
  agregar({ unidad: 'U4', caso: 'Hilo recto (r = 0.1 m)', magnitud: '|B|', analitico: campoHiloInfinito(I, 0.1), simulado: norma3(campoMagnetico(hilo, { x: 0.1, y: 0, z: 0 })), unidadSI: 'T', metodo: 'Biot–Savart' });

  const R = 0.2;
  const espira = crearFuente([geometriaEspira(R, 200)], I);
  agregar({ unidad: 'U4', caso: 'Espira, centro (R = 0.2 m)', magnitud: 'B', analitico: (MU_0 * I) / (2 * R), simulado: campoMagnetico(espira, { x: 0, y: 0, z: 0 }).z, unidadSI: 'T', metodo: 'Biot–Savart' });
  agregar({ unidad: 'U4', caso: 'Espira, eje (z = 0.3 m)', magnitud: 'B', analitico: campoEspiraEje(I, R, 0.3), simulado: campoMagnetico(espira, { x: 0, y: 0, z: 0.3 }).z, unidadSI: 'T', metodo: 'Biot–Savart' });

  const sol = crearFuente(geometriaSolenoide(0.1, 1, 50, 64), 2);
  agregar({ unidad: 'U4', caso: 'Solenoide N = 50, L = 1 m (centro)', magnitud: 'B', analitico: campoSolenoideEje(50, 2, 1, 0.1, 0), simulado: campoMagnetico(sol, { x: 0, y: 0, z: 0 }).z, unidadSI: 'T', metodo: 'Biot–Savart' });

  const Rp = 0.01;
  const pequena = crearFuente([geometriaEspira(Rp, 200)], 3);
  const p: Vec3 = { x: 0.4, y: 0.1, z: 0.3 };
  agregar({ unidad: 'U4', caso: 'Espira pequeña lejos (dipolo)', magnitud: '|B|', analitico: norma3(campoDipolo({ x: 0, y: 0, z: 3 * Math.PI * Rp * Rp }, p)), simulado: norma3(campoMagnetico(pequena, p)), unidadSI: 'T', metodo: 'Biot–Savart' });

  let circ = 0;
  const n = 200;
  for (let k = 0; k < n; k++) {
    const t = (2 * Math.PI * (k + 0.5)) / n;
    const B = campoMagnetico(hilo, { x: 0.15 * Math.cos(t), y: 0.15 * Math.sin(t), z: 0.3 });
    circ += (B.x * -Math.sin(t) + B.y * Math.cos(t)) * ((2 * Math.PI * 0.15) / n);
  }
  agregar({ unidad: 'U4', caso: 'Ley de Ampère alrededor del hilo', magnitud: '∮B·dl', analitico: MU_0 * I, simulado: circ, unidadSI: 'T·m', metodo: 'Biot–Savart' });

  // Lorentz con Boris (protón, B = 0.1 T, v = 10⁶ m/s)
  const base = { caso: 'circular' as const, particula: 'proton' as const, B: 0.1, E: 2e4, v0: 1e6, angulo: 60 };
  const circular = new SimulacionLorentz(crearEscenario(base));
  for (let i = 0; i < 300; i++) circular.paso();
  const pc = circular.particulas[0];
  agregar({ unidad: 'U4', caso: 'Movimiento circular (protón)', magnitud: 'radio r', analitico: radioCiclotron(MASA_PROTON, 1e6, CARGA_ELEMENTAL, 0.1), simulado: SimulacionLorentz.radioMedido(pc)!, unidadSI: 'm', metodo: 'Boris' });
  agregar({ unidad: 'U4', caso: 'Movimiento circular (protón)', magnitud: 'período T', analitico: periodoCiclotron(MASA_PROTON, CARGA_ELEMENTAL, 0.1), simulado: pc.periodo!, unidadSI: 's', metodo: 'Boris' });

  const helice = new SimulacionLorentz(crearEscenario({ ...base, caso: 'helicoidal' }));
  for (let i = 0; i < 200; i++) helice.paso();
  agregar({ unidad: 'U4', caso: 'Hélice (60°)', magnitud: 'paso p', analitico: 1e6 * Math.cos(Math.PI / 3) * periodoCiclotron(MASA_PROTON, CARGA_ELEMENTAL, 0.1), simulado: helice.particulas[0].desplazamientoVuelta!.z, unidadSI: 'm', metodo: 'Boris' });

  const deriva = new SimulacionLorentz(crearEscenario({ ...base, caso: 'deriva' }));
  for (let i = 0; i < 600; i++) deriva.paso();
  agregar({ unidad: 'U4', caso: 'Deriva E×B (E = 20 kV/m)', magnitud: 'v_d', analitico: 2e4 / 0.1, simulado: SimulacionLorentz.derivaMedida(deriva.particulas[0])!, unidadSI: 'm/s', metodo: 'Boris' });

  const espectro = new SimulacionLorentz(crearEscenario({ ...base, caso: 'espectrometro', v0: 1e5 }));
  for (let i = 0; i < 50000 && !espectro.terminada; i++) espectro.paso();
  const c14 = espectro.particulas[2];
  agregar({ unidad: 'U4', caso: 'Espectrómetro (¹⁴C⁺)', magnitud: 'masa m = qBr/v', analitico: c14.cfg.m, simulado: (CARGA_ELEMENTAL * 0.1 * (c14.final!.x / 2)) / 1e5, unidadSI: 'kg', metodo: 'Boris' });

  // Conservación de |v| en B puro: Boris vs Euler (20 pasos por vuelta)
  const T = periodoCiclotron(MASA_PROTON, CARGA_ELEMENTAL, 0.1);
  const B = { x: 0, y: 0, z: 0.1 };
  const E0 = { x: 0, y: 0, z: 0 };
  let b = { r: { x: 0, y: 0, z: 0 }, v: { x: 1e6, y: 0, z: 0 } };
  let e = { ...b };
  for (let i = 0; i < 1000 * 20; i++) b = pasoBoris(b.r, b.v, CARGA_ELEMENTAL / MASA_PROTON, E0, B, T / 20);
  for (let i = 0; i < 5 * 20; i++) e = pasoEulerLorentz(e.r, e.v, CARGA_ELEMENTAL / MASA_PROTON, E0, B, T / 20);
  agregar({ unidad: 'U4', caso: 'B puro, 1000 vueltas (Boris)', magnitud: '|v|', analitico: 1e6, simulado: norma3(b.v), unidadSI: 'm/s', metodo: 'Boris' });
  agregar({ unidad: 'U4', caso: 'B puro, 5 vueltas (Euler explícito)', magnitud: '|v|', analitico: 1e6, simulado: norma3(e.v), unidadSI: 'm/s', metodo: 'Euler' });
}

// ─────────────────── Salida ───────────────────
const num = (x: number) => (x !== 0 && (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e4) ? x.toExponential(4) : Number(x.toPrecision(6)).toString());
const err = (a: number, s: number) => {
  const e = (100 * Math.abs(s - a)) / Math.abs(a);
  return e === 0 ? '0' : e < 1e-6 ? '< 10⁻⁶' : Number(e.toPrecision(2)).toString();
};

console.log('| # | Unidad | Caso | Magnitud | Analítico | Simulado | Unidad SI | Método | Error (%) |');
console.log('|---|---|---|---|---|---|---|---|---|');
filas.forEach((f, i) =>
  console.log(`| ${i + 1} | ${f.unidad} | ${f.caso} | ${f.magnitud.replace(/\|/g, '\\|')} | ${num(f.analitico)} | ${num(f.simulado)} | ${f.unidadSI} | ${f.metodo} | ${err(f.analitico, f.simulado)} |`),
);
