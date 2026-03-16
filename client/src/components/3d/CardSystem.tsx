'use client';

import * as THREE from 'three';

export interface CardData {
  rank: string;
  suit: string;
  faceUp?: boolean;
}

export const SUIT_COLORS: Record<string, string> = {
  hearts: '#e53e3e',
  diamonds: '#e53e3e',
  clubs: '#1a1a1a',
  spades: '#1a1a1a',
};

export const CARD_WIDTH = 0.63;
export const CARD_HEIGHT = 0.88;
export const CARD_DEPTH = 0.005;

/**
 * Creates a Three.js Mesh representing a playing card.
 * Face-up cards show a white front; face-down show a blue back pattern.
 */
export function createCardMesh(card: CardData, faceUp = true): THREE.Mesh {
  const geo = new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH);

  const frontMat = new THREE.MeshStandardMaterial({
    color: faceUp ? 0xffffff : 0x1a3a6e,
    roughness: 0.3,
    metalness: 0.0,
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: 0x1a3a6e,
    roughness: 0.3,
  });

  const sideMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });

  const materials = [sideMat, sideMat, sideMat, sideMat, frontMat, backMat];
  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;

  // Store card data for later reference
  mesh.userData = { card, faceUp };

  return mesh;
}

/**
 * Animates a card deal from deck position to target position.
 */
export function animateDeal(
  mesh: THREE.Mesh,
  from: THREE.Vector3,
  to: THREE.Vector3,
  duration = 0.4,
  onComplete?: () => void
): void {
  const start = performance.now();
  const fromClone = from.clone();

  function tick() {
    const elapsed = (performance.now() - start) / 1000;
    const t = Math.min(elapsed / duration, 1);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out

    mesh.position.lerpVectors(fromClone, to, eased);
    mesh.position.y += Math.sin(t * Math.PI) * 0.3; // arc

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      mesh.position.copy(to);
      onComplete?.();
    }
  }

  requestAnimationFrame(tick);
}

/**
 * Lays out hole cards for a player seat.
 */
export function layoutHoleCards(
  scene: THREE.Scene,
  cards: CardData[],
  seatPosition: THREE.Vector3
): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  const spacing = CARD_WIDTH + 0.05;
  const startX = -((cards.length - 1) * spacing) / 2;

  cards.forEach((card, i) => {
    const mesh = createCardMesh(card, true);
    mesh.position.set(
      seatPosition.x + startX + i * spacing,
      seatPosition.y + 0.02,
      seatPosition.z
    );
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);
    meshes.push(mesh);
  });

  return meshes;
}

/**
 * Lays out community cards in the center of the table.
 */
export function layoutCommunityCards(
  scene: THREE.Scene,
  cards: CardData[],
  tableCenter: THREE.Vector3
): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  const spacing = CARD_WIDTH + 0.08;
  const startX = -((cards.length - 1) * spacing) / 2;

  cards.forEach((card, i) => {
    const mesh = createCardMesh(card, true);
    mesh.position.set(
      tableCenter.x + startX + i * spacing,
      tableCenter.y + 0.93,
      tableCenter.z
    );
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);
    meshes.push(mesh);
  });

  return meshes;
}
