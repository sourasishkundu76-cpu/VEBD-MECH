import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createGearGeometry, createSpringGeometry } from './geometryHelpers';
import {
  MechanicalTelemetry,
  StressTelemetry,
  ThermalTelemetry,
  ViewCameraMode,
  SimulationOverlay,
} from '../../types/physics';
import { CATALOG_PRODUCTS } from '../../data/problems';

interface VendingSceneProps {
  telemetry: MechanicalTelemetry;
  stress: StressTelemetry;
  thermal: ThermalTelemetry;
  cameraMode: ViewCameraMode;
  overlay: SimulationOverlay;
  targetComponent?: string | null;
  onManualCrankDelta?: (deltaAngle: number) => void;
  isSlowMotion: boolean;
}

export const VendingScene: React.FC<VendingSceneProps> = ({
  telemetry,
  stress,
  thermal,
  cameraMode,
  overlay,
  targetComponent,
  onManualCrankDelta,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to dynamic 3D objects for real-time physics transforms
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Dynamic moving meshes
  const crankGroupRef = useRef<THREE.Group | null>(null);
  const inputGearMeshRef = useRef<THREE.Mesh | null>(null);
  const interGearMeshRef = useRef<THREE.Group | null>(null);
  const outputGearMeshRef = useRef<THREE.Mesh | null>(null);
  const flywheelGroupRef = useRef<THREE.Group | null>(null);
  const pawlMeshRef = useRef<THREE.Mesh | null>(null);
  const dispenserCarouselRef = useRef<THREE.Group | null>(null);
  const springMeshRef = useRef<THREE.Mesh | null>(null);
  const counterweightArmRef = useRef<THREE.Group | null>(null);
  const fallingProductMeshRef = useRef<THREE.Group | null>(null);
  const trayFlapDoorRef = useRef<THREE.Mesh | null>(null);

  // Transparent casing meshes (for Internal View / X-Ray)
  const chassisPanelsRef = useRef<THREE.Mesh[]>([]);
  const glassDoorMeshRef = useRef<THREE.Mesh | null>(null);

  // Particle systems
  const energyParticlesRef = useRef<THREE.Points | null>(null);
  const thermalParticlesRef = useRef<THREE.Points | null>(null);

  // Vector indicators
  const torqueArrowRef = useRef<THREE.Group | null>(null);
  const gravityArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const forceArrowRef = useRef<THREE.ArrowHelper | null>(null);

  // Spotlight highlight
  const targetHighlightBoxRef = useRef<THREE.BoxHelper | null>(null);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera animation target
  const cameraTargetPos = useRef<THREE.Vector3>(new THREE.Vector3(2.4, 1.8, 3.4));
  const cameraLookAtTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.4, 0));

  // Current camera actual pos & lookAt for smooth lerping
  const currentCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(2.4, 1.8, 3.4));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.4, 0));

  // Setup Three.js scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.08);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.copy(currentCameraPos.current);
    camera.lookAt(currentLookAt.current);
    cameraRef.current = camera;

    // 3. Renderer with high-end settings
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting setup (Aerospace studio rig)
    const ambientLight = new THREE.AmbientLight(0x0d1527, 2.4);
    scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Fill Light (Electric Cyan)
    const cyanFillLight = new THREE.DirectionalLight(0x06b6d4, 1.8);
    cyanFillLight.position.set(-4, 2, 3);
    scene.add(cyanFillLight);

    // Back / Rim Light (Ice Blue)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Point light inside product chamber
    const chamberLight = new THREE.PointLight(0x22d3ee, 2.5, 3.5);
    chamberLight.position.set(0, 0.8, 0.2);
    scene.add(chamberLight);

    // 5. Ground Studio Floor with circular engineering grid
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x05070d,
      roughness: 0.65,
      metalness: 0.4,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.35;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(12, 24, 0x0284c7, 0x0f172a);
    gridHelper.position.y = -1.34;
    scene.add(gridHelper);

    // 6. MATERIALS
    const darkTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.25,
    });

    const brushedAluminumMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2,
    });

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.8,
      roughness: 0.3,
    });

    const steelGearMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.92,
      roughness: 0.28,
    });

    const cyanGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });

    const smokedGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.75,
      opacity: 0.65,
      transparent: true,
      ior: 1.5,
    });

    // 7. MACHINE STRUCTURE BUILD
    const machineRoot = new THREE.Group();
    scene.add(machineRoot);

    // (A) Vending Machine Main Outer Body
    // Outer dimensions: Width ~ 1.5m, Height ~ 2.4m, Depth ~ 0.9m
    const bodyGeometry = new THREE.BoxGeometry(1.4, 2.4, 0.85);
    const bodyMesh = new THREE.Mesh(bodyGeometry, darkTitaniumMat);
    bodyMesh.position.set(0, 0, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    machineRoot.add(bodyMesh);
    chassisPanelsRef.current.push(bodyMesh);

    // Cutout hollow window cavity inside machine
    const cavityMat = new THREE.MeshStandardMaterial({
      color: 0x080c14,
      metalness: 0.7,
      roughness: 0.4,
    });
    const cavityMesh = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.4, 0.65), cavityMat);
    cavityMesh.position.set(0, 0.35, 0.12);
    machineRoot.add(cavityMesh);

    // Front Panoramic Glass Door
    const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.45, 0.03), smokedGlassMat);
    glassDoor.position.set(0, 0.35, 0.44);
    machineRoot.add(glassDoor);
    glassDoorMeshRef.current = glassDoor;

    // Chamfered corner pillars with glowing cyan pinstripes
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 16), pillarMat);
    p1.position.set(0.68, 0, 0.4);
    const p2 = p1.clone();
    p2.position.set(-0.68, 0, 0.4);
    machineRoot.add(p1, p2);

    // LED Trim strip on top
    const ledHeader = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.03, 0.02), cyanGlowMat);
    ledHeader.position.set(0, 1.15, 0.44);
    machineRoot.add(ledHeader);

    // (B) 4 Vertical Storage Channels & Stored Product Cylinders
    const colSpacing = 0.26;
    for (let c = 0; c < 4; c++) {
      const colX = (c - 1.5) * colSpacing;
      // Clear column rack rails
      const railMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.95, 8),
        brushedAluminumMat
      );
      railMesh.position.set(colX - 0.05, 0.55, 0.15);
      const railMeshR = railMesh.clone();
      railMeshR.position.set(colX + 0.05, 0.55, 0.15);
      machineRoot.add(railMesh, railMeshR);

      // Stored canisters stacked in each column
      const prodData = CATALOG_PRODUCTS[c % CATALOG_PRODUCTS.length];
      const prodMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(prodData.color),
        metalness: 0.7,
        roughness: 0.25,
      });

      for (let s = 0; s < 3; s++) {
        const canGroup = new THREE.Group();
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 24), prodMat);
        const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.02, 24), brushedAluminumMat);
        capTop.position.y = 0.07;
        const capBot = capTop.clone();
        capBot.position.y = -0.07;
        const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.004, 8, 24), cyanGlowMat);
        ringGlow.rotation.x = Math.PI / 2;

        canGroup.add(cylinder, capTop, capBot, ringGlow);
        canGroup.position.set(colX, 0.85 - s * 0.19, 0.15);
        machineRoot.add(canGroup);
      }
    }

    // (C) Rotary Dispenser Carousel (Spindle with 4 quadrant cradles)
    const carouselGroup = new THREE.Group();
    carouselGroup.position.set(0, -0.05, 0.15);
    machineRoot.add(carouselGroup);
    dispenserCarouselRef.current = carouselGroup;

    // Carousel center drum
    const drumMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.22, 32), brushedAluminumMat);
    drumMesh.rotation.x = Math.PI / 2;
    carouselGroup.add(drumMesh);

    // 4 quadrant retention pockets
    for (let q = 0; q < 4; q++) {
      const qAngle = (q * Math.PI) / 2;
      const pocketGroup = new THREE.Group();
      pocketGroup.rotation.z = qAngle;

      const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.2), darkTitaniumMat);
      paddle.position.set(0.18, 0, 0);
      pocketGroup.add(paddle);

      // Decorative payload inside one slot
      if (q === 0) {
        const payload = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.14, 16),
          new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.2 })
        );
        payload.rotation.x = Math.PI / 2;
        payload.position.set(0.11, 0.06, 0);
        pocketGroup.add(payload);
      }
      carouselGroup.add(pocketGroup);
    }

    // (D) Precision Mechanical Gear Train (Right side gearbox enclosure)
    // Mounted on right side (x: ~ 0.52, y: -0.2 to 0.4, z: 0.1)
    const gearTrainGroup = new THREE.Group();
    gearTrainGroup.position.set(0.55, 0.05, 0.12);
    machineRoot.add(gearTrainGroup);

    // 1. Input Gear (z = 18 teeth, driven directly by hand crank shaft)
    const inputGearGeo = createGearGeometry(18, 0.09, 0.02, 0.024, 0.02);
    const inputGearMesh = new THREE.Mesh(inputGearGeo, steelGearMat);
    inputGearMesh.position.set(0.12, 0.26, 0.05);
    gearTrainGroup.add(inputGearMesh);
    inputGearMeshRef.current = inputGearMesh;

    // 2. Intermediate Compound Gear (z1 = 36 teeth outer, z2 = 14 teeth inner)
    const interGroup = new THREE.Group();
    interGroup.position.set(0.02, 0.08, 0.05);
    gearTrainGroup.add(interGroup);
    interGearMeshRef.current = interGroup;

    const interGearOuterGeo = createGearGeometry(34, 0.15, 0.02, 0.022, 0.025);
    const interOuterMesh = new THREE.Mesh(interGearOuterGeo, steelGearMat);
    const interGearInnerGeo = createGearGeometry(14, 0.065, 0.018, 0.026, 0.025);
    const interInnerMesh = new THREE.Mesh(interGearInnerGeo, bronzeMat);
    interInnerMesh.position.z = 0.022;
    interGroup.add(interOuterMesh, interInnerMesh);

    // 3. Output Gear driving the dispenser spindle (z = 44 teeth)
    const outputGearGeo = createGearGeometry(42, 0.19, 0.022, 0.025, 0.035);
    const outputGearMesh = new THREE.Mesh(outputGearGeo, steelGearMat);
    outputGearMesh.position.set(-0.16, -0.1, 0.05);
    gearTrainGroup.add(outputGearMesh);
    outputGearMeshRef.current = outputGearMesh;

    // Rotating drive shafts with bearing blocks
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 });
    const bearingMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });

    const inputShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 16), shaftMat);
    inputShaft.rotation.x = Math.PI / 2;
    inputShaft.position.set(0.12, 0.26, 0.1);
    gearTrainGroup.add(inputShaft);

    const bearingBlock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), bearingMat);
    bearingBlock.position.set(0.12, 0.26, 0.18);
    gearTrainGroup.add(bearingBlock);

    // (E) Heavy Flywheel with thick perimeter rim and 6 curved spokes
    const flywheelGroup = new THREE.Group();
    flywheelGroup.position.set(0.48, 0.45, -0.05);
    machineRoot.add(flywheelGroup);
    flywheelGroupRef.current = flywheelGroup;

    const fwRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.032, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.2 })
    );
    const fwHub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 24), brushedAluminumMat);
    fwHub.rotation.x = Math.PI / 2;
    flywheelGroup.add(fwRim, fwHub);

    // 6 spokes
    for (let sp = 0; sp < 6; sp++) {
      const spA = (sp * Math.PI) / 3;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.15, 8), brushedAluminumMat);
      spoke.position.set(Math.cos(spA) * 0.09, Math.sin(spA) * 0.09, 0);
      spoke.rotation.z = spA + Math.PI / 2;
      flywheelGroup.add(spoke);
    }

    // (F) Mechanical Lock (Ratchet & Pawl Escapement)
    const pawlGroup = new THREE.Group();
    pawlGroup.position.set(0.62, 0.38, 0.18);
    machineRoot.add(pawlGroup);

    const pawlMesh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.015), bronzeMat);
    pawlMesh.position.set(0, -0.03, 0);
    pawlGroup.add(pawlMesh);
    pawlMeshRef.current = pawlMesh;

    // (G) Spring Reset Mechanism
    const springGroup = new THREE.Group();
    springGroup.position.set(0.38, -0.08, 0.18);
    machineRoot.add(springGroup);

    const initialSpringGeo = createSpringGeometry(0.03, 0.005, 6, 0.16);
    const springMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.2 });
    const springMesh = new THREE.Mesh(initialSpringGeo, springMat);
    springGroup.add(springMesh);
    springMeshRef.current = springMesh;

    // (H) Dynamic Counterweight Arm (Moment Equilibrium)
    const cwArmGroup = new THREE.Group();
    cwArmGroup.position.set(-0.45, -0.05, 0.1);
    machineRoot.add(cwArmGroup);
    counterweightArmRef.current = cwArmGroup;

    const fulcrumPivot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 16), brushedAluminumMat);
    fulcrumPivot.rotation.x = Math.PI / 2;
    cwArmGroup.add(fulcrumPivot);

    const rockerBeam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.018, 0.03), darkTitaniumMat);
    cwArmGroup.add(rockerBeam);

    const cwMassBlock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.05), bronzeMat);
    cwMassBlock.position.set(-0.12, 0, 0);
    cwArmGroup.add(cwMassBlock);

    // (I) Curved Gravity Dispensing Chute
    const chuteCurvePoints = [
      new THREE.Vector3(0.12, -0.15, 0.15),
      new THREE.Vector3(0.08, -0.35, 0.22),
      new THREE.Vector3(-0.04, -0.55, 0.28),
      new THREE.Vector3(0.0, -0.78, 0.35),
    ];
    const chuteCurve = new THREE.CatmullRomCurve3(chuteCurvePoints);
    const chuteGeo = new THREE.TubeGeometry(chuteCurve, 32, 0.06, 12, false);
    const chuteMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: 0.85,
      opacity: 0.5,
      transparent: true,
      roughness: 0.15,
    });
    const chuteMesh = new THREE.Mesh(chuteGeo, chuteMat);
    machineRoot.add(chuteMesh);

    // (J) Falling Product Canister
    const fallCanister = new THREE.Group();
    const fCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.14, 24),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.8, roughness: 0.2 })
    );
    const fRing = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.005, 8, 24), cyanGlowMat);
    fRing.rotation.x = Math.PI / 2;
    fallCanister.add(fCyl, fRing);
    fallCanister.position.set(0, -0.15, 0.15);
    fallCanister.visible = false;
    machineRoot.add(fallCanister);
    fallingProductMeshRef.current = fallCanister;

    // (K) Delivery Tray with opening door flap
    const trayGroup = new THREE.Group();
    trayGroup.position.set(0, -0.9, 0.36);
    machineRoot.add(trayGroup);

    const trayAlcove = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.28, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x0a0f1d, metalness: 0.9, roughness: 0.3 })
    );
    trayGroup.add(trayAlcove);

    const trayFloorLED = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.01, 0.2), cyanGlowMat);
    trayFloorLED.position.set(0, -0.12, 0);
    trayGroup.add(trayFloorLED);

    const doorFlap = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.24, 0.015),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transmission: 0.8, transparent: true, opacity: 0.7 })
    );
    doorFlap.position.set(0, 0, 0.11);
    trayGroup.add(doorFlap);
    trayFlapDoorRef.current = doorFlap;

    // (L) Interactive Hand Crank Assembly (Mounted on machine right side)
    const crankAssembly = new THREE.Group();
    crankAssembly.position.set(0.72, 0.31, 0.22);
    machineRoot.add(crankAssembly);
    crankGroupRef.current = crankAssembly;

    // Crank hub flange
    const crankHub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 24), brushedAluminumMat);
    crankHub.rotation.z = Math.PI / 2;
    crankAssembly.add(crankHub);

    // Crank arm
    const crankArmLength = 0.22;
    const crankArmMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, crankArmLength, 0.018),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 })
    );
    crankArmMesh.position.set(0.02, crankArmLength * 0.45, 0);
    crankAssembly.add(crankArmMesh);

    // Crank knurled rotating handle
    const handleGrip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.09, 24),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.4 })
    );
    handleGrip.rotation.z = Math.PI / 2;
    handleGrip.position.set(0.065, crankArmLength * 0.9, 0);
    crankAssembly.add(handleGrip);

    // (M) Vector Indicators (Torque Arc, Gravity Arrow, Applied Force)
    const torqueGroup = new THREE.Group();
    const torqueArcMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.008, 8, 32, Math.PI * 1.5),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    torqueArcMesh.rotation.y = Math.PI / 2;
    torqueGroup.add(torqueArcMesh);
    torqueGroup.position.set(0.76, 0.31, 0.22);
    torqueGroup.visible = false;
    scene.add(torqueGroup);
    torqueArrowRef.current = torqueGroup;

    // Gravity downward arrow
    const gravArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 0),
      0.35,
      0x38bdf8,
      0.08,
      0.05
    );
    gravArrow.visible = false;
    scene.add(gravArrow);
    gravityArrowRef.current = gravArrow;

    // Applied force tangential arrow
    const forceArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0.78, 0.5, 0.22),
      0.25,
      0x22d3ee,
      0.06,
      0.04
    );
    forceArrow.visible = false;
    scene.add(forceArrow);
    forceArrowRef.current = forceArrow;

    // (N) Energy Flow Particle System
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    // Initial particle positions along the kinetic pathway
    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = 0.5 + Math.random() * 0.2;
      particlePositions[p * 3 + 1] = 0.3 - (p / particleCount) * 1.0;
      particlePositions[p * 3 + 2] = 0.15 + (Math.random() - 0.5) * 0.08;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.035,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const energyPoints = new THREE.Points(particleGeo, particleMat);
    energyPoints.visible = false;
    scene.add(energyPoints);
    energyParticlesRef.current = energyPoints;

    // (O) Thermal Heat Dissipation Particles
    const thermalPCount = 80;
    const thermalGeo = new THREE.BufferGeometry();
    const thermalPos = new Float32Array(thermalPCount * 3);
    for (let tp = 0; tp < thermalPCount; tp++) {
      thermalPos[tp * 3] = 0.5 + (Math.random() - 0.5) * 0.2;
      thermalPos[tp * 3 + 1] = 0.1 + Math.random() * 0.4;
      thermalPos[tp * 3 + 2] = 0.1 + (Math.random() - 0.5) * 0.1;
    }
    thermalGeo.setAttribute('position', new THREE.BufferAttribute(thermalPos, 3));
    const thermalMat = new THREE.PointsMaterial({
      color: 0xff4500,
      size: 0.03,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const thermalPoints = new THREE.Points(thermalGeo, thermalMat);
    thermalPoints.visible = false;
    scene.add(thermalPoints);
    thermalParticlesRef.current = thermalPoints;

    // Target highlight box helper
    const highlightBox = new THREE.BoxHelper(crankAssembly, 0x00f0ff);
    highlightBox.visible = false;
    scene.add(highlightBox);
    targetHighlightBoxRef.current = highlightBox;

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Interactive Crank Mouse / Touch Drag Handlers
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      lastMousePosRef.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = clientY - lastMousePosRef.current.y;
      const deltaX = clientX - lastMousePosRef.current.x;

      lastMousePosRef.current = { x: clientX, y: clientY };

      // Calculate crank angular displacement from drag
      const deltaAngle = (deltaY - deltaX * 0.5) * 0.025;
      if (Math.abs(deltaAngle) > 0.001 && onManualCrankDelta) {
        onManualCrankDelta(deltaAngle);
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    domElem.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      // Smooth camera interpolation (lerp)
      if (cameraRef.current) {
        currentCameraPos.current.lerp(cameraTargetPos.current, 0.06);
        currentLookAt.current.lerp(cameraLookAtTarget.current, 0.06);
        cameraRef.current.position.copy(currentCameraPos.current);
        cameraRef.current.lookAt(currentLookAt.current);
      }

      // Render
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domElem.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Camera presets when cameraMode changes
  useEffect(() => {
    switch (cameraMode) {
      case 'default':
        cameraTargetPos.current.set(2.4, 1.6, 3.2);
        cameraLookAtTarget.current.set(0, 0.35, 0);
        break;
      case 'mechanical':
        cameraTargetPos.current.set(1.5, 0.45, 1.4);
        cameraLookAtTarget.current.set(0.48, 0.15, 0.12);
        break;
      case 'flywheel':
        cameraTargetPos.current.set(1.3, 0.75, 0.9);
        cameraLookAtTarget.current.set(0.48, 0.45, -0.05);
        break;
      case 'dispenser':
        cameraTargetPos.current.set(0.9, -0.15, 1.6);
        cameraLookAtTarget.current.set(0, -0.2, 0.2);
        break;
      case 'physics':
        cameraTargetPos.current.set(2.6, 2.0, 2.8);
        cameraLookAtTarget.current.set(0.2, 0.3, 0.1);
        break;
      case 'stress':
        cameraTargetPos.current.set(1.4, 0.4, 1.2);
        cameraLookAtTarget.current.set(0.45, 0.15, 0.12);
        break;
      case 'thermal':
        cameraTargetPos.current.set(1.6, 0.5, 1.3);
        cameraLookAtTarget.current.set(0.45, 0.2, 0.12);
        break;
    }
  }, [cameraMode]);

  // Update real-time physics transforms on every render frame from telemetry props
  useEffect(() => {
    // 1. Hand Crank rotation
    if (crankGroupRef.current) {
      crankGroupRef.current.rotation.x = telemetry.crankAngle;
    }

    // 2. Gear Train meshing
    if (inputGearMeshRef.current) {
      inputGearMeshRef.current.rotation.z = telemetry.crankAngle;
    }
    if (interGearMeshRef.current) {
      // Counter-rotating at intermediate reduction
      interGearMeshRef.current.rotation.z = -telemetry.crankAngle * (18 / 34);
    }
    if (outputGearMeshRef.current) {
      outputGearMeshRef.current.rotation.z = telemetry.rotaryDispenserAngle;
    }

    // 3. Flywheel rotation (spins with crank / coasts)
    if (flywheelGroupRef.current) {
      flywheelGroupRef.current.rotation.z = telemetry.crankAngle * 1.8;
    }

    // 4. Ratchet Pawl escapement click
    if (pawlMeshRef.current) {
      const toothIndex = Math.sin(telemetry.crankAngle * 6);
      pawlMeshRef.current.rotation.z = telemetry.lockEngaged ? toothIndex * 0.18 : 0.42;
    }

    // 5. Rotary Dispenser carousel indexing
    if (dispenserCarouselRef.current) {
      dispenserCarouselRef.current.rotation.z = telemetry.rotaryDispenserAngle;
    }

    // 6. Helical Spring compression (F = kx)
    if (springMeshRef.current) {
      const scaleY = 1.0 - (telemetry.springCompression / 0.035) * 0.45;
      springMeshRef.current.scale.set(1, Math.max(0.4, scaleY), 1);
    }

    // 7. Counterweight rocker arm tilt (equilibrium)
    if (counterweightArmRef.current) {
      counterweightArmRef.current.rotation.z = telemetry.counterweightPos * 0.22;
    }

    // 8. Falling Product Canister trajectory along chute
    if (fallingProductMeshRef.current) {
      if (telemetry.isDropping) {
        fallingProductMeshRef.current.visible = true;
        const t = telemetry.dropProgress;
        // Interpolate along curved chute path:
        const x = 0.12 * (1 - t) + 0.0 * t + Math.sin(t * Math.PI) * 0.08;
        const y = -0.15 - t * 0.72;
        const z = 0.15 + t * 0.22;
        fallingProductMeshRef.current.position.set(x, y, z);
        fallingProductMeshRef.current.rotation.z = t * Math.PI * 1.5;
      } else {
        fallingProductMeshRef.current.visible = false;
      }
    }

    // 9. Delivery tray door flap deflection
    if (trayFlapDoorRef.current) {
      trayFlapDoorRef.current.rotation.x =
        telemetry.isDropping && telemetry.dropProgress > 0.85 ? -Math.PI / 4 : 0;
    }

    // 10. Vector visualizers
    if (torqueArrowRef.current) {
      torqueArrowRef.current.visible = overlay === 'physics_vectors';
      torqueArrowRef.current.scale.setScalar(Math.max(0.6, telemetry.torque / 8));
    }

    if (gravityArrowRef.current) {
      gravityArrowRef.current.visible = overlay === 'physics_vectors' && telemetry.isDropping;
      if (fallingProductMeshRef.current) {
        gravityArrowRef.current.position.copy(fallingProductMeshRef.current.position);
      }
    }

    if (forceArrowRef.current) {
      forceArrowRef.current.visible = overlay === 'physics_vectors' && telemetry.appliedForce > 0;
    }

    // 11. Energy Flow particles
    if (energyParticlesRef.current) {
      energyParticlesRef.current.visible = overlay === 'energy_flow';
      if (overlay === 'energy_flow') {
        const positions = energyParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const count = positions.length / 3;
        for (let i = 0; i < count; i++) {
          positions[i * 3 + 1] -= 0.012; // flow downwards
          if (positions[i * 3 + 1] < -0.9) {
            positions[i * 3 + 1] = 0.35;
          }
        }
        energyParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }

    // 12. Thermal Heat particles
    if (thermalParticlesRef.current) {
      thermalParticlesRef.current.visible = overlay === 'thermal_ir';
      if (overlay === 'thermal_ir') {
        const positions = thermalParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const count = positions.length / 3;
        for (let i = 0; i < count; i++) {
          positions[i * 3 + 1] += 0.008; // heat rises
          if (positions[i * 3 + 1] > 0.6) {
            positions[i * 3 + 1] = 0.15;
          }
        }
        thermalParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }

    // 13. Chassis Transparency for Internal View / X-Ray
    const isInternal = overlay === 'internal_xray';
    chassisPanelsRef.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (isInternal) {
        mat.transparent = true;
        mat.opacity = 0.22;
        mat.wireframe = true;
      } else {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.wireframe = false;
      }
    });

    if (glassDoorMeshRef.current) {
      const gMat = glassDoorMeshRef.current.material as THREE.MeshPhysicalMaterial;
      gMat.opacity = isInternal ? 0.12 : 0.65;
    }

    // 14. Stress Test Visualizer Mode: FEA color gradient mapping on gears & shafts
    if (inputGearMeshRef.current && interGearMeshRef.current && outputGearMeshRef.current) {
      const isStress = overlay === 'stress_fea';
      const stressRatio = Math.min(1.0, stress.maxVonMisesStress / stress.yieldStrength);

      // Color lerp: Blue (safe) -> Green (medium) -> Yellow -> Red (critical)
      const stressColor = new THREE.Color();
      if (stressRatio < 0.25) {
        stressColor.setRGB(0.1, 0.4, 0.95);
      } else if (stressRatio < 0.6) {
        stressColor.setRGB(0.1, 0.85, 0.3);
      } else if (stressRatio < 0.85) {
        stressColor.setRGB(0.95, 0.85, 0.1);
      } else {
        stressColor.setRGB(0.95, 0.15, 0.1);
      }

      const gears = [inputGearMeshRef.current, outputGearMeshRef.current];
      gears.forEach((g) => {
        const mat = g.material as THREE.MeshStandardMaterial;
        if (isStress) {
          mat.color.copy(stressColor);
          mat.emissive.copy(stressColor).multiplyScalar(0.35);
        } else {
          mat.color.setHex(0x64748b);
          mat.emissive.setHex(0x000000);
        }
      });
    }

    // 15. Thermal Infrared View Mode: false color temperature gradient
    if (flywheelGroupRef.current) {
      const isThermal = overlay === 'thermal_ir';
      const tempDelta = Math.min(1.0, thermal.peakThermalRise / 45);
      const thermalColor = new THREE.Color();
      thermalColor.setHSL(0.7 - tempDelta * 0.7, 0.9, 0.45); // Violet/Blue -> Orange/Red

      const fwMat = (flywheelGroupRef.current.children[0] as THREE.Mesh)
        .material as THREE.MeshStandardMaterial;
      if (isThermal) {
        fwMat.color.copy(thermalColor);
        fwMat.emissive.copy(thermalColor).multiplyScalar(0.4);
      } else {
        fwMat.color.setHex(0x1e293b);
        fwMat.emissive.setHex(0x000000);
      }
    }

    // 16. Target Component Spotlight
    if (targetHighlightBoxRef.current && sceneRef.current) {
      if (targetComponent) {
        let targetObj: THREE.Object3D | null = null;
        if (targetComponent === 'crank') targetObj = crankGroupRef.current;
        else if (targetComponent === 'gears') targetObj = inputGearMeshRef.current;
        else if (targetComponent === 'flywheel') targetObj = flywheelGroupRef.current;
        else if (targetComponent === 'lock') targetObj = pawlMeshRef.current;
        else if (targetComponent === 'dispenser') targetObj = dispenserCarouselRef.current;
        else if (targetComponent === 'spring') targetObj = springMeshRef.current;
        else if (targetComponent === 'counterweight') targetObj = counterweightArmRef.current;

        if (targetObj) {
          targetHighlightBoxRef.current.setFromObject(targetObj);
          targetHighlightBoxRef.current.visible = true;
        } else {
          targetHighlightBoxRef.current.visible = false;
        }
      } else {
        targetHighlightBoxRef.current.visible = false;
      }
    }
  }, [telemetry, stress, thermal, overlay, targetComponent]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden cursor-grab active:cursor-grabbing">
      <div ref={mountRef} className="w-full h-full" />

      {/* Floating 3D Interaction Hint */}
      <div className="absolute top-4 left-6 pointer-events-none flex items-center gap-2 bg-slate-950/65 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-cyan-500/20 text-xs text-slate-300">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-tech text-cyan-300 font-semibold uppercase tracking-wider">3D Hero Viewport</span>
        <span className="text-slate-500">·</span>
        <span>Drag anywhere to rotate crank & drive physics</span>
      </div>
    </div>
  );
};
