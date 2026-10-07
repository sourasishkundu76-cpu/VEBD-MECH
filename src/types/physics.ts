/**
 * VEND-MECH Physics & Simulation Type Definitions
 */

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  mass: number; // kg (e.g. 0.35 kg)
  height: number; // m in shelf stack (e.g. 1.45 m)
  color: string;
  accentColor: string;
  description: string;
  stock: number;
}

export interface ExperimentParams {
  productMass: number; // kg [0.2 - 3.0]
  crankForce: number; // N [10 - 150]
  crankRadius: number; // m [0.12 - 0.35]
  gearRatio: number; // [1.0 - 4.5]
  flywheelMass: number; // kg [1.5 - 12.0]
  flywheelRadius: number; // m [0.12 - 0.28]
  frictionCoeff: number; // mu [0.02 - 0.25]
  productHeight: number; // m [0.6 - 1.8]
  springConstant: number; // N/m [200 - 1500]
}

export interface MechanicalTelemetry {
  // Input & Torque
  appliedForce: number; // N
  crankRadius: number; // m
  crankAngle: number; // radians
  torque: number; // N·m (τ = r·F·sinθ)
  inputRPM: number;
  outputRPM: number;
  gearRatio: number;

  // Rotational Dynamics
  angularVelocity: number; // rad/s
  angularAcceleration: number; // rad/s²
  flywheelMass: number; // kg
  flywheelInertia: number; // kg·m² (I = 0.5·m·r²)
  rotationalEnergy: number; // Joules (K = 0.5·I·ω²)
  angularMomentum: number; // kg·m²/s (L = I·ω)

  // Mechanical Locks & Control
  lockEngaged: boolean;
  lockProgress: number; // 0 to 1
  rotaryDispenserAngle: number; // radians
  activeProductIndex: number;

  // Gravity & Linear Drop
  dropProgress: number; // 0 (at gate) to 1 (in tray)
  isDropping: boolean;
  dropVelocity: number; // m/s
  dropHeight: number; // m
  gravitationalPE: number; // Joules (PE = mgh)
  productMass: number; // kg

  // Spring Reset
  springCompression: number; // m
  springForce: number; // N (F = kx)
  storedElasticEnergy: number; // Joules (PE = 0.5·k·x²)

  // Counterweight & Equilibrium
  counterweightPos: number; // -1 to 1 balance arm
  systemMomentImbalance: number; // N·m
  isEquilibrium: boolean;

  // Friction & Energy
  frictionLoss: number; // Watts
  usefulEnergy: number; // Joules
  inputWork: number; // Joules
  efficiency: number; // % (Useful / Input * 100)
}

export interface StressTelemetry {
  maxVonMisesStress: number; // MPa
  yieldStrength: number; // MPa (Aircraft Aluminum 6061-T6 = 276 MPa, Titanium = 880 MPa)
  safetyFactor: number;
  shaftTorsionStress: number; // MPa (τ_max = 16·T / (π·d³))
  gearToothBendingStress: number; // MPa (Lewis formula σ = W_t / (F·m·Y))
  pawlShearStress: number; // MPa
  stressState: 'nominal' | 'elevated' | 'critical';
}

export interface ThermalTelemetry {
  bearingTemperature: number; // °C
  gearContactTemperature: number; // °C
  flywheelHubTemperature: number; // °C
  ambientTemperature: number; // °C (22°C baseline)
  heatDissipationRate: number; // W (convection + conductive heat sinks)
  peakThermalRise: number; // °C above ambient
}

export interface EngineeringProblem {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  problemStatement: string;
  solutionMechanism: string;
  physicsConcepts: string[];
  primaryFormula: string;
  formulaLabel: string;
  formulaExplanation: string;
  targetComponent: 'crank' | 'gears' | 'flywheel' | 'lock' | 'dispenser' | 'chute' | 'spring' | 'counterweight' | 'energy';
  defaultParams: Partial<ExperimentParams>;
}

export type ViewCameraMode = 'default' | 'mechanical' | 'flywheel' | 'dispenser' | 'physics' | 'stress' | 'thermal';

export type SimulationOverlay = 'normal' | 'physics_vectors' | 'internal_xray' | 'energy_flow' | 'stress_fea' | 'thermal_ir';
