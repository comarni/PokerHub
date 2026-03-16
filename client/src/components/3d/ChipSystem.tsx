'use client';

import * as THREE from 'three';

export interface ChipStack {
  amount: number;
  position: THREE.Vector3;
}

export const CHIP_DENOMINATIONS = [1, 5, 25, 100, 500, 1000] as const;

export const CHIP_COLORS: Record<number, number> = {
  1:    0xf5f5f5, // white
  5:    0xc0392b, // red
  25:   0x27ae60, // green
  100:  0x2980b9, // blue
  500:  0x8e44ad, // purple
  1000: 0x2c3e50, // black
};

export const CHIP_RADIUS = 0.09;
export const CHIP_HEIGHT = 0.022;
export const CHIP_STACK_GAP = 0.003;

/**
 * Creates a single chip mesh for the given denomination.
 */
export function createChipMesh(denomination: number): THREE.Mesh {
  const color = CHIP_COLORS[denomination] ?? 0xffffff;

  const geo = new THREE.CylinderGeometry(CHIP_RADIUS, CHIP_RADIUS, CHIP_HEIGHT, 32);
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.5,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.userData = { denomination };

  // Add edge stripe
  const edgeGeo = new THREE.CylinderGeometry(CHIP_RADIUS + 0.005, CHIP_RADIUS + 0.005, CHIP_HEIGHT * 0.4, 32, 1, true);
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.BackSide });
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  mesh.add(edge);

  return mesh;
}

/**
 * Breaks an amount into the fewest chips by denomination (greedy).
 */
export function breakIntoChips(amount: number): Map<number, number> {
  const result = new Map<number, number>();
  let remaining = amount;

  for (const denom of [...CHIP_DENOMINATIONS].reverse()) {
    if (remaining >= denom) {
      const count = Math.floor(remaining / denom);
      result.set(denom, count);
      remaining -= count * denom;
    }
  }

  return result;
}

/**
 * Creates a visual chip stack group for the given amount at a position.
 */
export function createChipStackGroup(amount: number, position: THREE.Vector3): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(position);

  const breakdown = breakIntoChips(amount);
  let xOffset = 0;

  breakdown.forEach((count, denom) => {
    const stackCount = Math.min(count, 10); // cap visual stack at 10
    for (let i = 0; i < stackCount; i++) {
      const chip = createChipMesh(denom);
      chip.position.set(xOffset, i * (CHIP_HEIGHT + CHIP_STACK_GAP), 0);
      group.add(chip);
    }
    xOffset += CHIP_RADIUS * 2.5;
  });

  return group;
}

/**
 * Animates chips moving from one position to another (pot contribution).
 */
export function animateChipsToPot(
  group: THREE.Group,
  targetPosition: THREE.Vector3,
  duration = 0.6,
  onComplete?: () => void
): void {
  const start = performance.now();
  const fromPos = group.position.clone();

  function tick() {
    const elapsed = (performance.now() - start) / 1000;
    const t = Math.min(elapsed / duration, 1);
    const eased = t * t * (3 - 2 * t); // smoothstep

    group.position.lerpVectors(fromPos, targetPosition, eased);
    group.position.y += Math.sin(t * Math.PI) * 0.5;

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      group.position.copy(targetPosition);
      onComplete?.();
    }
  }

  requestAnimationFrame(tick);
}
