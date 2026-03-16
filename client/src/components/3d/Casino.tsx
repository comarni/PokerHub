'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import HUD from '../ui/HUD';

interface TableData {
  id: string;
  name: string;
  position: [number, number, number];
  seats: number;
}

const TABLES: TableData[] = [
  { id: 'table-0', name: 'Practice Table', position: [0, 0, -4], seats: 4 },
  { id: 'table-1', name: 'Table Royale', position: [-8, 0, -8], seats: 6 },
  { id: 'table-2', name: 'High Roller', position: [8, 0, -8], seats: 6 },
  { id: 'table-3', name: 'Beginners', position: [0, 0, 8], seats: 6 },
  { id: 'table-4', name: 'VIP Lounge', position: [-8, 0, 8], seats: 4 },
  { id: 'table-5', name: 'Tournament', position: [8, 0, 8], seats: 9 },
];

export default function Casino() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRef = useRef({
    position: new THREE.Vector3(0, 1.7, 0),
    yaw: 0,
    pitch: 0,
  });
  const keysRef = useRef<Record<string, boolean>>({});
  const [nearTable, setNearTable] = useState<TableData | null>(null);
  const [seated, setSeated] = useState<TableData | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070c);
    scene.fog = new THREE.Fog(0x05070c, 35, 95);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.copy(playerRef.current.position);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x05070c, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbfd7ff, 0x2a1d14, 1.2);
    hemiLight.position.set(0, 18, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3d6, 0.8);
    keyLight.position.set(10, 16, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    scene.add(keyLight);

    // Ceiling chandelier lights
    const ceilingPositions = [[-8,-8],[8,-8],[0,8],[-8,8],[8,8],[0,0]];
    ceilingPositions.forEach(([x, z]) => {
      const pointLight = new THREE.PointLight(0xffd580, 2, 15);
      pointLight.position.set(x as number, 4, z as number);
      pointLight.castShadow = true;
      scene.add(pointLight);

      // Light fixture sphere
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd580, emissive: 0xffd580, emissiveIntensity: 2 })
      );
      bulb.position.set(x as number, 3.9, z as number);
      scene.add(bulb);
    });

    // Floor - casino carpet pattern
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1d4f2b,
      roughness: 0.92,
      metalness: 0.03
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(60, 60);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1f, emissive: 0x070707, emissiveIntensity: 0.4 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 5;
    scene.add(ceiling);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3b2b24, roughness: 0.85, emissive: 0x120b09, emissiveIntensity: 0.35 });
    const wallConfigs = [
      { pos: [0, 2.5, -25] as [number,number,number], rot: [0, 0, 0] as [number,number,number], size: [50, 5] },
      { pos: [0, 2.5, 25] as [number,number,number], rot: [0, Math.PI, 0] as [number,number,number], size: [50, 5] },
      { pos: [-25, 2.5, 0] as [number,number,number], rot: [0, Math.PI / 2, 0] as [number,number,number], size: [50, 5] },
      { pos: [25, 2.5, 0] as [number,number,number], rot: [0, -Math.PI / 2, 0] as [number,number,number], size: [50, 5] },
    ];
    wallConfigs.forEach(({ pos, rot, size }) => {
      const wall = new THREE.Mesh(
        new THREE.PlaneGeometry(size[0], size[1]),
        wallMat
      );
      wall.position.set(...pos);
      wall.rotation.set(...rot);
      scene.add(wall);
    });

    // Visible orientation aid near spawn to quickly verify scene rendering.
    const spawnMarker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x0088aa, emissiveIntensity: 0.9 })
    );
    spawnMarker.position.set(0, 0.2, -1.2);
    spawnMarker.castShadow = true;
    scene.add(spawnMarker);

    // Create poker tables
    TABLES.forEach(tableData => {
      createPokerTable(scene, tableData);
    });

    // Decorative pillars
    const pillarPositions = [[-15,-15],[15,-15],[-15,15],[15,15]];
    pillarPositions.forEach(([x, z]) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 5, 12),
        new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.3, roughness: 0.7 })
      );
      pillar.position.set(x as number, 2.5, z as number);
      pillar.castShadow = true;
      scene.add(pillar);
    });

    // Controls
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Pointer lock
    const handleClick = () => {
      if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
      }
    };

    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      setIsPointerLocked(locked);
    };

    renderer.domElement.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === renderer.domElement) {
        playerRef.current.yaw -= e.movementX * 0.002;
        playerRef.current.pitch -= e.movementY * 0.002;
        playerRef.current.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, playerRef.current.pitch));
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const SPEED = 0.08;
    const seatedRef = { value: false };

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);

      if (!seatedRef.value && document.pointerLockElement === renderer.domElement) {
        const dir = new THREE.Vector3();
        if (keysRef.current['KeyW']) dir.z -= 1;
        if (keysRef.current['KeyS']) dir.z += 1;
        if (keysRef.current['KeyA']) dir.x -= 1;
        if (keysRef.current['KeyD']) dir.x += 1;

        if (dir.length() > 0) {
          dir.normalize().applyEuler(new THREE.Euler(0, playerRef.current.yaw, 0));
          dir.multiplyScalar(SPEED);
          playerRef.current.position.add(dir);
          // Boundary clamp
          playerRef.current.position.x = Math.max(-22, Math.min(22, playerRef.current.position.x));
          playerRef.current.position.z = Math.max(-22, Math.min(22, playerRef.current.position.z));
        }
      }

      if (!seatedRef.value) {
        camera.position.copy(playerRef.current.position);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = playerRef.current.yaw;
        camera.rotation.x = playerRef.current.pitch;
      }

      // Check proximity to tables
      let closestTable: TableData | null = null;
      let closestDist = Infinity;
      TABLES.forEach(t => {
        const tablePos = new THREE.Vector3(...t.position);
        const dist = playerRef.current.position.distanceTo(tablePos);
        if (dist < 4 && dist < closestDist) {
          closestDist = dist;
          closestTable = t;
        }
      });
      setNearTable(closestTable);

      renderer.render(scene, camera);
    }

    // Store seatedRef reference so sit/stand can update it
    (window as unknown as Record<string, unknown>).__pokerSeatedRef = seatedRef;

    animate();

    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleSitDown = () => {
    if (!nearTable || !cameraRef.current) return;
    setSeated(nearTable);

    const seatedRef = (window as unknown as Record<string, unknown>).__pokerSeatedRef as { value: boolean } | undefined;
    if (seatedRef) seatedRef.value = true;

    // Animate camera to table view
    const tablePos = new THREE.Vector3(...nearTable.position);
    gsap.to(cameraRef.current.position, {
      x: tablePos.x,
      y: tablePos.y + 1.8,
      z: tablePos.z + 2.5,
      duration: 1.2,
      ease: 'power2.inOut'
    });
    gsap.to(cameraRef.current.rotation, {
      x: -0.3,
      y: 0,
      z: 0,
      duration: 1.2,
      ease: 'power2.inOut'
    });

    document.exitPointerLock();
  };

  const handleStandUp = () => {
    if (!seated || !cameraRef.current) return;

    const seatedRef = (window as unknown as Record<string, unknown>).__pokerSeatedRef as { value: boolean } | undefined;
    if (seatedRef) seatedRef.value = false;

    playerRef.current.position.set(
      seated.position[0],
      1.7,
      seated.position[2] + 3
    );

    gsap.to(cameraRef.current.position, {
      x: playerRef.current.position.x,
      y: playerRef.current.position.y,
      z: playerRef.current.position.z,
      duration: 1,
      ease: 'power2.inOut',
      onComplete: () => setSeated(null)
    });
  };

  return (
    <div className="relative w-screen h-screen">
      <div ref={mountRef} className="w-full h-full" />

      {/* Crosshair */}
      {isPointerLocked && !seated && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-4 h-4 relative">
            <div className="absolute top-1/2 left-0 w-full h-px bg-white opacity-70" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-white opacity-70" />
          </div>
        </div>
      )}

      {/* Click to play */}
      {!isPointerLocked && !seated && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-black/70 p-8 rounded-xl border border-yellow-600">
            <div className="text-yellow-400 text-5xl font-bold mb-2" style={{fontFamily: 'Georgia'}}>
              POKERHUB
            </div>
            <div className="text-gray-300 text-lg mb-4">3D Casino Experience</div>
            <div className="text-white text-sm animate-pulse">Click to enter casino</div>
            <div className="text-gray-400 text-xs mt-2">WASD to move · Mouse to look · Approach tables to sit</div>
          </div>
        </div>
      )}

      {/* Sit Down button */}
      {nearTable && !seated && isPointerLocked && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={handleSitDown}
            className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            SIT DOWN at {nearTable.name}
          </button>
        </div>
      )}

      {/* HUD overlay when seated */}
      {seated && (
        <HUD tableId={seated.id} tableName={seated.name} onStandUp={handleStandUp} />
      )}

      {/* Mini map / info */}
      {isPointerLocked && !seated && (
        <div className="absolute top-4 left-4 bg-black/60 text-green-400 text-xs p-2 rounded font-mono pointer-events-none">
          {nearTable ? `Near: ${nearTable.name}` : 'Exploring casino...'}
        </div>
      )}
    </div>
  );
}

