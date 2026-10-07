import { ExperimentParams, MechanicalTelemetry, StressTelemetry, ThermalTelemetry } from '../types/physics';

export const DEFAULT_EXPERIMENT_PARAMS: ExperimentParams = {
  productMass: 0.95,
  crankForce: 45,
  crankRadius: 0.22,
  gearRatio: 2.5,
  flywheelMass: 6.5,
  flywheelRadius: 0.20,
  frictionCoeff: 0.05,
  productHeight: 1.35,
  springConstant: 650,
};

export class PhysicsSimulationEngine {
  public params: ExperimentParams;
  public crankAngle: number = 0; // Cumulative angle (rad)
  public angularVelocity: number = 0; // rad/s
  public angularAcceleration: number = 0; // rad/s²
  public isManualDriving: boolean = false;
  public manualForceVector: { x: number; y: number } = { x: 0, y: 0 };

  // Cycle tracking
  public cycleProgress: number = 0; // 0 to 1 for 1 complete 360° cycle
  public lockEngaged: boolean = true;
  public isDropping: boolean = false;
  public dropProgress: number = 0; // 0 to 1 along chute
  public dropTime: number = 0;
  public dropDuration: number = 0.75; // seconds
  public activeSlot: number = 0;
  public totalCyclesCompleted: number = 0;

  // Energy & Work tracking
  public cumulativeInputWork: number = 0;
  public cumulativeUsefulWork: number = 0;
  public cumulativeFrictionEnergy: number = 0;

  // Thermal state
  public bearingTemp: number = 22.0; // °C
  public gearTemp: number = 22.0; // °C
  public flywheelTemp: number = 22.0; // °C

  constructor(initialParams: Partial<ExperimentParams> = {}) {
    this.params = { ...DEFAULT_EXPERIMENT_PARAMS, ...initialParams };
  }

  public updateParams(newParams: Partial<ExperimentParams>) {
    this.params = { ...this.params, ...newParams };
  }

  public reset() {
    this.crankAngle = 0;
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
    this.isManualDriving = false;
    this.cycleProgress = 0;
    this.lockEngaged = true;
    this.isDropping = false;
    this.dropProgress = 0;
    this.dropTime = 0;
    this.cumulativeInputWork = 0;
    this.cumulativeUsefulWork = 0;
    this.cumulativeFrictionEnergy = 0;
    this.bearingTemp = 22.0;
    this.gearTemp = 22.0;
    this.flywheelTemp = 22.0;
  }

