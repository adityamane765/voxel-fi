'use client';

import { useRef, useState, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Position data
export interface Position {
  id: number;
  pair: string;
  type: string;
  liquidity: number;
  priceCenter: number;
  spread: number;
  volatilityBucket: number;
  depth: number;
  earnings: number;
  apr: number;
  healthScore: number;
  isActive: boolean;
}

interface PositionOrbProps {
  position: Position;
  onClick: (position: Position) => void;
  isSelected: boolean;
}

// Map position to 3D coords
function positionToCoords(pos: Position): [number, number, number] {
  const x = ((pos.priceCenter / 8000) - 0.5) * 8;
  const y = (pos.depth - 2.5) * 2;
  const z = (pos.volatilityBucket - 1.5) * 3;
  return [x, y, z];
}

// Glowing position orb
function PositionOrb({ position, onClick, isSelected }: PositionOrbProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const coords = useMemo(() => positionToCoords(position), [position]);

  const size = useMemo(() => {
    return 0.15 + (position.liquidity / 15000) * 0.25;
  }, [position.liquidity]);

  // Color based on health score
  const color = useMemo(() => {
    if (position.healthScore >= 80) return new THREE.Color('#4ade80');
    if (position.healthScore >= 50) return new THREE.Color('#facc15');
    return new THREE.Color('#f87171');
  }, [position.healthScore]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      // Floating motion
      groupRef.current.position.y = coords[1] + Math.sin(t * 0.5 + position.id) * 0.1;
    }

    if (innerRef.current) {
      innerRef.current.rotation.y = t * 0.3;
      const scale = isSelected || hovered ? 1.3 : 1;
      innerRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }

    if (outerRef.current) {
      const pulse = 1 + Math.sin(t * 2 + position.id) * 0.15;
      outerRef.current.scale.setScalar(pulse * (isSelected || hovered ? 1.5 : 1.2));
      (outerRef.current.material as THREE.MeshBasicMaterial).opacity =
        (isSelected || hovered ? 0.2 : 0.08) + Math.sin(t * 3) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={[coords[0], coords[1], coords[2]]}>
      {/* Inner glowing core */}
      <Sphere
        ref={innerRef}
        args={[size, 32, 32]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick(position);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected || hovered ? 1.5 : 0.8}
          distort={0.2}
          speed={2}
          roughness={0}
          metalness={0.2}
        />
      </Sphere>

      {/* Outer glow sphere */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[size * 2, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ring around selected */}
      {(isSelected || hovered) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.8, 0.02, 8, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      )}

      {/* Label */}
      {hovered && (
        <Html center distanceFactor={15} style={{ pointerEvents: 'none' }}>
          <div className="bg-black/95 px-4 py-3 rounded-xl border border-white/20 whitespace-nowrap transform -translate-y-16 backdrop-blur">
            <div className="text-sm font-medium text-white">{position.pair}</div>
            <div className="text-xs text-gray-400 mt-1">${position.liquidity.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{position.apr.toFixed(1)}% APR</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Flowing connection lines
function FlowingConnections({ positions }: { positions: Position[] }) {
  const groupRef = useRef<THREE.Group>(null);

  const connections = useMemo(() => {
    const result: { start: THREE.Vector3; end: THREE.Vector3; color: THREE.Color }[] = [];

    // Connect nearby positions
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const [x1, y1, z1] = positionToCoords(positions[i]);
        const [x2, y2, z2] = positionToCoords(positions[j]);
        const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2 + (z2-z1)**2);

        if (dist < 5) {
          result.push({
            start: new THREE.Vector3(x1, y1, z1),
            end: new THREE.Vector3(x2, y2, z2),
            color: new THREE.Color('#ffffff'),
          });
        }
      }
    }

    return result;
  }, [positions]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Line) {
          const mat = child.material as THREE.LineBasicMaterial;
          mat.opacity = 0.05 + Math.sin(state.clock.elapsedTime * 1.5 + i * 0.5) * 0.03;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {connections.map((conn, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                conn.start.x, conn.start.y, conn.start.z,
                conn.end.x, conn.end.y, conn.end.z,
              ]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={conn.color}
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
    </group>
  );
}

// Ambient particles floating in the space
function AmbientParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 200;

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const radius = 8 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.5 - 1;
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const brightness = 0.3 + Math.random() * 0.4;
      col[i * 3] = brightness;
      col[i * 3 + 1] = brightness;
      col[i * 3 + 2] = brightness;
    }

    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Central reference point
function CentralPoint() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
    </mesh>
  );
}

// Ethereal rings
function EtherealRings() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {[3, 5, 7].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * 0.2]}>
          <torusGeometry args={[radius, 0.01, 8, 64]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.04 - i * 0.01}
          />
        </mesh>
      ))}
    </group>
  );
}

interface LiquidityUniverseProps {
  positions: Position[];
  onSelectPosition: (position: Position | null) => void;
  selectedPosition: Position | null;
  className?: string;
}

export default function LiquidityUniverse({
  positions,
  onSelectPosition,
  selectedPosition,
  className = '',
}: LiquidityUniverseProps) {
  const handleOrbClick = useCallback((position: Position) => {
    onSelectPosition(position);
  }, [onSelectPosition]);

  const handleCanvasClick = useCallback(() => {
    onSelectPosition(null);
  }, [onSelectPosition]);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [10, 5, 10], fov: 45 }}
        dpr={[1, 2]}
        onClick={handleCanvasClick}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 12, 35]} />

        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.6} color="#ffffff" />
          <pointLight position={[-10, -5, -10]} intensity={0.3} color="#ffffff" />
          <pointLight position={[0, 0, 0]} intensity={0.4} color="#ffffff" />

          {/* Scene elements */}
          <CentralPoint />
          <EtherealRings />
          <AmbientParticles />
          <FlowingConnections positions={positions} />

          {/* Position Orbs */}
          {positions.map((position) => (
            <PositionOrb
              key={position.id}
              position={position}
              onClick={handleOrbClick}
              isSelected={selectedPosition?.id === position.id}
            />
          ))}

          {/* Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            autoRotate
            autoRotateSpeed={0.15}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 6}
            maxDistance={25}
            minDistance={6}
            dampingFactor={0.05}
            enableDamping
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
