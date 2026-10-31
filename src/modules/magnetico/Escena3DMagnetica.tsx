import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Escena3D from '../../components/Escena3D';
import { campoMagnetico, type FuenteMagnetica } from '../../physics/magnetism';
import type { Vec3 } from '../../physics/vector';
import { COLOR_NEGATIVO, COLOR_POSITIVO } from '../cargas/dibujo';
import { SEMILADO, type ParamsFuente } from './fuentes';

const COLOR_B = '#a855f7';
const ARRIBA = new THREE.Vector3(0, 1, 0);

/** Libera la geometría cuando cambia o se desmonta. */
function useDesechable<T extends { dispose: () => void }>(obj: T): T {
  useEffect(() => () => obj.dispose(), [obj]);
  return obj;
}

/** Conductor dibujado como tubo de cobre a lo largo de cada polilínea. */
function Conductor({ polilineas }: { polilineas: Vec3[][] }) {
  const geometrias = useMemo(
    () =>
      polilineas.map((p) => {
        const curva = new THREE.CurvePath<THREE.Vector3>();
        for (let i = 1; i < p.length; i++)
          curva.add(new THREE.LineCurve3(new THREE.Vector3(p[i - 1].x, p[i - 1].y, p[i - 1].z), new THREE.Vector3(p[i].x, p[i].y, p[i].z)));
        return new THREE.TubeGeometry(curva, Math.min(2000, (p.length - 1) * 2), 0.018, 8, false);
      }),
    [polilineas],
  );
  useEffect(() => () => geometrias.forEach((g) => g.dispose()), [geometrias]);
  return (
    <>
      {geometrias.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color="#d97706" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
    </>
  );
}

/** Puntos luminosos que recorren el conductor en el sentido de la corriente convencional. */
function FlujoCorriente({ polilineas, I }: { polilineas: Vec3[][]; I: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  // Longitudes acumuladas de cada polilínea para ubicar puntos por longitud de arco
  const tramos = useMemo(
    () =>
      polilineas.map((p) => {
        const acum = [0];
        for (let i = 1; i < p.length; i++) acum.push(acum[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z));
        return { p, acum, largo: acum[acum.length - 1] };
      }),
    [polilineas],
  );
  const separacion = 0.12;
  const total = tramos.reduce((s, t) => s + Math.floor(t.largo / separacion), 0);
  const fase = useRef(0);
  const aux = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    fase.current = (fase.current + dt * (0.15 + 0.04 * Math.abs(I))) % separacion;
    let k = 0;
    for (const { p, acum, largo } of tramos) {
      let j = 1;
      for (let s = fase.current; s < largo && k < total; s += separacion) {
        while (j < acum.length - 1 && acum[j] < s) j++;
        const t = (s - acum[j - 1]) / (acum[j] - acum[j - 1] || 1);
        aux.position.set(p[j - 1].x + t * (p[j].x - p[j - 1].x), p[j - 1].y + t * (p[j].y - p[j - 1].y), p[j - 1].z + t * (p[j].z - p[j - 1].z));
        aux.updateMatrix();
        m.setMatrixAt(k++, aux.matrix);
      }
    }
    m.count = k;
    m.instanceMatrix.needsUpdate = true;
  });

  if (total === 0) return null;
  return (
    <instancedMesh key={total} ref={ref} args={[undefined, undefined, total]}>
      <sphereGeometry args={[0.03, 8, 6]} />
      <meshBasicMaterial color="#fde047" />
    </instancedMesh>
  );
}

/** Líneas de campo B (violeta) con conos que indican su sentido. */
function LineasB({ lineas }: { lineas: Vec3[][] }) {
  const geometria = useDesechable(
    useMemo(() => {
      const pos: number[] = [];
      for (const l of lineas) for (let i = 1; i < l.length; i++) pos.push(l[i - 1].x, l[i - 1].y, l[i - 1].z, l[i].x, l[i].y, l[i].z);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      return g;
    }, [lineas]),
  );
  const conos = useMemo(() => {
    const c: { pos: [number, number, number]; quat: THREE.Quaternion }[] = [];
    for (const l of lineas)
      for (let i = 25; i < l.length - 1; i += 70) {
        const d = new THREE.Vector3(l[i + 1].x - l[i].x, l[i + 1].y - l[i].y, l[i + 1].z - l[i].z).normalize();
        c.push({ pos: [l[i].x, l[i].y, l[i].z], quat: new THREE.Quaternion().setFromUnitVectors(ARRIBA, d) });
      }
    return c;
  }, [lineas]);
  const cono = useDesechable(useMemo(() => new THREE.ConeGeometry(0.022, 0.07, 8), []));
  return (
    <>
      <lineSegments geometry={geometria}>
        <lineBasicMaterial color={COLOR_B} transparent opacity={0.85} />
      </lineSegments>
      {conos.map((c, i) => (
        <mesh key={i} geometry={cono} position={c.pos} quaternion={c.quat}>
          <meshBasicMaterial color="#d8b4fe" />
        </mesh>
      ))}
    </>
  );
}

