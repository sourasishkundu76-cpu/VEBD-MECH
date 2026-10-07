import { EngineeringProblem, ProductItem } from '../types/physics';

export const CATALOG_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'AeroGel Thermal Core',
    category: 'Advanced Insulation',
    mass: 0.28,
    height: 1.65,
    color: '#06b6d4',
    accentColor: '#22d3ee',
    description: 'Ultra-low density nanoporous silica aerogel cylinder.',
    stock: 8,
  },
  {
    id: 'prod-2',
    name: 'Titanium Fastener Array',
    category: 'High-Stress Hardware',
    mass: 0.95,
    height: 1.35,
    color: '#94a3b8',
    accentColor: '#38bdf8',
    description: 'Grade 5 Ti-6Al-4V aerospace precision hex-lock set.',
    stock: 6,
  },
  {
    id: 'prod-3',
    name: 'Solid-State Battery Cell',
    category: 'Energy Storage',
    mass: 1.45,
    height: 1.05,
    color: '#38bdf8',
    accentColor: '#60a5fa',
    description: 'High energy-density 480 Wh/kg lithium-metal pouch pack.',
    stock: 5,
  },
  {
    id: 'prod-4',
    name: 'Graphene Supercapacitor',
    category: 'Pulse Power',
    mass: 0.62,
    height: 0.75,
    color: '#0284c7',
    accentColor: '#38bdf8',
    description: 'Sub-second electrostatic burst storage canister.',
    stock: 7,
  },
];

