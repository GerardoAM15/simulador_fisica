import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import Escena3D from '../../components/Escena3D';
import { MICRO } from '../../physics/constants';
import { potencialEn, type CargaPuntual } from '../../physics/electrostatics';
import { lineasCampoElectrico } from '../../physics/fieldLines';
import { isosuperficie, muestrearMalla3D } from '../../physics/isosurface';
import { COLOR_NEGATIVO, COLOR_POSITIVO } from './dibujo';

interface Props {
  cargas: readonly CargaPuntual[];
  lineasPorMicroC: number;
  mostrarLineas: boolean;
  mostrarIso: boolean;
  /** Superficies V = ±nivelIso [V] */
  nivelIso: number;
}

const L = 2; // semilado de la región de cálculo [m]

/** Libera la geometría de Three.js cuando deja de usarse. */
function useGeometria(crear: () => THREE.BufferGeometry | null, deps: unknown[]) {
  // `crear` cambia en cada render; la geometría solo se recrea cuando cambian `deps`
  const g = useMemo(crear, deps);
  useEffect(() => () => g?.dispose(), [g]);
  return g;
}

function LineasCampo3D({ cargas, lineasPorMicroC }: { cargas: readonly CargaPuntual[]; lineasPorMicroC: number }) {
  const lineas = useMemo(
    () =>
      lineasCampoElectrico(cargas, {
        dimension: 3,
        lineasPorMicroC,
        paso: 0.02,
        maxPasos: 1500,
        radioInicio: 0.06,
        limites: { min: { x: -L, y: -L, z: -L }, max: { x: L, y: L, z: L } },
      }),
    [cargas, lineasPorMicroC],
  );

  // Todas las líneas en un único LineSegments; el color va de rojo (inicio, +) a azul (fin, −)
  const geometria = useGeometria(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const a = new THREE.Color(COLOR_POSITIVO);
    const b = new THREE.Color(COLOR_NEGATIVO);
    const c = new THREE.Color();
    for (const { puntos } of lineas) {
      for (let i = 0; i < puntos.length - 1; i++) {
        const p = puntos[i];
        const q = puntos[i + 1];
        pos.push(p.x, p.y, p.z, q.x, q.y, q.z);
        c.lerpColors(a, b, i / puntos.length);
        col.push(c.r, c.g, c.b);
        c.lerpColors(a, b, (i + 1) / puntos.length);
        col.push(c.r, c.g, c.b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [lineas]);

  // Conos en el punto medio de cada línea indicando el sentido de E
  const flechas = useMemo(() => {
    const arriba = new THREE.Vector3(0, 1, 0);
    return lineas
      .filter((l) => l.puntos.length > 4)
      .map(({ puntos }) => {
        const i = Math.floor(puntos.length / 2);
        const p = puntos[i];
        const q = puntos[i + 1];
        const dir = new THREE.Vector3(q.x - p.x, q.y - p.y, q.z - p.z).normalize();
        return { pos: [p.x, p.y, p.z] as const, quat: new THREE.Quaternion().setFromUnitVectors(arriba, dir) };
      });
  }, [lineas]);
  const cono = useGeometria(() => new THREE.ConeGeometry(0.02, 0.07, 8), []);

  return (
    <>
      {geometria && (
        <lineSegments geometry={geometria}>
          <lineBasicMaterial vertexColors transparent opacity={0.85} />
        </lineSegments>
      )}
      {flechas.map((f, i) => (
        <mesh key={i} geometry={cono ?? undefined} position={[...f.pos]} quaternion={f.quat}>
          <meshBasicMaterial color="#e2e8f0" />
        </mesh>
      ))}
    </>
  );
}

function SuperficiesEquipotenciales({ cargas, nivel }: { cargas: readonly CargaPuntual[]; nivel: number }) {
  const n = 48;
  const malla = useMemo(
    () => muestrearMalla3D((x, y, z) => potencialEn(cargas, x, y, z), { x: -L, y: -L, z: -L }, { x: L, y: L, z: L }, n, n, n),
    [cargas],
  );
  const crear = (v: number) => {
    const { posiciones, indices } = isosuperficie(malla, v);
    if (indices.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    g.setIndex(new THREE.BufferAttribute(indices, 1));
    g.computeVertexNormals();
    return g;
  };
  const positiva = useGeometria(() => crear(nivel), [malla, nivel]);
  const negativa = useGeometria(() => crear(-nivel), [malla, nivel]);

  return (
    <>
      {[
        { g: positiva, color: COLOR_POSITIVO },
        { g: negativa, color: COLOR_NEGATIVO },
      ].map(
        ({ g, color }) =>
          g && (
            <mesh key={color} geometry={g}>
              <meshStandardMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          ),
      )}
    </>
  );
}

/** Vista 3D del sistema de cargas: esferas, líneas de campo 3D y superficies equipotenciales. */
export default function Escena3DCargas({ cargas, lineasPorMicroC, mostrarLineas, mostrarIso, nivelIso }: Props) {
  return (
    <Escena3D>
      {cargas.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]}>
          <sphereGeometry args={[0.035 + 0.012 * Math.sqrt(Math.abs(c.q) / MICRO), 24, 16]} />
          <meshStandardMaterial
            color={c.q >= 0 ? COLOR_POSITIVO : COLOR_NEGATIVO}
            emissive={c.q >= 0 ? COLOR_POSITIVO : COLOR_NEGATIVO}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
      {mostrarLineas && <LineasCampo3D cargas={cargas} lineasPorMicroC={lineasPorMicroC} />}
      {mostrarIso && <SuperficiesEquipotenciales cargas={cargas} nivel={nivelIso} />}
    </Escena3D>
  );
}
