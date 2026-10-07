import React from 'react';
import { ENGINEERING_PROBLEMS } from '../../data/problems';
import { EngineeringProblem } from '../../types/physics';
import { PlayCircle, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

interface ProblemLabPanelProps {
  selectedProblem: EngineeringProblem;
  onSelectProblem: (problem: EngineeringProblem) => void;
  onSolveProblem: (problem: EngineeringProblem) => void;
  isSolving: boolean;
}

export const ProblemLabPanel: React.FC<ProblemLabPanelProps> = ({
  selectedProblem,
  onSelectProblem,
  onSolveProblem,
  isSolving,
}) => {
  return (
    <aside className="w-80 h-full border-r border-slate-800/80 bg-[#070b13]/85 backdrop-blur-md flex flex-col shrink-0 select-none overflow-hidden z-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h2 className="font-tech text-sm font-bold tracking-wider text-slate-100 uppercase">
              Problem Lab
            </h2>
          </div>
          <span className="text-[11px] font-mono text-cyan-400/80">10 PRELOADED</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Select an engineering challenge to demonstrate its physics solution in 3D.
        </p>
      </div>

      {/* 10 Problem Selector List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-850 p-2 space-y-1">
        {ENGINEERING_PROBLEMS.map((prob) => {
          const isSelected = selectedProblem.id === prob.id;
          return (
            <button
              key={prob.id}
              onClick={() => onSelectProblem(prob)}
              className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 group ${
                isSelected
                  ? 'bg-cyan-950/60 border border-cyan-500/40 text-slate-100 shadow-sm'
                  : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <span
                className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 group-hover:text-cyan-300'
                }`}
              >
                {prob.code}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium leading-tight truncate text-slate-200">
                  {prob.title}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {prob.subtitle}
                </div>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Selected Problem Active Inspection Card */}
      <div className="p-4 border-t border-slate-800 bg-[#090f1a] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-tech text-cyan-400 uppercase tracking-wider font-semibold">
            Active Challenge #{selectedProblem.code}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Target: {selectedProblem.targetComponent.toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
          {selectedProblem.problemStatement}
        </p>

        {/* Formula Box */}
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-cyan-900/40">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mb-1">
            <span>{selectedProblem.formulaLabel}</span>
            <span className="text-cyan-400">PHYSICS LAW</span>
          </div>
          <div className="font-mono text-xs text-cyan-300 font-semibold tracking-wide">
            {selectedProblem.primaryFormula}
          </div>
        </div>

        {/* Action Button: Solve Problem in 3D */}
        <button
          onClick={() => onSolveProblem(selectedProblem)}
          disabled={isSolving}
          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            isSolving
              ? 'bg-cyan-500/30 text-cyan-300 cursor-wait'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950'
          }`}
        >
          {isSolving ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              Executing 3D Solution...
            </>
          ) : (
            <>
              <PlayCircle className="w-3.5 h-3.5" />
              Simulate 3D Solution
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
