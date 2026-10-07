import * as THREE from 'three';

/**
 * Procedural Involute-like Spur Gear Geometry generator
 */
export function createGearGeometry(
  teeth: number,
  pitchRadius: number,
  toothDepth: number,
  faceWidth: number,
  boreRadius: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const toothAngle = (Math.PI * 2) / teeth;
  const rootRadius = pitchRadius - toothDepth * 0.55;
  const tipRadius = pitchRadius + toothDepth * 0.45;

  for (let i = 0; i < teeth; i++) {
    const angle = i * toothAngle;
    const a1 = angle;
    const a2 = angle + toothAngle * 0.25;
    const a3 = angle + toothAngle * 0.5;
    const a4 = angle + toothAngle * 0.75;
    const a5 = angle + toothAngle;

    // Root to pitch
    const x1 = Math.cos(a1) * rootRadius;
    const y1 = Math.sin(a1) * rootRadius;
    // Tip rise
    const x2 = Math.cos(a2) * tipRadius;
    const y2 = Math.sin(a2) * tipRadius;
    // Tip land
    const x3 = Math.cos(a3) * tipRadius;
    const y3 = Math.sin(a3) * tipRadius;
    // Tooth descent
    const x4 = Math.cos(a4) * rootRadius;
    const y4 = Math.sin(a4) * rootRadius;
    // Root trough
    const x5 = Math.cos(a5) * rootRadius;
    const y5 = Math.sin(a5) * rootRadius;

    if (i === 0) {
      shape.moveTo(x1, y1);
    } else {
      shape.lineTo(x1, y1);
    }
    shape.lineTo(x2, y2);
    shape.lineTo(x3, y3);
    shape.lineTo(x4, y4);
    shape.lineTo(x5, y5);
  }

  // Bore hole in center
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  // Decorative spoke cutouts for realistic weight reduction
  if (pitchRadius > 0.08) {
    const spokeCount = 5;
    const spokeInnerR = boreRadius * 1.5;
    const spokeOuterR = rootRadius * 0.75;
    const spokeAngle = (Math.PI * 2) / spokeCount;

    for (let s = 0; s < spokeCount; s++) {
      const startA = s * spokeAngle + spokeAngle * 0.15;
      const endA = s * spokeAngle + spokeAngle * 0.85;
      const spokeHole = new THREE.Path();
      spokeHole.moveTo(Math.cos(startA) * spokeInnerR, Math.sin(startA) * spokeInnerR);
      spokeHole.lineTo(Math.cos(startA) * spokeOuterR, Math.sin(startA) * spokeOuterR);
      spokeHole.absarc(0, 0, spokeOuterR, startA, endA, false);
      spokeHole.lineTo(Math.cos(endA) * spokeInnerR, Math.sin(endA) * spokeInnerR);
      spokeHole.absarc(0, 0, spokeInnerR, endA, startA, true);
      shape.holes.push(spokeHole);
    }
  }

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: faceWidth,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();
  return geom;
}

/**
 * Procedural Helical Spring Coil Geometry
 */
export function createSpringGeometry(
  radius: number,
  wireRadius: number,
  coils: number,
  height: number
): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const segmentsPerCoil = 32;
  const totalPoints = coils * segmentsPerCoil;

  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints;
    const angle = t * coils * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = (t - 0.5) * height;
    const z = Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, totalPoints, wireRadius, 8, false);
}
