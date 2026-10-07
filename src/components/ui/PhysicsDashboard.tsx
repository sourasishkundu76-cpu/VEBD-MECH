import React from 'react';
import {
  MechanicalTelemetry,
  StressTelemetry,
  ThermalTelemetry,
  SimulationOverlay,
} from '../../types/physics';
import { Activity, Flame, ShieldAlert, Zap, Compass, RotateCw } from 'lucide-react';

interface PhysicsDashboardProps {
  telemetry: MechanicalTelemetry;
  stress: StressTelemetry;
  thermal: ThermalTelemetry;
  overlay: SimulationOverlay;
  onSelectOverlay: (overlay: SimulationOverlay) => void;
}

export const PhysicsDashboard: React.FC<PhysicsDashboardProps> = ({
  telemetry,
  stress,
  thermal,
  overlay,
  onSelectOverlay,
}) => {
  return (
    <aside className="w-88 h-full border-l border-slate-800/80 bg-[#070b13]/85 backdrop-blur-md flex flex-col shrink-0 select-none overflow-hidden z-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="font-tech text-sm font-bold tracking-wider text-slate-100 uppercase">
            Live Physics Telemetry
          </h2>
        </div>
        <span className="text-[10px] text-cyan-400/90 font-mono">CALCULATED LIVE</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Section 1: Applied Force & Torque */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Input Force & Torque</span>
            <span className="font-mono text-[10px] text-cyan-400">τ = r · F · sinθ</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400">Applied Force</div>
              <div className="text-base font-mono-num font-bold text-cyan-300 mt-0.5">
                {telemetry.appliedForce.toFixed(1)} <span className="text-xs font-normal text-slate-400">N</span>
              </div>
            </div>

            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400">Generated Torque</div>
              <div className="text-base font-mono-num font-bold text-cyan-300 mt-0.5">
                {telemetry.torque.toFixed(2)} <span className="text-xs font-normal text-slate-400">N·m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Rotational Dynamics & Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Rotational Dynamics</span>
            <span className="font-mono text-[10px] text-cyan-400">ω = Δθ / Δt</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400">Input RPM</div>
              <div className="text-sm font-mono-num font-bold text-slate-100 mt-0.5">
                {telemetry.inputRPM.toFixed(1)}
              </div>
            </div>

            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400">Output RPM</div>
              <div className="text-sm font-mono-num font-bold text-slate-100 mt-0.5">
                {telemetry.outputRPM.toFixed(1)}
              </div>
            </div>

            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400">Angular Vel (ω)</div>
              <div className="text-sm font-mono-num font-bold text-slate-100 mt-0.5">
                {telemetry.angularVelocity.toFixed(2)} <span className="text-[9px] text-slate-400">r/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Flywheel Rotational Kinetic Energy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Flywheel Energy</span>
            <span className="font-mono text-[10px] text-cyan-400">K = ½ · I · ω²</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400">Rotational Energy</div>
              <div className="text-base font-mono-num font-bold text-emerald-400 mt-0.5">
                {telemetry.rotationalEnergy.toFixed(2)} <span className="text-xs font-normal text-slate-400">J</span>
              </div>
            </div>

            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400">Angular Momentum (L)</div>
              <div className="text-base font-mono-num font-bold text-emerald-400 mt-0.5">
                {telemetry.angularMomentum.toFixed(3)} <span className="text-[10px] font-normal text-slate-400">kg·m²/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Gravity & Potential Energy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Gravity & Dispensing</span>
            <span className="font-mono text-[10px] text-cyan-400">PE = m · g · h</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400">Payload Mass</div>
              <div className="text-sm font-mono-num font-bold text-slate-100 mt-0.5">
                {telemetry.productMass.toFixed(2)} <span className="text-[9px] text-slate-400">kg</span>
              </div>
            </div>

            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400">Drop Height</div>
              <div className="text-sm font-mono-num font-bold text-slate-100 mt-0.5">
                {telemetry.dropHeight.toFixed(2)} <span className="text-[9px] text-slate-400">m</span>
              </div>
            </div>

            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400">Potential Energy</div>
              <div className="text-sm font-mono-num font-bold text-slate-100 mt-0.5">
                {telemetry.gravitationalPE.toFixed(1)} <span className="text-[9px] text-slate-400">J</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Springs & Reset Mechanics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Spring & Equilibrium</span>
            <span className="font-mono text-[10px] text-cyan-400">F = k · x</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400">Spring Force</div>
              <div className="text-sm font-mono-num font-bold text-slate-100 mt-0.5">
                {telemetry.springForce.toFixed(1)} <span className="text-xs font-normal text-slate-400">N</span>
              </div>
            </div>

            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400">Stored Elastic Energy</div>
              <div className="text-sm font-mono-num font-bold text-slate-100 mt-0.5">
                {telemetry.storedElasticEnergy.toFixed(3)} <span className="text-xs font-normal text-slate-400">J</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Stress Test FEA Module */}
        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Von Mises Stress Test (FEA)</span>
            </div>
            <button
              onClick={() => onSelectOverlay('stress_fea')}
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold transition-colors ${
                overlay === 'stress_fea'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-amber-900/40 text-amber-300 hover:bg-amber-800/50'
              }`}
            >
              3D VIEW
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <div className="text-[10px] text-slate-400">Peak Equivalent Stress</div>
              <div className="text-sm font-mono-num font-bold text-amber-300">
                {stress.maxVonMisesStress.toFixed(1)} <span className="text-[10px] text-slate-400">MPa</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Safety Factor (n)</div>
              <div className="text-sm font-mono-num font-bold text-emerald-400">
                {stress.safetyFactor.toFixed(1)}× <span className="text-[10px] text-slate-400">({stress.stressState})</span>
              </div>
            </div>
          </div>

          {/* Stress gradient bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-green-500 via-amber-500 to-red-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (stress.maxVonMisesStress / stress.yieldStrength) * 100)}%` }}
            />
          </div>
        </div>

        {/* Section 7: Thermal Dynamics Model */}
        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
              <Flame className="w-3.5 h-3.5" />
              <span>Thermal Dynamics Simulation</span>
            </div>
            <button
              onClick={() => onSelectOverlay('thermal_ir')}
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold transition-colors ${
                overlay === 'thermal_ir'
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-900/40 text-rose-300 hover:bg-rose-800/50'
              }`}
            >
              IR VIEW
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <div>
              <div className="text-[10px] text-slate-400">Bearing Race</div>
              <div className="text-sm font-mono-num font-bold text-rose-300">
                {thermal.bearingTemperature.toFixed(1)}°C
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Gear Contact</div>
              <div className="text-sm font-mono-num font-bold text-rose-300">
                {thermal.gearContactTemperature.toFixed(1)}°C
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Dissipation</div>
              <div className="text-sm font-mono-num font-bold text-slate-200">
                {thermal.heatDissipationRate.toFixed(1)} <span className="text-[9px]">W</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 8: Friction & Mechanical Efficiency */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Mechanical Efficiency</span>
            <span className="text-sm font-mono-num font-bold text-cyan-400">
              {telemetry.efficiency.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${telemetry.efficiency}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
            <span>Frictional Loss: {telemetry.frictionLoss.toFixed(2)} W</span>
            <span>Total Work: {telemetry.inputWork.toFixed(1)} J</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
