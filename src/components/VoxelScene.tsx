'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Wireframe cube with animated edges
function WireframeCube({ size = 2, color = '#ffffff' }: { size?: number; color?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  const edges = useMemo(() => {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    return edgesGeometry;
  }, [size]);

  return (
    <group ref={groupRef}>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={color} transparent opacity={0.4} />
      </lineSegments>
    </group>
  );
}

// Inner nested cubes - representing octree subdivision
function NestedCubes() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  const cubes = useMemo(() => {
    const result: { size: number; opacity: number }[] = [];
    // Octree-like subdivision - each level is half the size
    const sizes = [2.4, 1.6, 1.0, 0.6];
    sizes.forEach((size, i) => {
      result.push({ size, opacity: 0.15 + i * 0.1 });
    });
    return result;
  }, []);

  return (
    <group ref={groupRef}>
      {cubes.map((cube, i) => {
        const geometry = new THREE.BoxGeometry(cube.size, cube.size, cube.size);
        const edges = new THREE.EdgesGeometry(geometry);
        return (
          <lineSegments key={i} geometry={edges}>
            <lineBasicMaterial color="#ffffff" transparent opacity={cube.opacity} />
          </lineSegments>
        );
      })}
    </group>
  );
}

// Floating data points inside the cube
function DataPoints() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 50;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Random positions within a cube
      pos[i * 3] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.15;

      // Subtle pulsing
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      pointsRef.current.scale.setScalar(scale);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Connection lines between random points
function Connections() {
  const linesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  const lines = useMemo(() => {
    const result: THREE.Vector3[][] = [];
    const points: THREE.Vector3[] = [];

    // Create random points
    for (let i = 0; i < 12; i++) {
      points.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        )
      );
    }

    // Connect some nearby points
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = points[i].distanceTo(points[j]);
        if (dist < 1.2) {
          result.push([points[i], points[j]]);
        }
      }
    }

    return result;
  }, []);

  return (
    <group ref={linesRef}>
      {lines.map((line, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(line.flatMap(p => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.1} />
        </line>
      ))}
    </group>
  );
}

// Scene
function Scene() {
  return (
    <>
      {/* Subtle ambient light */}
      <ambientLight intensity={0.5} />

      {/* Main visualization */}
      <NestedCubes />
      <DataPoints />
      <Connections />

      {/* Controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.2}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 3}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  );
}

export default function VoxelScene({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [3, 2, 3], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
