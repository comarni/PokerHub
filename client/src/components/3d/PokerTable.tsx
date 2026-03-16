'use client';

// PokerTable component - used as a React Three Fiber scene node
// when integrating with @react-three/fiber instead of raw Three.js

import { useRef } from 'react';
import * as THREE from 'three';

interface PokerTableProps {
  position?: [number, number, number];
  seats?: number;
  name?: string;
  onClick?: () => void;
}

// This component is a placeholder for R3F integration.
// The active Three.js table rendering lives in Casino.tsx via createPokerTable().
export default function PokerTable({ position = [0, 0, 0], seats = 6, name = 'Table', onClick }: PokerTableProps) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Table base */}
      <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.0, 0.15, 32]} />
        <meshStandardMaterial color={0x3d2b1f} roughness={0.8} />
      </mesh>

      {/* Felt surface */}
      <mesh position={[0, 0.9, 0]} receiveShadow>
        <cylinderGeometry args={[2.0, 2.0, 0.05, 32]} />
        <meshStandardMaterial color={0x0B4D1C} roughness={1.0} />
      </mesh>

      {/* Rail */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.92, 0]}>
        <torusGeometry args={[2.1, 0.12, 8, 64]} />
        <meshStandardMaterial color={0x2c1810} roughness={0.6} />
      </mesh>

      {/* Seats */}
      {Array.from({ length: seats }).map((_, i) => {
        const angle = (i / seats) * Math.PI * 2;
        const sx = Math.cos(angle) * 2.8;
        const sz = Math.sin(angle) * 2.8;
        return (
          <mesh key={i} position={[sx, 0.55, sz]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
            <meshStandardMaterial color={0x4a1c1c} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}
