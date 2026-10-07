import React from 'react';
import { X, RotateCcw, Sliders, Check } from 'lucide-react';
import { ExperimentParams } from '../../types/physics';
import { DEFAULT_EXPERIMENT_PARAMS } from '../../physics/engine';

interface ExperimentLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: ExperimentParams;
  onUpdateParams: (newParams: Partial<ExperimentParams>) => void;
}

export const ExperimentLabModal: React.FC<ExperimentLabModalProps> = ({
  isOpen,
  onClose,
  params,
  onUpdateParams,
}) => {
  if (!isOpen) return null;

  // Real-time calculated theoretical engineering metrics
  const theoreticalTorque = params.crankRadius * params.crankForce * 0.96;
  const theoreticalInertia = 0.5 * params.flywheelMass * Math.pow(params.flywheelRadius, 2);
  const theoreticalPE = params.productMass * 9.81 * params.productHeight;
  const theoreticalMaxRPM = (theoreticalTorque / (theoreticalInertia + 0.05)) * 9.5;
  const theoreticalEfficiency = Math.max(50, Math.min(96, 92 - params.frictionCoeff * 120));

  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'aerospace':
        onUpdateParams({
          frictionCoeff: 0.02,
          gearRatio: 3.2,
          flywheelMass: 8.5,
          flywheelRadius: 0.24,
        });
        break;
      case 'heavy_payload':
        onUpdateParams({
          productMass: 2.4,
          crankForce: 85,
          crankRadius: 0.28,
          springConstant: 950,
        });
        break;
      case 'rapid_dispense':
        onUpdateParams({
          gearRatio: 1.5,
          crankForce: 55,
          flywheelMass: 4.0,
          frictionCoeff: 0.03,
        });
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-6 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#090e18] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-tech text-base font-bold text-slate-100 uppercase tracking-wider">
                Virtual Experiment Laboratory
              </h2>
              <p className="text-xs text-slate-400">
                Adjust physical variables to evaluate system mechanical behavior and energy conservation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">ENGINEERING PRESETS:</span>
          <button
            onClick={() => applyPreset('aerospace')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-cyan-300 hover:bg-cyan-950 border border-cyan-500/30 transition-colors"
          >
            Aerospace Low-Friction
          </button>
          <button
            onClick={() => applyPreset('heavy_payload')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-amber-300 hover:bg-amber-950 border border-amber-500/30 transition-colors"
          >
            Heavy Titanium Payload
          </button>
          <button
            onClick={() => applyPreset('rapid_dispense')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-emerald-300 hover:bg-emerald-950 border border-emerald-500/30 transition-colors"
          >
            High-Velocity Rapid Index
          </button>
          <button
            onClick={() => onUpdateParams(DEFAULT_EXPERIMENT_PARAMS)}
            className="ml-auto text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-2 gap-6 flex-1">
          {/* 1. Crank Force */}
          <div className="space-y-1.5 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">User Crank Force (F)</span>
              <span className="font-mono text-cyan-300 font-bold">{params.crankForce} N</span>
            </div>
            <input
              type="range"
              min="10"
              max="140"
              step="5"
              value={params.crankForce}
              onChange={(e) => onUpdateParams({ crankForce: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-400">Biomechanic arm pushing strength</div>
          </div>

          {/* 2. Crank Radius */}
          <div className="space-y-1.5 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Crank Arm Radius (r)</span>
              <span className="font-mono text-cyan-300 font-bold">{(params.crankRadius * 100).toFixed(0)} cm</span>
            </div>
            <input
              type="range"
              min="0.12"
              max="0.35"
              step="0.01"
              value={params.crankRadius}
              onChange={(e) => onUpdateParams({ crankRadius: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-400">Torque lever arm distance (τ = rF)</div>
          </div>

          {/* 3. Gear Ratio */}
          <div className="space-y-1.5 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Gear Ratio (i)</span>
              <span className="font-mono text-cyan-300 font-bold">{params.gearRatio.toFixed(1)} : 1</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="4.5"
              step="0.1"
              value={params.gearRatio}
              onChange={(e) => onUpdateParams({ gearRatio: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-400">Mechanical advantage torque multiplier</div>
          </div>

          {/* 4. Flywheel Mass */}
          <div className="space-y-1.5 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Flywheel Mass (m)</span>
              <span className="font-mono text-cyan-300 font-bold">{params.flywheelMass.toFixed(1)} kg</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="12.0"
              step="0.5"
              value={params.flywheelMass}
              onChange={(e) => onUpdateParams({ flywheelMass: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-400">Rotational inertia & smoothing capacity</div>
          </div>

          {/* 5. Product Mass */}
          <div className="space-y-1.5 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Product Canister Mass (m)</span>
              <span className="font-mono text-cyan-300 font-bold">{params.productMass.toFixed(2)} kg</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={params.productMass}
              onChange={(e) => onUpdateParams({ productMass: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-400">Payload weight in gravity drop chute</div>
          </div>

          {/* 6. Product Stored Height */}
          <div className="space-y-1.5 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Storage Rack Height (h)</span>
              <span className="font-mono text-cyan-300 font-bold">{params.productHeight.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.05"
              value={params.productHeight}
              onChange={(e) => onUpdateParams({ productHeight: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-400">Initial Gravitational Potential Energy</div>
          </div>

          {/* 7. Friction Coefficient */}
          <div className="space-y-1.5 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Friction Coefficient (μ)</span>
              <span className="font-mono text-cyan-300 font-bold">{params.frictionCoeff.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.20"
              step="0.005"
              value={params.frictionCoeff}
              onChange={(e) => onUpdateParams({ frictionCoeff: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-400">Bearing & chute sliding surface friction</div>
          </div>

          {/* 8. Spring Constant */}
          <div className="space-y-1.5 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Reset Spring Constant (k)</span>
              <span className="font-mono text-cyan-300 font-bold">{params.springConstant} N/m</span>
            </div>
            <input
              type="range"
              min="200"
              max="1400"
              step="50"
              value={params.springConstant}
              onChange={(e) => onUpdateParams({ springConstant: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-400">Hooke's law recoil spring stiffness</div>
          </div>
        </div>

        {/* Live Engineering Calculations Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Torque (τ)</div>
            <div className="text-sm font-mono-num font-bold text-cyan-300">
              {theoreticalTorque.toFixed(2)} N·m
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Inertia (I)</div>
            <div className="text-sm font-mono-num font-bold text-slate-100">
              {theoreticalInertia.toFixed(3)} kg·m²
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Potential Energy</div>
            <div className="text-sm font-mono-num font-bold text-emerald-400">
              {theoreticalPE.toFixed(1)} J
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Projected Efficiency</div>
            <div className="text-sm font-mono-num font-bold text-cyan-400">
              {theoreticalEfficiency.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
