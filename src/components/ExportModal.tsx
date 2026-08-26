import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { exportToAnimatedSVG, exportToLottieJSON } from '../engine/exporter';
import { recordSceneToVideo } from '../engine/videoRecorder';
import { serializeDocument } from '../engine/format/documentParser';
import { OpenSVGDocument } from '../engine/format/nativeDocument';
import { X, FileCode, Code, Globe, Film, ChevronRight, Loader2 } from 'lucide-react';

export const ExportModal: React.FC = () => {
  const {
    isExportOpen,
    setExportOpen,
    rootFrame,
    nodes,
    nodeOrder,
    duration,
    fps,
    showToast
  } = useStudioStore();

  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  if (!isExportOpen) return null;

  const currentNodes = nodeOrder.map((id) => nodes[id]).filter(Boolean);

  const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}!`);
    setExportOpen(false);
  };

  const handleExportSVG = () => {
    const svgStr = exportToAnimatedSVG(rootFrame, currentNodes, duration);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    downloadBlob(`${rootFrame.name.toLowerCase().replace(/\s+/g, '-')}-animation.svg`, blob);
  };

  const handleExportLottie = () => {
    const lottieData = exportToLottieJSON(rootFrame, currentNodes, duration, fps);
    const blob = new Blob([JSON.stringify(lottieData, null, 2)], { type: 'application/json' });
    downloadBlob(`${rootFrame.name.toLowerCase().replace(/\s+/g, '-')}-lottie.json`, blob);
  };

  const handleExportOpenSVG = () => {
    const doc: OpenSVGDocument = {
      format: 'opensvg',
      schemaVersion: '2.0.0',
      metadata: {
        id: `doc-${rootFrame.name.toLowerCase().replace(/\s+/g, '-')}`,
        title: rootFrame.name,
        author: 'OpenSVG Motion Studio',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      scene: {
        width: rootFrame.width,
        height: rootFrame.height,
        fps,
        duration,
        background: rootFrame.canvasBg || rootFrame.fill || '#ffffff',
        clipContent: rootFrame.clipContent ?? true
      },
      rootFrame,
      nodes,
      nodeOrder
    };
    const osvgString = serializeDocument(doc, true);
    const blob = new Blob([osvgString], { type: 'application/vnd.opensvg+json' });
    downloadBlob(`${rootFrame.name.toLowerCase().replace(/\s+/g, '-')}.osvg`, blob);
  };

  const handleExportVideo = async () => {
    try {
      setIsRecording(true);
      setRecordProgress(0);
      showToast('Rendering 60 FPS Video...');

      const videoBlob = await recordSceneToVideo(rootFrame, currentNodes, duration, {
        fps: 60,
        onProgress: (p) => setRecordProgress(p)
      });

      downloadBlob(`${rootFrame.name.toLowerCase().replace(/\s+/g, '-')}-60fps.webm`, videoBlob);
    } catch (err: any) {
      showToast(`Video export failed: ${err.message || err}`, 'error');
    } finally {
      setIsRecording(false);
      setRecordProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
            Export Motion Assets
          </h3>
          <button
            onClick={() => !isRecording && setExportOpen(false)}
            disabled={isRecording}
            className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 hover:dark:text-zinc-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 hover:dark:bg-zinc-800 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Recording Progress State */}
        {isRecording ? (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <div className="text-center">
              <div className="text-sm font-bold text-gray-800 dark:text-zinc-100">
                Rendering Video Stream ({Math.round(recordProgress * 100)}%)
              </div>
              <div className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                Please wait while frames are captured at 60 FPS
              </div>
            </div>
            <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-blue-500 h-full transition-all duration-150"
                style={{ width: `${recordProgress * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
              Choose format to export your vector animation:
            </p>

            {/* OpenSVG Native Format Option */}
            <button
              onClick={handleExportOpenSVG}
              className="flex items-center justify-between p-3.5 border border-gray-200 dark:border-zinc-700/80 rounded-2xl hover:border-emerald-500 hover:dark:border-emerald-500 hover:bg-emerald-50/50 hover:dark:bg-emerald-950/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800 dark:text-zinc-100">OpenSVG Native (.osvg)</div>
                  <div className="text-[11px] text-gray-400 dark:text-zinc-500">Autonomous interactive runtime format</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-emerald-500" />
            </button>

            {/* Video Option */}
            <button
              onClick={handleExportVideo}
              className="flex items-center justify-between p-3.5 border border-gray-200 dark:border-zinc-700/80 rounded-2xl hover:border-blue-500 hover:dark:border-blue-500 hover:bg-blue-50/50 hover:dark:bg-blue-950/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800 dark:text-zinc-100">60 FPS Video (.webm / .mp4)</div>
                  <div className="text-[11px] text-gray-400 dark:text-zinc-500">High-bitrate video stream recording</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-rose-500" />
            </button>

            {/* SVG Option */}
            <button
              onClick={handleExportSVG}
              className="flex items-center justify-between p-3.5 border border-gray-200 dark:border-zinc-700/80 rounded-2xl hover:border-blue-500 hover:dark:border-blue-500 hover:bg-blue-50/50 hover:dark:bg-blue-950/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800 dark:text-zinc-100">Animated SVG (.svg)</div>
                  <div className="text-[11px] text-gray-400 dark:text-zinc-500">Standalone SVG with embedded CSS keyframes</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-blue-500" />
            </button>

            {/* Lottie Option */}
            <button
              onClick={handleExportLottie}
              className="flex items-center justify-between p-3.5 border border-gray-200 dark:border-zinc-700/80 rounded-2xl hover:border-indigo-500 hover:dark:border-indigo-500 hover:bg-indigo-50/50 hover:dark:bg-indigo-950/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800 dark:text-zinc-100">Bodymovin / Lottie (.json)</div>
                  <div className="text-[11px] text-gray-400 dark:text-zinc-500">Official Lottie schema for Web, iOS & Android</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-indigo-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
