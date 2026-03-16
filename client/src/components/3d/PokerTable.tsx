'use client';

// PokerTable component - used as a React Three Fiber scene node
// when integrating with @react-three/fiber instead of raw Three.js

interface PokerTableProps {
  position?: [number, number, number];
  seats?: number;
  name?: string;
  onClick?: () => void;
}

// This component is a placeholder for R3F integration.
// The active Three.js table rendering lives in Casino.tsx via createPokerTable().
export default function PokerTable(props: PokerTableProps) {
  void props;
  return null;
}
