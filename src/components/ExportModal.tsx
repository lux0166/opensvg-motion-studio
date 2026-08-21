import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { exportToAnimatedSVG, exportToLottieJSON } from '../engine/exporter';
import { X, FileCode, Code, Globe, ChevronRight } from 'lucide-react';

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

  if (!isExportOpen) return null;

  const currentNodes = nodeOrder.map((id) => nodes[id]).filter(Boolean);

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
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
    downloadFile(`${rootFrame.name.toLowerCase().replace(/\s+/g, '-')}-animation.svg`, svgStr, 'image/svg+xml');
  };

  const handleExportLottie = () => {
    const lottieData = exportToLottieJSON(rootFrame, currentNodes, duration, fps);
    downloadFile(`${rootFrame.name.toLowerCase().replace(/\s+/g, '-')}-lottie.json`, JSON.stringify(lottieData, null, 2), 'application/json');
  };

  const handleExportProject = () => {
    const project = {
      name: rootFrame.name,
      duration,
      fps,
      rootFrame,
      nodes,
      nodeOrder
    };
    downloadFile(`${rootFrame.name.toLowerCase().replace(/\s+/g, '-')}-project.kinetic`, JSON.stringify(project, null, 2), 'application/json');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            Export Motion Assets
          </h3>
          <button
            onClick={() => setExportOpen(false)}
            className="text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-5 flex flex-col gap-3">
          <p className="text-xs text-gray-500 mb-1">
            Choose format to export your vector animation:
          </p>

          <button
            onClick={handleExportSVG}
            className="flex items-center justify-between p-3.5 border border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-800">Animated SVG (.svg)</div>
                <div className="text-[11px] text-gray-400">Standalone SVG with embedded CSS keyframes</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
          </button>

          <button
            onClick={handleExportLottie}
            className="flex items-center justify-between p-3.5 border border-gray-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-800">Bodymovin / Lottie (.json)</div>
                <div className="text-[11px] text-gray-400">Official Lottie schema for Web, iOS & Android</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
          </button>

          <button
            onClick={handleExportProject}
            className="flex items-center justify-between p-3.5 border border-gray-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-800">Kinetic Project (.kinetic)</div>
                <div className="text-[11px] text-gray-400">Full source scene graph and keyframe tracks</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
