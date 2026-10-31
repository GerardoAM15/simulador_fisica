import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface Props {
  children: ReactNode;
  camara?: [number, number, number];
  /** Mostrar los ejes x, y, z en el origen */
  ejes?: boolean;
  /** Altura z del plano de la cuadrícula */
  alturaCuadricula?: number;
  /** [tamaño, divisiones] de la cuadrícula */
  cuadricula?: [number, number];
  /** Punto al que mira la cámara (centro de rotación) */
  objetivo?: [number, number, number];
}

/**
 * Escena 3D base: eje z hacia arriba, plano xy con cuadrícula (1 división = 0.2 m),
 * ejes (x rojo, y verde, z azul) y OrbitControls (arrastrar = rotar, rueda = zoom, clic derecho = desplazar).
 */
export default function Escena3D({
  children,
  camara = [2.4, -3, 2.2],
  ejes = true,
  alturaCuadricula = 0,
  cuadricula = [4, 20],
  objetivo = [0, 0, 0],
}: Props) {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: camara, up: [0, 0, 1], fov: 45, near: 0.01, far: 100 }} dpr={[1, 2]}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, -4, 6]} intensity={1.4} />
        <gridHelper args={[cuadricula[0], cuadricula[1], '#334155', '#1e293b']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, alturaCuadricula]} />
        {ejes && <axesHelper args={[0.4]} />}
        <OrbitControls makeDefault enableDamping target={objetivo} />
        {children}
      </Canvas>
    </div>
  );
}
