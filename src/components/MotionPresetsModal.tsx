import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { CubicBezierCurve } from '../engine/types';
import { MOTION_PRESETS, MotionPreset, PresetCategory } from '../engine/motionPresets';
import { BezierCurveGraph } from './BezierCurveGraph';
import {
  Sparkles,
  X,
  Search,
  Sliders,
  Play,
  RotateCw,
  RotateCcw,
  Heart,
  Feather,
  Sun,
  Activity,
  Eye,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  ArrowDown,
  Minimize2,
  Check,
  ChevronDown,
  ChevronUp,
  LineChart
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5" />,
  ArrowUpCircle: <ArrowUpCircle className="w-5 h-5" />,
  ArrowRightCircle: <ArrowRightCircle className="w-5 h-5" />,
  RotateCw: <RotateCw className="w-5 h-5" />,
  ArrowDownCircle: <ArrowDownCircle className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  Feather: <Feather className="w-5 h-5" />,
  Sun: <Sun className="w-5 h-5" />,
  Activity: <Activity className="w-5 h-5" />,
  Eye: <Eye className="w-5 h-5" />,
  Minimize2: <Minimize2 className="w-5 h-5" />,
  ArrowDown: <ArrowDown className="w-5 h-5" />,
  RotateCcw: <RotateCcw className="w-5 h-5" />,
};

