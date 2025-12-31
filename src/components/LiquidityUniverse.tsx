'use client';

import { useRef, useState, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Line, Text } from '@react-three/drei';
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

interface VoxelProps {
  position: Position;
  onClick: (position: Position) => void;
  isSelected: boolean;
}

// Grid dimensions
const GRID_SIZE = 8;
const GRID_DIVISIONS = 4;

// Map position to 3D coords within grid
function positionToCoords(pos: Position): [number, number, number] {
  // X: Price (0-8000 mapped to -GRID_SIZE/2 to GRID_SIZE/2)
  const x = ((pos.priceCenter / 8000) - 0.5) * GRID_SIZE;
  // Y: Depth (1-4 mapped to grid)
  const y = ((pos.depth - 1) / 3) * (GRID_SIZE * 0.6) - (GRID_SIZE * 0.3);
  // Z: Volatility bucket (0-3 mapped to grid)
  const z = ((pos.volatilityBucket) / 3) * GRID_SIZE - (GRID_SIZE / 2);
  return [x, y, z];
}

// Clean voxel cube
function Voxel({ position, onClick, isSelected }: VoxelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const [hovered, setHovered] = useState(false);

  const coords = useMemo(() => positionToCoords(position), [position]);

  // Size based on liquidity (capped for clean proportions)
  const size = useMemo(() => {
    const base = 0.3;
    const scale = Math.min(position.liquidity / 10000, 1);
    return base + scale * 0.4;
  }, [position.liquidity]);

  // Opacity based on liquidity
  const opacity = useMemo(() => {
    return 0.4 + (position.liquidity / 15000) * 0.5;
  }, [position.liquidity]);

  return (
    <group position={coords}>
      {/* Main cube */}
      <mesh
        ref={meshRef}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick(position);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={isSelected ? 0.9 : hovered ? 0.7 : opacity}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Edge lines */}
      <lineSegments ref={edgesRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(size, size, size)]} />
        <lineBasicMaterial
          color={isSelected ? '#ffffff' : hovered ? '#888888' : '#444444'}
          transparent
          opacity={isSelected ? 1 : hovered ? 0.8 : 0.5}
        />
      </lineSegments>

      {/* Selection outline */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(size + 0.08, size + 0.08, size + 0.08)]} />
          <lineBasicMaterial color="#ffffff" />
        </lineSegments>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html center distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div className="bg-black/95 px-3 py-2 rounded-lg border border-white/20 whitespace-nowrap transform -translate-y-12">
            <div className="text-xs font-medium text-white">{position.pair}</div>
            <div className="text-xs text-gray-400">${position.liquidity.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{position.apr.toFixed(1)}% APR</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Grid floor and axes
function GridSystem() {
  const gridSize = GRID_SIZE;
  const divisions = GRID_DIVISIONS;

  // Create grid lines
  const gridLines = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
    const half = gridSize / 2;
    const step = gridSize / divisions;

    // Floor grid (XZ plane)
    for (let i = 0; i <= divisions; i++) {
      const pos = -half + i * step;
      // X lines
      lines.push([
        new THREE.Vector3(-half, -half, pos),
        new THREE.Vector3(half, -half, pos),
      ]);
      // Z lines
      lines.push([
        new THREE.Vector3(pos, -half, -half),
        new THREE.Vector3(pos, -half, half),
      ]);
    }

    return lines;
  }, []);

  return (
    <group>
      {/* Floor grid lines */}
      {gridLines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#222222"
          lineWidth={1}
          transparent
          opacity={0.6}
        />
      ))}

      {/* Axis lines */}
      <Line
        points={[
          new THREE.Vector3(-GRID_SIZE / 2, -GRID_SIZE / 2, -GRID_SIZE / 2),
          new THREE.Vector3(GRID_SIZE / 2, -GRID_SIZE / 2, -GRID_SIZE / 2),
        ]}
        color="#444444"
        lineWidth={1.5}
      />
      <Line
        points={[
          new THREE.Vector3(-GRID_SIZE / 2, -GRID_SIZE / 2, -GRID_SIZE / 2),
          new THREE.Vector3(-GRID_SIZE / 2, GRID_SIZE / 2, -GRID_SIZE / 2),
        ]}
        color="#444444"
        lineWidth={1.5}
      />
      <Line
        points={[
          new THREE.Vector3(-GRID_SIZE / 2, -GRID_SIZE / 2, -GRID_SIZE / 2),
          new THREE.Vector3(-GRID_SIZE / 2, -GRID_SIZE / 2, GRID_SIZE / 2),
        ]}
        color="#444444"
        lineWidth={1.5}
      />

      {/* Axis labels */}
      <Text
        position={[GRID_SIZE / 2 + 0.5, -GRID_SIZE / 2, -GRID_SIZE / 2]}
        fontSize={0.3}
        color="#666666"
        anchorX="left"
      >
        PRICE
      </Text>
      <Text
        position={[-GRID_SIZE / 2, GRID_SIZE / 2 + 0.3, -GRID_SIZE / 2]}
        fontSize={0.3}
        color="#666666"
        anchorX="center"
      >
        DEPTH
      </Text>
      <Text
        position={[-GRID_SIZE / 2, -GRID_SIZE / 2, GRID_SIZE / 2 + 0.5]}
        fontSize={0.3}
        color="#666666"
        anchorX="left"
      >
        VOL
      </Text>
    </group>
  );
}

