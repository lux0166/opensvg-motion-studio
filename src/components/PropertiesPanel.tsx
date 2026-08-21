import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { Square, Trash2, Sliders, Info } from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const {
    rootFrame,
    nodes,
    selectedId,
    updateRootFrame,
    updateNode,
    deleteNode,
    showToast
  } = useStudioStore();

  // 1. Root Frame Selected
  if (selectedId === 'frame-1' || !selectedId) {
    return (
      <aside className="w-72 bg-white m-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col z-10 overflow-y-auto select-none">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Square className="w-3.5 h-3.5 text-blue-500" />
            <h2 className="font-bold text-gray-800 text-xs">{rootFrame.name}</h2>
          </div>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
            Root Frame
          </span>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Dimensions */}
          <div>
            <label className="text-[11px] text-gray-400 font-semibold mb-2 block uppercase tracking-wider">
              Canvas Dimensions
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <span className="text-gray-400 text-xs font-mono font-medium mr-2">W</span>
                <input
                  type="number"
                  value={rootFrame.width}
                  onChange={(e) => updateRootFrame({ width: Math.max(100, parseInt(e.target.value) || 600) })}
                  className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 focus:ring-0 outline-none"
                />
              </div>
              <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <span className="text-gray-400 text-xs font-mono font-medium mr-2">H</span>
                <input
                  type="number"
                  value={rootFrame.height}
                  onChange={(e) => updateRootFrame({ height: Math.max(100, parseInt(e.target.value) || 400) })}
                  className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 focus:ring-0 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="text-[11px] text-gray-400 font-semibold mb-2 block uppercase tracking-wider">
              Background Fill
            </label>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={rootFrame.fill}
                  onChange={(e) => updateRootFrame({ fill: e.target.value })}
                  className="w-7 h-7 rounded-lg border border-gray-300 cursor-pointer p-0 bg-transparent"
                />
                <span className="text-xs font-mono font-semibold text-gray-700 uppercase">
                  {rootFrame.fill}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Solid</span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Clip Content Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-800 block">Clip Content</span>
              <span className="text-[10px] text-gray-400">Hide elements outside canvas</span>
            </div>
            <button
              onClick={() => updateRootFrame({ clipContent: !rootFrame.clipContent })}
              className={`w-10 h-6 ${
                rootFrame.clipContent ? 'bg-blue-500' : 'bg-gray-300'
              } rounded-full relative transition-colors duration-200 focus:outline-none shadow-inner`}
            >
              <span
                className={`absolute top-1 ${
                  rootFrame.clipContent ? 'right-1' : 'left-1'
                } w-4 h-4 bg-white rounded-full shadow transition-all duration-200`}
              />
            </button>
          </div>

          <div className="mt-2 p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-700 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
            <span>
              Click on elements on Canvas or Layers to edit position, rotation, and animation tracks.
            </span>
          </div>
        </div>
      </aside>
    );
  }

  // 2. Element Selected
  const selectedNode = nodes[selectedId];
  if (!selectedNode) return null;

  return (
    <aside className="w-72 bg-white m-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col z-10 overflow-y-auto select-none">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div
            className="w-3.5 h-3.5 rounded-sm"
            style={{ backgroundColor: selectedNode.fill }}
          />
          <h2 className="font-bold text-gray-800 text-xs">{selectedNode.name}</h2>
        </div>
        <button
          title="Delete Element (Delete)"
          onClick={() => {
            deleteNode(selectedId);
            showToast('Element deleted', 'info');
          }}
          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Position */}
        <div>
          <label className="text-[11px] text-gray-400 font-semibold mb-2 block uppercase tracking-wider">
            Position
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
              <span className="text-gray-400 text-xs font-mono font-medium mr-2">X</span>
              <input
                type="number"
                value={selectedNode.x}
                onChange={(e) => updateNode(selectedId, { x: parseInt(e.target.value) || 0 })}
                className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 focus:ring-0 outline-none"
              />
            </div>
            <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
              <span className="text-gray-400 text-xs font-mono font-medium mr-2">Y</span>
              <input
                type="number"
                value={selectedNode.y}
                onChange={(e) => updateNode(selectedId, { y: parseInt(e.target.value) || 0 })}
                className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 focus:ring-0 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <label className="text-[11px] text-gray-400 font-semibold mb-2 block uppercase tracking-wider">
            Dimensions
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
              <span className="text-gray-400 text-xs font-mono font-medium mr-2">W</span>
              <input
                type="number"
                value={selectedNode.width}
                onChange={(e) => updateNode(selectedId, { width: Math.max(10, parseInt(e.target.value) || 50) })}
                className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 focus:ring-0 outline-none"
              />
            </div>
            <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
              <span className="text-gray-400 text-xs font-mono font-medium mr-2">H</span>
              <input
                type="number"
                value={selectedNode.height}
                onChange={(e) => updateNode(selectedId, { height: Math.max(10, parseInt(e.target.value) || 50) })}
                className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 focus:ring-0 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
              Rotation
            </label>
            <span className="text-xs font-mono font-bold text-blue-600">
              {Math.round(selectedNode.rotation || 0)}°
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={Math.round(selectedNode.rotation || 0) % 360}
            onChange={(e) => updateNode(selectedId, { rotation: parseInt(e.target.value) })}
          />
        </div>

        {/* Fill Color */}
        <div>
          <label className="text-[11px] text-gray-400 font-semibold mb-2 block uppercase tracking-wider">
            Fill Color
          </label>
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={selectedNode.fill}
                onChange={(e) => updateNode(selectedId, { fill: e.target.value })}
                className="w-7 h-7 rounded-lg border border-gray-300 cursor-pointer p-0 bg-transparent"
              />
              <span className="text-xs font-mono font-semibold text-gray-700 uppercase">
                {selectedNode.fill}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">Color</span>
          </div>
        </div>

        {/* Corner Radius */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
              Corner Radius
            </label>
            <span className="text-xs font-mono font-bold text-gray-700">
              {selectedNode.borderRadius || 0}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="64"
            value={selectedNode.borderRadius || 0}
            onChange={(e) => updateNode(selectedId, { borderRadius: parseInt(e.target.value) })}
          />
        </div>

        <hr className="border-gray-100" />

        {/* Animation Tracks Info */}
        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs text-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-gray-800">Timeline Tracks</span>
          </div>
          <span className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
            {selectedNode.tracks?.length || 0} active
          </span>
        </div>
      </div>
    </aside>
  );
};
