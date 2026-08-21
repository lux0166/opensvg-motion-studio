import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { ToolMode } from '../engine/types';
import { openProjectFromFile, serializeProject } from '../engine/projectManager';
import {
  Compass,
  MousePointer,
  Crop,
  Square,
  PenTool,
  Shapes,
  Type,
  RotateCcw,
  RotateCw,
  Download,
  Settings,
  Plus,
  Circle,
  Star,
  FolderOpen,
  Save,
  FilePlus,
  ChevronDown
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    selectedTool,
    setSelectedTool,
    setExportOpen,
    setSettingsOpen,
    addNode,
    rootFrame,
    nodes,
    nodeOrder,
    duration,
    fps,
    loadProject,
    createNewProject,
    undo,
    redo,
    past,
    future,
    showToast
  } = useStudioStore();

  const [shapesDropdownOpen, setShapesDropdownOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);

  const tools: { id: ToolMode; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: 'Select Tool (V)', icon: <MousePointer className="w-3.5 h-3.5" /> },
    { id: 'direct-select', label: 'Transform Tool (T)', icon: <Crop className="w-3.5 h-3.5" /> },
    { id: 'frame', label: 'Frame Tool (F)', icon: <Square className="w-3.5 h-3.5" /> },
    { id: 'pen', label: 'Pen Tool (P)', icon: <PenTool className="w-3.5 h-3.5" /> },
  ];

  const handleAddShape = (type: 'rect' | 'circle' | 'star') => {
    const id = `shape-${Date.now()}`;
    addNode({
      id,
      name: type === 'circle' ? 'Circle' : type === 'star' ? 'Star Card' : 'Rectangle',
      type,
      visible: true,
      locked: false,
      x: Math.round(rootFrame.width / 2 - 50),
      y: Math.round(rootFrame.height / 2 - 50),
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: type === 'circle' ? 9999 : type === 'star' ? 20 : 12,
      fill: type === 'circle' ? '#10b981' : type === 'star' ? '#f59e0b' : '#8b5cf6',
      tracks: [
        {
          id: `tr-rot-${Date.now()}`,
          property: 'rotation',
          label: 'Rotation',
          unit: '°',
          color: '#8b5cf6',
          keyframes: [
            { id: 'k1', time: 0, value: 0, curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
            { id: 'k2', time: 3, value: 360, curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } }
          ]
        }
      ]
    });
    setShapesDropdownOpen(false);
    showToast(`Added ${type} shape!`);
  };

  const handleOpenProject = async () => {
    try {
      const proj = await openProjectFromFile();
      loadProject(proj);
      setFileMenuOpen(false);
    } catch (err: any) {
      if (err?.message !== 'No file selected') {
        showToast(`Failed to open project: ${err?.message || err}`, 'error');
      }
    }
  };

  const handleSaveProject = () => {
    const jsonStr = serializeProject(rootFrame, nodes, nodeOrder, duration, fps);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rootFrame.name.toLowerCase().replace(/\s+/g, '-')}-project.kinetic`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Saved project (.kinetic)!', 'success');
    setFileMenuOpen(false);
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-app-border shrink-0 z-10 bg-white/80 backdrop-blur-md select-none">
      {/* Brand & File Menu */}
      <div className="flex items-center gap-3 relative">
        <button
          onClick={() => setFileMenuOpen(!fileMenuOpen)}
          className="bg-white px-4 py-2 rounded-full shadow-sm font-semibold flex items-center gap-2 hover:bg-gray-50 border border-gray-100 transition-all active:scale-95"
        >
          <Compass className="w-4 h-4 text-blue-600" />
          <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent font-bold">
            OpenSVG
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {/* File Dropdown Menu */}
        {fileMenuOpen && (
          <div className="absolute top-14 left-0 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                createNewProject();
                setFileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-left"
            >
              <FilePlus className="w-4 h-4 text-gray-500" />
              New Project
            </button>
            <button
              onClick={handleOpenProject}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-left"
            >
              <FolderOpen className="w-4 h-4 text-blue-500" />
              Open File (.kinetic)
            </button>
            <button
              onClick={handleSaveProject}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-left"
            >
              <Save className="w-4 h-4 text-emerald-500" />
              Save Project (Ctrl+S)
            </button>
            <div className="h-[1px] bg-gray-100 my-0.5" />
            <button
              onClick={() => {
                setExportOpen(true);
                setFileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors text-left"
            >
              <Download className="w-4 h-4 text-indigo-500" />
              Export Assets...
            </button>
          </div>
        )}

        <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2.5 py-1 rounded-full border border-blue-100 hidden sm:inline-block">
          Desktop Studio
        </span>
      </div>

      {/* Tool Group Center */}
      <div className="flex items-center bg-gray-100/90 rounded-full p-1 shadow-inner border border-gray-200/80 relative">
        {tools.map((t) => {
          const isActive = selectedTool === t.id;
          return (
            <button
              key={t.id}
              title={t.label}
              onClick={() => setSelectedTool(t.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 ${
                isActive
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              {t.icon}
            </button>
          );
        })}

        {/* Shapes Menu */}
        <div className="relative">
          <button
            title="Shapes Tool"
            onClick={() => setShapesDropdownOpen(!shapesDropdownOpen)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 ${
              shapesDropdownOpen
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-gray-900'
            }`}
          >
            <Shapes className="w-3.5 h-3.5" />
          </button>

          {shapesDropdownOpen && (
            <div className="absolute top-11 left-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-col gap-1 min-w-[140px] z-50 animate-in fade-in zoom-in-95">
              <button
                onClick={() => handleAddShape('rect')}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-left"
              >
                <Square className="w-3.5 h-3.5 text-purple-500" />
                Rectangle
              </button>
              <button
                onClick={() => handleAddShape('circle')}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-left"
              >
                <Circle className="w-3.5 h-3.5 text-emerald-500" />
                Circle / Oval
              </button>
              <button
                onClick={() => handleAddShape('star')}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-left"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                Star Shape
              </button>
            </div>
          )}
        </div>

        <button
          title="Text Tool"
          onClick={() => setSelectedTool('text')}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 ${
            selectedTool === 'text'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-white hover:text-gray-900'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-5 bg-gray-300 mx-1" />

        <button
          title="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={past.length === 0}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          onClick={redo}
          disabled={future.length === 0}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-5 bg-gray-300 mx-1" />

        <button
          title="Export Animation (Ctrl+E)"
          onClick={() => setExportOpen(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          title="Project Settings"
          onClick={() => setSettingsOpen(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition-all"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAddShape('rect')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> New Element
        </button>
      </div>
    </header>
  );
};
