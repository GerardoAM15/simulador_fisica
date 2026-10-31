import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Dielectrico } from '../../physics/capacitor';
import { COLOR_NEGATIVO, COLOR_POSITIVO } from '../cargas/dibujo';

interface Props {
  /** Lado de las placas en unidades de la escena */
  lado: number;
  /** Separación entre placas en unidades de la escena */
  separacion: number;
  /** Fracción del dieléctrico insertada entre las placas (0–1) */
  fraccion: number;
  dielectrico: Dielectrico;
  /** Intensidad visual del campo (0–1, escala logarítmica de E) */
  intensidad: number;
  /** Puntos de carga por lado en cada placa (escala logarítmica de σ) */
  cargasPorLado: number;
}

const GROSOR = 0.04;
const N_LINEAS = 5;
const ABAJO = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1));

/** Puntos que viajan de la placa + a la − siguiendo E; su rapidez visual crece con |E|. */
function FlujoCampo({ lado, separacion, intensidad }: { lado: number; separacion: number; intensidad: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const porLinea = 3;
  const total = N_LINEAS * N_LINEAS * porLinea;
  const aux = useMemo(() => new THREE.Object3D(), []);
  const fase = useRef(0);

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    fase.current = (fase.current + dt * (0.15 + 0.6 * intensidad)) % 1;
    let k = 0;
    for (let i = 0; i < N_LINEAS; i++)
      for (let j = 0; j < N_LINEAS; j++)
        for (let p = 0; p < porLinea; p++) {
          const s = (fase.current + p / porLinea) % 1;
          aux.position.set((-0.5 + (i + 0.5) / N_LINEAS) * lado * 0.9, (-0.5 + (j + 0.5) / N_LINEAS) * lado * 0.9, separacion / 2 - s * separacion);
          aux.updateMatrix();
          m.setMatrixAt(k++, aux.matrix);
        }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} visible={intensidad > 0}>
      <sphereGeometry args={[0.014, 8, 6]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.35 + 0.65 * intensidad} />
    </instancedMesh>
  );
}

/** Líneas de campo verticales con una punta de flecha en el centro (E apunta de + a −). */
function LineasCampo({ lado, separacion, intensidad }: { lado: number; separacion: number; intensidad: number }) {
  const puntos = useMemo(() => {
    const p: { x: number; y: number }[] = [];
    for (let i = 0; i < N_LINEAS; i++)
      for (let j = 0; j < N_LINEAS; j++)
        p.push({ x: (-0.5 + (i + 0.5) / N_LINEAS) * lado * 0.9, y: (-0.5 + (j + 0.5) / N_LINEAS) * lado * 0.9 });
    return p;
  }, [lado]);

  const geometria = useMemo(() => {
    const pos: number[] = [];
    for (const { x, y } of puntos) pos.push(x, y, separacion / 2, x, y, -separacion / 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, [puntos, separacion]);
  useEffect(() => () => geometria.dispose(), [geometria]);

  if (intensidad <= 0) return null;
  return (
    <>
      <lineSegments geometry={geometria}>
        <lineBasicMaterial color="#fbbf24" transparent opacity={0.15 + 0.45 * intensidad} />
      </lineSegments>
      {puntos.map(({ x, y }, i) => (
        <mesh key={i} position={[x, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.025, 0.06, 8]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.3 + 0.6 * intensidad} />
        </mesh>
      ))}
    </>
  );
}

/** Cargas libres sobre la cara interna de una placa. */
function CargasPlaca({ lado, z, color, n }: { lado: number; z: number; color: string; n: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const aux = new THREE.Object3D();
    let k = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        aux.position.set((-0.5 + (i + 0.5) / n) * lado * 0.92, (-0.5 + (j + 0.5) / n) * lado * 0.92, z);
        aux.updateMatrix();
        m.setMatrixAt(k++, aux.matrix);
      }
    m.instanceMatrix.needsUpdate = true;
  }, [lado, z, n]);
  if (n <= 0) return null;
  return (
    <instancedMesh key={n} ref={ref} args={[undefined, undefined, n * n]}>
      <sphereGeometry args={[0.018, 8, 6]} />
      <meshBasicMaterial color={color} />
    </instancedMesh>
  );
}

