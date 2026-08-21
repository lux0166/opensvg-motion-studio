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
  AlignEndVertical,
  Type,
  Sparkles,
  Scissors,
  Layers,
  MousePointerClick,
  Zap,
  Plus,
  Navigation,
  Pipette,
  Palette
} from 'lucide-react';
import { generateColorHarmonies } from '../engine/colorHarmony';

export const PropertiesPanel: React.FC = () => {
  const {
    rootFrame,
    nodes,
    selectedId,
    selectedIds,
    alignSelected,
    applyBooleanOp,
    addTrigger,
    removeTrigger,
    updateRootFrame,
    updateNode,
    deleteNode,
    showToast
  } = useStudioStore();

  // 1. Root Frame Selected
  if (selectedId === 'frame-1' || !selectedId) {
    return (
      <aside className="w-72 bg-white dark:bg-zinc-900 m-3 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col z-10 overflow-y-auto select-none">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Square className="w-3.5 h-3.5 text-blue-500" />
            <h2 className="font-bold text-gray-800 dark:text-zinc-200 text-xs">{rootFrame.name}</h2>
          </div>
          <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">
            Root Frame
          </span>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Dimensions */}
          <div>
            <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold mb-2 block uppercase tracking-wider">
              Canvas Dimensions
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center bg-gray-50 dark:bg-zinc-800/70 rounded-xl px-3 py-2 border border-gray-200 dark:border-zinc-700 focus-within:border-blue-500 focus-within:bg-white focus-within:dark:bg-zinc-800 transition-all">
                <span className="text-gray-400 dark:text-zinc-500 text-xs font-mono font-medium mr-2">W</span>
                <input
                  type="number"
                  value={rootFrame.width}
                  onChange={(e) => updateRootFrame({ width: Math.max(100, parseInt(e.target.value) || 600) })}
                  className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 dark:text-zinc-100 focus:ring-0 outline-none"
                />
              </div>
              <div className="flex items-center bg-gray-50 dark:bg-zinc-800/70 rounded-xl px-3 py-2 border border-gray-200 dark:border-zinc-700 focus-within:border-blue-500 focus-within:bg-white focus-within:dark:bg-zinc-800 transition-all">
                <span className="text-gray-400 dark:text-zinc-500 text-xs font-mono font-medium mr-2">H</span>
                <input
                  type="number"
                  value={rootFrame.height}
                  onChange={(e) => updateRootFrame({ height: Math.max(100, parseInt(e.target.value) || 400) })}
                  className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 dark:text-zinc-100 focus:ring-0 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold mb-2 block uppercase tracking-wider">
              Background Fill
            </label>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-zinc-800/70 rounded-xl border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={rootFrame.fill}
                  onChange={(e) => updateRootFrame({ fill: e.target.value })}
                  className="w-7 h-7 rounded-lg border border-gray-300 dark:border-zinc-600 cursor-pointer p-0 bg-transparent"
                />
                <span className="text-xs font-mono font-semibold text-gray-700 dark:text-zinc-300 uppercase">
                  {rootFrame.fill}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">Solid</span>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-zinc-800" />

          {/* Clip Content Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200 block">Clip Content</span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">Hide elements outside canvas</span>
            </div>
            <button
              onClick={() => updateRootFrame({ clipContent: !rootFrame.clipContent })}
              className={`w-10 h-6 ${
                rootFrame.clipContent ? 'bg-blue-500' : 'bg-gray-300 dark:bg-zinc-700'
              } rounded-full relative transition-colors duration-200 focus:outline-none shadow-inner`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  rootFrame.clipContent ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="mt-2 p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed flex items-start gap-2">
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
    <aside className="w-72 bg-white dark:bg-zinc-900 m-3 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col z-10 overflow-y-auto select-none">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <div
            className="w-3.5 h-3.5 rounded-sm"
            style={{ backgroundColor: selectedNode.fill }}
          />
          <h2 className="font-bold text-gray-800 dark:text-zinc-200 text-xs">{selectedNode.name}</h2>
        </div>
        <button
          title="Delete Element (Delete)"
          onClick={() => {
            deleteNode(selectedId);
            showToast('Element deleted', 'info');
          }}
          className="text-gray-400 dark:text-zinc-500 hover:text-red-500 hover:dark:text-red-400 p-1.5 rounded-lg hover:bg-red-50 hover:dark:bg-red-950/40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Boolean Operations (when 2+ shapes selected) */}
        {selectedIds.length >= 2 && (
          <div>
            <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold mb-2 block uppercase tracking-wider flex items-center justify-between">
              <span>Boolean Ops ({selectedIds.length})</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">Compound</span>
            </label>
            <div className="grid grid-cols-4 gap-1 bg-gray-50 dark:bg-zinc-800/70 p-1 rounded-xl border border-gray-200 dark:border-zinc-700 text-[10px] font-semibold text-gray-700 dark:text-zinc-300">
              <button
                title="Union (Combine Shapes into one)"
                onClick={() => applyBooleanOp('union')}
                className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white hover:dark:bg-zinc-700 hover:text-blue-600 hover:dark:text-blue-400 transition-all shadow-xs"
              >
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Union</span>
              </button>
              <button
                title="Subtract (Cut front shape from back)"
                onClick={() => applyBooleanOp('subtract')}
                className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white hover:dark:bg-zinc-700 hover:text-red-600 hover:dark:text-red-400 transition-all shadow-xs"
              >
                <Scissors className="w-3.5 h-3.5 text-red-500" />
                <span>Subtract</span>
              </button>
              <button
                title="Intersect (Keep overlapping area)"
                onClick={() => applyBooleanOp('intersect')}
                className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white hover:dark:bg-zinc-700 hover:text-indigo-600 hover:dark:text-indigo-400 transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Intersect</span>
              </button>
              <button
                title="Exclude (XOR Difference)"
                onClick={() => applyBooleanOp('exclude')}
                className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white hover:dark:bg-zinc-700 hover:text-purple-600 hover:dark:text-purple-400 transition-all shadow-xs"
              >
                <Type className="w-3.5 h-3.5 text-purple-500" />
                <span>Exclude</span>
              </button>
            </div>
          </div>
        )}

        {/* Alignment Quick Actions */}
        <div>
          <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold mb-2 block uppercase tracking-wider">
            Align
          </label>
          <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/70 p-1 rounded-xl border border-gray-200 dark:border-zinc-700">
            <button
              title="Align Left"
              onClick={() => {
                alignSelected('left');
                showToast('Aligned Left');
              }}
              className="p-1.5 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-blue-600 hover:dark:text-blue-400 hover:bg-white hover:dark:bg-zinc-700 transition-colors"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              title="Align Center Horizontally"
              onClick={() => {
                alignSelected('center');
                showToast('Aligned Center');
              }}
              className="p-1.5 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-blue-600 hover:dark:text-blue-400 hover:bg-white hover:dark:bg-zinc-700 transition-colors"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              title="Align Right"
              onClick={() => {
                alignSelected('right');
                showToast('Aligned Right');
              }}
              className="p-1.5 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-blue-600 hover:dark:text-blue-400 hover:bg-white hover:dark:bg-zinc-700 transition-colors"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-gray-200 dark:bg-zinc-700" />
            <button
              title="Align Top"
              onClick={() => {
                alignSelected('top');
                showToast('Aligned Top');
              }}
              className="p-1.5 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-blue-600 hover:dark:text-blue-400 hover:bg-white hover:dark:bg-zinc-700 transition-colors"
            >
              <AlignStartVertical className="w-3.5 h-3.5" />
            </button>
            <button
              title="Align Middle Vertically"
              onClick={() => {
                alignSelected('middle');
                showToast('Aligned Middle');
              }}
              className="p-1.5 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-blue-600 hover:dark:text-blue-400 hover:bg-white hover:dark:bg-zinc-700 transition-colors"
            >
              <AlignCenterVertical className="w-3.5 h-3.5" />
            </button>
            <button
              title="Align Bottom"
              onClick={() => {
                alignSelected('bottom');
                showToast('Aligned Bottom');
              }}
              className="p-1.5 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-blue-600 hover:dark:text-blue-400 hover:bg-white hover:dark:bg-zinc-700 transition-colors"
            >
              <AlignEndVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold mb-2 block uppercase tracking-wider">
            Position
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center bg-gray-50 dark:bg-zinc-800/70 rounded-xl px-3 py-2 border border-gray-200 dark:border-zinc-700 focus-within:border-blue-500 focus-within:bg-white focus-within:dark:bg-zinc-800 transition-all">
              <span className="text-gray-400 dark:text-zinc-500 text-xs font-mono font-medium mr-2">X</span>
              <input
                type="number"
                value={selectedNode.x}
                onChange={(e) => updateNode(selectedId, { x: parseInt(e.target.value) || 0 })}
                className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 dark:text-zinc-100 focus:ring-0 outline-none"
              />
            </div>
            <div className="flex items-center bg-gray-50 dark:bg-zinc-800/70 rounded-xl px-3 py-2 border border-gray-200 dark:border-zinc-700 focus-within:border-blue-500 focus-within:bg-white focus-within:dark:bg-zinc-800 transition-all">
              <span className="text-gray-400 dark:text-zinc-500 text-xs font-mono font-medium mr-2">Y</span>
              <input
                type="number"
                value={selectedNode.y}
                onChange={(e) => updateNode(selectedId, { y: parseInt(e.target.value) || 0 })}
                className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 dark:text-zinc-100 focus:ring-0 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold mb-2 block uppercase tracking-wider">
            Dimensions
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center bg-gray-50 dark:bg-zinc-800/70 rounded-xl px-3 py-2 border border-gray-200 dark:border-zinc-700 focus-within:border-blue-500 focus-within:bg-white focus-within:dark:bg-zinc-800 transition-all">
              <span className="text-gray-400 dark:text-zinc-500 text-xs font-mono font-medium mr-2">W</span>
              <input
                type="number"
                value={selectedNode.width}
                onChange={(e) => updateNode(selectedId, { width: Math.max(10, parseInt(e.target.value) || 50) })}
                className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 dark:text-zinc-100 focus:ring-0 outline-none"
              />
            </div>
            <div className="flex items-center bg-gray-50 dark:bg-zinc-800/70 rounded-xl px-3 py-2 border border-gray-200 dark:border-zinc-700 focus-within:border-blue-500 focus-within:bg-white focus-within:dark:bg-zinc-800 transition-all">
              <span className="text-gray-400 dark:text-zinc-500 text-xs font-mono font-medium mr-2">H</span>
              <input
                type="number"
                value={selectedNode.height}
                onChange={(e) => updateNode(selectedId, { height: Math.max(10, parseInt(e.target.value) || 50) })}
                className="w-full border-none bg-transparent p-0 text-xs font-semibold text-gray-800 dark:text-zinc-100 focus:ring-0 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
              Rotation
            </label>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
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

        {/* Typography Controls (When Text Node is Selected) */}
        {selectedNode.type === 'text' && (
          <div className="p-3 bg-gray-50 dark:bg-zinc-800/70 rounded-2xl border border-gray-200 dark:border-zinc-700 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-zinc-200">
              <Type className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Typography Settings</span>
            </div>

            {/* Text Content */}
            <div>
              <label className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mb-1 block uppercase">
                Content
              </label>
              <input
                type="text"
                value={selectedNode.textContent || ''}
                onChange={(e) => updateNode(selectedId, { textContent: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-800 dark:text-zinc-100 outline-none focus:border-purple-500"
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mb-1 block uppercase">
                Font Family
              </label>
              <select
                value={selectedNode.fontFamily || 'Inter, sans-serif'}
                onChange={(e) => updateNode(selectedId, { fontFamily: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 text-xs font-medium text-gray-800 dark:text-zinc-100 outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="Inter, sans-serif">Inter (Modern Clean)</option>
                <option value="'Space Grotesk', sans-serif">Space Grotesk (Tech & Kinetic)</option>
                <option value="'Outfit', sans-serif">Outfit (Geometric Sans)</option>
                <option value="'Fira Code', monospace">Fira Code (Code Monospace)</option>
                <option value="'Playfair Display', serif">Playfair Display (Editorial Serif)</option>
                <option value="Roboto, sans-serif">Roboto (Standard)</option>
              </select>
            </div>

            {/* Font Size & Weight Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mb-1 block uppercase">
                  Size ({selectedNode.fontSize || 28}px)
                </label>
                <input
                  type="number"
                  min="8"
                  max="144"
                  value={selectedNode.fontSize || 28}
                  onChange={(e) =>
                    updateNode(selectedId, { fontSize: Math.max(8, parseInt(e.target.value) || 28) })
                  }
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-2 py-1 text-xs font-mono font-semibold text-gray-800 dark:text-zinc-100 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mb-1 block uppercase">
                  Weight
                </label>
                <select
                  value={selectedNode.fontWeight || 600}
                  onChange={(e) => updateNode(selectedId, { fontWeight: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-2 py-1 text-xs font-semibold text-gray-800 dark:text-zinc-100 outline-none cursor-pointer"
                >
                  <option value="400">Regular (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">SemiBold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="900">Black (900)</option>
                </select>
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mb-1 block uppercase">
                Alignment
              </label>
              <div className="flex bg-white dark:bg-zinc-900 p-0.5 rounded-xl border border-gray-200 dark:border-zinc-700">
                <button
                  onClick={() => updateNode(selectedId, { textAlign: 'left' })}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                    !selectedNode.textAlign || selectedNode.textAlign === 'left'
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 hover:dark:bg-zinc-800'
                  }`}
                >
                  Left
                </button>
                <button
                  onClick={() => updateNode(selectedId, { textAlign: 'center' })}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                    selectedNode.textAlign === 'center'
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 hover:dark:bg-zinc-800'
                  }`}
                >
                  Center
                </button>
                <button
                  onClick={() => updateNode(selectedId, { textAlign: 'right' })}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                    selectedNode.textAlign === 'right'
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 hover:dark:bg-zinc-800'
                  }`}
                >
                  Right
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fill & Gradients */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
              Fill Style
            </label>
            {/* Fill Mode Switcher */}
            <div className="flex bg-gray-200/60 dark:bg-zinc-800 p-0.5 rounded-lg text-[10px] font-medium">
              <button
                onClick={() => updateNode(selectedId, { fillType: 'solid' })}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  !selectedNode.fillType || selectedNode.fillType === 'solid'
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-bold shadow-xs'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 hover:dark:text-zinc-200'
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
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-bold shadow-xs'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 hover:dark:text-zinc-200'
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
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-bold shadow-xs'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 hover:dark:text-zinc-200'
                }`}
              >
                Radial
              </button>
            </div>
          </div>

          {/* Solid Color */}
          {(!selectedNode.fillType || selectedNode.fillType === 'solid') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-zinc-800/70 rounded-xl border border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={selectedNode.fill.startsWith('#') ? selectedNode.fill : '#3b82f6'}
                    onChange={(e) => updateNode(selectedId, { fill: e.target.value })}
                    className="w-7 h-7 rounded-lg border border-gray-300 dark:border-zinc-600 cursor-pointer p-0 bg-transparent"
                  />
                  <span className="text-xs font-mono font-semibold text-gray-700 dark:text-zinc-300 uppercase">
                    {selectedNode.fill}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    title="Sample screen color (Eyedropper)"
                    onClick={async () => {
                      if ('EyeDropper' in window) {
                        try {
                          const eyeDropper = new (window as any).EyeDropper();
                          const res = await eyeDropper.open();
                          if (res && res.sRGBHex) {
                            updateNode(selectedId, { fill: res.sRGBHex });
                            showToast(`Sampled: ${res.sRGBHex}`, 'success');
                          }
                        } catch {
                          // cancelled
                        }
                      } else {
                        showToast('Eyedropper tool active', 'info');
                      }
                    }}
                    className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-blue-600 hover:dark:text-blue-400 bg-white dark:bg-zinc-800 hover:bg-blue-50 hover:dark:bg-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-lg transition-colors shadow-2xs"
                  >
                    <Pipette className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">Pick</span>
                </div>
              </div>

              {/* Color Harmonies Palette Generator */}
              {selectedNode.fill.startsWith('#') && (
                <div className="p-2.5 bg-gray-50/70 dark:bg-zinc-800/50 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 space-y-2">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    <Palette className="w-3 h-3 text-purple-500" /> Color Harmonies
                  </div>
                  {(() => {
                    const harmonies = generateColorHarmonies(selectedNode.fill);
                    return (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-zinc-400">
                          <span>Complementary</span>
                          <div className="flex gap-1">
                            {harmonies.complementary.map((c, i) => (
                              <button
                                key={i}
                                title={`Apply ${c}`}
                                onClick={() => updateNode(selectedId, { fill: c })}
                                style={{ backgroundColor: c }}
                                className="w-4 h-4 rounded-md border border-black/10 dark:border-white/10 shadow-2xs hover:scale-115 transition-transform"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-zinc-400">
                          <span>Analogous</span>
                          <div className="flex gap-1">
                            {harmonies.analogous.map((c, i) => (
                              <button
                                key={i}
                                title={`Apply ${c}`}
                                onClick={() => updateNode(selectedId, { fill: c })}
                                style={{ backgroundColor: c }}
                                className="w-4 h-4 rounded-md border border-black/10 dark:border-white/10 shadow-2xs hover:scale-115 transition-transform"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-zinc-400">
                          <span>Triadic</span>
                          <div className="flex gap-1">
                            {harmonies.triadic.map((c, i) => (
                              <button
                                key={i}
                                title={`Apply ${c}`}
                                onClick={() => updateNode(selectedId, { fill: c })}
                                style={{ backgroundColor: c }}
                                className="w-4 h-4 rounded-md border border-black/10 dark:border-white/10 shadow-2xs hover:scale-115 transition-transform"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-zinc-400">
                          <span>Monochromatic</span>
                          <div className="flex gap-1">
                            {harmonies.monochromatic.map((c, i) => (
                              <button
                                key={i}
                                title={`Apply ${c}`}
                                onClick={() => updateNode(selectedId, { fill: c })}
                                style={{ backgroundColor: c }}
                                className="w-4 h-4 rounded-md border border-black/10 dark:border-white/10 shadow-2xs hover:scale-115 transition-transform"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Linear Gradient Controls */}
          {selectedNode.fillType === 'linear' && (
            <div className="p-3 bg-gray-50 dark:bg-zinc-800/70 rounded-xl border border-gray-200 dark:border-zinc-700 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-zinc-300 font-medium">Gradient Stops</span>
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
                    className="w-6 h-6 rounded-md border border-gray-300 dark:border-zinc-600 cursor-pointer p-0 bg-transparent"
                  />
                  <span className="text-gray-300 dark:text-zinc-600 text-xs font-mono">→</span>
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
                    className="w-6 h-6 rounded-md border border-gray-300 dark:border-zinc-600 cursor-pointer p-0 bg-transparent"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">Angle</span>
                  <span className="text-xs font-mono font-bold text-gray-700 dark:text-zinc-300">
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
            <div className="p-3 bg-gray-50 dark:bg-zinc-800/70 rounded-xl border border-gray-200 dark:border-zinc-700 flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-zinc-300 font-medium">Center & Edge</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedNode.radialGradient?.stops[0]?.color || '#60a5fa'}
                  onChange={(e) => {
                    const stops = [...(selectedNode.radialGradient?.stops || [{ offset: 0, color: '#60a5fa' }, { offset: 1, color: '#1e40af' }])];
                    stops[0] = { offset: 0, color: e.target.value };
                    updateNode(selectedId, { radialGradient: { stops } });
                  }}
                  className="w-6 h-6 rounded-md border border-gray-300 dark:border-zinc-600 cursor-pointer p-0 bg-transparent"
                />
                <span className="text-gray-300 dark:text-zinc-600 text-xs font-mono">◎</span>
                <input
                  type="color"
                  value={selectedNode.radialGradient?.stops[1]?.color || '#1e40af'}
                  onChange={(e) => {
                    const stops = [...(selectedNode.radialGradient?.stops || [{ offset: 0, color: '#60a5fa' }, { offset: 1, color: '#1e40af' }])];
                    stops[1] = { offset: 1, color: e.target.value };
                    updateNode(selectedId, { radialGradient: { stops } });
                  }}
                  className="w-6 h-6 rounded-md border border-gray-300 dark:border-zinc-600 cursor-pointer p-0 bg-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stroke Section */}
        <div>
          <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold mb-2 block uppercase tracking-wider">
            Stroke & Border
          </label>
          <div className="p-3 bg-gray-50 dark:bg-zinc-800/70 rounded-xl border border-gray-200 dark:border-zinc-700 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedNode.stroke || '#3b82f6'}
                  onChange={(e) => updateNode(selectedId, { stroke: e.target.value })}
                  className="w-6 h-6 rounded-md border border-gray-300 dark:border-zinc-600 cursor-pointer p-0 bg-transparent"
                />
                <span className="text-xs font-mono font-semibold text-gray-700 dark:text-zinc-300">
                  {selectedNode.stroke || 'None'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 w-20">
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">W</span>
                <input
                  type="number"
                  min="0"
                  max="32"
                  value={selectedNode.strokeWidth || 0}
                  onChange={(e) =>
                    updateNode(selectedId, { strokeWidth: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-gray-800 dark:text-zinc-100 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-zinc-700/60">
              <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium">Style</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => updateNode(selectedId, { strokeDash: [] })}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                    !selectedNode.strokeDash || selectedNode.strokeDash.length === 0
                      ? 'bg-white dark:bg-zinc-700 border-blue-400 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                      : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700'
                  }`}
                >
                  Solid
                </button>
                <button
                  onClick={() => updateNode(selectedId, { strokeDash: [6, 6] })}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                    selectedNode.strokeDash && selectedNode.strokeDash.length > 0
                      ? 'bg-white dark:bg-zinc-700 border-blue-400 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                      : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700'
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
            <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
              Corner Radius
            </label>
            <span className="text-xs font-mono font-bold text-gray-700 dark:text-zinc-300">
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

        {/* Visual Filter Effects: Drop Shadow & Blur */}
        <div>
          <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold mb-2 block uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" /> Effects & Shadows
          </label>
          <div className="p-3 bg-gray-50 dark:bg-zinc-800/70 rounded-2xl border border-gray-200 dark:border-zinc-700 flex flex-col gap-3">
            {/* Drop Shadow Toggle & Color */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-700 dark:text-zinc-300 font-semibold">Drop Shadow</span>
              <input
                type="color"
                value={selectedNode.shadowColor || '#000000'}
                onChange={(e) => updateNode(selectedId, { shadowColor: e.target.value })}
                className="w-6 h-6 rounded-md border border-gray-300 dark:border-zinc-600 cursor-pointer p-0 bg-transparent"
              />
            </div>

            {/* Shadow Blur Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">Blur</span>
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-zinc-300">
                  {selectedNode.shadowBlur || 0}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="64"
                value={selectedNode.shadowBlur || 0}
                onChange={(e) => updateNode(selectedId, { shadowBlur: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Shadow Offset X & Y */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mb-1 block uppercase">
                  Offset X
                </label>
                <input
                  type="number"
                  min="-50"
                  max="50"
                  value={selectedNode.shadowOffsetX || 0}
                  onChange={(e) =>
                    updateNode(selectedId, { shadowOffsetX: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-gray-800 dark:text-zinc-100 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mb-1 block uppercase">
                  Offset Y
                </label>
                <input
                  type="number"
                  min="-50"
                  max="50"
                  value={selectedNode.shadowOffsetY || 0}
                  onChange={(e) =>
                    updateNode(selectedId, { shadowOffsetY: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-gray-800 dark:text-zinc-100 outline-none"
                />
              </div>
            </div>

            {/* Layer Blur */}
            <div className="pt-2 border-t border-gray-200/60 dark:border-zinc-700/60">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">Gaussian Blur</span>
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-zinc-300">
                  {selectedNode.filterBlur || 0}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={selectedNode.filterBlur || 0}
                onChange={(e) => updateNode(selectedId, { filterBlur: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Motion Path & Trajectory Orbit */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-indigo-500" /> Motion Path
            </label>
            {selectedNode.motionPath && (
              <button
                title="Detach Motion Path"
                onClick={() => updateNode(selectedId, { motionPath: undefined })}
                className="text-[10px] font-bold text-red-500 hover:text-red-600"
              >
                Detach
              </button>
            )}
          </div>

          {(() => {
            const pathNodes = Object.values(nodes).filter(
              (n) => (n.type === 'path' || (n.pathPoints && n.pathPoints.length > 0)) && n.id !== selectedId
            );

            if (pathNodes.length === 0 && !selectedNode.motionPath) {
              return (
                <div className="p-3 bg-gray-50 dark:bg-zinc-800/70 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 text-[11px] text-gray-400 dark:text-zinc-500 flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 shrink-0" />
                  <span>Draw a Vector Path (P) to use as a motion guide.</span>
                </div>
              );
            }

            return (
              <div className="bg-gray-50 dark:bg-zinc-800/70 p-3 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 space-y-2.5">
                <div>
                  <label className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mb-1 block uppercase">
                    Target Vector Path
                  </label>
                  <select
                    value={selectedNode.motionPath?.pathNodeId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        updateNode(selectedId, { motionPath: undefined });
                      } else {
                        updateNode(selectedId, {
                          motionPath: {
                            pathNodeId: val,
                            progress: selectedNode.motionPath?.progress ?? 0,
                            autoOrient: selectedNode.motionPath?.autoOrient ?? true
                          }
                        });
                      }
                    }}
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-2 py-1 text-xs font-semibold text-gray-800 dark:text-zinc-100 outline-none cursor-pointer"
                  >
                    <option value="">None (Static Position)</option>
                    {pathNodes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedNode.motionPath && (
                  <>
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mb-1">
                        <span className="uppercase">Path Progress</span>
                        <span className="font-mono text-gray-700 dark:text-zinc-300">
                          {Math.round((selectedNode.motionPath.progress || 0) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round((selectedNode.motionPath.progress || 0) * 100)}
                        onChange={(e) => {
                          const prog = parseFloat(e.target.value) / 100;
                          updateNode(selectedId, {
                            motionPath: {
                              ...selectedNode.motionPath!,
                              progress: prog
                            }
                          });
                        }}
                        className="w-full accent-indigo-600 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-zinc-300">
                        Auto-Orient to Path
                      </span>
                      <button
                        onClick={() => {
                          updateNode(selectedId, {
                            motionPath: {
                              ...selectedNode.motionPath!,
                              autoOrient: !selectedNode.motionPath?.autoOrient
                            }
                          });
                        }}
                        className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          selectedNode.motionPath?.autoOrient ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                            selectedNode.motionPath?.autoOrient ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* Interactivity & State Machine Triggers */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500" /> Triggers & Events
            </label>
            <button
              title="Add Click Trigger (Jump to 0.0s)"
              onClick={() => {
                const newTrigger = {
                  id: `trig-${Date.now()}`,
                  event: 'onClick' as const,
                  action: 'jumpToTime' as const,
                  targetTime: 0.0
                };
                addTrigger(selectedId, newTrigger);
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 hover:dark:bg-blue-900/50 px-2 py-0.5 rounded-md transition-colors shadow-xs"
            >
              <Plus className="w-3 h-3" /> Add Trigger
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {(!selectedNode.triggers || selectedNode.triggers.length === 0) ? (
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/70 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 text-[11px] text-gray-400 dark:text-zinc-500 flex items-center gap-2">
                <MousePointerClick className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                <span>No triggers added. Add interactive hover or click actions.</span>
              </div>
            ) : (
              selectedNode.triggers.map((trig) => (
                <div
                  key={trig.id}
                  className="p-2.5 bg-gray-50 dark:bg-zinc-800/70 rounded-xl border border-gray-200 dark:border-zinc-700 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 dark:text-zinc-200 text-[11px] uppercase">
                      {trig.event}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono">
                      → {trig.action}{trig.action === 'jumpToTime' ? ` (${trig.targetTime}s)` : ''}
                    </span>
                  </div>
                  <button
                    title="Remove Trigger"
                    onClick={() => removeTrigger(selectedId, trig.id)}
                    className="text-gray-400 dark:text-zinc-500 hover:text-red-500 hover:dark:text-red-400 p-1 rounded hover:bg-red-50 hover:dark:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <hr className="border-gray-100 dark:border-zinc-800" />

        {/* Animation Tracks Info */}
        <div className="bg-gray-50 dark:bg-zinc-800/70 p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs text-gray-600 dark:text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-gray-800 dark:text-zinc-200">Timeline Tracks</span>
          </div>
          <span className="text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
            {selectedNode.tracks?.length || 0} active
          </span>
        </div>
      </div>
    </aside>
  );
};