function createPokerTable(scene: THREE.Scene, tableData: TableData) {
  const [tx, , tz] = tableData.position;

  // Table base
  const baseGeo = new THREE.CylinderGeometry(2.2, 2.0, 0.15, 32);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.8 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(tx, 0.82, tz);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  // Felt surface
  const feltGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.05, 32);
  const feltMat = new THREE.MeshStandardMaterial({ color: 0x0B4D1C, roughness: 1.0 });
  const felt = new THREE.Mesh(feltGeo, feltMat);
  felt.position.set(tx, 0.9, tz);
  felt.receiveShadow = true;
  scene.add(felt);

  // Table rail
  const railGeo = new THREE.TorusGeometry(2.1, 0.12, 8, 64);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x2c1810, roughness: 0.6, metalness: 0.1 });
  const rail = new THREE.Mesh(railGeo, railMat);
  rail.rotation.x = Math.PI / 2;
  rail.position.set(tx, 0.92, tz);
  scene.add(rail);

  // Table leg
  const legGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1a0d08 });
  const leg = new THREE.Mesh(legGeo, legMat);
  leg.position.set(tx, 0.4, tz);
  scene.add(leg);

  // Table light (cone from above)
  const tableLight = new THREE.SpotLight(0x88ff88, 1.5, 8, Math.PI / 6, 0.5);
  tableLight.position.set(tx, 5, tz);
  tableLight.target.position.set(tx, 0, tz);
  tableLight.castShadow = true;
  scene.add(tableLight);
  scene.add(tableLight.target);

  // Seats
  const seatAngleStep = (Math.PI * 2) / tableData.seats;
  for (let i = 0; i < tableData.seats; i++) {
    const angle = i * seatAngleStep;
    const sx = tx + Math.cos(angle) * 2.8;
    const sz = tz + Math.sin(angle) * 2.8;

    const seatGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x4a1c1c, roughness: 0.8 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(sx, 0.55, sz);
    seat.castShadow = true;
    scene.add(seat);

    // Seat back
    const backGeo = new THREE.BoxGeometry(0.4, 0.5, 0.05);
    const back = new THREE.Mesh(backGeo, seatMat);
    back.position.set(sx, 0.85, sz + Math.sin(angle) * 0.2);
    back.rotation.y = angle;
    scene.add(back);
  }

  // Table name sign placeholder (gold bar)
  const signGeo = new THREE.BoxGeometry(1.5, 0.3, 0.05);
  const signMat = new THREE.MeshStandardMaterial({ color: 0xC9A84C, metalness: 0.5 });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(tx, 1.8, tz - 2.3);
  scene.add(sign);

  // Chips on table (decorative)
  for (let i = 0; i < 3; i++) {
    const chipGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
    const chipColors = [0xf5f5f5, 0xc0392b, 0x27ae60];
    const chip = new THREE.Mesh(chipGeo, new THREE.MeshStandardMaterial({ color: chipColors[i], metalness: 0.3 }));
    chip.position.set(tx + (i - 1) * 0.2, 0.93, tz);
    scene.add(chip);
  }
}
