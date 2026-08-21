import React, { useRef } from 'react';
import { CubicBezierCurve } from '../engine/types';
import { Sliders } from 'lucide-react';

export interface BezierCurvePreset {
  id: string;
  name: string;
  curve: CubicBezierCurve;
}

export const PRESET_CURVES: BezierCurvePreset[] = [
  { id: 'linear', name: 'Linear', curve: { x1: 0, y1: 0, x2: 1, y2: 1 } },
  { id: 'ease', name: 'Ease', curve: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 } },
  { id: 'ease-in', name: 'Ease In', curve: { x1: 0.42, y1: 0, x2: 1, y2: 1 } },
  { id: 'ease-out', name: 'Ease Out', curve: { x1: 0, y1: 0, x2: 0.58, y2: 1 } },
  { id: 'ease-in-out', name: 'Ease In-Out', curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
  { id: 'ease-out-back', name: 'Back / Pop', curve: { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 } },
  { id: 'anticipate', name: 'Anticipate', curve: { x1: 0.36, y1: 0, x2: 0.66, y2: -0.56 } },
  { id: 'snappy-spring', name: 'Snappy', curve: { x1: 0.16, y1: 1.08, x2: 0.38, y2: 1 } },
];

interface BezierCurveGraphProps {
  curve: CubicBezierCurve;
  onChange: (curve: CubicBezierCurve) => void;
  compact?: boolean;
  className?: string;
  showPresets?: boolean;
  showFormula?: boolean;
}

