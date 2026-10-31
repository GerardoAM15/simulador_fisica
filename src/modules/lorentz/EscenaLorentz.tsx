import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Escena3D from '../../components/Escena3D';
import type { IdCaso } from './casos';
import { MAX_PUNTOS, type SimulacionLorentz } from './simulacion';

const CAMARAS: Record<IdCaso, { camara: [number, number, number]; objetivo: [number, number, number] }> = {
  circular: { camara: [0, -4.5, 5.5], objetivo: [0, -1, 0] },
  helicoidal: { camara: [9, -10, 2], objetivo: [0, -1, 0] },
  deriva: { camara: [0, -9, 11], objetivo: [0, 0, 0] },
  selector: { camara: [0, -6, 8], objetivo: [0, 0, 0] },
  espectrometro: { camara: [1.4, -3.5, 5], objetivo: [1.4, 0.8, 0] },
};

/** Línea cuya geometría se llena incrementalmente con los puntos de una trayectoria. */
function LineaCreciente({ puntos, color, opacidad = 1 }: { puntos: () => { x: number; y: number; z: number }[]; color: string; opacidad?: number }) {
  const geometria = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_PUNTOS * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);
  useEffect(() => () => geometria.dispose(), [geometria]);
  const escritos = useRef(0);

  useFrame(() => {
    const p = puntos();
    const attr = geometria.getAttribute('position') as THREE.BufferAttribute;
    if (p.length < escritos.current) escritos.current = 0; // se reinició la simulación
    for (let i = escritos.current; i < p.length; i++) attr.setXYZ(i, p[i].x, p[i].y, p[i].z);
    if (p.length !== escritos.current) {
      attr.needsUpdate = true;
      geometria.setDrawRange(0, p.length);
      geometria.computeBoundingSphere();
      escritos.current = p.length;
    }
  });

  const linea = useMemo(() => new THREE.Line(geometria, new THREE.LineBasicMaterial({ color, transparent: opacidad < 1, opacity: opacidad })), [geometria, color, opacidad]);
  return <primitive object={linea} />;
}

/** Flechas fijas que indican la dirección de un campo uniforme. */
function FlechasCampo({ dir, color, posiciones, largo }: { dir: [number, number, number]; color: number; posiciones: [number, number, number][]; largo: number }) {
  const flechas = useMemo(
    () => posiciones.map((p) => new THREE.ArrowHelper(new THREE.Vector3(...dir).normalize(), new THREE.Vector3(...p), largo, color, 0.25, 0.14)),
    [dir, color, posiciones, largo],
  );
  useEffect(() => () => flechas.forEach((f) => f.dispose()), [flechas]);
  return (
    <>
      {flechas.map((f, i) => (
        <primitive key={i} object={f} />
      ))}
    </>
  );
}

interface Props {
  sim: MutableRefObject<SimulacionLorentz>;
  caso: IdCaso;
  corriendo: boolean;
  pasosPorCuadro: number;
  hayE: boolean;
  /** Cambia cada vez que se crea una simulación nueva (reinicia trayectorias y partículas) */
  idSim: number;
  /** Se llama periódicamente para refrescar el panel */
  onTick: () => void;
}

/** Avanza la simulación dentro del bucle de render de Three.js y dibuja trayectorias y partículas. */
function Simulacion({ sim, corriendo, pasosPorCuadro, onTick }: Omit<Props, 'caso' | 'hayE' | 'idSim'>) {
  const esferas = useRef<(THREE.Mesh | null)[]>([]);
  const cuadro = useRef(0);
  const particulas = sim.current.particulas;

  useFrame(() => {
    const s = sim.current;
    if (corriendo && !s.terminada) {
      for (let k = 0; k < pasosPorCuadro; k++) s.paso();
      if (++cuadro.current % 6 === 0 || s.terminada) onTick();
    }
    s.particulas.forEach((p, i) => {
      const e = esferas.current[i];
      if (e) e.position.set(p.r.x / s.esc.escala, p.r.y / s.esc.escala, p.r.z / s.esc.escala);
    });
  });

  return (
    <>
      {particulas.map((p, i) => (
        <group key={i}>
          <LineaCreciente puntos={() => sim.current.particulas[i]?.tray ?? []} color={p.cfg.color} />
          {p.euler && <LineaCreciente puntos={() => sim.current.particulas[i]?.euler?.tray ?? []} color="#ef4444" opacidad={0.8} />}
          <mesh ref={(m) => (esferas.current[i] = m)}>
            <sphereGeometry args={[0.1, 16, 12]} />
            <meshStandardMaterial color={p.cfg.color} emissive={p.cfg.color} emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default function EscenaLorentz(props: Props) {
  const { caso, hayE, idSim, ...resto } = props;
  const { camara, objetivo } = CAMARAS[caso];
  const posB = useMemo<[number, number, number][]>(() => {
    const p: [number, number, number][] = [];
    for (const x of [-4, 4]) for (const y of [-4, 4]) p.push([x + (caso === 'espectrometro' ? 1.4 : 0), y, caso === 'helicoidal' ? -6 : -0.8]);
    return p;
  }, [caso]);
  const posE = useMemo<[number, number, number][]>(() => [-3, 0, 3].map((x) => [x, -1.6, 0.6]), []);

  return (
    <Escena3D camara={camara} objetivo={objetivo} ejes={false} cuadricula={[24, 24]} alturaCuadricula={caso === 'helicoidal' ? -6.5 : -0.01}>
      <Simulacion key={idSim} {...resto} />
      <FlechasCampo dir={[0, 0, 1]} color={0xa855f7} posiciones={posB} largo={caso === 'helicoidal' ? 12 : 1.6} />
      {hayE && <FlechasCampo dir={[0, 1, 0]} color={0xfbbf24} posiciones={posE} largo={1.2} />}
      {caso === 'selector' && (
        <>
          {/* Placas del selector: la inferior es + (E apunta hacia +y) y la rendija de salida en x = 5 */}
          <mesh position={[0, -1.55, 0]}>
            <boxGeometry args={[10, 0.08, 0.6]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <boxGeometry args={[10, 0.08, 0.6]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          <mesh position={[5.05, 0.85, 0]}>
            <boxGeometry args={[0.08, 1.4, 0.6]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[5.05, -0.85, 0]}>
            <boxGeometry args={[0.08, 1.4, 0.6]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </>
      )}
      {caso === 'espectrometro' && (
        <mesh position={[1.6, -0.05, 0]}>
          <boxGeometry args={[2.6, 0.06, 0.4]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      )}
    </Escena3D>
  );
}