/**
 * Bloque dieléctrico con dipolos moleculares. Fuera de las placas los dipolos están orientados al azar;
 * al entrar en el campo giran para alinearse con E (polarización).
 */
function BloqueDielectrico({ lado, separacion, fraccion, dielectrico, intensidad }: Omit<Props, 'cargasPorLado'>) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const nx = 7;
  const ny = 7;
  const nz = 2;
  const total = nx * ny * nz;
  const espesor = separacion * 0.94;
  const xBloque = lado * (1 - fraccion);

  const azar = useMemo(
    () =>
      Array.from({ length: total }, () =>
        new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28)),
      ),
    [total],
  );
  const actuales = useMemo(() => azar.map((q) => q.clone()), [azar]);
  const aux = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    let k = 0;
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++)
        for (let l = 0; l < nz; l++) {
          const x = xBloque + (-0.5 + (i + 0.5) / nx) * lado;
          const y = (-0.5 + (j + 0.5) / ny) * lado;
          const z = (-0.5 + (l + 0.5) / nz) * espesor;
          const dentro = Math.abs(x) < lado / 2 && intensidad > 0;
          actuales[k].slerp(dentro ? ABAJO : azar[k], Math.min(1, dt * 4));
          aux.position.set(x, y, z);
          aux.quaternion.copy(actuales[k]);
          aux.updateMatrix();
          m.setMatrixAt(k++, aux.matrix);
        }
    m.instanceMatrix.needsUpdate = true;
  });

  // Cargas ligadas en las caras del dieléctrico, solo en la zona entre las placas
  const anchoDentro = fraccion * lado;
  const xDentro = lado / 2 - anchoDentro / 2;
  const opacidadLigada = (1 - 1 / dielectrico.kappa) * 0.6 * Math.min(1, intensidad * 2);

  return (
    <group>
      <mesh position={[xBloque, 0, 0]}>
        <boxGeometry args={[lado, lado, espesor]} />
        <meshStandardMaterial color={dielectrico.color} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, total]}>
        <coneGeometry args={[0.025, Math.min(0.12, espesor * 0.35), 6]} />
        <meshStandardMaterial color="#f8fafc" />
      </instancedMesh>
      {anchoDentro > 0.001 && opacidadLigada > 0 && (
        <>
          {/* Cara superior frente a la placa +: carga ligada negativa; cara inferior: positiva */}
          <mesh position={[xDentro, 0, espesor / 2 + 0.002]}>
            <planeGeometry args={[anchoDentro, lado]} />
            <meshBasicMaterial color={COLOR_NEGATIVO} transparent opacity={opacidadLigada} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={[xDentro, 0, -espesor / 2 - 0.002]}>
            <planeGeometry args={[anchoDentro, lado]} />
            <meshBasicMaterial color={COLOR_POSITIVO} transparent opacity={opacidadLigada} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </>
      )}
    </group>
  );
}

/** Capacitor de placas paralelas horizontales: placa superior +, inferior −, E apunta hacia −z. */
export default function Capacitor3D(props: Props) {
  const { lado, separacion, intensidad, cargasPorLado, dielectrico } = props;
  const zSup = separacion / 2 + GROSOR / 2;
  return (
    <group>
      <mesh position={[0, 0, zSup]}>
        <boxGeometry args={[lado, lado, GROSOR]} />
        <meshStandardMaterial color={COLOR_POSITIVO} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, -zSup]}>
        <boxGeometry args={[lado, lado, GROSOR]} />
        <meshStandardMaterial color={COLOR_NEGATIVO} metalness={0.4} roughness={0.4} />
      </mesh>
      <CargasPlaca lado={lado} z={separacion / 2 - 0.01} color="#fecaca" n={cargasPorLado} />
      <CargasPlaca lado={lado} z={-separacion / 2 + 0.01} color="#bfdbfe" n={cargasPorLado} />
      <LineasCampo lado={lado} separacion={separacion} intensidad={intensidad} />
      <FlujoCampo lado={lado} separacion={separacion} intensidad={intensidad} />
      {dielectrico.kappa > 1 && <BloqueDielectrico {...props} />}
    </group>
  );
}