/** Brújulas en el plano y = 0 orientadas según B; el color indica log|B|. */
function Brujulas({ fuente }: { fuente: FuenteMagnetica }) {
  const datos = useMemo(() => {
    const d: { pos: [number, number, number]; quat: THREE.Quaternion; color: string }[] = [];
    const n = 11;
    const muestras: { p: Vec3; B: Vec3; mag: number }[] = [];
    for (let i = 0; i < n; i++)
      for (let k = 0; k < n; k++) {
        const p = { x: -1.8 + (3.6 * i) / (n - 1), y: 0, z: -1.8 + (3.6 * k) / (n - 1) };
        const B = campoMagnetico(fuente, p, 0.05);
        muestras.push({ p, B, mag: Math.hypot(B.x, B.y, B.z) });
      }
    const logs = muestras.filter((m) => m.mag > 0).map((m) => Math.log10(m.mag));
    const lo = Math.min(...logs);
    const hi = Math.max(...logs);
    for (const { p, B, mag } of muestras) {
      if (mag === 0) continue;
      const t = hi > lo ? (Math.log10(mag) - lo) / (hi - lo) : 0.5;
      d.push({
        pos: [p.x, p.y, p.z],
        quat: new THREE.Quaternion().setFromUnitVectors(ARRIBA, new THREE.Vector3(B.x, B.y, B.z).normalize()),
        color: `hsl(${270 - 220 * t}, 85%, ${45 + 25 * t}%)`,
      });
    }
    return d;
  }, [fuente]);
  return (
    <>
      {datos.map((b, i) => (
        <mesh key={i} position={b.pos} quaternion={b.quat}>
          <coneGeometry args={[0.035, 0.16, 8]} />
          <meshBasicMaterial color={b.color} />
        </mesh>
      ))}
    </>
  );
}

/** Imán de barra: mitad norte (roja) arriba, sur (azul) abajo. */
function Iman({ R, L }: { R: number; L: number }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh position={[0, L / 4, 0]}>
        <cylinderGeometry args={[R, R, L / 2, 32]} />
        <meshStandardMaterial color={COLOR_POSITIVO} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, -L / 4, 0]}>
        <cylinderGeometry args={[R, R, L / 2, 32]} />
        <meshStandardMaterial color={COLOR_NEGATIVO} transparent opacity={0.55} />
      </mesh>
      <Html position={[0, L / 2 + 0.12, 0]} center>
        <span className="pointer-events-none select-none text-sm font-bold text-red-300">N</span>
      </Html>
      <Html position={[0, -L / 2 - 0.12, 0]} center>
        <span className="pointer-events-none select-none text-sm font-bold text-blue-300">S</span>
      </Html>
    </group>
  );
}

interface Props {
  params: ParamsFuente;
  polilineas: Vec3[][];
  fuente: FuenteMagnetica;
  lineas: Vec3[][];
  mostrarLineas: boolean;
  mostrarBrujulas: boolean;
  sonda: Vec3;
  /** B en la sonda [T] */
  Bsonda: Vec3;
  onSonda: (p: Vec3) => void;
}

export default function Escena3DMagnetica({ params, polilineas, fuente, lineas, mostrarLineas, mostrarBrujulas, sonda, Bsonda, onSonda }: Props) {
  const mag = Math.hypot(Bsonda.x, Bsonda.y, Bsonda.z);
  const flecha = useMemo(() => {
    const dir = mag > 0 ? new THREE.Vector3(Bsonda.x, Bsonda.y, Bsonda.z).normalize() : new THREE.Vector3(0, 0, 1);
    return new THREE.ArrowHelper(dir, new THREE.Vector3(sonda.x, sonda.y, sonda.z), 0.35, 0x22d3ee, 0.1, 0.06);
  }, [Bsonda, sonda, mag]);
  useEffect(() => () => flecha.dispose(), [flecha]);

  const alClic = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSonda({ x: Number(e.point.x.toFixed(3)), y: 0, z: Number(e.point.z.toFixed(3)) });
  };

  return (
    <Escena3D camara={[3.2, -3.6, 1.8]} ejes={false} alturaCuadricula={-SEMILADO}>
      {params.tipo === 'iman' ? <Iman R={params.R} L={params.L} /> : <Conductor polilineas={polilineas} />}
      {params.tipo !== 'iman' && <FlujoCorriente polilineas={polilineas} I={params.I} />}
      {mostrarLineas && <LineasB lineas={lineas} />}
      {mostrarBrujulas && <Brujulas fuente={fuente} />}

      {/* Plano y = 0 (contiene el eje): un clic coloca allí la sonda */}
      <mesh rotation={[Math.PI / 2, 0, 0]} onClick={alClic}>
        <planeGeometry args={[4.4, 4.4]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[sonda.x, sonda.y, sonda.z]}>
        <sphereGeometry args={[0.04, 16, 12]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      {mag > 0 && <primitive object={flecha} />}
    </Escena3D>
  );
}