export const MotionPresetsModal: React.FC = () => {
  const {
    isPresetsModalOpen,
    setPresetsModalOpen,
    applyMotionPresetToSelection,
    selectedId,
    selectedIds,
    nodes,
    setTimelineMode,
    showToast
  } = useStudioStore();

  const [activeCategory, setActiveCategory] = useState<PresetCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(1.0);
  const [delay, setDelay] = useState(0.0);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [showCurveGraph, setShowCurveGraph] = useState(false);
  const [customCurve, setCustomCurve] = useState<CubicBezierCurve>({ x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 });
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPresetsModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPresetsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    searchInputRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresetsModalOpen, setPresetsModalOpen]);

  const selectedCount = selectedIds.length > 0 ? selectedIds.length : selectedId && selectedId !== 'frame-1' ? 1 : 0;
  const targetLabel = selectedCount === 0
    ? 'No layer selected'
    : selectedCount === 1
    ? `Target: ${nodes[selectedId || selectedIds[0]]?.name || 'Selected Layer'}`
    : `Target: ${selectedCount} selected layers`;

  const filteredPresets = useMemo(() => {
    return MOTION_PRESETS.filter((p) => {
      const matchCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  if (!isPresetsModalOpen) return null;

  const handleApply = (preset: MotionPreset) => {
    applyMotionPresetToSelection(preset.id, {
      duration: duration ?? preset.defaultDuration,
      intensity,
      delay,
      replaceTracks: true
    });

    setAppliedId(preset.id);
    setTimeout(() => {
      setAppliedId(null);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 motion-reduce:animate-none motion-reduce:duration-0"
      onClick={() => setPresetsModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="presets-title"
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="presets-title" className="text-base font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                Motion Presets & Transitions
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">
                  1-Click Animation
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {targetLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPresetsModalOpen(false)}
            aria-label="Close presets modal"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Category Filter & Search */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-zinc-800 p-1 rounded-xl">
            {(['all', 'entrance', 'emphasis', 'exit'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-all ${
                  activeCategory === cat
                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                {cat === 'all' ? 'All Presets' : cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              ref={searchInputRef}
              type="text"
              aria-label="Search motion presets"
              placeholder="Search animations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Customization Sliders Bar */}
        <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs gap-6 overflow-x-auto">
          <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 shrink-0 font-medium">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Preset Tuning:</span>
          </div>

          <div className="flex items-center gap-4 grow justify-end">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-slate-500 dark:text-zinc-400 text-xs">Duration:</span>
              <input
                type="range"
                aria-label="Preset duration in seconds"
                min="0.3"
                max="3.0"
                step="0.1"
                value={duration ?? 0.8}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-20 accent-blue-600"
              />
              <span className="text-slate-700 dark:text-zinc-300 font-mono text-xs w-8">
                {(duration ?? 0.8).toFixed(1)}s
              </span>
            </div>

            <div className="flex items-center gap-2 min-w-[130px]">
              <span className="text-slate-500 dark:text-zinc-400 text-xs">Intensity:</span>
              <input
                type="range"
                aria-label="Preset intensity multiplier"
                min="0.5"
                max="2.0"
                step="0.1"
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                className="w-16 accent-blue-600"
              />
              <span className="text-slate-700 dark:text-zinc-300 font-mono text-xs w-6">
                {intensity.toFixed(1)}x
              </span>
            </div>

            <div className="flex items-center gap-2 min-w-[120px]">
              <span className="text-slate-500 dark:text-zinc-400 text-xs">Delay:</span>
              <input
                type="range"
                aria-label="Preset delay in seconds"
                min="0.0"
                max="1.5"
                step="0.1"
                value={delay}
                onChange={(e) => setDelay(parseFloat(e.target.value))}
                className="w-16 accent-blue-600"
              />
              <span className="text-slate-700 dark:text-zinc-300 font-mono text-xs w-6">
                {delay.toFixed(1)}s
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowCurveGraph(!showCurveGraph)}
              aria-expanded={showCurveGraph}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                showCurveGraph
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Curve Graph</span>
              {showCurveGraph ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Collapsible Interactive Bezier Curve Inspector */}
        {showCurveGraph && (
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-zinc-900/80 border-b border-slate-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Live Easing Curve Inspector
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Drag handles or pick a preset to adjust acceleration curve
              </span>
            </div>
            <BezierCurveGraph
              curve={customCurve}
              onChange={setCustomCurve}
              compact={true}
              showPresets={true}
              showFormula={true}
            />
          </div>
        )}

        {/* Presets Grid Cards */}
        <div className="p-6 overflow-y-auto max-h-[50vh] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 custom-scrollbar">
          {filteredPresets.map((preset) => {
            const isApplied = appliedId === preset.id;
            const categoryBadgeColor =
              preset.category === 'entrance'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40'
                : preset.category === 'emphasis'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40';

            return (
              <div
                key={preset.id}
                className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 bg-white dark:bg-zinc-800/70 hover:shadow-md hover:-translate-y-0.5 ${
                  isApplied
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-2 ring-emerald-500/30'
                    : 'border-slate-200/90 dark:border-zinc-700/80 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-700/80 flex items-center justify-center text-slate-700 dark:text-zinc-200 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {ICON_MAP[preset.icon] || <Sparkles className="w-4 h-4" />}
                    </div>
                    <span className={`text-xs uppercase font-semibold px-2 py-0.5 rounded-md border ${categoryBadgeColor}`}>
                      {preset.category}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {preset.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 leading-relaxed mb-3">
                    {preset.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-700/60">
                  <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
                    {preset.defaultDuration}s default
                  </span>

                  <button
                    type="button"
                    onClick={() => handleApply(preset)}
                    disabled={selectedCount === 0}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      isApplied
                        ? 'bg-emerald-700 dark:bg-emerald-600 text-white font-semibold shadow-xs'
                        : selectedCount === 0
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                        : 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-blue-600 dark:hover:bg-blue-600 dark:hover:text-white shadow-2xs hover:shadow-xs active:scale-95'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Applied
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        Apply
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>💡 Applies keyframes directly to selected timeline tracks. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 font-mono text-xs text-slate-700 dark:text-zinc-300">Ctrl+Z</kbd> to undo.</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTimelineMode('graph');
                setPresetsModalOpen(false);
                showToast('Switched to Timeline Graph Editor');
              }}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 hover:dark:bg-indigo-900/50 font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Open in Graph Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setPresetsModalOpen(false)}
              className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
