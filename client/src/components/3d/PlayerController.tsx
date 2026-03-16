'use client';

// PlayerController - first-person movement controller
// Active movement logic is embedded in Casino.tsx useEffect for direct Three.js use.
// This module exports helper types and utilities for the controller.

export interface PlayerState {
  position: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  isMoving: boolean;
  speed: number;
}

export const DEFAULT_PLAYER_STATE: PlayerState = {
  position: { x: 0, y: 1.7, z: 0 },
  yaw: 0,
  pitch: 0,
  isMoving: false,
  speed: 0.08,
};

export const MOVEMENT_KEYS = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
} as const;

export const PLAYER_BOUNDS = {
  minX: -22,
  maxX: 22,
  minZ: -22,
  maxZ: 22,
  eyeHeight: 1.7,
} as const;

export function clampPosition(x: number, z: number): { x: number; z: number } {
  return {
    x: Math.max(PLAYER_BOUNDS.minX, Math.min(PLAYER_BOUNDS.maxX, x)),
    z: Math.max(PLAYER_BOUNDS.minZ, Math.min(PLAYER_BOUNDS.maxZ, z)),
  };
}

export function clampPitch(pitch: number): number {
  return Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
}
