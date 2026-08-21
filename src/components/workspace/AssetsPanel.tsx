import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Music, Upload, FileAudio, Trash2, Image, Star, Heart } from 'lucide-react';
import { parseAudioFile } from '../../engine/audioEngine';

export const AssetsPanel: React.FC = () => {
  const { audioTrack, setAudioTrack, showToast, addNode } = useStudioStore();

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Parsing audio waveform...');
      const config = await parseAudioFile(file);
      setAudioTrack({
        id: `audio-${Date.now()}`,
        name: file.name,
        src: config.src,
        duration: config.duration,
        waveformData: config.waveformData,
        volume: 1,
        muted: false
      });
      showToast(`Loaded: ${file.name}`, 'success');
    } catch {
      showToast('Failed to parse audio file', 'error');
    }
  };

  const addPresetStar = () => {
    addNode({
      id: `star-${Date.now()}`,
      name: 'Golden Star',
      type: 'rect',
      visible: true,
      locked: false,
      x: 180,
      y: 120,
      width: 80,
      height: 80,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 12,
      fill: '#f59e0b',
      tracks: []
    });
    showToast('Added Star Asset to canvas', 'success');
  };

  const addPresetHeart = () => {
    addNode({
      id: `heart-${Date.now()}`,
      name: 'Ruby Heart',
      type: 'circle',
      visible: true,
      locked: false,
      x: 240,
      y: 150,
      width: 72,
      height: 72,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 9999,
      fill: '#ef4444',
      tracks: []
    });
    showToast('Added Heart Asset to canvas', 'success');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-3 overflow-y-auto bg-white dark:bg-zinc-900 text-xs gap-3">
      {/* Audio Track Section */}
      <div className="flex flex-col gap-2">
        <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-purple-500" />
          Audio Track
        </span>

        {audioTrack ? (
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <FileAudio className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="flex flex-col truncate">
                <span className="font-medium text-purple-900 dark:text-purple-200 truncate">{audioTrack.name}</span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                  {audioTrack.duration.toFixed(1)}s • Audio Layer
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAudioTrack(null)}
              className="p-1 rounded-md text-purple-400 hover:text-red-500 transition-colors"
              title="Remove Audio"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/40 hover:bg-slate-100 hover:dark:bg-zinc-800 cursor-pointer transition-colors text-center">
            <Upload className="w-5 h-5 text-slate-400 mb-1" />
            <span className="font-medium text-slate-700 dark:text-zinc-300">Upload Soundtrack</span>
            <span className="text-[10px] text-slate-400">MP3, WAV, OGG</span>
            <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
          </label>
        )}
      </div>

      {/* Vector Asset Library */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Image className="w-3.5 h-3.5 text-blue-500" />
          Asset Library
        </span>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={addPresetStar}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 flex flex-col items-center gap-1.5 transition-all text-center group"
          >
            <Star className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-slate-700 dark:text-zinc-300 text-[11px]">Star Card</span>
          </button>

          <button
            type="button"
            onClick={addPresetHeart}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 flex flex-col items-center gap-1.5 transition-all text-center group"
          >
            <Heart className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-slate-700 dark:text-zinc-300 text-[11px]">Heart Badge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
