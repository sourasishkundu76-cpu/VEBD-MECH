import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, Flame, ShieldAlert, Sliders, Network } from 'lucide-react';
import { ViewCameraMode, SimulationOverlay } from '../../types/physics';

interface TopNavProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isSlowMotion: boolean;
  onToggleSlowMotion: () => void;
  overlay: SimulationOverlay;
  onSelectOverlay: (overlay: SimulationOverlay) => void;
  cameraMode: ViewCameraMode;
  onSelectCamera: (cam: ViewCameraMode) => void;
  onOpenExperimentLab: () => void;
  onOpenArchitecture: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  isRunning,
  onTogglePlay,
  onReset,
  isMuted,
  onToggleMute,
  isSlowMotion,
  onToggleSlowMotion,
  overlay,
  onSelectOverlay,
  cameraMode,
  onSelectCamera,
  onOpenExperimentLab,
  onOpenArchitecture,
}) => {
  return (
    <header className="h-16 w-full px-6 flex items-center justify-between border-b border-cyan-900/30 bg-[#070b13]/90 backdrop-blur-md z-30 select-none shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-tech text-xl font-bold tracking-wider text-slate-100 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 rotate-45 inline-block" />
              VEND-MECH
            </span>
            <span className="text-xs text-cyan-400 font-tech font-semibold tracking-widest px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/40">
              PHYSICS SIMULATOR
            </span>
          </div>
          <span className="text-[11px] text-slate-400 tracking-wide">
            FORCE · MOTION · ENERGY · MECHANICS
          </span>
        </div>
      </div>

      {/* Zone 2: Simulation Mode Tabs & Inspection Views */}
      <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => {
            onSelectOverlay('normal');
            onSelectCamera('default');
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            overlay === 'normal' && cameraMode === 'default'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Default 3D
        </button>

        <button
          onClick={() => {
            onSelectOverlay('physics_vectors');
            onSelectCamera('physics');
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            overlay === 'physics_vectors'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Physics Vectors
        </button>

        <button
          onClick={() => {
            onSelectOverlay('internal_xray');
            onSelectCamera('mechanical');
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            overlay === 'internal_xray'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Internal X-Ray
        </button>

        <button
          onClick={() => {
            onSelectOverlay('stress_fea');
            onSelectCamera('stress');
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            overlay === 'stress_fea'
              ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
              : 'text-amber-400/90 hover:text-amber-300'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Stress Test FEA
        </button>

        <button
          onClick={() => {
            onSelectOverlay('thermal_ir');
            onSelectCamera('thermal');
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            overlay === 'thermal_ir'
              ? 'bg-rose-500 text-white font-semibold shadow-sm'
              : 'text-rose-400 hover:text-rose-300'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Thermal Dynamics
        </button>

        <button
          onClick={() => onSelectOverlay('energy_flow')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            overlay === 'energy_flow'
              ? 'bg-cyan-400 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Energy Flow
        </button>

        <span className="w-px h-5 bg-slate-800 mx-1" />

        <button
          onClick={onOpenExperimentLab}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-cyan-300 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Experiment Lab
        </button>

        <button
          onClick={onOpenArchitecture}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-cyan-300 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          Architecture
        </button>
      </nav>

      {/* Zone 3: Primary Action Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSlowMotion}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
            isSlowMotion
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Slow Motion (0.2x speed)"
        >
          Slow-Mo (0.2x)
        </button>

        <button
          onClick={onToggleMute}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
          title={isMuted ? 'Unmute Mechanical Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        <button
          onClick={onReset}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Reset Simulation Mechanics"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-sm ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-tech uppercase tracking-wider'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              Pause Sim
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Sim
            </>
          )}
        </button>
      </div>
    </header>
  );
};