export const BezierCurveGraph: React.FC<BezierCurveGraphProps> = ({
  curve,
  onChange,
  compact = false,
  className = '',
  showPresets = true,
  showFormula = true,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Compact viewBox: 320 x 140
  const width = 320;
  const height = 130;
  const paddingX = 28;
  const paddingY = 22;

  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  // Normalized (0,0) is at (paddingX, height - paddingY)
  // Normalized (1,1) is at (width - paddingX, paddingY)
  const toSvgX = (nx: number) => paddingX + nx * graphWidth;
  const toSvgY = (ny: number) => height - paddingY - ny * graphHeight;

  const p0 = { x: toSvgX(0), y: toSvgY(0) };
  const p1 = { x: toSvgX(curve.x1), y: toSvgY(curve.y1) };
  const p2 = { x: toSvgX(curve.x2), y: toSvgY(curve.y2) };
  const p3 = { x: toSvgX(1), y: toSvgY(1) };

  const pathData = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
  const areaData = `${pathData} L ${p3.x} ${p0.y} L ${p0.x} ${p0.y} Z`;

  const handleDrag = (handle: 'p1' | 'p2', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const svg = svgRef.current;
    if (!svg) return;

    const onMove = (moveEv: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;

      const clientX = (moveEv.clientX - rect.left) * scaleX;
      const clientY = (moveEv.clientY - rect.top) * scaleY;

      let nx = (clientX - paddingX) / graphWidth;
      let ny = (height - paddingY - clientY) / graphHeight;

      // X is clamped [0, 1] per CSS cubic-bezier spec; Y can overshoot [-0.8, 2.0]
      nx = Math.max(0, Math.min(1, parseFloat(nx.toFixed(2))));
      ny = Math.max(-0.8, Math.min(2.0, parseFloat(ny.toFixed(2))));

      if (handle === 'p1') {
        onChange({ ...curve, x1: nx, y1: ny });
      } else {
        onChange({ ...curve, x2: nx, y2: ny });
      }
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const activePreset = PRESET_CURVES.find(
    (p) =>
      Math.abs(p.curve.x1 - curve.x1) < 0.03 &&
      Math.abs(p.curve.y1 - curve.y1) < 0.03 &&
      Math.abs(p.curve.x2 - curve.x2) < 0.03 &&
      Math.abs(p.curve.y2 - curve.y2) < 0.03
  );

  return (
    <div className={`flex flex-col gap-1.5 ${compact ? 'max-w-md' : 'max-w-xl'} mx-auto w-full ${className}`}>
      {/* Docked Preset Selection Bar */}
      {showPresets && (
        <div className="flex flex-wrap items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-100/90 dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/80 text-[10px]">
          {PRESET_CURVES.map((p) => {
            const isSelected = activePreset?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(p.curve)}
                className={`px-1.5 py-0.5 rounded-md font-medium text-[10px] transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-700/50'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Proportional, Sleek Bezier Canvas SVG */}
      <div className="relative w-full rounded-xl bg-white dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 p-1 overflow-hidden shadow-2xs">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[110px] select-none overflow-visible"
        >
          <defs>
            <linearGradient id="bezierGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Box */}
          <rect
            x={paddingX}
            y={paddingY}
            width={graphWidth}
            height={graphHeight}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-zinc-800/80"
            strokeWidth="1"
          />

          {/* Baseline Y=0 and Topline Y=1 */}
          <line
            x1={paddingX - 4}
            y1={toSvgY(0)}
            x2={width - paddingX + 4}
            y2={toSvgY(0)}
            stroke="currentColor"
            className="text-slate-200 dark:text-zinc-800"
            strokeWidth="1"
          />
          <line
            x1={paddingX - 4}
            y1={toSvgY(1)}
            x2={width - paddingX + 4}
            y2={toSvgY(1)}
            stroke="currentColor"
            className="text-slate-200 dark:text-zinc-800"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Diagonal Linear Guide */}
          <line
            x1={p0.x}
            y1={p0.y}
            x2={p3.x}
            y2={p3.y}
            stroke="currentColor"
            className="text-slate-200/50 dark:text-zinc-800/60"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Tangent line P0 -> P1 */}
          <line
            x1={p0.x}
            y1={p0.y}
            x2={p1.x}
            y2={p1.y}
            stroke="#60a5fa"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            opacity="0.85"
          />

          {/* Tangent line P3 -> P2 */}
          <line
            x1={p3.x}
            y1={p3.y}
            x2={p2.x}
            y2={p2.y}
            stroke="#c084fc"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            opacity="0.85"
          />

          {/* Area Fill */}
          <path d={areaData} fill="url(#bezierGrad)" />

          {/* Main Bezier Curve */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* P0 (Start) and P3 (End) Solid Pins */}
          <circle cx={p0.x} cy={p0.y} r="3" fill="#3b82f6" />
          <circle cx={p3.x} cy={p3.y} r="3" fill="#3b82f6" />

          {/* P1 Handle (Interactive Draggable with Keyboard Support) */}
          <g
            role="slider"
            tabIndex={0}
            aria-label="Tangent handle P1 (control point 1)"
            aria-valuenow={Math.round(curve.x1 * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="cursor-grab active:cursor-grabbing group outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onMouseDown={(e) => handleDrag('p1', e)}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 0.05 : 0.01;
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                onChange({ ...curve, x1: Math.min(1, parseFloat((curve.x1 + step).toFixed(2))) });
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onChange({ ...curve, x1: Math.max(0, parseFloat((curve.x1 - step).toFixed(2))) });
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                onChange({ ...curve, y1: Math.min(2.0, parseFloat((curve.y1 + step).toFixed(2))) });
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                onChange({ ...curve, y1: Math.max(-0.8, parseFloat((curve.y1 - step).toFixed(2))) });
              }
            }}
          >
            <circle
              cx={p1.x}
              cy={p1.y}
              r="9"
              fill="transparent"
            />
            <circle
              cx={p1.x}
              cy={p1.y}
              r="4"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="drop-shadow-xs group-hover:scale-125 transition-transform origin-center"
            />
          </g>

          {/* P2 Handle (Interactive Draggable with Keyboard Support) */}
          <g
            role="slider"
            tabIndex={0}
            aria-label="Tangent handle P2 (control point 2)"
            aria-valuenow={Math.round(curve.x2 * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="cursor-grab active:cursor-grabbing group outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            onMouseDown={(e) => handleDrag('p2', e)}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 0.05 : 0.01;
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                onChange({ ...curve, x2: Math.min(1, parseFloat((curve.x2 + step).toFixed(2))) });
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onChange({ ...curve, x2: Math.max(0, parseFloat((curve.x2 - step).toFixed(2))) });
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                onChange({ ...curve, y2: Math.min(2.0, parseFloat((curve.y2 + step).toFixed(2))) });
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                onChange({ ...curve, y2: Math.max(-0.8, parseFloat((curve.y2 - step).toFixed(2))) });
              }
            }}
          >
            <circle
              cx={p2.x}
              cy={p2.y}
              r="9"
              fill="transparent"
            />
            <circle
              cx={p2.x}
              cy={p2.y}
              r="4"
              fill="#9333ea"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="drop-shadow-xs group-hover:scale-125 transition-transform origin-center"
            />
          </g>
        </svg>

        {/* Floating Axis Labels */}
        <div className="absolute left-2 bottom-1 text-[9px] font-mono text-slate-400 dark:text-zinc-500">
          0.0
        </div>
        <div className="absolute right-2 top-1 text-[9px] font-mono text-slate-400 dark:text-zinc-500">
          1.0
        </div>
      </div>

      {/* Formula Readout */}
      {showFormula && (
        <div className="flex items-center justify-between px-2.5 py-1 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200/60 dark:border-zinc-800 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 font-mono text-[10.5px]">
            <Sliders className="w-3 h-3 text-slate-400" />
            <span>cubic-bezier({curve.x1}, {curve.y1}, {curve.x2}, {curve.y2})</span>
          </div>
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-800/40">
            {activePreset ? activePreset.name : 'Custom'}
          </span>
        </div>
      )}
    </div>
  );
};
