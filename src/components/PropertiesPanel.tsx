import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import {
  Square,
  Trash2,
  Sliders,
  Info,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical
} from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const {
    rootFrame,
    nodes,
    selectedId,
    alignSelected,
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
        {/* Alignment Quick Actions */}
        <div>
          <label className="text-[11px] text-gray-400 font-semibold mb-2 block uppercase tracking-wider">
            Align
          </label>
          <div className="flex items-center justify-between bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button
              title="Align Left"
              onClick={() => {
                alignSelected('left');
                showToast('Aligned Left');
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white transition-colors"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              title="Align Center Horizontally"
              onClick={() => {
                alignSelected('center');
                showToast('Aligned Center');
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white transition-colors"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              title="Align Right"
              onClick={() => {
                alignSelected('right');
                showToast('Aligned Right');
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white transition-colors"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-gray-200" />
            <button
              title="Align Top"
              onClick={() => {
                alignSelected('top');
                showToast('Aligned Top');
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white transition-colors"
            >
              <AlignStartVertical className="w-3.5 h-3.5" />
            </button>
            <button
              title="Align Middle Vertically"
              onClick={() => {
                alignSelected('middle');
                showToast('Aligned Middle');
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white transition-colors"
            >
              <AlignCenterVertical className="w-3.5 h-3.5" />
            </button>
            <button
              title="Align Bottom"
              onClick={() => {
                alignSelected('bottom');
                showToast('Aligned Bottom');
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white transition-colors"
            >
              <AlignEndVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

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

        {/* Fill & Gradients */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
              Fill Style
            </label>
            {/* Fill Mode Switcher */}
            <div className="flex bg-gray-200/60 p-0.5 rounded-lg text-[10px] font-medium">
              <button
                onClick={() => updateNode(selectedId, { fillType: 'solid' })}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  !selectedNode.fillType || selectedNode.fillType === 'solid'
                    ? 'bg-white text-gray-900 font-bold shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Solid
              </button>
              <button
                onClick={() =>
                  updateNode(selectedId, {
                    fillType: 'linear',
                    linearGradient: selectedNode.linearGradient || {
                      angle: 45,
                      stops: [
                        { offset: 0, color: selectedNode.fill || '#3b82f6' },
                        { offset: 1, color: '#9333ea' }
                      ]
                    }
                  })
                }
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  selectedNode.fillType === 'linear'
                    ? 'bg-white text-gray-900 font-bold shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Linear
              </button>
              <button
                onClick={() =>
                  updateNode(selectedId, {
                    fillType: 'radial',
                    radialGradient: selectedNode.radialGradient || {
                      stops: [
                        { offset: 0, color: '#60a5fa' },
                        { offset: 1, color: '#1e40af' }
                      ]
                    }
                  })
                }
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  selectedNode.fillType === 'radial'
                    ? 'bg-white text-gray-900 font-bold shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Radial
              </button>
            </div>
          </div>

          {/* Solid Color */}
          {(!selectedNode.fillType || selectedNode.fillType === 'solid') && (
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
              <span className="text-[11px] text-gray-400 font-medium">Hex Color</span>
            </div>
          )}

          {/* Linear Gradient Controls */}
          {selectedNode.fillType === 'linear' && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">Gradient Stops</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedNode.linearGradient?.stops[0]?.color || '#3b82f6'}
                    onChange={(e) => {
                      const stops = [...(selectedNode.linearGradient?.stops || [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#9333ea' }])];
                      stops[0] = { offset: 0, color: e.target.value };
                      updateNode(selectedId, {
                        linearGradient: { angle: selectedNode.linearGradient?.angle || 45, stops }
                      });
                    }}
                    className="w-6 h-6 rounded-md border border-gray-300 cursor-pointer p-0 bg-transparent"
                  />
                  <span className="text-gray-300 text-xs font-mono">→</span>
                  <input
                    type="color"
                    value={selectedNode.linearGradient?.stops[1]?.color || '#9333ea'}
                    onChange={(e) => {
                      const stops = [...(selectedNode.linearGradient?.stops || [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#9333ea' }])];
                      stops[1] = { offset: 1, color: e.target.value };
                      updateNode(selectedId, {
                        linearGradient: { angle: selectedNode.linearGradient?.angle || 45, stops }
                      });
                    }}
                    className="w-6 h-6 rounded-md border border-gray-300 cursor-pointer p-0 bg-transparent"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-gray-500 font-medium">Angle</span>
                  <span className="text-xs font-mono font-bold text-gray-700">
                    {selectedNode.linearGradient?.angle || 45}°
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedNode.linearGradient?.angle || 45}
                  onChange={(e) =>
                    updateNode(selectedId, {
                      linearGradient: {
                        stops: selectedNode.linearGradient?.stops || [
                          { offset: 0, color: '#3b82f6' },
                          { offset: 1, color: '#9333ea' }
                        ],
                        angle: parseInt(e.target.value)
                      }
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Radial Gradient Controls */}
          {selectedNode.fillType === 'radial' && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Center & Edge</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedNode.radialGradient?.stops[0]?.color || '#60a5fa'}
                  onChange={(e) => {
                    const stops = [...(selectedNode.radialGradient?.stops || [{ offset: 0, color: '#60a5fa' }, { offset: 1, color: '#1e40af' }])];
                    stops[0] = { offset: 0, color: e.target.value };
                    updateNode(selectedId, { radialGradient: { stops } });
                  }}
                  className="w-6 h-6 rounded-md border border-gray-300 cursor-pointer p-0 bg-transparent"
                />
                <span className="text-gray-300 text-xs font-mono">◎</span>
                <input
                  type="color"
                  value={selectedNode.radialGradient?.stops[1]?.color || '#1e40af'}
                  onChange={(e) => {
                    const stops = [...(selectedNode.radialGradient?.stops || [{ offset: 0, color: '#60a5fa' }, { offset: 1, color: '#1e40af' }])];
                    stops[1] = { offset: 1, color: e.target.value };
                    updateNode(selectedId, { radialGradient: { stops } });
                  }}
                  className="w-6 h-6 rounded-md border border-gray-300 cursor-pointer p-0 bg-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stroke Section */}
        <div>
          <label className="text-[11px] text-gray-400 font-semibold mb-2 block uppercase tracking-wider">
            Stroke & Border
          </label>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedNode.stroke || '#3b82f6'}
                  onChange={(e) => updateNode(selectedId, { stroke: e.target.value })}
                  className="w-6 h-6 rounded-md border border-gray-300 cursor-pointer p-0 bg-transparent"
                />
                <span className="text-xs font-mono font-semibold text-gray-700">
                  {selectedNode.stroke || 'None'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 w-20">
                <span className="text-[10px] text-gray-400 font-mono">W</span>
                <input
                  type="number"
                  min="0"
                  max="32"
                  value={selectedNode.strokeWidth || 0}
                  onChange={(e) =>
                    updateNode(selectedId, { strokeWidth: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-gray-800 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
              <span className="text-[11px] text-gray-500 font-medium">Style</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => updateNode(selectedId, { strokeDash: [] })}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                    !selectedNode.strokeDash || selectedNode.strokeDash.length === 0
                      ? 'bg-white border-blue-400 text-blue-600 font-bold shadow-xs'
                      : 'border-gray-200 text-gray-500 hover:bg-white'
                  }`}
                >
                  Solid
                </button>
                <button
                  onClick={() => updateNode(selectedId, { strokeDash: [6, 6] })}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                    selectedNode.strokeDash && selectedNode.strokeDash.length > 0
                      ? 'bg-white border-blue-400 text-blue-600 font-bold shadow-xs'
                      : 'border-gray-200 text-gray-500 hover:bg-white'
                  }`}
                >
                  Dashed
                </button>
              </div>
            </div>
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
