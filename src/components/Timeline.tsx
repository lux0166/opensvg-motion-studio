import React, { useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { EASING_CURVES } from '../engine/evaluator';
import { CubicBezierCurve } from '../engine/types';
import { parseAudioFile } from '../engine/audioEngine';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Gem,
  Activity,
  Layers as LayersIcon,
  Sparkles,
  Wand2,
  Music,
  Volume2,
  VolumeX,
  Trash2,
  Bookmark
} from 'lucide-react';

export const Timeline: React.FC = () => {
  const {
    isPlaying,
    setPlaying,
    currentTime,
    setCurrentTime,
    duration,
    loop,
    setLoop,
    timelineMode,
    setTimelineMode,
    markers,
    addMarker,
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
    staggerSelectedKeyframes,
    audioTrack,
    setAudioTrack,
    updateAudioTrack,
    addOrUpdateKeyframe,
    updateKeyframeTime,
    updateKeyframeCurve,
    showToast
  } = useStudioStore();

  const gridRef = useRef<HTMLDivElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Audio Sync with Playhead
  useEffect(() => {
    if (!audioElementRef.current || !audioTrack) return;
    const audio = audioElementRef.current;
    audio.volume = audioTrack.muted ? 0 : audioTrack.volume;

    if (isPlaying) {
      audio.currentTime = currentTime;
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = currentTime;
    }
  }, [isPlaying, audioTrack?.muted, audioTrack?.volume]);

  useEffect(() => {
    if (!audioElementRef.current || !audioTrack) return;
    if (!isPlaying) {
      audioElementRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

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

  // Playback requestAnimationFrame Loop
  useEffect(() => {
    let animId: number;
    let lastTime: number | null = null;

    const loopFn = (now: number) => {
      if (!isPlaying) {
        lastTime = null;
        return;
      }

      if (!lastTime) lastTime = now;
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      let nextTime = currentTime + dt;
      if (nextTime >= duration) {
        if (loop) {
          nextTime = 0;
        } else {
          nextTime = duration;
          setPlaying(false);
        }
      }

      setCurrentTime(nextTime);
      animId = requestAnimationFrame(loopFn);
    };

    if (isPlaying) {
      animId = requestAnimationFrame(loopFn);
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentTime, duration, loop]);

  const handleGridMouseDown = (e: React.MouseEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const seek = (clientX: number) => {
      const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const progress = offsetX / rect.width;
      setCurrentTime(parseFloat((progress * duration).toFixed(2)));
    };

    seek(e.clientX);

    const onMove = (moveEv: MouseEvent) => seek(moveEv.clientX);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleKeyframeDrag = (
    startEvent: React.MouseEvent,
    nodeId: string,
    property: string,
    keyframeId: string
  ) => {
    startEvent.stopPropagation();
    if (startEvent.shiftKey) {
      toggleKeyframeSelection(keyframeId, true);
      return;
    }

    if (!selectedKeyframeIds.includes(keyframeId)) {
      setSelectedKeyframeIds([keyframeId]);
    }

    if (!gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const startClientX = startEvent.clientX;
    const initialTrack = nodes[nodeId]?.tracks?.find((t) => t.property === property);
    const initialKf = initialTrack?.keyframes?.find((k) => k.id === keyframeId);
    const initialTime = initialKf?.time || 0;

    const onMove = (moveEv: MouseEvent) => {
      const dx = moveEv.clientX - startClientX;
      const dt = (dx / rect.width) * duration;
      const newTime = Math.max(0, Math.min(duration, parseFloat((initialTime + dt).toFixed(2))));

      updateKeyframeTime(nodeId, property, keyframeId, newTime);
      setCurrentTime(newTime);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      showToast('Keyframe position updated');
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  // Find active track for Graph Editor
  const activeNode = selectedId ? nodes[selectedId] : null;
  const activeTrack = activeNode?.tracks?.find((t) => t.id === selectedTrackId) || activeNode?.tracks?.[0];
  const activeKeyframe = activeTrack?.keyframes?.[0];
  const currentCurve: CubicBezierCurve = activeKeyframe?.curve || { x1: 0.42, y1: 0, x2: 0.58, y2: 1 };

  const applyCurvePreset = (presetName: string) => {
    if (!selectedId || !activeTrack || !activeKeyframe) return;
    const curve = EASING_CURVES[presetName] || EASING_CURVES['ease-in-out'];
    updateKeyframeCurve(selectedId, activeTrack.property, activeKeyframe.id, curve);
    showToast(`Applied ${presetName} curve!`);
  };

  const handleCurveHandleDrag = (handle: 'p1' | 'p2', startEvent: React.MouseEvent) => {
    startEvent.stopPropagation();
    const svgRect = (startEvent.currentTarget.closest('svg') as SVGSVGElement)?.getBoundingClientRect();
    if (!svgRect) return;

    const onMove = (moveEv: MouseEvent) => {
      const padding = 40;
      const w = svgRect.width - padding * 2;
      const h = svgRect.height - padding * 2;

      let nx = (moveEv.clientX - (svgRect.left + padding)) / w;
      let ny = 1 - (moveEv.clientY - (svgRect.top + padding)) / h;

      nx = Math.max(0, Math.min(1, parseFloat(nx.toFixed(2))));
      ny = parseFloat(ny.toFixed(2));

      const newCurve = { ...currentCurve };
      if (handle === 'p1') {
        newCurve.x1 = nx;
        newCurve.y1 = ny;
      } else {
        newCurve.x2 = nx;
        newCurve.y2 = ny;
      }

      if (selectedId && activeTrack && activeKeyframe) {
        updateKeyframeCurve(selectedId, activeTrack.property, activeKeyframe.id, newCurve);
      }
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <footer className="h-64 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex flex-col z-20 m-3 mt-0 rounded-2xl shadow-sm overflow-hidden select-none">
      {/* Header Controls */}
      <div className="h-12 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-4 bg-gray-50/80 dark:bg-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <button
            title="Go to Start (0)"
            onClick={() => setCurrentTime(0)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700 hover:text-blue-600 hover:dark:text-blue-400 rounded-lg transition-all"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            title="Step Back 0.1s (←)"
            onClick={() => setCurrentTime(Math.max(0, currentTime - 0.1))}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700 hover:text-blue-600 hover:dark:text-blue-400 rounded-lg transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            title="Play / Pause (Space)"
            onClick={() => setPlaying(!isPlaying)}
            className={`w-9 h-9 flex items-center justify-center text-white rounded-lg shadow-sm transition-all active:scale-95 ${
              isPlaying ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            title="Step Forward 0.1s (→)"
            onClick={() => setCurrentTime(Math.min(duration, currentTime + 0.1))}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700 hover:text-blue-600 hover:dark:text-blue-400 rounded-lg transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-gray-300 dark:bg-zinc-700 mx-1" />
          <button
            title="Toggle Loop"
            onClick={() => {
              setLoop(!loop);
              showToast(loop ? 'Loop: Disabled' : 'Loop: Enabled');
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              loop
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                : 'text-gray-400 dark:text-zinc-500 hover:bg-gray-100 hover:dark:bg-zinc-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Time Counter Display */}
          <div className="ml-3 text-xs font-semibold font-mono text-gray-800 dark:text-zinc-200 flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-3 py-1 rounded-md border border-gray-200/80 dark:border-zinc-700 shadow-xs">
            <span className="text-blue-600 dark:text-blue-400 w-10 text-right">{currentTime.toFixed(2)}</span>
            <span className="text-gray-400 dark:text-zinc-600">/</span>
            <span className="text-gray-500 dark:text-zinc-400">{duration.toFixed(2)} s</span>
          </div>

          {/* Stagger Keyframes Action Button */}
          <button
            title="Stagger Animation Tracks (+0.05s cascade)"
            onClick={() => staggerSelectedKeyframes(0.05)}
            className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 hover:dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-xs"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Stagger Tracks</span>
          </button>

          {/* Audio Track Loader Button */}
          <label
            title="Load Audio Track (.mp3, .wav, .ogg)"
            className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 hover:dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-xs"
          >
            <Music className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>{audioTrack ? 'Replace Audio' : 'Add Audio'}</span>
            <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
          </label>
        </div>

        {/* Mode Switcher: Dopesheet vs Graph Editor */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-200/70 dark:bg-zinc-800/90 p-0.5 rounded-lg border border-gray-300/60 dark:border-zinc-700 text-xs font-medium">
            <button
              onClick={() => setTimelineMode('dopesheet')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                timelineMode === 'dopesheet'
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-bold shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 hover:dark:text-zinc-100'
              }`}
            >
              <LayersIcon className="w-3 h-3 text-blue-500" /> Dopesheet
            </button>
            <button
              onClick={() => setTimelineMode('graph')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                timelineMode === 'graph'
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-bold shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 hover:dark:text-zinc-100'
              }`}
            >
              <Activity className="w-3 h-3 text-indigo-500" /> Graph Editor
            </button>
          </div>

          <button
            title="Add Marker at current timestamp (M)"
            onClick={() => {
              addMarker(currentTime, `M @ ${currentTime.toFixed(2)}s`);
            }}
            className="flex items-center gap-1 bg-white dark:bg-zinc-800 hover:bg-gray-50 hover:dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 px-2.5 py-1 rounded-md font-medium text-xs shadow-xs transition-colors"
          >
            <Bookmark className="w-3 h-3 text-purple-500" /> Add Marker
          </button>

          <button
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
            className="flex items-center gap-1 bg-white dark:bg-zinc-800 hover:bg-gray-50 hover:dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 px-2.5 py-1 rounded-md font-medium text-xs shadow-xs transition-colors"
          >
            <Gem className="w-3 h-3 text-blue-500" /> Add Keyframe
          </button>
        </div>
      </div>

      {/* Tracks / Graph Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Track Labels */}
        <div className="w-64 border-r border-gray-100 dark:border-zinc-800 flex flex-col overflow-y-auto bg-white dark:bg-zinc-900 shrink-0">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-zinc-500 flex justify-between items-center h-8 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50">
            <span>LAYERS & TRACKS</span>
            <span className="text-[10px] bg-gray-200/60 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-1.5 py-0.5 rounded">Timeline</span>
          </div>

          {nodeOrder.map((id) => {
            const node = nodes[id];
            if (!node || !node.visible) return null;
            const isSelected = selectedId === id;

            return (
              <div key={id} className="flex flex-col border-b border-gray-50 dark:border-zinc-800/50 pb-1">
                <div
                  onClick={() => setSelectedId(id)}
                  className={`flex items-center px-4 py-2 hover:bg-gray-50 hover:dark:bg-zinc-800/60 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/80 dark:bg-blue-950/40 font-medium' : ''
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-sm mr-2 shrink-0"
                    style={{ backgroundColor: node.fill }}
                  />
                  <span className="text-xs text-gray-700 dark:text-zinc-300 flex-1 truncate">{node.name}</span>
                </div>

                {node.tracks?.map((track) => {
                  const isTrackActive = selectedTrackId === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        setSelectedId(id);
                        setSelectedTrackId(track.id);
                      }}
                      className={`flex items-center px-4 py-1 pl-8 cursor-pointer text-xs transition-colors ${
                        isTrackActive
                          ? 'bg-blue-100/60 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 hover:dark:bg-zinc-800/40'
                      }`}
                    >
                      <span className="flex-1 text-[11px] truncate">{track.label}</span>
                      <Gem className={`w-2.5 h-2.5 ${isTrackActive ? 'text-blue-600' : 'text-blue-400'}`} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Right Timeline Grid Area */}
        <div
          ref={gridRef}
          onMouseDown={handleGridMouseDown}
          className="flex-1 relative overflow-x-hidden overflow-y-auto bg-[#fafafa] dark:bg-zinc-950/50 flex flex-col cursor-crosshair"
        >
          {/* Time Ruler & Markers Header */}
          <div className="h-8 border-b border-gray-100 dark:border-zinc-800 relative text-[10px] text-gray-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 cursor-pointer select-none shrink-0 sticky top-0 z-20">
            <div className="absolute left-2 bottom-1.5 font-mono font-medium">0.0s</div>
            <div className="absolute left-[33.33%] bottom-1.5 font-mono font-medium -translate-x-1/2">
              {(duration * 0.33).toFixed(1)}s
            </div>
            <div className="absolute left-[66.66%] bottom-1.5 font-mono font-medium -translate-x-1/2">
              {(duration * 0.66).toFixed(1)}s
            </div>
            <div className="absolute right-3 bottom-1.5 font-mono font-medium">
              {duration.toFixed(1)}s
            </div>

            {/* Timeline Markers */}
            {markers.map((m) => {
              const leftPct = duration > 0 ? (m.time / duration) * 100 : 0;
              return (
                <div
                  key={m.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTime(m.time);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeMarker(m.id);
                  }}
                  title={`Marker: ${m.label} (${m.time}s) - Right-click to remove`}
                  style={{ left: `${leftPct}%` }}
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center cursor-pointer group z-30"
                >
                  <div
                    className="w-2.5 h-2.5 rotate-45 rounded-2xs shadow-xs"
                    style={{ backgroundColor: m.color || '#8b5cf6' }}
                  />
                  <span className="text-[9px] font-bold font-mono px-1 py-0.2 rounded shadow-sm mt-0.5 hidden group-hover:block bg-gray-900 text-white whitespace-nowrap z-40">
                    {m.label} ({m.time}s)
                  </span>
                </div>
              );
            })}
          </div>

          {/* Dopesheet View vs Graph View */}
          {timelineMode === 'dopesheet' ? (
            <div className="relative w-full flex-1 pt-1 pb-4">
              {/* Audio Waveform Track */}
              {audioTrack && (
                <div className="relative w-full h-11 bg-purple-50/70 dark:bg-purple-950/30 border-b border-purple-200/80 dark:border-purple-800/80 flex items-center px-3 mb-2 shadow-xs">
                  <div className="flex items-center gap-2 mr-3 shrink-0 bg-white/90 dark:bg-zinc-900/90 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Music className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 truncate max-w-[120px]">
                      {audioTrack.name}
                    </span>
                    <button
                      title="Detect Audio Beats & Generate Timeline Markers"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateMarkersFromAudioBeats();
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-pink-600 bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 hover:dark:bg-pink-900/50 px-1.5 py-0.5 rounded transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Beats
                    </button>
                    <button
                      title={audioTrack.muted ? 'Unmute' : 'Mute'}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateAudioTrack({ muted: !audioTrack.muted });
                      }}
                      className="p-0.5 rounded hover:bg-purple-100 hover:dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 transition-colors"
                    >
                      {audioTrack.muted ? (
                        <VolumeX className="w-3 h-3 text-red-500" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      title="Remove Audio Track"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAudioTrack(null);
                        showToast('Removed audio track');
                      }}
                      className="p-0.5 rounded hover:bg-red-50 hover:dark:bg-red-950/40 text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Normalized Waveform Bars */}
                  <div className="flex-1 h-7 flex items-center gap-0.5 relative overflow-hidden">
                    {(audioTrack.waveformData || []).map((peak, pIdx) => {
                      const heightPercent = Math.max(12, peak * 100);
                      const barPos = (pIdx / (audioTrack.waveformData?.length || 100)) * 100;
                      const isPast = (barPos / 100) * duration <= currentTime;

                      return (
                        <div
                          key={pIdx}
                          className={`flex-1 rounded-full transition-colors ${
                            isPast ? 'bg-purple-600 dark:bg-purple-400' : 'bg-purple-300/80 dark:bg-purple-800/80'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hidden HTML Audio Sync Element */}
              {audioTrack && <audio ref={audioElementRef} src={audioTrack.src} />}

              {nodeOrder.map((id) => {
                const node = nodes[id];
                if (!node || !node.visible) return null;

                return (
                  <div key={id} className="relative w-full mb-3" style={{ height: `${28 + (node.tracks?.length || 0) * 24}px` }}>
                    {/* Duration Bar */}
                    <div
                      className="absolute h-5 bg-blue-100/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-full flex items-center justify-between px-1.5 shadow-xs"
                      style={{ top: '4px', left: '2%', right: '4%' }}
                    >
                      <div className="w-1.5 h-2.5 bg-blue-400 rounded-full" />
                      <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 truncate px-2 select-none">
                        {node.name} duration
                      </span>
                      <div className="w-1.5 h-2.5 bg-blue-400 rounded-full" />
                    </div>

                    {/* Keyframe diamonds with drag support */}
                    {node.tracks?.map((track, tIdx) => (
                      <div
                        key={track.id}
                        className="absolute w-full h-6 flex items-center"
                        style={{ top: `${32 + tIdx * 24}px` }}
                      >
                        {track.keyframes.map((kf) => {
                          const kfPos = (kf.time / duration) * 100;
                          const isCurrent = Math.abs(currentTime - kf.time) < 0.04;
                          const isSelected = selectedKeyframeIds.includes(kf.id);
                          return (
                            <div
                              key={kf.id}
                              title={`${track.label}: ${kf.value}${track.unit} at ${kf.time}s (Shift+Click to multi-select, Drag to move)`}
                              onMouseDown={(e) => handleKeyframeDrag(e, node.id, track.property, kf.id)}
                              className={`keyframe-diamond absolute w-2.5 h-2.5 rounded-xs cursor-ew-resize shadow-sm transition-transform ${
                                isSelected
                                  ? 'bg-amber-400 border border-amber-600 scale-125 z-10'
                                  : isCurrent
                                  ? 'active bg-blue-600'
                                  : 'bg-gray-700 dark:bg-zinc-400'
                              }`}
                              style={{ left: `${kfPos}%`, top: '50%' }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Graph Editor SVG Curve View with Interactive Handles */
            <div className="relative w-full flex-1 flex flex-col items-center justify-between p-3 bg-white dark:bg-zinc-900">
              {/* Easing & Spring Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5 z-10 bg-gray-50 dark:bg-zinc-800/70 p-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-[11px]">
                <span className="font-semibold text-gray-500 dark:text-zinc-400 px-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" /> Curves:
                </span>
                {['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'spring'].map((p) => (
                  <button
                    key={p}
                    onClick={() => applyCurvePreset(p)}
                    className="px-2 py-0.5 rounded-lg hover:bg-white hover:dark:bg-zinc-700 hover:text-blue-600 hover:dark:text-blue-400 font-medium text-gray-600 dark:text-zinc-300 transition-colors uppercase text-[10px]"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Interactive Curve SVG */}
              <div className="relative w-full flex-1 min-h-[100px] flex items-center justify-center">
                <svg className="w-full h-full">
                  <defs>
                    <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="40" y2="110" stroke="currentColor" className="text-gray-200 dark:text-zinc-800" strokeWidth="1" />
                  <line x1="40" y1="110" x2="560" y2="110" stroke="currentColor" className="text-gray-200 dark:text-zinc-800" strokeWidth="1" />

                  {/* Tangent Line P1 */}
                  <line
                    x1="40"
                    y1="110"
                    x2={40 + currentCurve.x1 * 520}
                    y2={110 - currentCurve.y1 * 90}
                    stroke="#93c5fd"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />

                  {/* Tangent Line P2 */}
                  <line
                    x1="560"
                    y1="20"
                    x2={40 + currentCurve.x2 * 520}
                    y2={110 - currentCurve.y2 * 90}
                    stroke="#93c5fd"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />

                  {/* Curve Path */}
                  <path
                    d={`M 40 110 C ${40 + currentCurve.x1 * 520} ${110 - currentCurve.y1 * 90}, ${
                      40 + currentCurve.x2 * 520
                    } ${110 - currentCurve.y2 * 90}, 560 20`}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                  />

                  {/* Endpoint Start & End */}
                  <circle cx="40" cy="110" r="4.5" fill="#3b82f6" />
                  <circle cx="560" cy="20" r="4.5" fill="#3b82f6" />

                  {/* Interactive P1 Handle */}
                  <circle
                    cx={40 + currentCurve.x1 * 520}
                    cy={110 - currentCurve.y1 * 90}
                    r="6"
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleCurveHandleDrag('p1', e)}
                  />

                  {/* Interactive P2 Handle */}
                  <circle
                    cx={40 + currentCurve.x2 * 520}
                    cy={110 - currentCurve.y2 * 90}
                    r="6"
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleCurveHandleDrag('p2', e)}
                  />
                </svg>
              </div>

              {/* Curve Formula Display */}
              <div className="text-[11px] font-mono text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/70 px-3 py-1 rounded-lg border border-gray-200 dark:border-zinc-700">
                cubic-bezier({currentCurve.x1}, {currentCurve.y1}, {currentCurve.x2}, {currentCurve.y2})
              </div>
            </div>
          )}

          {/* Draggable Scrubber Playhead */}
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