export const ENGINEERING_PROBLEMS: EngineeringProblem[] = [
  {
    id: 1,
    code: '01',
    title: 'Controlled Single-Product Dispensing',
    subtitle: 'Rotary Indexing & Mechanical Ratchet Constraint',
    problemStatement:
      'Dispense exactly one selected product canister per cycle without letting adjacent stacked products cascade or double-release under gravitational pull.',
    solutionMechanism:
      'A rotary quadrant wheel with an escapement ratchet pawl indexes precisely 90° (π/2 rad) per full mechanical cycle. The gravity release gate opens only when the indexing chamber matches the drop chute aperture, and immediately self-locks.',
    physicsConcepts: ['Torque', 'Rotational Motion', 'Mechanical Lock', 'Escapement Constraint', 'Gravity'],
    primaryFormula: 'τ = r · F · sinθ & Δθ = π/2',
    formulaLabel: 'Escapement Indexing Angle',
    formulaExplanation:
      'Angular displacement is restricted to discrete quadrant steps. Torque advances the rotor while a spring-loaded pawl enforces unilateral rotational motion, ensuring n = 1 unit release.',
    targetComponent: 'dispenser',
    defaultParams: {
      gearRatio: 2.5,
      crankForce: 45,
      crankRadius: 0.22,
    },
  },
  {
    id: 2,
    code: '02',
    title: 'Products Stored at Different Heights',
    subtitle: 'Gravitational Potential Energy Transfer & Chute Damping',
    problemStatement:
      'Products stored on top racks (h = 1.65m) acquire excessive velocity during vertical free-fall compared to lower racks (h = 0.75m), risking impact damage in the delivery bay.',
    solutionMechanism:
      'A curved helical friction chute dissipates excess kinetic energy via controlled normal force and kinetic friction: ΔE_kin = mgh - W_friction, bringing impact speed to a safe terminal velocity.',
    physicsConcepts: ['Gravitational Potential Energy', 'Conservation of Energy', 'Linear Motion', 'Impact Damping'],
    primaryFormula: 'PE = m · g · h   ⟶   v = √(2gh - 2W_f/m)',
    formulaLabel: 'Energy Balance & Fall Velocity',
    formulaExplanation:
      'Gravitational potential energy PE is converted into translational kinetic energy. The delivery chute applies contact friction normal to the curvature to decelerate upper shelf items.',
    targetComponent: 'chute',
    defaultParams: {
      productHeight: 1.65,
      productMass: 0.95,
      frictionCoeff: 0.08,
    },
  },
  {
    id: 3,
    code: '03',
    title: 'Reducing Required User Force',
    subtitle: 'Mechanical Advantage via Torque Lever & Compound Gear Train',
    problemStatement:
      'Directly driving the loaded rotary carousel requires 110 N of tangential force—exceeding comfortable human ergonomics (ideal input ≤ 35 N).',
    solutionMechanism:
      'Lengthening the hand crank radius r from 0.12 m to 0.25 m doubles user torque, while a 2.5:1 compound reduction gear train multiplies torque by mechanical advantage (MA = N2/N1 = 2.5), slashing required user force by 65%.',
    physicsConcepts: ['Torque (τ = rF)', 'Mechanical Advantage', 'Gear Ratio (i = ω1/ω2)', 'Conservation of Work'],
    primaryFormula: 'τ_out = i · τ_in = i · (r_crank · F_in)',
    formulaLabel: 'Gear Torque Multiplication',
    formulaExplanation:
      'Work is conserved: lower applied force requires greater angular displacement (more rotations of the crank), but dramatically lowers physical effort.',
    targetComponent: 'gears',
    defaultParams: {
      crankRadius: 0.26,
      crankForce: 35,
      gearRatio: 2.8,
    },
  },
  {
    id: 4,
    code: '04',
    title: 'Smoothing Irregular Motion',
    subtitle: 'Rotational Inertia & Flywheel Kinetic Energy Buffer',
    problemStatement:
      'Human hand-cranking produces pulsating, jerky input torque peaks (θ = 90° vs θ = 0°), causing severe vibration, gear tooth backlash, and jerky dispensing motion.',
    solutionMechanism:
      'A dense peripheral-mass titanium flywheel (m = 6.5 kg, r = 0.20 m) stores rotational kinetic energy during force peaks and discharges it smoothly through dead spots via high angular momentum L = Iω.',
    physicsConcepts: ['Moment of Inertia (I = 1/2 m r²)', 'Rotational Kinetic Energy', 'Angular Momentum (L = Iω)', 'Cyclic Smoothing'],
    primaryFormula: 'K_rot = ½ · I · ω²   where   I = ½ · m · r²',
    formulaLabel: 'Rotational Energy Reservoir',
    formulaExplanation:
      'The flywheel resists changes in rotational speed: dω/dt = (τ_in - τ_load) / I. High moment of inertia attenuates angular acceleration oscillations.',
    targetComponent: 'flywheel',
    defaultParams: {
      flywheelMass: 7.5,
      flywheelRadius: 0.22,
      crankForce: 50,
    },
  },
  {
    id: 5,
    code: '05',
    title: 'Preventing Accidental Dispensing',
    subtitle: 'Mechanical Lock, Threshold Torque & Force Equilibrium',
    problemStatement:
      'Vibrations, accidental bumps, or incomplete partial crank rotations must never trigger a product drop without committed user interaction.',
    solutionMechanism:
      'A bi-stable mechanical detent lock maintains static equilibrium under external vibration. The lock only trips when applied torque overcomes the detent spring preload (τ ≥ τ_thresh = 4.2 N·m).',
    physicsConcepts: ['Static Equilibrium (Στ = 0)', 'Threshold Force', 'Mechanical Constraints', 'Preloaded Spring Detent'],
    primaryFormula: 'τ_applied ≥ k_detent · x_pre · r_arm',
    formulaLabel: 'Lock Detent Threshold',
    formulaExplanation:
      'Until the applied torque overcomes the pre-tensioned locking spring moment, the drive shaft is mechanically constrained, ensuring complete fail-safe operation.',
    targetComponent: 'lock',
    defaultParams: {
      crankForce: 48,
      gearRatio: 2.2,
    },
  },
  {
    id: 6,
    code: '06',
    title: 'Automatic Mechanical Reset',
    subtitle: 'Hooke’s Law & Elastic Potential Energy Recovery',
    problemStatement:
      'After product release, the indexing mechanism and safety gate must automatically return to safe sealed rest positions without requiring a reverse manual crank.',
    solutionMechanism:
      'During the forward drive stroke, a high-tensile helical recoil spring is compressed by displacement x. Upon escapement release, stored elastic potential energy snaps the gate shut and resets the pawl.',
    physicsConcepts: ["Hooke's Law (F = kx)", 'Elastic Potential Energy (PE = 1/2 k x²)', 'Harmonic Recoil', 'Mechanical Rest'],
    primaryFormula: 'F_spring = k · x   &   PE_elastic = ½ · k · x²',
    formulaLabel: "Hooke's Law Recoil Equation",
    formulaExplanation:
      'Mechanical work performed during the crank cycle is partially diverted into elastic strain energy, creating an autonomous return force F = kx upon gate trip.',
    targetComponent: 'spring',
    defaultParams: {
      springConstant: 680,
      crankForce: 42,
    },
  },
  {
    id: 7,
    code: '07',
    title: 'Frictional Energy Loss & Efficiency',
    subtitle: 'Coulomb Contact Friction, Heat Dissipation & Mechanical Efficiency',
    problemStatement:
      'Gear meshing contact, shaft bushings, and sliding chute guides dissipate input energy as waste heat, reducing overall transmission efficiency.',
    solutionMechanism:
      'Replacing dry sliding bushings with ceramic hybrid deep-groove ball bearings and optimized involute gear profiles reduces friction coefficient from μ = 0.20 to μ = 0.04, boosting mechanical efficiency from 62% to over 88%.',
    physicsConcepts: ['Frictional Force (F_f = μ N)', 'Friction Power Loss', 'Energy Conservation', 'Mechanical Efficiency (η)'],
    primaryFormula: 'η = (W_useful / W_input) · 100%   &   P_loss = μ · F_N · v',
    formulaLabel: 'Mechanical Transmission Efficiency',
    formulaExplanation:
      'Total work equals useful output work plus friction losses. Minimizing contact friction coefficient directly maximizes the percentage of human input delivered to the payload.',
    targetComponent: 'energy',
    defaultParams: {
      frictionCoeff: 0.04,
      crankForce: 40,
    },
  },
  {
    id: 8,
    code: '08',
    title: 'Uneven Product Load & Balance',
    subtitle: 'Moment of Force, Center of Mass & Dynamic Counterweight',
    problemStatement:
      'When heavy products (1.45 kg) reside on one side of the carousel while empty chambers reside on the other, static unbalance causes parasitic torque and bearing wear.',
    solutionMechanism:
      'A counterweighted balancing rocker arm dynamically shifts a lead-free bronze balance mass m_cw opposite to the carousel payload center of mass, restoring moment equilibrium Στ = 0.',
    physicsConcepts: ['Moment of Force (τ = F · d)', 'Center of Mass', 'Static Equilibrium', 'Rotational Symmetry'],
    primaryFormula: 'Στ = (m_load · r_load) - (m_cw · r_cw) = 0',
    formulaLabel: 'Moment Equilibrium Condition',
    formulaExplanation:
      'Balancing opposing moments around the primary spindle eliminates asymmetric radial bearing loads and ensures silky, uniform crank resistance.',
    targetComponent: 'counterweight',
    defaultParams: {
      productMass: 1.45,
      crankForce: 38,
    },
  },
  {
    id: 9,
    code: '09',
    title: 'Different Product Masses & Dynamics',
    subtitle: "Newton's Second Law & Mass-Dependent Acceleration",
    problemStatement:
      'An aerogel capsule (0.28 kg) accelerates much faster upon gravity release than a dense titanium bolt pack (0.95 kg) or battery pack (1.45 kg), demanding tuned damping.',
    solutionMechanism:
      'While gravitational acceleration g is identical in vacuum, contact normal force F_N = mg cosθ scales friction proportionally (F_f = μ mg cosθ), self-regulating descent acceleration a = g(sinθ - μ cosθ).',
    physicsConcepts: ["Newton's 2nd Law (F = ma)", 'Gravitational Force (W = mg)', 'Inertial Resistance', 'Chute Dynamics'],
    primaryFormula: 'a = g · (sin θ - μ · cos θ)',
    formulaLabel: 'Inclined Plane Acceleration',
    formulaExplanation:
      'The acceleration down the dispensing guide is mass-independent in ideal friction, but aerodynamic drag and track elastomeric dampers safely catch heavy payloads.',
    targetComponent: 'chute',
    defaultParams: {
      productMass: 1.45,
      frictionCoeff: 0.09,
    },
  },
  {
    id: 10,
    code: '10',
    title: 'Human Energy to Useful Mechanical Work',
    subtitle: 'Thermodynamic Energy Flow & Muscle Mechanical Output',
    problemStatement:
      'Operate the entire vending cycle completely off-grid without electrical motors, battery packs, or wall power—powered 100% by human metabolic work.',
    solutionMechanism:
      'Human biomechanical force on the crank arm converts chemical energy into mechanical rotational work (W = ∫τ dθ = 18.5 Joules). The system cleanly allocates this energy to gear driving, flywheel storage, spring charging, and gravitational payload release.',
    physicsConcepts: ['Conservation of Energy', 'Mechanical Work (W = ∫τ dθ)', 'Power Output (P = W/t)', 'Work-Energy Theorem'],
    primaryFormula: 'W_total = ∫ τ · dθ = ΔK_rot + ΔPE_spring + W_dispense + W_loss',
    formulaLabel: 'Work-Energy Balance Equation',
    formulaExplanation:
      'Every joule spent by the user is traced through the mechanical train: stored momentarily as flywheel kinetic energy and spring potential energy before being spent to deliver the product.',
    targetComponent: 'energy',
    defaultParams: {
      crankForce: 45,
      crankRadius: 0.24,
      gearRatio: 2.4,
    },
  },
];
