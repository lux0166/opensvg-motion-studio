import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { CubicBezierCurve } from '../../engine/types';
import { BezierCurveGraph } from '../BezierCurveGraph';
import { Activity } from 'lucide-react';

export const GraphEditorPanel: React.FC = () => {
  const {
    nodes,
    selectedId,
    selectedTrackId,
    updateKeyframeCurve
  } = useStudioStore();

  const activeNode = selectedId ? nodes[selectedId] : null;
  const activeTrack = activeNode?.tracks?.find((t) => t.id === selectedTrackId) || activeNode?.tracks?.[0];
  const activeKeyframe = activeTrack?.keyframes?.[0];
  const currentCurve: CubicBezierCurve = activeKeyframe?.curve || { x1: 0.42, y1: 0, x2: 0.58, y2: 1 };

  const handleCurveChange = (newCurve: CubicBezierCurve) => {
    if (selectedId && activeTrack && activeKeyframe) {
      updateKeyframeCurve(selectedId, activeTrack.property, activeKeyframe.id, newCurve);
    }
  };

  const isLinear = currentCurve.x1 === 0 && currentCurve.y1 === 0 && currentCurve.x2 === 1 && currentCurve.y2 === 1;
  const isHold = currentCurve.x1 === 0 && currentCurve.y1 === 0 && currentCurve.x2 === 0 && currentCurve.y2 === 1;
  const isCubic = !isLinear && !isHold;

  return (
    <div className="w-full h-full min-h-0 bg-white dark:bg-zinc-900 flex flex-col p-2.5 overflow-y-auto shrink-0 select-none">
      {/* Header: Track Indicator */}
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Curve Interpolation</span>
        </div>
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40 truncate max-w-[120px]">
          {activeTrack?.label || (activeNode ? activeNode.name : 'No Track')}
        </span>
      </div>

      {/* Interpolation Mode Pills */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg text-xs mb-2 shrink-0">
        <button
          type="button"
          onClick={() => handleCurveChange({ x1: 0, y1: 0, x2: 1, y2: 1 })}
          aria-pressed={isLinear}
          className={`py-1 rounded-md font-semibold text-xs text-center transition-all flex items-center justify-center gap-1 ${
            isLinear
              ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'hover:bg-white hover:dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
          }`}
          title="Linear interpolation"
        >
          <span>/</span> Linear
        </button>
        <button
          type="button"
          onClick={() => handleCurveChange({ x1: 0.42, y1: 0, x2: 0.58, y2: 1 })}
          aria-pressed={isCubic}
          className={`py-1 rounded-md font-semibold text-xs text-center transition-all flex items-center justify-center gap-1 ${
            isCubic
              ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'hover:bg-white hover:dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
          }`}
          title="Cubic Bézier curve"
        >
          <span>〰️</span> Cubic
        </button>
        <button
          type="button"
          onClick={() => handleCurveChange({ x1: 0, y1: 0, x2: 0, y2: 1 })}
          aria-pressed={isHold}
          className={`py-1 rounded-md font-semibold text-xs text-center transition-all flex items-center justify-center gap-1 ${
            isHold
              ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'hover:bg-white hover:dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
          }`}
          title="Hold / Step interpolation"
        >
          <span>⎍</span> Hold
        </button>
      </div>

      {/* Cubic Bezier Interactive Curve Box */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <BezierCurveGraph
          curve={currentCurve}
          onChange={handleCurveChange}
          compact={true}
          showPresets={true}
          showFormula={true}
          className="w-full"
        />
      </div>
    </div>
  );
};
