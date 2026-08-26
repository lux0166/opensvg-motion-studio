import React, { useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { RuntimeClock } from '../engine/runtime/runtimeClock';
import {
  Gem,
  Sparkles,
  Music,
  Volume2,
  VolumeX,
  Trash2
} from 'lucide-react';

export const Timeline: React.FC = () => {
  const {
    isPlaying,
    setPlaying,
    currentTime,
    setCurrentTime,
    duration,
    loop,
    markers,
    removeMarker,
    generateMarkersFromAudioBeats,
    nodes,
    nodeOrder,
    selectedId,
    setSelectedId,
    selectedTrackId,
    setSelectedTrackId,
    selectedKeyframeIds,
    setSelectedKeyframeIds,
    toggleKeyframeSelection,
    audioTrack,
    setAudioTrack,
    updateAudioTrack,
    updateKeyframeTime,
    showToast
  } = useStudioStore();

  const gridRef = useRef<HTMLDivElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Sync HTML5 Audio element with Studio store state
  useEffect(() => {
    if (!audioElementRef.current || !audioTrack) return;
    const audio = audioElementRef.current;
    audio.volume = audioTrack.muted ? 0 : audioTrack.volume;

    if (isPlaying) {
      audio.currentTime = currentTime;
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, audioTrack]);

  useEffect(() => {
    if (!audioElementRef.current || !audioTrack) return;
    if (!isPlaying) {
      audioElementRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Playback Loop driven directly by canonical RuntimeClock
  useEffect(() => {
    if (!isPlaying) return;

    const clock = new RuntimeClock(duration, 60, loop ? 'loop' : 'once');
    clock.seek(currentTime);
    clock.play();

    let animId: number;
    let lastTime = performance.now();

    const loopFn = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      clock.advance(dt);
      const nextTime = clock.getCurrentTime();
      setCurrentTime(nextTime);

      if (!clock.getIsPlaying()) {
        setPlaying(false);
      } else {
        animId = requestAnimationFrame(loopFn);
      }
    };

    animId = requestAnimationFrame(loopFn);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, duration, loop]);

  // Keyboard Shortcuts: Space for Play/Pause, M for Marker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(!isPlaying);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        useStudioStore.getState().addMarker(currentTime, `M @ ${currentTime.toFixed(2)}s`);
        showToast(`Marker placed at ${currentTime.toFixed(2)}s`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, setPlaying, showToast]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleGridPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newTime = (x / rect.width) * duration;
    setCurrentTime(Math.max(0, Math.min(newTime, duration)));

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!gridRef.current) return;
      const moveRect = gridRef.current.getBoundingClientRect();
      const moveX = Math.max(0, Math.min(moveEvent.clientX - moveRect.left, moveRect.width));
      const moveTime = (moveX / moveRect.width) * duration;
      setCurrentTime(Math.max(0, Math.min(moveTime, duration)));
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleKeyframeDragStart = (
    e: React.PointerEvent,
    nodeId: string,
    property: string,
    keyframeId: string
  ) => {
    e.stopPropagation();
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const moveX = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
      const newTime = Number(((moveX / rect.width) * duration).toFixed(2));
      updateKeyframeTime(nodeId, property, keyframeId, newTime);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <footer className="w-full h-full bg-white dark:bg-zinc-900 flex flex-col z-20 overflow-hidden select-none">
      {/* Tracks / Dopesheet Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Track Names Column */}
        <div className="w-64 bg-slate-50/50 dark:bg-zinc-900 border-r border-slate-200/80 dark:border-zinc-800 flex flex-col shrink-0">
          <div className="h-8 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between px-3 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
            <span>LAYERS & TRACKS</span>
            <span className="text-[10px] bg-slate-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">Timeline</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Audio Track Row if present */}
            {audioTrack && (
              <div className="flex items-center justify-between px-3 h-8 bg-purple-50/60 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-300">
                <div className="flex items-center gap-1.5 truncate">
                  <Music className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="truncate max-w-[110px] font-medium">{audioTrack.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title={audioTrack.muted ? 'Unmute' : 'Mute'}
                    onClick={() => updateAudioTrack({ muted: !audioTrack.muted })}
                    className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded text-purple-600 dark:text-purple-300 transition-colors"
                  >
                    {audioTrack.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    title="Generate Markers from Audio Beats"
                    onClick={() => {
                      generateMarkersFromAudioBeats();
                      showToast('Beat markers generated automatically!');
                    }}
                    className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded text-purple-600 dark:text-purple-300 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </button>
                  <button
                    type="button"
                    title="Remove Audio Track"
                    onClick={() => setAudioTrack(null)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-950 rounded text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Render Layers and Animation Tracks */}
            {nodeOrder
              .filter((id) => id !== 'frame-1')
              .map((nodeId) => {
                const node = nodes[nodeId];
                if (!node) return null;
                const isSelected = selectedId === nodeId;

                return (
                  <div key={nodeId} className="border-b border-slate-100 dark:border-zinc-800/60">
                    <div
                      onClick={() => setSelectedId(nodeId)}
                      className={`flex items-center justify-between px-3 h-7 text-xs font-semibold cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                          : 'text-slate-800 dark:text-zinc-200 hover:bg-slate-100/60 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <div
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: node.type === 'rect' ? '#1e293b' : '#3b82f6' }}
                        />
                        <span className="truncate">{node.name}</span>
                      </div>
                    </div>

                    {/* Animated Properties Sub-tracks */}
                    {node.tracks &&
                      node.tracks.map((track) => {
                        const isTrackSelected = isSelected && selectedTrackId === track.id;
                        return (
                          <div
                            key={track.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(nodeId);
                              setSelectedTrackId(track.id);
                            }}
                            className={`flex items-center justify-between pl-6 pr-3 h-6 text-[11px] cursor-pointer transition-colors ${
                              isTrackSelected
                                ? 'bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
                                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/40 dark:hover:bg-zinc-800/30'
                            }`}
                          >
                            <span className="truncate">{track.label}</span>
                            <Gem className="w-2.5 h-2.5 opacity-60 text-blue-500" />
                          </div>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Side: Timeline Grid & Tracks Area */}
        <div
          ref={gridRef}
          onPointerDown={handleGridPointerDown}
          className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/30 dark:bg-zinc-950/30 cursor-crosshair"
        >
          {/* Audio HTML Element */}
          {audioTrack && (
            <audio
              ref={audioElementRef}
              src={audioTrack.src}
              preload="auto"
              className="hidden"
            />
          )}

          {/* Time Ruler / Header */}
          <div className="h-8 border-b border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 relative flex items-center select-none text-[10px] font-mono text-slate-400 dark:text-zinc-500">
            {[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((t) => {
              const pos = (t / duration) * 100;
              return (
                <div
                  key={t}
                  className="absolute flex flex-col items-center pointer-events-none transform -translate-x-1/2"
                  style={{ left: `${pos}%` }}
                >
                  <div className="h-2 w-[1px] bg-slate-300 dark:bg-zinc-700" />
                  <span className="mt-0.5">{t.toFixed(1)}s</span>
                </div>
              );
            })}

            {/* Timeline Markers */}
            {markers.map((marker) => {
              const pos = (marker.time / duration) * 100;
              return (
                <div
                  key={marker.id}
                  title={`${marker.label} (${marker.time.toFixed(2)}s) - Double-click to remove`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    removeMarker(marker.id);
                    showToast('Marker removed');
                  }}
                  className="absolute top-0 bottom-0 flex flex-col items-center group cursor-pointer z-30 transform -translate-x-1/2"
                  style={{ left: `${pos}%` }}
                >
                  <div className="w-2.5 h-2.5 bg-amber-500 rotate-45 transform origin-center shadow-xs" />
                  <div className="w-[1px] flex-1 bg-amber-500/40" />
                </div>
              );
            })}
          </div>

          {/* Dopesheet Keyframe Lanes & Track Bars */}
          <div className="flex-1 overflow-y-auto relative custom-scrollbar">
            {/* Audio Waveform Track Lane */}
            {audioTrack && (
              <div className="h-8 border-b border-purple-100/60 dark:border-purple-900/30 relative bg-purple-50/20 dark:bg-purple-950/10 flex items-center px-1">
                {audioTrack.waveformData && (
                  <div className="w-full h-5 flex items-center gap-[1px] opacity-70">
                    {audioTrack.waveformData.slice(0, 100).map((val, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-purple-500 dark:bg-purple-400 rounded-full"
                        style={{ height: `${Math.max(15, val * 100)}%` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Layer Tracks */}
            {nodeOrder
              .filter((id) => id !== 'frame-1')
              .map((nodeId) => {
                const node = nodes[nodeId];
                if (!node) return null;
                const isSelected = selectedId === nodeId;

                return (
                  <div key={nodeId} className="border-b border-slate-100/80 dark:border-zinc-800/40">
                    {/* Layer Main Bar */}
                    <div
                      className={`h-7 relative flex items-center transition-colors ${
                        isSelected ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div
                        className="absolute top-1 bottom-1 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700/60 rounded-full flex items-center justify-between px-2 text-[10px] font-medium text-blue-700 dark:text-blue-300 opacity-90 shadow-2xs"
                        style={{
                          left: '5%',
                          width: '90%'
                        }}
                      >
                        <div className="w-1.5 h-3 bg-blue-400 dark:bg-blue-500 rounded-full" />
                        <span className="truncate">{node.name} duration</span>
                        <div className="w-1.5 h-3 bg-blue-400 dark:bg-blue-500 rounded-full" />
                      </div>
                    </div>

                    {/* Sub-track Keyframe Diamonds */}
                    {node.tracks &&
                      node.tracks.map((track) => (
                        <div
                          key={track.id}
                          className="h-6 relative flex items-center border-t border-slate-50 dark:border-zinc-800/20"
                        >
                          {track.keyframes.map((kf) => {
                            const pos = (kf.time / duration) * 100;
                            const isKfSelected = selectedKeyframeIds.includes(kf.id);

                            return (
                              <div
                                key={kf.id}
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  if (e.shiftKey) {
                                    toggleKeyframeSelection(kf.id, true);
                                  } else {
                                    setSelectedKeyframeIds([kf.id]);
                                  }
                                  setSelectedId(nodeId);
                                  setSelectedTrackId(track.id);
                                  handleKeyframeDragStart(e, nodeId, track.property, kf.id);
                                }}
                                className={`absolute w-3 h-3 rotate-45 transform -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform hover:scale-125 z-20 shadow-xs ${
                                  isKfSelected
                                    ? 'bg-amber-400 border-2 border-slate-900 dark:border-white ring-2 ring-amber-400/50'
                                    : 'bg-slate-700 dark:bg-zinc-300 hover:bg-blue-500'
                                }`}
                                style={{ left: `${pos}%` }}
                                title={`${track.label}: ${kf.value} at ${kf.time.toFixed(2)}s`}
                              />
                            );
                          })}
                        </div>
                      ))}
                  </div>
                );
              })}
          </div>

          {/* Current Time Playhead Scrub Bar */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-blue-500 z-30 pointer-events-none transform -translate-x-1/2"
            style={{ left: `${progressPercent}%` }}
          >
            <div className="w-3.5 h-4 bg-blue-500 rounded-b-sm absolute top-0 -left-[6px] shadow-md flex items-center justify-center pointer-events-auto cursor-ew-resize">
              <div className="w-1 h-2 bg-white/80 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