// Bounding wireframe
function BoundingBox() {
  const size = GRID_SIZE;
  const half = size / 2;

  const edges = useMemo(() => {
    const points: [THREE.Vector3, THREE.Vector3][] = [
      // Bottom face
      [new THREE.Vector3(-half, -half, -half), new THREE.Vector3(half, -half, -half)],
      [new THREE.Vector3(half, -half, -half), new THREE.Vector3(half, -half, half)],
      [new THREE.Vector3(half, -half, half), new THREE.Vector3(-half, -half, half)],
      [new THREE.Vector3(-half, -half, half), new THREE.Vector3(-half, -half, -half)],
      // Top face
      [new THREE.Vector3(-half, half, -half), new THREE.Vector3(half, half, -half)],
      [new THREE.Vector3(half, half, -half), new THREE.Vector3(half, half, half)],
      [new THREE.Vector3(half, half, half), new THREE.Vector3(-half, half, half)],
      [new THREE.Vector3(-half, half, half), new THREE.Vector3(-half, half, -half)],
      // Vertical edges
      [new THREE.Vector3(-half, -half, -half), new THREE.Vector3(-half, half, -half)],
      [new THREE.Vector3(half, -half, -half), new THREE.Vector3(half, half, -half)],
      [new THREE.Vector3(half, -half, half), new THREE.Vector3(half, half, half)],
      [new THREE.Vector3(-half, -half, half), new THREE.Vector3(-half, half, half)],
    ];
    return points;
  }, []);

  return (
    <group>
      {edges.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#1a1a1a"
          lineWidth={1}
          transparent
          opacity={0.4}
        />
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
  const handleVoxelClick = useCallback((position: Position) => {
    onSelectPosition(position);
  }, [onSelectPosition]);

  const handleCanvasClick = useCallback(() => {
    onSelectPosition(null);
  }, [onSelectPosition]);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [12, 8, 12], fov: 40 }}
        dpr={[1, 2]}
        onClick={handleCanvasClick}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0a0a0a']} />

        <Suspense fallback={null}>
          {/* Lighting - soft and professional */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.6} color="#ffffff" />
          <directionalLight position={[-5, 5, -5]} intensity={0.2} color="#ffffff" />

          {/* Grid and bounds */}
          <GridSystem />
          <BoundingBox />

          {/* Voxels */}
          {positions.map((position) => (
            <Voxel
              key={position.id}
              position={position}
              onClick={handleVoxelClick}
              isSelected={selectedPosition?.id === position.id}
            />
          ))}

          {/* Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            autoRotate
            autoRotateSpeed={0.3}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 6}
            maxDistance={30}
            minDistance={8}
            dampingFactor={0.05}
            enableDamping
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
