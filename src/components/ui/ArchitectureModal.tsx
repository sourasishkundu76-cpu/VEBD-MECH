import React, { useState } from 'react';
import { X, Network, ArrowDown, ChevronRight } from 'lucide-react';
import { MechanicalTelemetry, StressTelemetry, ThermalTelemetry } from '../../types/physics';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: MechanicalTelemetry;
  stress: StressTelemetry;
  thermal: ThermalTelemetry;
}

interface ArchNode {
  id: string;
  name: string;
  subsystem: string;
  physicsPrinciple: string;
  purpose: string;
  formula: string;
  formulaExplanation: string;
  getValue: (t: MechanicalTelemetry, s: StressTelemetry, th: ThermalTelemetry) => string;
}

const ARCHITECTURE_NODES: ArchNode[] = [
  {
    id: 'user_input',
    name: '01. Human Metabolic Input',
    subsystem: 'Biomechanical Interface',
    physicsPrinciple: 'Human Force & Mechanical Work',
    purpose: 'Provides initial chemical-to-mechanical energy transfer into the system.',
    formula: 'W = ∫ F · ds',
    formulaExplanation: 'Force applied over the displacement arc generates mechanical work.',
    getValue: (t) => `${t.appliedForce.toFixed(1)} N applied`,
  },
  {
    id: 'crank',
    name: '02. Hand Crank Spindle',
    subsystem: 'Input Drive Subsystem',
    physicsPrinciple: 'Torque & Angular Lever Arm',
    purpose: 'Converts tangential linear arm force into rotational moment around the central axis.',
    formula: 'τ = r · F · sinθ',
    formulaExplanation: 'Torque equals crank radius multiplied by normal force.',
    getValue: (t) => `${t.torque.toFixed(2)} N·m generated`,
  },
  {
    id: 'gear_train',
    name: '03. Precision Compound Gear Train',
    subsystem: 'Kinematic Transmission',
    physicsPrinciple: 'Mechanical Advantage & Involute Meshing',
    purpose: 'Multiplies drive torque and adapts rotational velocity to dispenser indexing speed.',
    formula: 'i = ω_in / ω_out = z_out / z_in',
    formulaExplanation: 'Gear ratio trades angular displacement for torque multiplication.',
    getValue: (t) => `${t.gearRatio.toFixed(1)}:1 ratio (${t.inputRPM.toFixed(1)} → ${t.outputRPM.toFixed(1)} RPM)`,
  },
  {
    id: 'flywheel',
    name: '04. Heavy Perimeter Flywheel',
    subsystem: 'Inertial Energy Reservoir',
    physicsPrinciple: 'Rotational Kinetic Energy & Angular Momentum',
    purpose: 'Buffers jerky human torque fluctuations and smooths rotation through dead points.',
    formula: 'K_rot = ½ · I · ω²   (L = I · ω)',
    formulaExplanation: 'High peripheral mass stores kinetic energy during peak force strokes.',
    getValue: (t) => `${t.rotationalEnergy.toFixed(2)} J stored (${t.angularMomentum.toFixed(3)} kg·m²/s)`,
  },
  {
    id: 'lock',
    name: '05. Mechanical Detent & Ratchet Lock',
    subsystem: 'Escapement & Safety',
    physicsPrinciple: 'Static Equilibrium & Preloaded Constraint',
    purpose: 'Prevents accidental dispensing and back-rotation until torque threshold is met.',
    formula: 'τ_threshold ≥ k_detent · x · r',
    formulaExplanation: 'Lock pawl releases only when applied torque overcomes preloaded spring.',
    getValue: (t) => (t.lockEngaged ? 'ENGAGED (Constrained)' : 'RELEASED (Gate Tripped)'),
  },
  {
    id: 'dispenser',
    name: '06. Rotary Quadrant Dispenser',
    subsystem: 'Payload Indexing Carousel',
    physicsPrinciple: 'Rotational Displacement & Indexing',
    purpose: 'Aligns exactly one product slot with the drop chute per 360° crank rotation.',
    formula: 'Δθ_rotor = 2π / n_slots = π / 2',
    formulaExplanation: 'Discrete quadrant advancement guarantees single-item separation.',
    getValue: (t) => `Slot #${t.activeProductIndex + 1} aligned (${(t.rotaryDispenserAngle * (180 / Math.PI)).toFixed(0)}°)`,
  },
  {
    id: 'gravity_chute',
    name: '07. Curved Gravity Slide Channel',
    subsystem: 'Gravitational Free-Fall Guide',
    physicsPrinciple: 'Gravitational Potential Energy & Sliding Friction',
    purpose: 'Safely guides released canister downward while dissipating excess terminal velocity.',
    formula: 'PE = m · g · h   ⟶   a = g(sinθ - μ cosθ)',
    formulaExplanation: 'Potential energy converts to kinetic energy with normal frictional damping.',
    getValue: (t) => `${t.gravitationalPE.toFixed(1)} J potential (${t.dropVelocity.toFixed(1)} m/s)`,
  },
  {
    id: 'tray',
    name: '08. Damped Delivery Bay',
    subsystem: 'Dispense Interface',
    physicsPrinciple: 'Inelastic Impact & Damped Deceleration',
    purpose: 'Arrests descending canister velocity and pushes open the retrieval door.',
    formula: 'Impulse = ∫ F · dt = Δp',
    formulaExplanation: 'Spring flap absorbs momentum and presents payload for user pickup.',
    getValue: (t) => (t.dropProgress >= 1.0 ? 'Payload Presented' : 'Awaiting Release'),
  },
  {
    id: 'reset_system',
    name: '09. Spring & Counterweight Reset',
    subsystem: 'Autonomous Reset',
    physicsPrinciple: "Hooke's Law & Moment Equilibrium",
    purpose: 'Automatically returns lock pawl to safe rest and balances carousel static moments.',
    formula: 'F_recoil = -k · x   &   Στ = 0',
    formulaExplanation: 'Stored elastic strain energy returns the mechanism to initial state.',
    getValue: (t) => `${t.springForce.toFixed(1)} N recoil (${t.isEquilibrium ? 'Balanced' : 'Compensating'})`,
  },
];

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  stress,
  thermal,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('crank');

  if (!isOpen) return null;

  const activeNode =
    ARCHITECTURE_NODES.find((n) => n.id === selectedNodeId) || ARCHITECTURE_NODES[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#090e18] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <Network className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-tech text-base font-bold text-slate-100 uppercase tracking-wider">
                System Mechanical Architecture
              </h2>
              <p className="text-xs text-slate-400">
                End-to-end mechanical schematic of force, kinematic transfer, energy storage, and reset.
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

        {/* Content: Left Flowchart List & Right Detail Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Flow Diagram Column */}
          <div className="w-1/2 p-4 overflow-y-auto border-r border-slate-800 space-y-2">
            {ARCHITECTURE_NODES.map((node, i) => {
              const isSelected = node.id === selectedNodeId;
              return (
                <React.Fragment key={node.id}>
                  <button
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 text-slate-100 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {node.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {node.subsystem}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`}
                    />
                  </button>
                  {i < ARCHITECTURE_NODES.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <ArrowDown className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Detailed Subsystem Inspection Right Pane */}
          <div className="w-1/2 p-6 overflow-y-auto flex flex-col justify-between bg-slate-950/40">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                  {activeNode.subsystem}
                </span>
                <h3 className="font-tech text-lg font-bold text-slate-100 mt-0.5">
                  {activeNode.name}
                </h3>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Physics Principle
                </div>
                <div className="text-sm text-cyan-300 font-medium">
                  {activeNode.physicsPrinciple}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Mechanical Role & Purpose
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeNode.purpose}
                </p>
              </div>

              {/* Formula Card */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-cyan-900/50 space-y-1.5">
                <div className="text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>MATHEMATICAL LAW</span>
                  <span className="text-cyan-400 font-semibold">ENGINEERING FORMULA</span>
                </div>
                <div className="font-mono text-sm text-cyan-300 font-bold">
                  {activeNode.formula}
                </div>
                <p className="text-[11px] text-slate-400 pt-1 leading-normal">
                  {activeNode.formulaExplanation}
                </p>
              </div>
            </div>

            {/* Live Telemetry Value */}
            <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">CURRENT REAL-TIME VALUE</span>
              <span className="text-sm font-mono-num font-bold text-emerald-400">
                {activeNode.getValue(telemetry, stress, thermal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
