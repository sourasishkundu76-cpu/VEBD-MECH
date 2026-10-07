import React from 'react';
import { ArrowRight, Zap, Check } from 'lucide-react';
import { MechanicalTelemetry } from '../../types/physics';

interface EnergyFlowBarProps {
  telemetry: MechanicalTelemetry;
  currentStepIndex?: number;
  onSelectStage?: (index: number) => void;
}

const FLOW_STAGES = [
  { id: 'human', label: 'Human Energy', physics: 'Metabolic Work (W = ∫F ds)' },
  { id: 'torque', label: 'Torque', physics: 'τ = r · F · sinθ' },
  { id: 'rotation', label: 'Rotational Motion', physics: 'ω = Δθ / Δt' },
  { id: 'gears', label: 'Gear Transmission', physics: 'Torque Multiplication (MA = i)' },
  { id: 'flywheel', label: 'Flywheel Inertia', physics: 'Kinetic Reservoir (½ I ω²)' },
  { id: 'lock', label: 'Mechanical Lock', physics: 'Ratchet Detent Threshold' },
  { id: 'gravity', label: 'Gravity Release', physics: 'Potential Energy (mgh)' },
  { id: 'delivery', label: 'Product Delivery', physics: 'Kinetic Arrival (½ mv²)' },
];

export const EnergyFlowBar: React.FC<EnergyFlowBarProps> = ({
  telemetry,
  onSelectStage,
}) => {
  // Determine current active stage index from cycle progress
  let activeIndex = 0;
  if (telemetry.isDropping) {
    activeIndex = telemetry.dropProgress > 0.85 ? 7 : 6;
  } else if (!telemetry.lockEngaged) {
    activeIndex = 5;
  } else if (telemetry.rotationalEnergy > 0.2) {
    activeIndex = 4;
  } else if (telemetry.angularVelocity > 0.1) {
    activeIndex = 3;
  } else if (telemetry.torque > 0.5) {
    activeIndex = 1;
  } else if (telemetry.appliedForce > 0) {
    activeIndex = 0;
  }

  return (
    <div className="h-14 w-full px-6 border-t border-slate-800/80 bg-[#070b13]/90 backdrop-blur-md flex items-center justify-between shrink-0 select-none z-20 overflow-x-auto">
      <div className="flex items-center gap-2 mr-4 shrink-0">
        <Zap className="w-4 h-4 text-cyan-400" />
        <span className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
          Energy Flow
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-center">
        {FLOW_STAGES.map((stage, idx) => {
          const isActive = idx === activeIndex;
          const isPassed = idx < activeIndex;

          return (
            <React.Fragment key={stage.id}>
              <div
                onClick={() => onSelectStage && onSelectStage(idx)}
                className={`flex flex-col items-center px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-sm'
                    : isPassed
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-400 opacity-60'
                }`}
                title={stage.physics}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
                  {isPassed ? (
                    <Check className="w-3 h-3 text-cyan-400" />
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                  ) : null}
                  <span>{stage.label}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]">
                  {stage.physics}
                </div>
              </div>

              {idx < FLOW_STAGES.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mx-0.5" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="shrink-0 ml-4 font-mono text-xs text-cyan-400">
        Cycle: {((telemetry.lockProgress || 0) * 100).toFixed(0)}%
      </div>
    </div>
  );
};
