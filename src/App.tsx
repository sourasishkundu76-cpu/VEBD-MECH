import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VendingScene } from './components/vending3d/VendingScene';
import { TopNav } from './components/ui/TopNav';
import { ProblemLabPanel } from './components/ui/ProblemLabPanel';
import { PhysicsDashboard } from './components/ui/PhysicsDashboard';
import { EnergyFlowBar } from './components/ui/EnergyFlowBar';
import { ExperimentLabModal } from './components/ui/ExperimentLabModal';
import { ArchitectureModal } from './components/ui/ArchitectureModal';
import { StepByStepController, SIMULATION_STEPS } from './components/ui/StepByStepController';
import { PhysicsSimulationEngine, DEFAULT_EXPERIMENT_PARAMS } from './physics/engine';
import { ENGINEERING_PROBLEMS } from './data/problems';
import { soundEngine } from './audio/soundEngine';
import {
  EngineeringProblem,
  ExperimentParams,
  MechanicalTelemetry,
  StressTelemetry,
  ThermalTelemetry,
  ViewCameraMode,
  SimulationOverlay,
} from './types/physics';

export default function App() {
  // Primary Simulation Engine instance
  const engineRef = useRef<PhysicsSimulationEngine>(new PhysicsSimulationEngine());

  // Interactive UI State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSlowMotion, setIsSlowMotion] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<ViewCameraMode>('default');
  const [overlay, setOverlay] = useState<SimulationOverlay>('normal');

  // Selected Engineering Problem (1 to 10)
  const [selectedProblem, setSelectedProblem] = useState<EngineeringProblem>(
    ENGINEERING_PROBLEMS[0]
  );
  const [isSolvingProblem, setIsSolvingProblem] = useState<boolean>(false);
  const [problemSolveMessage, setProblemSolveMessage] = useState<string | null>(null);

  // Experiment Lab & Architecture Modals
  const [isExperimentLabOpen, setIsExperimentLabOpen] = useState<boolean>(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);
  const [experimentParams, setExperimentParams] = useState<ExperimentParams>(
    DEFAULT_EXPERIMENT_PARAMS
  );

  // 12-Step Guided Workflow
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isAutoStepping, setIsAutoStepping] = useState<boolean>(false);

  // Target Component Spotlight in 3D
  const [targetComponent, setTargetComponent] = useState<string | null>('dispenser');

  // Live Telemetry states
  const [telemetry, setTelemetry] = useState<MechanicalTelemetry>(() => {
    const initial = engineRef.current.step(0.016, false);
    return initial.telemetry;
  });
  const [stress, setStress] = useState<StressTelemetry>(() => {
    const initial = engineRef.current.step(0.016, false);
    return initial.stress;
  });
  const [thermal, setThermal] = useState<ThermalTelemetry>(() => {
    const initial = engineRef.current.step(0.016, false);
    return initial.thermal;
  });

  // Sound trigger dispatcher
  const handleSoundTrigger = useCallback((type: 'tick' | 'unlock' | 'gate' | 'drop' | 'reset') => {
    switch (type) {
      case 'tick':
        soundEngine.playRatchetTick();
        break;
      case 'unlock':
        soundEngine.playLockRelease();
        break;
      case 'gate':
        soundEngine.playGateSlide();
        break;
      case 'drop':
        soundEngine.playDropThud();
        break;
      case 'reset':
        soundEngine.playSpringReset();
        break;
    }
  }, []);

  // Update experiment parameters in engine
  const handleUpdateParams = useCallback((newParams: Partial<ExperimentParams>) => {
    setExperimentParams((prev) => {
      const merged = { ...prev, ...newParams };
      engineRef.current.updateParams(merged);
      return merged;
    });
  }, []);

  // Reset entire simulation
  const handleReset = useCallback(() => {
    engineRef.current.reset();
    setIsRunning(false);
    setIsSolvingProblem(false);
    setIsAutoStepping(false);
    setProblemSolveMessage(null);
    soundEngine.playSpringReset();
  }, []);

  // Manual hand crank interaction from 3D drag
  const handleManualCrankDelta = useCallback((deltaAngle: number) => {
    if (deltaAngle > 0) {
      engineRef.current.angularVelocity = Math.min(
        18,
        engineRef.current.angularVelocity + deltaAngle * 12
      );
      engineRef.current.isManualDriving = true;
    }
  }, []);

  // Problem Lab Selector handler
  const handleSelectProblem = useCallback((prob: EngineeringProblem) => {
    setSelectedProblem(prob);
    setTargetComponent(prob.targetComponent);
    setProblemSolveMessage(null);
    soundEngine.playUiClick();

    if (prob.defaultParams) {
      handleUpdateParams(prob.defaultParams);
    }

    // Switch camera mode to highlight relevant subsystem
    if (prob.targetComponent === 'gears') setCameraMode('mechanical');
    else if (prob.targetComponent === 'flywheel') setCameraMode('flywheel');
    else if (prob.targetComponent === 'dispenser' || prob.targetComponent === 'chute')
      setCameraMode('dispenser');
    else if (prob.targetComponent === 'energy') setOverlay('energy_flow');
    else setCameraMode('default');
  }, [handleUpdateParams]);

  // Solve selected problem automatically
  const handleSolveProblem = useCallback((prob: EngineeringProblem) => {
    setIsSolvingProblem(true);
    setIsRunning(true);
    setProblemSolveMessage(`Simulating physical solution for Problem #${prob.code}...`);
    soundEngine.playUiClick();

    // After 1 full cycle (~3.5 seconds), finalize solution
    setTimeout(() => {
      setIsSolvingProblem(false);
      setProblemSolveMessage(`✓ Solved: ${prob.solutionMechanism}`);
    }, 4200);
  }, []);

  // Auto-stepping interval for 12-step guided physics tour
  useEffect(() => {
    if (!isAutoStepping) return;
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        const next = (prev + 1) % SIMULATION_STEPS.length;
        setTargetComponent(SIMULATION_STEPS[next].target);
        return next;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [isAutoStepping]);

  // Main high-frequency simulation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      // Scale dt for slow motion (0.2x)
      const dt = isSlowMotion ? rawDt * 0.2 : rawDt;

      // Determine if driving force is actively engaged
      const driving = isRunning || isSolvingProblem || engineRef.current.isManualDriving;
      if (engineRef.current.isManualDriving) {
        engineRef.current.isManualDriving = false;
      }

      // Step physics engine
      const { telemetry: t, stress: s, thermal: th } = engineRef.current.step(
        dt,
        driving,
        handleSoundTrigger
      );

      // Dynamic mechanical drone audio tracking input RPM
      soundEngine.updateRPM(t.inputRPM);

      // Sync state for UI panels
      setTelemetry(t);
      setStress(s);
      setThermal(th);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, isSolvingProblem, isSlowMotion, handleSoundTrigger]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#060911] text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Strictly Compliant 3-Zone Top Navigation Header */}
      <TopNav
        isRunning={isRunning}
        onTogglePlay={() => {
          setIsRunning((prev) => !prev);
          soundEngine.playUiClick();
        }}
        onReset={handleReset}
        isMuted={isMuted}
        onToggleMute={() => {
          const muted = soundEngine.toggleMuted();
          setIsMuted(muted);
        }}
        isSlowMotion={isSlowMotion}
        onToggleSlowMotion={() => setIsSlowMotion((prev) => !prev)}
        overlay={overlay}
        onSelectOverlay={(newOverlay) => {
          setOverlay(newOverlay);
          soundEngine.playUiClick();
        }}
        cameraMode={cameraMode}
        onSelectCamera={(newCam) => {
          setCameraMode(newCam);
          soundEngine.playUiClick();
        }}
        onOpenExperimentLab={() => setIsExperimentLabOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* 2. Main Desktop Layout: Left Problem Lab + Center 3D Machine Hero + Right Live Telemetry */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left-Side: Problem Lab (01 - 10 Preloaded Problems) */}
        <ProblemLabPanel
          selectedProblem={selectedProblem}
          onSelectProblem={handleSelectProblem}
          onSolveProblem={handleSolveProblem}
          isSolving={isSolvingProblem}
        />

        {/* Center: Hero 3D Futuristic Vending Machine Viewport */}
        <main className="flex-1 relative h-full min-w-0 bg-gradient-to-b from-[#060911] to-[#04060c]">
          {/* 12-Step Guided Physics Workflow Banner */}
          <StepByStepController
            currentStepIndex={stepIndex}
            onSetStepIndex={(idx) => {
              setStepIndex(idx);
              setTargetComponent(SIMULATION_STEPS[idx].target);
              soundEngine.playUiClick();
            }}
            isAutoStepping={isAutoStepping}
            onToggleAutoStep={() => setIsAutoStepping((prev) => !prev)}
          />

          {/* Active Problem Educational Banner (When solving or inspected) */}
          {problemSolveMessage && (
            <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs px-4 py-2 rounded-xl backdrop-blur-md shadow-lg max-w-xl text-center animate-in fade-in slide-in-from-top-2">
              <span className="font-tech font-bold uppercase tracking-wider text-cyan-300 mr-2">
                Physics Solution:
              </span>
              {problemSolveMessage}
            </div>
          )}

          {/* Interactive 3D WebGL Canvas (The True Hero) */}
          <VendingScene
            telemetry={telemetry}
            stress={stress}
            thermal={thermal}
            cameraMode={cameraMode}
            overlay={overlay}
            targetComponent={targetComponent}
            onManualCrankDelta={handleManualCrankDelta}
            isSlowMotion={isSlowMotion}
          />

          {/* Quick Camera Preset Pills in 3D Viewport Corner */}
          <div className="absolute bottom-4 left-6 z-10 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 px-2 font-mono font-semibold uppercase">
              Camera:
            </span>
            {(
              [
                { mode: 'default', label: 'Overview' },
                { mode: 'mechanical', label: 'Gears' },
                { mode: 'flywheel', label: 'Flywheel' },
                { mode: 'dispenser', label: 'Chute' },
                { mode: 'physics', label: 'Vectors' },
              ] as const
            ).map((cam) => (
              <button
                key={cam.mode}
                onClick={() => {
                  setCameraMode(cam.mode);
                  soundEngine.playUiClick();
                }}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                  cameraMode === cam.mode
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* Live RPM / Speed Ticker on Hero Screen */}
          <div className="absolute bottom-4 right-6 z-10 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-cyan-500/20 flex items-center gap-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Driveshaft Speed</div>
              <div className="text-sm font-mono-num font-bold text-cyan-300">
                {telemetry.inputRPM.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">RPM</span>
              </div>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Lock Status</div>
              <div
                className={`text-xs font-mono font-bold ${
                  telemetry.lockEngaged ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {telemetry.lockEngaged ? 'LOCKED' : 'RELEASED'}
              </div>
            </div>
          </div>
        </main>

        {/* Right-Side: Real-Time Physics Telemetry & Stress / Thermal Models */}
        <PhysicsDashboard
          telemetry={telemetry}
          stress={stress}
          thermal={thermal}
          overlay={overlay}
          onSelectOverlay={(newOverlay) => setOverlay(newOverlay)}
        />
      </div>

      {/* 3. Bottom Energy Flow Sequence Tracker */}
      <EnergyFlowBar
        telemetry={telemetry}
        onSelectStage={(idx) => {
          soundEngine.playUiClick();
          if (idx === 0 || idx === 1) setTargetComponent('crank');
          else if (idx === 2 || idx === 3) setTargetComponent('gears');
          else if (idx === 4) setTargetComponent('flywheel');
          else if (idx === 5) setTargetComponent('lock');
          else if (idx === 6 || idx === 7) setTargetComponent('chute');
        }}
      />

      {/* 4. Virtual Experiment Lab Parameter Tuning Modal */}
      <ExperimentLabModal
        isOpen={isExperimentLabOpen}
        onClose={() => setIsExperimentLabOpen(false)}
        params={experimentParams}
        onUpdateParams={handleUpdateParams}
      />

      {/* 5. System Mechanical Architecture Schematic Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
        telemetry={telemetry}
        stress={stress}
        thermal={thermal}
      />
    </div>
  );
}
