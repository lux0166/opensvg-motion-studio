import React from 'react';
import { SnapPosition } from '../../engine/workspaceTypes';
import { Layers, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface DockingCompassOverlayProps {
  containerRect: DOMRect | null;
  activeHoverPos: SnapPosition | null;
  onHoverPosChange: (pos: SnapPosition | null) => void;
  onDrop: (pos: SnapPosition) => void;
}

export const DockingCompassOverlay: React.FC<DockingCompassOverlayProps> = ({
  containerRect,
  activeHoverPos,
  onHoverPosChange,
  onDrop,
}) => {
  if (!containerRect) return null;

  return (
    <div
      className="absolute inset-0 z-50 pointer-events-auto select-none"
      onMouseLeave={() => onHoverPosChange(null)}
      onMouseUp={() => {
        if (activeHoverPos) onDrop(activeHoverPos);
      }}
    >
      {/* Translucent Blue Snap Preview Overlay */}
      {activeHoverPos && (
        <div
          className={`absolute bg-blue-500/25 dark:bg-blue-600/30 border-2 border-blue-500 dark:border-blue-400 rounded-xl transition-all duration-150 pointer-events-none shadow-lg backdrop-blur-2xs ${
            activeHoverPos === 'tab'
              ? 'inset-1'
              : activeHoverPos === 'top'
              ? 'inset-x-1 top-1 h-[48%]'
              : activeHoverPos === 'bottom'
              ? 'inset-x-1 bottom-1 h-[48%]'
              : activeHoverPos === 'left'
              ? 'inset-y-1 left-1 w-[48%]'
              : 'inset-y-1 right-1 w-[48%]'
          }`}
        />
      )}

      {/* Docking Compass 5-Way Diamond Guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-28 h-28 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/20 p-2 shadow-2xl flex items-center justify-center pointer-events-auto">
          {/* Top Zone */}
          <button
            type="button"
            title="Split Top"
            onMouseEnter={() => onHoverPosChange('top')}
            className={`absolute top-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              activeHoverPos === 'top'
                ? 'bg-blue-600 text-white scale-110 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          {/* Bottom Zone */}
          <button
            type="button"
            title="Split Bottom"
            onMouseEnter={() => onHoverPosChange('bottom')}
            className={`absolute bottom-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              activeHoverPos === 'bottom'
                ? 'bg-blue-600 text-white scale-110 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          {/* Left Zone */}
          <button
            type="button"
            title="Split Left"
            onMouseEnter={() => onHoverPosChange('left')}
            className={`absolute left-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              activeHoverPos === 'left'
                ? 'bg-blue-600 text-white scale-110 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Right Zone */}
          <button
            type="button"
            title="Split Right"
            onMouseEnter={() => onHoverPosChange('right')}
            className={`absolute right-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              activeHoverPos === 'right'
                ? 'bg-blue-600 text-white scale-110 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Center Tab Zone */}
          <button
            type="button"
            title="Stack as Tab"
            onMouseEnter={() => onHoverPosChange('tab')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeHoverPos === 'tab'
                ? 'bg-blue-600 text-white scale-115 shadow-lg font-bold'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
