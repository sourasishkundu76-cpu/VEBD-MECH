import React from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Layers } from 'lucide-react';

export interface SimulationStep {
  step: number;
  label: string;
  target: 'crank' | 'gears' | 'flywheel' | 'lock' | 'dispenser' | 'chute' | 'spring' | 'counterweight' | 'energy';
  description: string;
  formula: string;
}

export const SIMULATION_STEPS: SimulationStep[] = [
  { step: 1, label: 'User Input', target: 'crank', description: 'Operator grips the ergonomic crank handle to deliver input energy.', formula: 'W = F · d' },
  { step: 2, label: 'Force Applied', target: 'crank', description: 'Tangential biomechanical force is applied normal to the crank lever arm.', formula: 'F_applied = 45 N' },
  { step: 3, label: 'Torque Generated', target: 'crank', description: 'Rotational moment is created around the primary drive spindle.', formula: 'τ = r · F · sinθ' },
  { step: 4, label: 'Crank Rotates', target: 'crank', description: 'Angular velocity increases, rotating the input driveshaft.', formula: 'ω = Δθ / Δt' },
  { step: 5, label: 'Gear Train Activates', target: 'gears', description: 'Input pinion meshes with compound cluster gear, multiplying torque.', formula: 'i = 2.5:1 (τ_out = i · τ_in)' },
  { step: 6, label: 'Flywheel Accelerates', target: 'flywheel', description: 'Heavy perimeter inertia rim spins up, storing rotational kinetic energy.', formula: 'K_rot = ½ · I · ω²' },
  { step: 7, label: 'Mechanical Lock Releases', target: 'lock', description: 'Spring-loaded detent ratchet pawl trips as torque threshold is exceeded.', formula: 'τ ≥ τ_threshold' },
  { step: 8, label: 'Rotary Dispenser Alignment', target: 'dispenser', description: 'Carousel advances exactly 90°, positioning product above drop aperture.', formula: 'Δθ = π/2 rad' },
  { step: 9, label: 'Gravity Release', target: 'chute', description: 'Retention gate opens; gravitational field acts upon the stored payload.', formula: 'F_g = m · g' },
  { step: 10, label: 'Product Fall & Slide', target: 'chute', description: 'Canister accelerates down the curved chute, converting PE to linear KE.', formula: 'PE = mgh ⟶ ½ mv²' },
  { step: 11, label: 'Delivery in Tray', target: 'chute', description: 'Product deflects damped retrieval flap and comes to rest in the delivery bay.', formula: 'Impulse = Δp' },
  { step: 12, label: 'Mechanical Reset', target: 'spring', description: 'Compressed recoil spring returns pawl into engagement and re-arms lock.', formula: 'F_recoil = -k · x' },
];

interface StepByStepControllerProps {
  currentStepIndex: number;
  onSetStepIndex: (index: number) => void;
  isAutoStepping: boolean;
  onToggleAutoStep: () => void;
}

export const StepByStepController: React.FC<StepByStepControllerProps> = ({
  currentStepIndex,
  onSetStepIndex,
  isAutoStepping,
  onToggleAutoStep,
}) => {
  const currentStep = SIMULATION_STEPS[currentStepIndex] || SIMULATION_STEPS[0];

  const handlePrev = () => {
    onSetStepIndex((currentStepIndex - 1 + SIMULATION_STEPS.length) % SIMULATION_STEPS.length);
  };

  const handleNext = () => {
    onSetStepIndex((currentStepIndex + 1) % SIMULATION_STEPS.length);
  };

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-[#070b13]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-4 select-none max-w-2xl">
      <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
        <Layers className="w-4 h-4 text-cyan-400" />
        <span className="font-mono text-xs font-bold text-cyan-400">
          STEP {String(currentStep.step).padStart(2, '0')}/12
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-tech text-xs font-bold text-slate-100 uppercase tracking-wider">
            {currentStep.label}
          </span>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/20">
            {currentStep.formula}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 truncate mt-0.5">
          {currentStep.description}
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
        <button
          onClick={handlePrev}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Previous Step"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleAutoStep}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
            isAutoStepping
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          {isAutoStepping ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
          <span className="text-[10px] uppercase font-mono">{isAutoStepping ? 'Pause' : 'Auto'}</span>
        </button>

        <button
          onClick={handleNext}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Next Step"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
