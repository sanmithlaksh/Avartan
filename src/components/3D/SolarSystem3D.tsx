// 3D Solar System Engine with First-Person Astronaut Free-Flight & 3D Planetary Placement
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Compass } from 'lucide-react';
import * as THREE from 'three';
import { useGame } from '../../context/GameContext';
import {
  PLANET_DEFINITIONS,
  CELESTIAL_BOUNDARY_RADIUS,
  ZODIAC_SECTORS,
  calculateSightlineIntersection,
  getHeliocentricPosition3D,
  getNodeAngleRad
} from '../../engine/astronomy';
import { getProceduralPlanetTexture, getProceduralRingTexture, getProceduralBumpTexture } from '../../engine/textureGenerator';
import { PlanetId } from '../../engine/types';
import { soundFx } from '../../utils/audio';
import { AstronautHUD } from './AstronautHUD';

export const SolarSystem3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    planets,
    selectedPlanetId,
    selectPlanet,
    setPlanetNode,
    observationActive,
    zodiacRevealed,
    triggerZodiacDiscovery,
    discoveryProgress,
    setDiscoveryProgress,
    settings,
    showZodiacTable,
    zodiacTableShown,
    zodiacTableError,
    setViewMode,
  } = useGame();

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetMeshesRef = useRef<Record<string, THREE.Mesh>>({});
  const orbitLineMeshesRef = useRef<Record<string, THREE.Line>>({});
  const nodeMarkersGroupRef = useRef<THREE.Group | null>(null);
  const observationRayGroupRef = useRef<THREE.Group | null>(null);
  const boundaryGroupRef = useRef<THREE.Group | null>(null);
  const boundaryScannerMeshRef = useRef<THREE.Mesh | null>(null);
  const boundaryParticlesRef = useRef<THREE.Points | null>(null);
  const boundaryWallMeshRef = useRef<THREE.Mesh | null>(null);
  const zodiacGroupRef = useRef<THREE.Group | null>(null);
  const spaceDustPointsRef = useRef<THREE.Points | null>(null);

  // Navigation & Flight State
  const [navMode, setNavMode] = useState<'fly' | 'orbit'>('fly');
  const [flySpeed, setFlySpeed] = useState<number>(1);
  const [cameraCoords, setCameraCoords] = useState<{ x: number; y: number; z: number }>({ x: 30, y: 18, z: 45 });
  const [targetedObject, setTargetedObject] = useState<{
    type: 'planet' | 'node' | 'boundary' | null;
    name: string;
    distance: number;
  } | null>(null);

  // Astronaut First-Person Physics & Keys
  const keysPressedRef = useRef<Record<string, boolean>>({});
  const velocityRef = useRef(new THREE.Vector3());
  const cameraYawRef = useRef<number>(-Math.PI / 4);
  const cameraPitchRef = useRef<number>(-0.35);
  const isPointerDownRef = useRef<boolean>(false);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Orbit Mode Spherical Coordinates
  const orbitSphericalRef = useRef({ radius: 75, theta: Math.PI / 4, phi: Math.PI / 3.5 });
  const orbitTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // 3D Planet Dragging along Orbit
  const isDraggingPlanet3DRef = useRef<PlanetId | null>(null);

  // Boundary Hold Discovery
  const isHoldingBoundaryRef = useRef<boolean>(false);
  const holdStartTimeRef = useRef<number>(0);
  const isHoldingZodiacTableRef = useRef<boolean>(false);
  const tableHoldStartRef = useRef<number>(0);
  const [tableHoldProgress, setTableHoldProgress] = useState<number>(0);
  const [showTableHoldError, setShowTableHoldError] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  // Camera Tweening for Fast Travel
  const tweenTargetRef = useRef<{
    pos: THREE.Vector3;
    yaw: number;
    pitch: number;
    active: boolean;
    duration: number;
    elapsed: number;
    startPos: THREE.Vector3;
    startYaw: number;
    startPitch: number;
  } | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    // No solid background — deep space is rendered by the starfield sphere
    scene.fog = new THREE.FogExp2(0x000510, 0.0015);

    // Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2500);
    cameraRef.current = camera;
    camera.position.set(30, 18, 45);
    updateCameraOrientation();

    // Renderer — safe WebGLRenderer instantiation with fallback options to prevent context creation failure
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false
      });
    } catch (e1) {
      console.warn('WebGL initialization failed, checking software renderer:', e1);
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          antialias: false,
          powerPreference: 'low-power'
        });
      } catch (e2) {
        console.error('All WebGL context attempts failed:', e2);
        setWebglError('WebGL context could not be created on this device/browser.');
        return;
      }
    }

    if (!renderer) {
      setWebglError('Unable to create WebGL context.');
      return;
    }

    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = false;

    // Listen for WebGL context loss
    const canvas = canvasRef.current;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost.');
      setWebglError('WebGL Context Lost. Switched to 2D view.');
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);

    // ── LIGHTING ──────────────────────────────────────────────
    // Very dim ambient for deep-space fill (prevents absolute black back-faces)
    const ambientLight = new THREE.AmbientLight(0x0a1020, 2.5);
    scene.add(ambientLight);

    // Central solar point light — primary illumination source
    const sunLight = new THREE.PointLight(0xfff8e7, 8.0, 600, 1.2);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Soft secondary fill from opposite direction (simulates scattered zodiacal light)
    const fillLight = new THREE.DirectionalLight(0x1a3050, 0.8);
    fillLight.position.set(-80, 30, -80);
    scene.add(fillLight);

    // Rim light (subtle blue-purple) from galactic core direction
    const rimLight = new THREE.PointLight(0x4060ff, 1.2, 350, 2.0);
    rimLight.position.set(-120, 15, -150);
    scene.add(rimLight);

    // Deep Space Starfield, Cosmic Dust & Realistic Gas Nebulae
    createStarfield(scene);
    createSpaceDust(scene);
    createCosmicNebula(scene);

    // Central Sun
    createSun(scene);

    // Planetary System & Orbits
    createPlanetarySystem(scene);

    // 12 Orbital Nodes Group
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);
    nodeMarkersGroupRef.current = nodeGroup;

    // Observation Ray Group
    const rayGroup = new THREE.Group();
    scene.add(rayGroup);
    observationRayGroupRef.current = rayGroup;

    // Celestial Outer Boundary
    createCelestialBoundary(scene);

    // Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Window Resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Main Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Camera Movement Physics
      updateCameraMotion(delta);

      // Rotate planet globes
      Object.entries(planetMeshesRef.current).forEach(([_, mesh]) => {
        mesh.rotation.y += delta * 0.35;
      });

      // Slowly rotate space dust around player
      if (spaceDustPointsRef.current && cameraRef.current) {
        spaceDustPointsRef.current.position.copy(cameraRef.current.position);
      }

      // Celestial Boundary — ZODIAC IS COMPLETELY STAGNANT (rotation strictly fixed at 0)
      // Only counter-rotating energy stream for visual depth
      if (boundaryParticlesRef.current) {
        boundaryParticlesRef.current.rotation.y = -elapsed * 0.045;
      }
      if (boundaryWallMeshRef.current) {
        // Pulsating opacity like a living energy membrane
        (boundaryWallMeshRef.current.material as THREE.MeshBasicMaterial).opacity =
          0.04 + Math.sin(elapsed * 1.8) * 0.03 + Math.sin(elapsed * 3.1) * 0.02;
      }

      // Pulse Boundary Scanner if holding (Hold for 10.0 seconds)
      if (isHoldingBoundaryRef.current && !zodiacRevealed) {
        const holdDuration = (Date.now() - holdStartTimeRef.current) / 1000;
        const prog = Math.min(100, Math.round((holdDuration / 10.0) * 100)); // Exactly 10.0 seconds
        setDiscoveryProgress(prog);
        if (boundaryScannerMeshRef.current) {
          boundaryScannerMeshRef.current.rotation.z += delta * (holdDuration > 6 ? 8 : 3);
          const warningPhase = holdDuration > 6 ? (holdDuration - 6) / 4.0 : 0;
          (boundaryScannerMeshRef.current.material as THREE.MeshBasicMaterial).opacity =
            holdDuration <= 6
              ? 0.05 + (holdDuration / 6) * 0.15 // First 6 sec: subtle glow
              : 0.2 + warningPhase * 0.8 + Math.sin(elapsed * 18) * 0.15 * warningPhase; // Last 4 sec: flashing warnings
        }
        // Play audio warning after 6 seconds has passed
        if (holdDuration > 6 && holdDuration <= 6.1) {
          soundFx.playBoundaryCharging();
        }
        if (prog >= 100) {
          isHoldingBoundaryRef.current = false;
          if (boundaryScannerMeshRef.current) {
            (boundaryScannerMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
          }
          triggerZodiacDiscovery();
        }
      }

      // ZODIAC TABLE HOLD: After zodiac revealed, hold 10 sec to show reference table
      if (isHoldingZodiacTableRef.current) {
        const holdDuration = (Date.now() - tableHoldStartRef.current) / 1000;
        const prog = Math.min(100, Math.round((holdDuration / 10.0) * 100));
        setTableHoldProgress(prog);
        if (prog >= 100) {
          isHoldingZodiacTableRef.current = false;
          setTableHoldProgress(0);
          showZodiacTable();
        }
      }

      // Perform center targeting raycast in Fly Mode
      performCenterTargeting();

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      try {
        renderer.dispose();
        renderer.forceContextLoss();
      } catch (err) {}
    };
  }, []);

  // Updates Camera Orientation based on Yaw & Pitch
  const updateCameraOrientation = () => {
    if (!cameraRef.current) return;
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.y = cameraYawRef.current;
    euler.x = cameraPitchRef.current;
    cameraRef.current.quaternion.setFromEuler(euler);
  };

  // Camera Motion — WASD: horizontal XZ pan | Mouse drag: look rotation | Scroll: zoom
  const updateCameraMotion = (delta: number) => {
    if (!cameraRef.current) return;

    // Handle Active Fast Travel Tween
    if (tweenTargetRef.current && tweenTargetRef.current.active) {
      const tween = tweenTargetRef.current;
      tween.elapsed += delta;
      const t = Math.min(1, tween.elapsed / tween.duration);
      const ease = 1 - Math.pow(1 - t, 3);

      cameraRef.current.position.lerpVectors(tween.startPos, tween.pos, ease);
      cameraYawRef.current = THREE.MathUtils.lerp(tween.startYaw, tween.yaw, ease);
      cameraPitchRef.current = THREE.MathUtils.lerp(tween.startPitch, tween.pitch, ease);
      updateCameraOrientation();

      if (t >= 1) tween.active = false;
      setCameraCoords({
        x: cameraRef.current.position.x,
        y: cameraRef.current.position.y,
        z: cameraRef.current.position.z
      });
      return;
    }

    if (navMode === 'fly') {
      const keys = keysPressedRef.current;
      const speedMultiplier = (keys['ShiftLeft'] || keys['ShiftRight'] || flySpeed > 1) ? 3.0 : 1.0;
      const baseSpeed = 20 * speedMultiplier;

      // ── WASD: horizontal XZ movement only (decoupled from camera pitch) ──
      // Use ONLY the yaw angle to compute forward/right vectors on the XZ plane.
      // This means W/S push you forward/backward across the orbital plane —
      // NOT diving/climbing with the camera's look direction like an FPS.
      const yaw = cameraYawRef.current;
      const fwdX = -Math.sin(yaw);   // forward in XZ (yaw-only)
      const fwdZ = -Math.cos(yaw);
      const rightX = Math.cos(yaw);  // strafe right in XZ
      const rightZ = -Math.sin(yaw);

      let moveX = 0, moveZ = 0, moveY = 0;

      if (keys['KeyW'] || keys['ArrowUp'])   { moveX += fwdX;   moveZ += fwdZ;   }
      if (keys['KeyS'] || keys['ArrowDown']) { moveX -= fwdX;   moveZ -= fwdZ;   }
      if (keys['KeyA'] || keys['ArrowLeft']) { moveX -= rightX; moveZ -= rightZ; }
      if (keys['KeyD'] || keys['ArrowRight']){ moveX += rightX; moveZ += rightZ; }

      // Vertical: Space/E to ascend, Q/C to descend
      if (keys['Space'] || keys['KeyE']) moveY += 1;
      if (keys['KeyQ']  || keys['KeyC']) moveY -= 1;

      const len = Math.sqrt(moveX * moveX + moveZ * moveZ + moveY * moveY);
      if (len > 0) {
        velocityRef.current.x += (moveX / len) * baseSpeed * delta * 5;
        velocityRef.current.y += (moveY / len) * baseSpeed * delta * 5;
        velocityRef.current.z += (moveZ / len) * baseSpeed * delta * 5;
      }

      // Smooth exponential friction / damping
      velocityRef.current.multiplyScalar(Math.pow(0.04, delta));

      cameraRef.current.position.addScaledVector(velocityRef.current, delta);

      // Clamp within solar system bounds
      cameraRef.current.position.x = THREE.MathUtils.clamp(cameraRef.current.position.x, -130, 130);
      cameraRef.current.position.y = THREE.MathUtils.clamp(cameraRef.current.position.y, -80, 80);
      cameraRef.current.position.z = THREE.MathUtils.clamp(cameraRef.current.position.z, -130, 130);

      updateCameraOrientation();
      setCameraCoords({
        x: cameraRef.current.position.x,
        y: cameraRef.current.position.y,
        z: cameraRef.current.position.z
      });
    } else {
      // Orbit Mode
      const { radius, theta, phi } = orbitSphericalRef.current;
      const x = orbitTargetRef.current.x + radius * Math.sin(phi) * Math.sin(theta);
      const y = orbitTargetRef.current.y + radius * Math.cos(phi);
      const z = orbitTargetRef.current.z + radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.position.set(x, y, z);
      cameraRef.current.lookAt(orbitTargetRef.current);
      setCameraCoords({ x, y, z });
    }
  };


  // Perform Raycasting from Screen Center in Fly Mode
  const performCenterTargeting = () => {
    if (!cameraRef.current || !sceneRef.current) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);

    // 1. Check Node markers
    if (nodeMarkersGroupRef.current) {
      const nodeHits = raycaster.intersectObjects(nodeMarkersGroupRef.current.children, true);
      const hit = nodeHits.find(h => (h.object.userData as any).isOrbitalNode);
      if (hit) {
        const { planetId, nodeIndex } = hit.object.userData;
        const pDef = PLANET_DEFINITIONS[planetId as PlanetId];
        setTargetedObject({
          type: 'node',
          name: `${pDef.name} Node ${nodeIndex} (${nodeIndex * 30}°)`,
          distance: hit.distance
        });
        return;
      }
    }

    // 2. Check Planets
    const planetMeshes = Object.values(planetMeshesRef.current);
    const planetHits = raycaster.intersectObjects(planetMeshes);
    if (planetHits.length > 0) {
      const pId = (planetHits[0].object.userData as any).planetId as PlanetId;
      if (pId) {
        setTargetedObject({
          type: 'planet',
          name: PLANET_DEFINITIONS[pId].name,
          distance: planetHits[0].distance
        });
        return;
      }
    }

    // 3. Check Outer Boundary
    const hitsBoundary = checkBoundaryRaycast(raycaster);
    if (hitsBoundary) {
      setTargetedObject({
        type: 'boundary',
        name: zodiacRevealed ? 'Celestial Zodiac Wheel' : 'Unidentified Outer Barrier',
        distance: 40
      });
      return;
    }

    setTargetedObject(null);
  };

  // Antialiased round star sprite texture — prevents square pixelation on points!
  const createCircularStarTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.18, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.42, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  // Soft volumetric gas cloud puff texture — velvety smooth nebulae with zero square edges!
  const createNebulaGlowTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.60, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  // Zodiac billboard sprite: revealed only after 5s hold; Aries shows '1' badge exclusively.
  // High resolution canvas (512×256) for crisp symbols and clean typography at any distance.
  const createZodiacBillboard = (symbol: string, name: string, isAries: boolean): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 256);

    if (isAries) {
      // Large glowing '1' badge — Aries is the only sign with a number
      const badgeGrd = ctx.createRadialGradient(256, 44, 4, 256, 44, 45);
      badgeGrd.addColorStop(0, 'rgba(2, 132, 199, 0.95)');
      badgeGrd.addColorStop(1, 'rgba(8, 47, 73, 0.6)');
      ctx.fillStyle = badgeGrd;
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(220, 10, 72, 48, 12);
      ctx.fill();
      ctx.stroke();

      // '1' badge text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 14;
      ctx.fillText('1', 256, 34);
      ctx.shadowBlur = 0;
    }

    // Large luminous zodiac symbol (Slightly big for clear identification)
    ctx.fillStyle = isAries ? '#00f8ff' : '#f8fafc';
    ctx.font = `bold ${isAries ? 105 : 95}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = isAries ? '#00f3ff' : '#a855f7';
    ctx.shadowBlur = isAries ? 24 : 18;
    ctx.fillText(symbol, 256, isAries ? 138 : 110);
    ctx.shadowBlur = 0;

    // Constellation name in subtle, clean typography below the symbol
    ctx.fillStyle = isAries ? '#38bdf8' : '#cbd5e1';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = isAries ? '#00f3ff' : '#a855f7';
    ctx.shadowBlur = 8;
    ctx.fillText(name.toUpperCase(), 256, isAries ? 210 : 188);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(mat);
    // Slightly big as requested by the user
    sprite.scale.set(7.0, 3.5, 1);
    return sprite;
  };



  // Photorealistic Deep-Space Starfield — pure particle-based, no canvas sphere (prevents pixelation)
  const createStarfield = (scene: THREE.Scene) => {
    // Set a very deep navy scene background — will show between stars
    scene.background = new THREE.Color(0x00010c);

    // ── MAIN STAR FIELD (14,000 stars across all spectral classes) ────────
    const starCount = 14000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      // 40% of stars concentrated in a tilted galactic band
      const isMilkyWay = Math.random() < 0.40;
      const finalPhi = isMilkyWay
        ? phi * 0.18 + Math.PI * 0.5 * 0.82 + (Math.random() - 0.5) * 0.28
        : phi;

      const radius = 600 + Math.random() * 500;
      positions[i * 3]     = radius * Math.sin(finalPhi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(finalPhi);
      positions[i * 3 + 2] = radius * Math.sin(finalPhi) * Math.sin(theta);

      // Accurate stellar spectral colour population
      const spectral = Math.random();
      if (spectral < 0.03) {
        colors[i*3] = 0.65; colors[i*3+1] = 0.82; colors[i*3+2] = 1.00; // O: hot blue-white
      } else if (spectral < 0.10) {
        colors[i*3] = 0.80; colors[i*3+1] = 0.90; colors[i*3+2] = 1.00; // B: blue-white
      } else if (spectral < 0.20) {
        colors[i*3] = 0.97; colors[i*3+1] = 0.97; colors[i*3+2] = 1.00; // A: white
      } else if (spectral < 0.38) {
        colors[i*3] = 1.00; colors[i*3+1] = 0.95; colors[i*3+2] = 0.75; // F/G: yellow-white (Sol type)
      } else if (spectral < 0.62) {
        colors[i*3] = 1.00; colors[i*3+1] = 0.68; colors[i*3+2] = 0.38; // K: orange
      } else {
        colors[i*3] = 1.00; colors[i*3+1] = 0.38; colors[i*3+2] = 0.20; // M: red dwarf (most common)
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const starTex = createCircularStarTexture();

    // Main faint stars (smooth circular pinpoints of light, zero pixelation)
    scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({
      size: 2.2,
      map: starTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })));

    // ── BRIGHT GIANT / SUPERGIANT STARS (200) — large glowing round orbs ──────
    const brightCount = 200;
    const bGeo = new THREE.BufferGeometry();
    const bPos = new Float32Array(brightCount * 3);
    const bCol = new Float32Array(brightCount * 3);
    for (let i = 0; i < brightCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 500 + Math.random() * 250;
      bPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      bPos[i*3+1] = r * Math.cos(phi);
      bPos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
      const c = Math.random();
      if (c < 0.35) { bCol[i*3] = 0.70; bCol[i*3+1] = 0.85; bCol[i*3+2] = 1.00; }   // blue supergiant
      else if (c < 0.6) { bCol[i*3] = 1.00; bCol[i*3+1] = 0.95; bCol[i*3+2] = 0.80; } // yellow giant
      else if (c < 0.85) { bCol[i*3] = 1.00; bCol[i*3+1] = 0.60; bCol[i*3+2] = 0.30; } // orange giant
      else { bCol[i*3] = 1.00; bCol[i*3+1] = 0.25; bCol[i*3+2] = 0.15; }               // red supergiant
    }
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
    bGeo.setAttribute('color',    new THREE.BufferAttribute(bCol, 3));
    scene.add(new THREE.Points(bGeo, new THREE.PointsMaterial({
      size: 7.0,
      map: starTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })));

    // ── MILKY WAY BAND — dense cloud of faint distant stars ──────────────
    const mwCount = 5000;
    const mwGeo = new THREE.BufferGeometry();
    const mwPos = new Float32Array(mwCount * 3);
    const mwCol = new Float32Array(mwCount * 3);
    for (let i = 0; i < mwCount; i++) {
      // Concentrate tightly in the galactic equatorial belt
      const theta = Math.random() * Math.PI * 2;
      const bandPhi = Math.PI / 2 + (Math.random() - 0.5) * 0.45;
      const r = 700 + Math.random() * 300;
      mwPos[i*3]   = r * Math.sin(bandPhi) * Math.cos(theta);
      mwPos[i*3+1] = r * Math.cos(bandPhi);
      mwPos[i*3+2] = r * Math.sin(bandPhi) * Math.sin(theta);
      // Warm white to pale blue-white
      const t = Math.random();
      mwCol[i*3] = 0.85 + t * 0.15; mwCol[i*3+1] = 0.88 + t * 0.10; mwCol[i*3+2] = 0.92 + t * 0.08;
    }
    mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
    mwGeo.setAttribute('color',    new THREE.BufferAttribute(mwCol, 3));
    scene.add(new THREE.Points(mwGeo, new THREE.PointsMaterial({
      size: 1.4,
      map: starTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })));
  };


  // Volumetric Cosmic Gas Dust Nebulae (multi-layer particle clouds with soft glow sprites)
  const createCosmicNebula = (scene: THREE.Scene) => {
    const nebulaTex = createNebulaGlowTexture();
    const nebulaClouds = [
      // Massive purple nebula — galactic core-ish glow far right
      { color: 0x9333ea, center: new THREE.Vector3(200, 40, -280), size: 180, particles: 2000, opacity: 0.16 },
      // Electric cyan nebula — left wing
      { color: 0x06b6d4, center: new THREE.Vector3(-240, -30, 220), size: 200, particles: 1800, opacity: 0.14 },
      // Magenta/pink star formation region
      { color: 0xec4899, center: new THREE.Vector3(-180, 60, -240), size: 150, particles: 1500, opacity: 0.13 },
      // Golden amber stellar nursery
      { color: 0xf59e0b, center: new THREE.Vector3(260, -50, 180), size: 170, particles: 1400, opacity: 0.13 },
      // Deep blue ionized hydrogen
      { color: 0x3b82f6, center: new THREE.Vector3(180, -80, 260), size: 140, particles: 1100, opacity: 0.11 },
      // Subtle green nebula (OIII emission lines)
      { color: 0x10b981, center: new THREE.Vector3(-300, 20, -100), size: 120, particles: 800,  opacity: 0.09 },
      // Dense white stellar cluster
      { color: 0xf8fafc, center: new THREE.Vector3(-150, 90, -300), size: 80,  particles: 500,  opacity: 0.18 },
    ];

    nebulaClouds.forEach(cloud => {
      // Layer 1: Large, diffuse outer cloud
      const geom1 = new THREE.BufferGeometry();
      const pos1 = new Float32Array(cloud.particles * 3);
      for (let i = 0; i < cloud.particles; i++) {
        const r = Math.random(); const s = Math.pow(r, 0.5); // non-uniform — denser at edges
        const u = (Math.random() - 0.5) * cloud.size * s;
        const v = (Math.random() - 0.5) * cloud.size * 0.42 * s;
        const w = (Math.random() - 0.5) * cloud.size * s;
        pos1[i*3]   = cloud.center.x + u;
        pos1[i*3+1] = cloud.center.y + v;
        pos1[i*3+2] = cloud.center.z + w;
      }
      geom1.setAttribute('position', new THREE.BufferAttribute(pos1, 3));
      scene.add(new THREE.Points(geom1, new THREE.PointsMaterial({
        color: cloud.color, size: 12.0, map: nebulaTex, transparent: true,
        opacity: cloud.opacity, blending: THREE.AdditiveBlending, depthWrite: false
      })));

      // Layer 2: Denser inner core (smaller, brighter)
      const innerCount = Math.floor(cloud.particles * 0.3);
      const geom2 = new THREE.BufferGeometry();
      const pos2 = new Float32Array(innerCount * 3);
      for (let i = 0; i < innerCount; i++) {
        pos2[i*3]   = cloud.center.x + (Math.random() - 0.5) * cloud.size * 0.4;
        pos2[i*3+1] = cloud.center.y + (Math.random() - 0.5) * cloud.size * 0.18;
        pos2[i*3+2] = cloud.center.z + (Math.random() - 0.5) * cloud.size * 0.4;
      }
      geom2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
      scene.add(new THREE.Points(geom2, new THREE.PointsMaterial({
        color: cloud.color, size: 6.0, map: nebulaTex, transparent: true,
        opacity: cloud.opacity * 2.0, blending: THREE.AdditiveBlending, depthWrite: false
      })));
    });
  };

  // Floating Cosmic Dust Motes drifting around the player
  const createSpaceDust = (scene: THREE.Scene) => {
    const count = 1400;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 1.2,
      map: createCircularStarTexture(),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geom, mat);
    scene.add(points);
    spaceDustPointsRef.current = points;
  };

  // Photorealistic Sun with corona, lens flare halo, and plasma jets
  const createSun = (scene: THREE.Scene) => {
    // Core solar sphere — MeshBasicMaterial so it self-illuminates (not shaded by lights)
    const sunGeom = new THREE.SphereGeometry(3.4, 64, 64);
    const sunTex = getProceduralPlanetTexture('sun');
    const sunMesh = new THREE.Mesh(sunGeom, new THREE.MeshBasicMaterial({ map: sunTex }));
    scene.add(sunMesh);

    // Innermost corona (orange-yellow glow)
    const corona1 = new THREE.Mesh(
      new THREE.SphereGeometry(4.6, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.22, side: THREE.BackSide, blending: THREE.AdditiveBlending })
    );
    scene.add(corona1);

    // Mid corona (pale yellow)
    const corona2 = new THREE.Mesh(
      new THREE.SphereGeometry(6.2, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7, transparent: true, opacity: 0.10, side: THREE.BackSide, blending: THREE.AdditiveBlending })
    );
    scene.add(corona2);

    // Outer corona haze (very faint white)
    const corona3 = new THREE.Mesh(
      new THREE.SphereGeometry(9.0, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04, side: THREE.BackSide, blending: THREE.AdditiveBlending })
    );
    scene.add(corona3);

    // Solar flare particle ring (additive particles orbiting Sun)
    const flareCount = 500;
    const flareGeo = new THREE.BufferGeometry();
    const flarePos = new Float32Array(flareCount * 3);
    for (let i = 0; i < flareCount; i++) {
      const angle = (i / flareCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const r = 3.8 + Math.random() * 2.2;
      const y = (Math.random() - 0.5) * 1.5;
      flarePos[i*3]   = r * Math.cos(angle);
      flarePos[i*3+1] = y;
      flarePos[i*3+2] = r * Math.sin(angle);
    }
    flareGeo.setAttribute('position', new THREE.BufferAttribute(flarePos, 3));
    scene.add(new THREE.Points(flareGeo, new THREE.PointsMaterial({
      color: 0xfde68a, size: 1.5, map: createCircularStarTexture(), transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false
    })));
  };

  // Photorealistic Planets with bump maps, atmosphere halos, and vibrant materials
  const createPlanetarySystem = (scene: THREE.Scene) => {
    const planetIds: PlanetId[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

    // Emissive tints (faint self-glow to boost dark-side visibility)
    const emissiveMap: Partial<Record<PlanetId, { color: number; intensity: number }>> = {
      earth:   { color: 0x001830, intensity: 0.25 },
      venus:   { color: 0x1a1000, intensity: 0.15 },
      neptune: { color: 0x000820, intensity: 0.20 },
      uranus:  { color: 0x001518, intensity: 0.15 },
    };

    // Atmospheric glow halos
    const atmosphereMap: Partial<Record<PlanetId, { color: number; scale: number; opacity: number }>> = {
      earth:   { color: 0x38bdf8, scale: 1.18, opacity: 0.50 },
      venus:   { color: 0xfde68a, scale: 1.16, opacity: 0.38 },
      mars:    { color: 0xfca5a5, scale: 1.14, opacity: 0.28 },
      jupiter: { color: 0xfde68a, scale: 1.08, opacity: 0.18 },
      saturn:  { color: 0xfde68a, scale: 1.08, opacity: 0.15 },
      uranus:  { color: 0x67e8f9, scale: 1.14, opacity: 0.32 },
      neptune: { color: 0x60a5fa, scale: 1.16, opacity: 0.40 },
    };

    planetIds.forEach(id => {
      const def = PLANET_DEFINITIONS[id];

      // ── Orbit ring ───────────────────────────────────────────
      const orbitPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 256; i++) {
        const theta = (i / 256) * Math.PI * 2;
        orbitPts.push(new THREE.Vector3(def.orbitalRadius * Math.cos(theta), 0, -def.orbitalRadius * Math.sin(theta)));
      }
      const isEarth = id === 'earth';
      const orbitMat = new THREE.LineBasicMaterial({
        color: isEarth ? 0x00f3ff : 0x334155,
        transparent: true,
        opacity: isEarth ? 0.9 : 0.28,
      });
      const orbitLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitPts), orbitMat);
      scene.add(orbitLine);
      orbitLineMeshesRef.current[id] = orbitLine;

      // ── Planet globe ─────────────────────────────────────────
      const texture = getProceduralPlanetTexture(def.textureType);
      const bumpTex = (id === 'mercury' || id === 'mars' || id === 'earth')
        ? getProceduralBumpTexture(def.textureType)
        : undefined;

      const emissive = emissiveMap[id];
      const planetMat = new THREE.MeshStandardMaterial({
        map: texture,
        bumpMap: bumpTex,
        bumpScale: id === 'mercury' ? 0.6 : id === 'mars' ? 0.4 : 0.2,
        roughness: id === 'mercury' ? 0.85 : id === 'earth' ? 0.55 : 0.4,
        metalness: id === 'mercury' ? 0.35 : 0.08,
        emissive: emissive ? new THREE.Color(emissive.color) : new THREE.Color(0x000000),
        emissiveIntensity: emissive ? emissive.intensity : 0,
      });

      // 64-segment sphere for high quality silhouette
      const planetGeom = new THREE.SphereGeometry(def.size, 64, 64);
      const planetMesh = new THREE.Mesh(planetGeom, planetMat);
      planetMesh.userData = { planetId: id };

      // ── Rings ─────────────────────────────────────────────
      if (def.hasRings && def.ringInnerRadius && def.ringOuterRadius) {
        const ringGeom = new THREE.RingGeometry(def.ringInnerRadius, def.ringOuterRadius, 128, 4);
        const ringTex = getProceduralRingTexture(id as 'saturn' | 'uranus');
        const ringMat = new THREE.MeshBasicMaterial({
          map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: id === 'saturn' ? 1.0 : 0.85,
          blending: THREE.NormalBlending
        });
        const ringsMesh = new THREE.Mesh(ringGeom, ringMat);
        ringsMesh.rotation.x = id === 'uranus' ? Math.PI / 2.1 : Math.PI / 2.4;
        if (id === 'uranus') ringsMesh.rotation.z = Math.PI / 4;
        planetMesh.add(ringsMesh);
      }

      // ── Atmospheric Fresnel Halo ─────────────────────────────
      const atmos = atmosphereMap[id];
      if (atmos) {
        const haloGeom = new THREE.SphereGeometry(def.size * atmos.scale, 32, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: atmos.color, transparent: true, opacity: atmos.opacity,
          side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
        });
        planetMesh.add(new THREE.Mesh(haloGeom, haloMat));

        // Secondary thinner halo for depth
        const halo2Geom = new THREE.SphereGeometry(def.size * (atmos.scale + 0.08), 24, 24);
        const halo2Mat = new THREE.MeshBasicMaterial({
          color: atmos.color, transparent: true, opacity: atmos.opacity * 0.35,
          side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
        });
        planetMesh.add(new THREE.Mesh(halo2Geom, halo2Mat));
      }

      // Place at initial node 0
      planetMesh.position.set(def.orbitalRadius, 0, 0);
      scene.add(planetMesh);
      planetMeshesRef.current[id] = planetMesh;
    });
  };

  // Build Dynamic Celestial Boundary (Clean, uncluttered, no objects in zodiac orbit)
  const createCelestialBoundary = (scene: THREE.Scene) => {
    const boundaryGroup = new THREE.Group();
    scene.add(boundaryGroup);
    boundaryGroupRef.current = boundaryGroup;

    const R = CELESTIAL_BOUNDARY_RADIUS;
    const starTex = createCircularStarTexture();

    // ── CLEAN OUTER GLOWING ORBIT RINGS (NO CLUTTER / NO BULKY OBJECTS) ───
    for (let ring = 0; ring < 2; ring++) {
      const rOffset = ring * 0.4 - 0.2;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 256; i++) {
        const theta = (i / 256) * Math.PI * 2;
        pts.push(new THREE.Vector3((R + rOffset) * Math.cos(theta), 0, -(R + rOffset) * Math.sin(theta)));
      }
      const ringMat = new THREE.LineBasicMaterial({
        color: ring === 0 ? 0x00f3ff : 0x6366f1,
        transparent: true,
        opacity: ring === 0 ? 0.65 : 0.25
      });
      boundaryGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat));
    }

    // ── SUBTLE TRANSLUCENT ENERGY VEIL ─────────
    const bandGeom = new THREE.CylinderGeometry(R + 0.3, R - 0.3, 1.6, 128, 1, true);
    const bandMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, transparent: true, opacity: 0.05, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const bandMesh = new THREE.Mesh(bandGeom, bandMat);
    boundaryGroup.add(bandMesh);
    boundaryWallMeshRef.current = bandMesh;

    // ── SUBTLE NON-PIXELATED DYNAMIC ENERGY STREAM (smooth round particles) ──
    const pCount = 360;
    const pGeom = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const theta = (i / pCount) * Math.PI * 2;
      const rOff = (Math.random() - 0.5) * 0.8;
      pPos[i*3]   = (R + rOff) * Math.cos(theta);
      pPos[i*3+1] = (Math.random() - 0.5) * 1.0;
      pPos[i*3+2] = -(R + rOff) * Math.sin(theta);
      if (i % 2 === 0) { pColors[i*3] = 0.0; pColors[i*3+1] = 0.95; pColors[i*3+2] = 1.0; }
      else { pColors[i*3] = 0.5; pColors[i*3+1] = 0.2; pColors[i*3+2] = 0.95; }
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeom.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    const boundaryParticles = new THREE.Points(pGeom, new THREE.PointsMaterial({
      size: 1.2, map: starTex, vertexColors: true, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    boundaryGroup.add(boundaryParticles);
    boundaryParticlesRef.current = boundaryParticles;

    // ── DISCOVERY SCANNER ARC (Pulses when holding for 5 seconds) ─────────
    const scanGeom = new THREE.RingGeometry(R - 1.5, R + 1.5, 96);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff, transparent: true, opacity: 0, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const scanMesh = new THREE.Mesh(scanGeom, scanMat);
    scanMesh.rotation.x = Math.PI / 2;
    boundaryGroup.add(scanMesh);
    boundaryScannerMeshRef.current = scanMesh;

    // ── DEDICATED ZODIAC SPRITES GROUP ────────────────────────────────────
    // SEEN ONLY IF THE USER HOLDS FOR 5 SECONDS! (controlled by zodiacRevealed)
    const zodiacGroup = new THREE.Group();
    zodiacGroup.visible = zodiacRevealed;
    boundaryGroup.add(zodiacGroup);
    zodiacGroupRef.current = zodiacGroup;

    for (let i = 0; i < 12; i++) {
      const sector = ZODIAC_SECTORS[i];
      const midAngleDeg = sector.startAngleDeg + 15;
      const midRad = (midAngleDeg * Math.PI) / 180;
      const bx = R * Math.cos(midRad);
      const bz = -R * Math.sin(midRad);

      const isAries = sector.id === 0;
      const billboard = createZodiacBillboard(sector.symbol, sector.name, isAries);
      billboard.position.set(bx, 1.8, bz);
      // Slightly big for clear readability as requested
      billboard.scale.set(7.0, 3.5, 1);
      zodiacGroup.add(billboard);
    }
  };


  // Synchronize 3D Planet Positions
  useEffect(() => {
    Object.entries(planets).forEach(([id, pState]) => {
      const mesh = planetMeshesRef.current[id];
      if (!mesh) return;

      if (pState.selectedNode !== null) {
        mesh.visible = true;
        const pos3D = getHeliocentricPosition3D(pState.orbitalRadius, pState.selectedNode);
        mesh.position.set(pos3D.x, 0, pos3D.z);
      } else {
        const pos3D = getHeliocentricPosition3D(pState.orbitalRadius, 0);
        mesh.position.set(pos3D.x, 0, pos3D.z);
        mesh.visible = false;
      }
    });

    // Highlight selected planet orbit
    Object.entries(orbitLineMeshesRef.current).forEach(([id, line]) => {
      const isSelected = id === selectedPlanetId;
      const isEarth = id === 'earth';
      const mat = line.material as THREE.LineBasicMaterial;
      if (isSelected) {
        mat.color.setHex(0x00f3ff);
        mat.opacity = 0.95;
      } else if (isEarth) {
        mat.color.setHex(0x38bdf8);
        mat.opacity = 0.65;
      } else {
        mat.color.setHex(0x334155);
        mat.opacity = 0.25;
      }
    });
  }, [planets, selectedPlanetId]);

  // Synchronize Zodiac signs visibility (Seen only if user held for 5 seconds!)
  useEffect(() => {
    if (zodiacGroupRef.current) {
      zodiacGroupRef.current.visible = zodiacRevealed;
    }
  }, [zodiacRevealed]);

  // Update 3D Holographic Orbital Nodes
  useEffect(() => {
    if (!nodeMarkersGroupRef.current || !sceneRef.current) return;
    const group = nodeMarkersGroupRef.current;

    while (group.children.length > 0) {
      const child = group.children.pop();
      if (child && (child as any).geometry) (child as any).geometry.dispose();
    }

    if (!selectedPlanetId || selectedPlanetId === 'earth') return;

    const pState = planets[selectedPlanetId];
    if (!pState) return;

    const radius = pState.orbitalRadius;

    for (let nodeIdx = 0; nodeIdx < 12; nodeIdx++) {
      const pos = getHeliocentricPosition3D(radius, nodeIdx);
      const isCurrentPlaced = pState.selectedNode === nodeIdx;

      // 1. Vertical Energy Beam at each 3D node
      const beamGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.0, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: isCurrentPlaced ? 0x00f3ff : 0x64748b,
        transparent: true,
        opacity: isCurrentPlaced ? 0.9 : 0.35
      });
      const beamMesh = new THREE.Mesh(beamGeom, beamMat);
      beamMesh.position.set(pos.x, 0, pos.z);
      group.add(beamMesh);

      // 2. Clickable 3D Node Orb
      const nodeGeom = new THREE.SphereGeometry(isCurrentPlaced ? 0.6 : 0.4, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: isCurrentPlaced ? 0x00f3ff : 0x94a3b8,
        transparent: true,
        opacity: isCurrentPlaced ? 1.0 : 0.65
      });
      const nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
      nodeMesh.position.set(pos.x, 0, pos.z);
      nodeMesh.userData = { isOrbitalNode: true, nodeIndex: nodeIdx, planetId: selectedPlanetId };
      group.add(nodeMesh);

      // 3. Ground holographic circular target
      const ringGeom = new THREE.RingGeometry(0.7, 0.9, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isCurrentPlaced ? 0x00f3ff : 0x475569,
        transparent: true,
        opacity: isCurrentPlaced ? 0.85 : 0.4,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.set(pos.x, 0, pos.z);
      group.add(ringMesh);
    }
  }, [selectedPlanetId, planets]);

  // Update Observation Sightline Ray
  useEffect(() => {
    if (!observationRayGroupRef.current || !sceneRef.current) return;
    const group = observationRayGroupRef.current;

    while (group.children.length > 0) {
      const child = group.children.pop();
      if (child && (child as any).geometry) (child as any).geometry.dispose();
    }

    if (!observationActive || !selectedPlanetId || selectedPlanetId === 'earth') return;

    const pState = planets[selectedPlanetId];
    const eState = planets.earth;
    if (pState && pState.selectedNode !== null && eState && eState.selectedNode !== null) {
      const sightline = calculateSightlineIntersection(
        eState.selectedNode,
        eState.orbitalRadius,
        pState.selectedNode,
        pState.orbitalRadius,
        CELESTIAL_BOUNDARY_RADIUS,
        settings.zodiacAngularOffsetDeg
      );

      // Core Laser Line
      const points = [
        new THREE.Vector3(sightline.earth3D.x, sightline.earth3D.y, sightline.earth3D.z),
        new THREE.Vector3(sightline.planet3D.x, sightline.planet3D.y, sightline.planet3D.z),
        new THREE.Vector3(sightline.boundary3D.x, sightline.boundary3D.y, sightline.boundary3D.z)
      ];

      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.95,
        linewidth: 3
      });
      const line = new THREE.Line(lineGeom, lineMat);
      group.add(line);

      // Outer Glowing Cylinder along ray
      const start = new THREE.Vector3(sightline.earth3D.x, sightline.earth3D.y, sightline.earth3D.z);
      const end = new THREE.Vector3(sightline.boundary3D.x, sightline.boundary3D.y, sightline.boundary3D.z);
      const distance = start.distanceTo(end);
      const cylinderGeom = new THREE.CylinderGeometry(0.12, 0.12, distance, 16);
      const cylinderMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const cylinder = new THREE.Mesh(cylinderGeom, cylinderMat);
      cylinder.position.copy(start).add(end).multiplyScalar(0.5);
      cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
      group.add(cylinder);

      // Boundary Impact Shockwave Ring
      const impactGeom = new THREE.RingGeometry(1.0, 1.6, 32);
      const impactMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
      });
      const impactMesh = new THREE.Mesh(impactGeom, impactMat);
      impactMesh.rotation.x = Math.PI / 2;
      impactMesh.position.set(sightline.boundary3D.x, sightline.boundary3D.y, sightline.boundary3D.z);
      group.add(impactMesh);
    }
  }, [observationActive, selectedPlanetId, planets, settings.zodiacAngularOffsetDeg]);

  // Handle Pointer Events (Mouse Look, Raycast, Dragging)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    if (!canvasRef.current || !cameraRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // 1. Check if clicking an Orbital Node
    if (nodeMarkersGroupRef.current) {
      const nodeHits = raycaster.intersectObjects(nodeMarkersGroupRef.current.children, true);
      const hitNode = nodeHits.find(h => (h.object.userData as any).isOrbitalNode);
      if (hitNode) {
        const { planetId, nodeIndex } = hitNode.object.userData;
        setPlanetNode(planetId, nodeIndex);
        return;
      }
    }

    // 2. Check if clicking a Planet (Select and begin 3D Dragging)
    const planetMeshes = Object.values(planetMeshesRef.current);
    const planetHits = raycaster.intersectObjects(planetMeshes);
    if (planetHits.length > 0) {
      const hitPlanetId = (planetHits[0].object.userData as any).planetId as PlanetId;
      if (hitPlanetId) {
        selectPlanet(hitPlanetId);
        if (hitPlanetId !== 'earth') {
          isDraggingPlanet3DRef.current = hitPlanetId;
        }
        return;
      }
    }

    // 3. Check if clicking Outer Boundary
    const hitsBoundary = checkBoundaryRaycast(raycaster);
    if (hitsBoundary) {
      if (!zodiacRevealed) {
        // Phase 1: 15-second boundary hold (first 10s silent, last 5s warnings)
        isHoldingBoundaryRef.current = true;
        holdStartTimeRef.current = Date.now();
      } else {
        // Phase 2: After zodiac revealed, hold 10 seconds to reveal planetary reference table
        isHoldingZodiacTableRef.current = true;
        tableHoldStartRef.current = Date.now();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;

    const deltaX = e.clientX - lastPointerPosRef.current.x;
    const deltaY = e.clientY - lastPointerPosRef.current.y;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    // If dragging a planet in 3D: snap along orbit!
    if (isDraggingPlanet3DRef.current && canvasRef.current && cameraRef.current) {
      const pId = isDraggingPlanet3DRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      // Raycast to Y=0 plane
      const ray = raycaster.ray;
      if (Math.abs(ray.direction.y) > 0.0001) {
        const t = -ray.origin.y / ray.direction.y;
        if (t > 0) {
          const hitX = ray.origin.x + t * ray.direction.x;
          const hitZ = ray.origin.z + t * ray.direction.z;

          // Compute angle in degrees [0, 360)
          let angleDeg = (Math.atan2(-hitZ, hitX) * 180) / Math.PI;
          if (angleDeg < 0) angleDeg += 360;

          const nearestNode = Math.round(angleDeg / 30) % 12;
          if (planets[pId].selectedNode !== nearestNode) {
            setPlanetNode(pId, nearestNode);
          }
        }
      }
      return;
    }

    // Camera Look / Rotation
    if (navMode === 'fly') {
      cameraYawRef.current -= deltaX * 0.004;
      cameraPitchRef.current = THREE.MathUtils.clamp(
        cameraPitchRef.current - deltaY * 0.004,
        -Math.PI / 2.1,
        Math.PI / 2.1
      );
      updateCameraOrientation();
    } else {
      orbitSphericalRef.current.theta -= deltaX * 0.005;
      orbitSphericalRef.current.phi = THREE.MathUtils.clamp(
        orbitSphericalRef.current.phi - deltaY * 0.005,
        0.05,
        Math.PI / 2 - 0.05
      );
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    isDraggingPlanet3DRef.current = null;
    if (isHoldingBoundaryRef.current) {
      isHoldingBoundaryRef.current = false;
      setDiscoveryProgress(0);
    }
    if (isHoldingZodiacTableRef.current) {
      isHoldingZodiacTableRef.current = false;
      setTableHoldProgress(0);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (navMode === 'orbit') {
      // Orbit mode: zoom = change orbital radius
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.93;
      orbitSphericalRef.current.radius = THREE.MathUtils.clamp(
        orbitSphericalRef.current.radius * zoomFactor,
        15,
        180
      );
    } else {
      // Fly mode: scroll = zoom (move camera along its horizontal forward direction only)
      // We project the camera's look onto the XZ plane so scroll stays flat
      // (no vertical drift when pitched up/down — purely changes distance to scene)
      if (!cameraRef.current) return;
      const yaw = cameraYawRef.current;
      const flatForward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const zoomStrength = e.deltaY < 0 ? 14 : -14;
      velocityRef.current.addScaledVector(flatForward, zoomStrength);
    }
  };


  const checkBoundaryRaycast = (raycaster: THREE.Raycaster): boolean => {
    const ray = raycaster.ray;
    if (Math.abs(ray.direction.y) < 0.0001) return false;
    const t = -ray.origin.y / ray.direction.y;
    if (t < 0) return false;
    const hitX = ray.origin.x + t * ray.direction.x;
    const hitZ = ray.origin.z + t * ray.direction.z;
    const dist = Math.sqrt(hitX * hitX + hitZ * hitZ);
    return Math.abs(dist - CELESTIAL_BOUNDARY_RADIUS) < 3.5;
  };

  // Fast Travel Camera Tweening Function
  const handleFlyTo = (target: 'sun' | 'earth' | PlanetId | 'reset') => {
    if (!cameraRef.current) return;

    soundFx.playPlanetSelect();
    let targetPos = new THREE.Vector3(30, 20, 45);
    let targetYaw = -Math.PI / 4;
    let targetPitch = -0.35;

    if (target === 'earth') {
      const eNode = planets.earth.selectedNode ?? 3;
      const ePos = getHeliocentricPosition3D(PLANET_DEFINITIONS.earth.orbitalRadius, eNode);
      // Stand on Earth vantage point: slightly above Earth surface, looking out into outer space!
      targetPos = new THREE.Vector3(ePos.x, 1.8, ePos.z);
      // Look outward away from Sun
      targetYaw = Math.atan2(-ePos.x, -ePos.z);
      targetPitch = 0.05;
    } else if (target === 'sun') {
      targetPos = new THREE.Vector3(0, 4, 14);
      targetYaw = Math.PI;
      targetPitch = -0.15;
    } else if (target === 'reset') {
      targetPos = new THREE.Vector3(35, 25, 55);
      targetYaw = -Math.PI / 4;
      targetPitch = -0.4;
    } else {
      // Planet
      const pState = planets[target];
      if (pState) {
        const node = pState.selectedNode ?? 0;
        const pos = getHeliocentricPosition3D(pState.orbitalRadius, node);
        targetPos = new THREE.Vector3(pos.x + 3, 2.5, pos.z + 4);
        targetYaw = Math.atan2(pos.x - targetPos.x, pos.z - targetPos.z);
        targetPitch = -0.2;
      }
    }

    tweenTargetRef.current = {
      pos: targetPos,
      yaw: targetYaw,
      pitch: targetPitch,
      active: true,
      duration: 1.2,
      elapsed: 0,
      startPos: cameraRef.current.position.clone(),
      startYaw: cameraYawRef.current,
      startPitch: cameraPitchRef.current
    };
  };

  // Virtual Directional Movement for Mobile / Touch
  const handleVirtualMove = (direction: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down') => {
    if (!cameraRef.current) return;
    const move = new THREE.Vector3();
    if (direction === 'forward') move.z -= 15;
    if (direction === 'backward') move.z += 15;
    if (direction === 'left') move.x -= 15;
    if (direction === 'right') move.x += 15;
    if (direction === 'up') move.y += 15;
    if (direction === 'down') move.y -= 15;

    move.applyQuaternion(cameraRef.current.quaternion);
    velocityRef.current.add(move);
  };

  if (webglError) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-space-950 p-6 text-center select-none">
        <div className="p-4 rounded-2xl bg-space-900/90 border border-cyan-500/40 max-w-md shadow-[0_0_50px_rgba(0,243,255,0.25)] flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
            <Compass className="w-6 h-6 animate-spin-very-slow" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-orbit font-bold text-lg text-slate-100">
              3D HARDWARE ACCELERATION UNAVAILABLE
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Your browser or GPU has disabled or exhausted WebGL context. Seamlessly switch to the high-precision 2D Heliocentric Array.
            </p>
          </div>
          <button
            onClick={() => setViewMode('2d')}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-orbit font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            SWITCH TO 2D HELIOCENTRIC ARRAY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none bg-space-950">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Futuristic Astronaut Visor HUD & Controls */}
      <AstronautHUD
        navMode={navMode}
        setNavMode={setNavMode}
        flySpeed={flySpeed}
        setFlySpeed={setFlySpeed}
        cameraCoords={cameraCoords}
        targetedObject={targetedObject}
        onFlyTo={handleFlyTo}
        onVirtualMove={handleVirtualMove}
        tableHoldProgress={tableHoldProgress}
      />
    </div>
  );
};
