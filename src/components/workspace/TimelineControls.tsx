import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { parseAudioFile } from '../../engine/audioEngine';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Music,
  Bookmark,
  Gem,
  Activity
} from 'lucide-react';

/**
 * Centered Playback Transport Controls & Time Counter (Big, prominent & comfortable)
 */
export const TimelinePlaybackControls: React.FC = () => {
  const {
    currentTime,
    duration,
    isPlaying,
    loop,
    setCurrentTime,
    setPlaying,
    setLoop,
    showToast
  } = useStudioStore();

  return (
    <div className="flex items-center justify-center gap-1.5 select-none shrink-0">
      {/* Transport Button Cluster */}
      <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-zinc-800/90 p-0.5 rounded-lg border border-slate-200/70 dark:border-zinc-700/60 shadow-2xs">
        <button
          type="button"
          title="Go to Start (0)"
          onClick={() => setCurrentTime(0)}
          className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-all"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Step Back 0.1s (←)"
          onClick={() => setCurrentTime(Math.max(0, currentTime - 0.1))}
          className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Play / Pause (Space)"
          onClick={() => setPlaying(!isPlaying)}
          className={`w-8 h-8 flex items-center justify-center text-white rounded-md shadow-xs transition-all active:scale-95 ${
            isPlaying ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600 shadow-md shadow-blue-500/20'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          type="button"
          title="Step Forward 0.1s (→)"
          onClick={() => setCurrentTime(Math.min(duration, currentTime + 0.1))}
          className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Toggle Loop"
          onClick={() => {
            setLoop(!loop);
            showToast(loop ? 'Loop: Disabled' : 'Loop: Enabled');
          }}
          className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${
            loop
              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-400 dark:text-zinc-500 hover:bg-white/60 hover:dark:bg-zinc-700/60'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Time Counter Display */}
      <div className="text-xs font-semibold font-mono text-slate-800 dark:text-zinc-200 flex items-center gap-1 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-zinc-700 shadow-2xs">
        <span className="text-blue-600 dark:text-blue-400 w-9 text-right">{currentTime.toFixed(2)}</span>
        <span className="text-slate-400 dark:text-zinc-600">/</span>
        <span className="text-slate-500 dark:text-zinc-400">{duration.toFixed(2)}s</span>
      </div>
    </div>
  );
};

/**
 * Left-aligned Action Buttons (Stagger, Audio, Graph, Marker, Keyframe)
 */
export const TimelineActionButtons: React.FC = () => {
  const {
    currentTime,
    audioTrack,
    isGraphEditorOpen,
    selectedId,
    nodes,
    toggleGraphEditor,
    staggerSelectedKeyframes,
    setAudioTrack,
    addMarker,
    addOrUpdateKeyframe,
    showToast
  } = useStudioStore();

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await parseAudioFile(file, 150);
      setAudioTrack({
        id: `audio-${Date.now()}`,
        name: file.name,
        src: res.src,
        volume: 1,
        muted: false,
        duration: res.duration,
        waveformData: res.waveformData
      });
      showToast(`Loaded audio track: ${file.name}`);
    } catch {
      showToast('Failed to load audio file', 'error');
    }
  };

  return (
    <div className="flex items-center gap-1 select-none shrink-0 pl-1">
      {/* Stagger Action */}
      <button
        type="button"
        title="Stagger Animation Tracks (+0.05s cascade)"
        onClick={() => staggerSelectedKeyframes(0.05)}
        className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 hover:dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 px-2 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-2xs"
      >
        <Wand2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>Stagger</span>
      </button>

      {/* Audio Loader */}
      <label
        title="Load Audio Track (.mp3, .wav, .ogg)"
        className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 hover:dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80 px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-2xs"
      >
        <Music className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        <span>{audioTrack ? 'Replace' : 'Audio'}</span>
        <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
      </label>

      {/* Graph Editor Toggle */}
      <button
        type="button"
        title="Toggle Graph Editor / Curve Inspector"
        onClick={toggleGraphEditor}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all border shadow-2xs ${
          isGraphEditorOpen
            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-bold'
            : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 hover:dark:bg-zinc-700'
        }`}
      >
        <Activity className="w-3.5 h-3.5 text-indigo-500" />
        <span>Graph</span>
      </button>

      {/* Add Marker Button */}
      <button
        type="button"
        title="Add Marker at current timestamp (M)"
        onClick={() => {
          addMarker(currentTime, `M @ ${currentTime.toFixed(2)}s`);
        }}
        className="w-7 h-7 flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-slate-50 hover:dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-2xs transition-colors"
      >
        <Bookmark className="w-3.5 h-3.5 text-purple-500" />
      </button>

      {/* Add Keyframe Button */}
      <button
        type="button"
        title="Add Keyframe at current timestamp"
        onClick={() => {
          if (selectedId && selectedId !== 'frame-1') {
            const n = nodes[selectedId];
            if (n) {
              addOrUpdateKeyframe(selectedId, 'rotation', currentTime, n.rotation || 0);
              showToast(`Keyframe added at ${currentTime.toFixed(2)}s`);
            }
          } else {
            showToast('Select an element on canvas first!', 'error');
          }
        }}
        className="w-7 h-7 flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-slate-50 hover:dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-2xs transition-colors"
      >
        <Gem className="w-3.5 h-3.5 text-blue-500" />
      </button>
    </div>
  );
};