  // Step the simulation forward by delta time dt (seconds)
  public step(
    dt: number,
    drivingInput: boolean,
    onSoundTrigger?: (sound: 'tick' | 'unlock' | 'gate' | 'drop' | 'reset') => void
  ): {
    telemetry: MechanicalTelemetry;
    stress: StressTelemetry;
    thermal: ThermalTelemetry;
  } {
    const clampedDt = Math.min(dt, 0.05);

    // 1. Inertia of flywheel + drivetrain components
    // Flywheel inertia I = 0.5 * m * r²
    const flywheelInertia = 0.5 * this.params.flywheelMass * Math.pow(this.params.flywheelRadius, 2);
    // Gear train & shaft equivalent reflected inertia
    const gearInertia = 0.015 * Math.pow(this.params.gearRatio, 2);
    const totalInertia = flywheelInertia + gearInertia + 0.01;

    // 2. Input Torque τ = r · F · sinθ
    let inputTorque = 0;
    if (drivingInput || this.isManualDriving) {
      // Applied user force on crank handle
      // User naturally exerts tangential force (sinθ ≈ 0.95 average over drive arc)
      inputTorque = this.params.crankRadius * this.params.crankForce * 0.96;
    }

    // 3. Friction Torque & Opposing Loads
    // Viscous & Coulomb friction on bearings and gear teeth
    const normalLoad = 45 + this.params.productMass * 9.81;
    const coulombFrictionTorque = this.params.frictionCoeff * normalLoad * 0.04;
    const viscousDampingTorque = 0.035 * this.angularVelocity;
    const totalResistingTorque = (coulombFrictionTorque + viscousDampingTorque) * (this.angularVelocity > 0.01 ? 1 : 0);

    // Spring resistance during first 80% of stroke (charging reset spring)
    const springDisplacement = Math.sin((this.cycleProgress * Math.PI) / 2) * 0.035; // max 35mm
    const springForce = this.params.springConstant * springDisplacement;
    const springTorque = (springForce * 0.02) / this.params.gearRatio;

    // 4. Net Torque & Angular Acceleration
    const netTorque = Math.max(0, inputTorque - totalResistingTorque - springTorque);

    if (drivingInput || this.isManualDriving) {
      this.angularAcceleration = (netTorque > 0 ? netTorque : -totalResistingTorque) / totalInertia;
    } else {
      // Flywheel coast-down governed solely by friction deceleration
      const frictionDecel = (coulombFrictionTorque + viscousDampingTorque) / totalInertia;
      this.angularAcceleration = -frictionDecel;
    }

    // Integrate angular velocity
    this.angularVelocity += this.angularAcceleration * clampedDt;
    if (this.angularVelocity < 0) {
      this.angularVelocity = 0;
      this.angularAcceleration = 0;
    }

    // Integrate crank angle
    const deltaAngle = this.angularVelocity * clampedDt;
    this.crankAngle += deltaAngle;

    // Update cycle progress (1 full rotation = 2π radians)
    const prevCycle = this.cycleProgress;
    this.cycleProgress = (this.crankAngle % (2 * Math.PI)) / (2 * Math.PI);

    // Sound: Ratchet indexing tick every 30 degrees (π/6)
    const prevTickSlot = Math.floor((this.crankAngle - deltaAngle) / (Math.PI / 6));
    const currTickSlot = Math.floor(this.crankAngle / (Math.PI / 6));
    if (currTickSlot > prevTickSlot && onSoundTrigger) {
      onSoundTrigger('tick');
    }

    // Lock dynamics
    if (this.cycleProgress > 0.45 && this.lockEngaged) {
      this.lockEngaged = false;
      if (onSoundTrigger) onSoundTrigger('unlock');
    }

    // Product drop trigger at apex alignment (around cycleProgress ~ 0.75)
    if (prevCycle < 0.75 && this.cycleProgress >= 0.75 && !this.isDropping) {
      this.isDropping = true;
      this.dropProgress = 0;
      this.dropTime = 0;
      if (onSoundTrigger) onSoundTrigger('gate');
    }

    // Drop physics (free fall & curved chute slide)
    if (this.isDropping) {
      this.dropTime += clampedDt;
      this.dropProgress = Math.min(1.0, this.dropTime / this.dropDuration);

      if (this.dropProgress >= 1.0) {
        this.isDropping = false;
        this.dropProgress = 1.0;
        this.totalCyclesCompleted++;
        this.activeSlot = (this.activeSlot + 1) % 4;
        if (onSoundTrigger) onSoundTrigger('drop');
      }
    }

    // Cycle reset & spring snap back at cycle wrap
    if (prevCycle > 0.92 && this.cycleProgress < 0.1) {
      this.lockEngaged = true;
      if (onSoundTrigger) onSoundTrigger('reset');
    }

    // 5. Work & Energy tracking
    const instantaneousInputPower = inputTorque * this.angularVelocity; // Watts
    const frictionPowerLoss = totalResistingTorque * this.angularVelocity; // Watts
    this.cumulativeInputWork += instantaneousInputPower * clampedDt;
    this.cumulativeFrictionEnergy += frictionPowerLoss * clampedDt;

    // Useful work: advancing the dispenser carousel + potential energy deliver
    const usefulPower = Math.max(0, instantaneousInputPower - frictionPowerLoss);
    this.cumulativeUsefulWork += usefulPower * clampedDt;

    // 6. Rotational Dynamics Outputs
    const inputRPM = (this.angularVelocity * 60) / (2 * Math.PI);
    const outputRPM = inputRPM / this.params.gearRatio;
    const rotationalEnergy = 0.5 * totalInertia * Math.pow(this.angularVelocity, 2);
    const angularMomentum = totalInertia * this.angularVelocity;

    // 7. Gravitational Potential Energy & Fall Velocity
    const g = 9.81; // m/s²
    const currentHeight = this.params.productHeight * (1 - this.dropProgress);
    const gravitationalPE = this.params.productMass * g * currentHeight;
    // Terminal / impact velocity accounting for friction damping along curved chute
    const idealV = Math.sqrt(2 * g * this.params.productHeight * Math.max(0.01, this.dropProgress));
    const dampedV = idealV * (1 - this.params.frictionCoeff * 1.5);

    // 8. Spring force & elastic potential energy
    const storedElasticEnergy = 0.5 * this.params.springConstant * Math.pow(springDisplacement, 2);

    // 9. Counterweight & Equilibrium
    // As product carousel shifts, counterweight balances opposing static moment
    const carouselOffset = Math.sin(this.crankAngle / this.params.gearRatio) * 0.12;
    const loadMoment = this.params.productMass * g * carouselOffset;
    const counterweightMass = 2.4; // kg
    const counterweightArm = -carouselOffset * 0.85; // counter-pivots
    const counterweightMoment = counterweightMass * g * counterweightArm;
    const systemMomentImbalance = Math.abs(loadMoment + counterweightMoment);

    // 10. Efficiency calculation
    const efficiency =
      this.cumulativeInputWork > 0.1
        ? Math.min(96, Math.max(45, (this.cumulativeUsefulWork / this.cumulativeInputWork) * 100))
        : 84.5;

    // 11. Interactive FEA / Von Mises Stress Model
    // Driveshaft radius d = 22mm
    const shaftRadius = 0.011; // meters
    const shaftTorsionStress = (16 * inputTorque) / (Math.PI * Math.pow(shaftRadius * 2, 3) * 1e6); // MPa

    // Gear tooth bending stress via Lewis formula σ = W_t / (b · m · Y)
    // Tangential tooth force W_t = τ / r_gear
    const rGear = 0.045; // 45mm pitch radius
    const tangentialToothForce = (inputTorque * this.params.gearRatio) / rGear;
    const gearFaceWidth = 0.018; // 18mm face
    const gearModule = 0.0025; // 2.5mm module
    const lewisFactor = 0.38; // 20° involute tooth form
    const gearToothBendingStress = tangentialToothForce / (gearFaceWidth * gearModule * lewisFactor * 1e6); // MPa

    // Ratchet pawl shear stress
    const pawlShearStress = (springForce * 1.8) / (0.012 * 0.008 * 1e6); // MPa

    // Von Mises combined equivalent stress: σ_vm = √(σ_b² + 3·τ²)
    const maxVonMisesStress = Math.sqrt(
      Math.pow(gearToothBendingStress, 2) + 3 * Math.pow(shaftTorsionStress, 2)
    );

    const yieldStrength = 310; // Aircraft 6061-T6 Aluminum (yield ~ 276-310 MPa)
    const safetyFactor = maxVonMisesStress > 0.5 ? Math.min(15, yieldStrength / maxVonMisesStress) : 12.5;

    const stressState: 'nominal' | 'elevated' | 'critical' =
      maxVonMisesStress > 200 ? 'critical' : maxVonMisesStress > 90 ? 'elevated' : 'nominal';

    // 12. Interactive Thermal Dynamics Model
    // Frictional heat generation Q_gen = μ · F_normal · v_rel
    const contactSpeed = this.angularVelocity * 0.035; // m/s at bearing race
    const qGenerated = this.params.frictionCoeff * normalLoad * contactSpeed * 4.2; // Thermal Joules/sec (Watts)

    // Dissipation to aluminum chassis heat sinks (convective cooling)
    const ambient = 22.0; // °C
    const thermalConductance = 1.45; // W/°C
    const coolingRate = thermalConductance * (this.bearingTemp - ambient);

    // Temperature change rate: dT = (Q_gen - Q_cool) / C_thermal
    const thermalCapacitance = 65.0; // J/°C
    const deltaT = ((qGenerated - coolingRate) / thermalCapacitance) * clampedDt;

    this.bearingTemp = Math.max(ambient, this.bearingTemp + deltaT * 1.8);
    this.gearTemp = Math.max(ambient, this.gearTemp + deltaT * 1.4);
    this.flywheelTemp = Math.max(ambient, this.flywheelTemp + deltaT * 0.6);

    const telemetry: MechanicalTelemetry = {
      appliedForce: drivingInput ? this.params.crankForce : 0,
      crankRadius: this.params.crankRadius,
      crankAngle: this.crankAngle,
      torque: inputTorque,
      inputRPM,
      outputRPM,
      gearRatio: this.params.gearRatio,
      angularVelocity: this.angularVelocity,
      angularAcceleration: this.angularAcceleration,
      flywheelMass: this.params.flywheelMass,
      flywheelInertia,
      rotationalEnergy,
      angularMomentum,
      lockEngaged: this.lockEngaged,
      lockProgress: this.cycleProgress,
      rotaryDispenserAngle: this.crankAngle / this.params.gearRatio,
      activeProductIndex: this.activeSlot,
      dropProgress: this.dropProgress,
      isDropping: this.isDropping,
      dropVelocity: dampedV,
      dropHeight: currentHeight,
      gravitationalPE,
      productMass: this.params.productMass,
      springCompression: springDisplacement,
      springForce,
      storedElasticEnergy,
      counterweightPos: counterweightArm / 0.12,
      systemMomentImbalance,
      isEquilibrium: systemMomentImbalance < 0.15,
      frictionLoss: frictionPowerLoss,
      usefulEnergy: this.cumulativeUsefulWork,
      inputWork: this.cumulativeInputWork,
      efficiency,
    };

    const stress: StressTelemetry = {
      maxVonMisesStress,
      yieldStrength,
      safetyFactor,
      shaftTorsionStress,
      gearToothBendingStress,
      pawlShearStress,
      stressState,
    };

    const thermal: ThermalTelemetry = {
      bearingTemperature: this.bearingTemp,
      gearContactTemperature: this.gearTemp,
      flywheelHubTemperature: this.flywheelTemp,
      ambientTemperature: ambient,
      heatDissipationRate: coolingRate,
      peakThermalRise: this.bearingTemp - ambient,
    };

    return { telemetry, stress, thermal };
  }
}
