import React, { useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { Settings, X, Sliders, Clock, Ratio, Palette, Check } from 'lucide-react';

const RESOLUTION_PRESETS = [
  { label: '800 × 600 (Default)', width: 800, height: 600 },
  { label: '1920 × 1080 (FHD 16:9)', width: 1920, height: 1080 },
  { label: '1080 × 1080 (Square 1:1)', width: 1080, height: 1080 },
  { label: '1080 × 1920 (Story 9:16)', width: 1080, height: 1920 },
  { label: '1200 × 630 (Social Banner)', width: 1200, height: 630 }
];

const FPS_OPTIONS = [24, 30, 60, 120];

export const ProjectSettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    rootFrame,
    updateRootFrame,
    duration,
    setDuration,
    fps,
    setFps,
    showToast
  } = useStudioStore();

  useEffect(() => {
    if (!isSettingsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSettingsOpen, setSettingsOpen]);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Project Settings</h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Canvas dimensions, framerate, and playback parameters</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:dark:text-zinc-200 hover:bg-slate-100 hover:dark:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Project / Stage Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Composition Name
            </label>
            <input
              type="text"
              value={rootFrame.name}
              onChange={(e) => updateRootFrame({ name: e.target.value })}
              className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
            />
          </div>

          {/* Canvas Resolution Presets */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Ratio className="w-3.5 h-3.5 text-blue-500" />
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Canvas Dimensions
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2.5">
              {RESOLUTION_PRESETS.map((preset) => {
                const isSelected = rootFrame.width === preset.width && rootFrame.height === preset.height;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      updateRootFrame({ width: preset.width, height: preset.height });
                      showToast(`Canvas resized to ${preset.width}×${preset.height}`);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-left border text-[11px] transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                        : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-blue-500" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Width & Height inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={rootFrame.width}
                  min={100}
                  max={4096}
                  onChange={(e) => updateRootFrame({ width: Math.max(10, parseInt(e.target.value, 10) || 800) })}
                  className="w-full h-8 px-3 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={rootFrame.height}
                  min={100}
                  max={4096}
                  onChange={(e) => updateRootFrame({ height: Math.max(10, parseInt(e.target.value, 10) || 600) })}
                  className="w-full h-8 px-3 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                />
              </div>
            </div>
          </div>

          {/* Duration & FPS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Duration (Seconds)
                </label>
              </div>
              <input
                type="number"
                value={duration}
                min={0.5}
                max={120}
                step={0.5}
                onChange={(e) => setDuration(Math.max(0.5, parseFloat(e.target.value) || 3.0))}
                className="w-full h-8 px-3 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Framerate (FPS)
                </label>
              </div>
              <div className="flex gap-1.5">
                {FPS_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setFps(rate)}
                    className={`flex-1 h-8 rounded-xl text-xs font-mono font-medium border transition-all ${
                      fps === rate
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    {rate}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Background Color & Clip Content */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Stage Background</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={rootFrame.fill || '#ffffff'}
                onChange={(e) => updateRootFrame({ fill: e.target.value })}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-zinc-700 cursor-pointer"
              />
              <span className="text-xs font-mono uppercase text-slate-600 dark:text-zinc-400">
                {rootFrame.fill || '#ffffff'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
