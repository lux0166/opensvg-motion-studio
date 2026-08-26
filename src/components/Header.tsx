import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { ToolMode } from '../engine/types';
import { TOOL_REGISTRY } from '../engine/tools/toolRegistry';
import { importSvgString } from '../engine/svgImporter';
import { toggleThemeWithAnimation } from '../hooks/useThemeSwitcher';
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
  UploadCloud,
  ChevronDown,
  X,
  Copy,
  Edit2,
  ShieldClose,
  ArrowRightToLine,
  Check,
  Sun,
  Moon,
  Sparkles,
  LayoutTemplate,
  Monitor,
  Target,
  Hand
} from 'lucide-react';

interface ContextMenuState {
  tabId: string;
  x: number;
  y: number;
}

export const Header: React.FC = () => {
  const {
    theme,
    selectedTool,
    setSelectedTool,
    setExportOpen,
    setSettingsOpen,
    setPresetsModalOpen,
    addNode,
    rootFrame,
    fps,
    createNewProject,
    undo,
    redo,
    past,
    future,
    showToast,
    // Tab Management
    tabs,
    activeTabId,
    openNewTab,
    closeTab,
    switchTab,
    renameTab,
    duplicateTab,
    reorderTabs,
    closeOtherTabs,
    closeTabsToRight,
    workspace,
    setWorkspacePreset,
    resetWorkspace
  } = useStudioStore();

  const [shapesDropdownOpen, setShapesDropdownOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [tabsDropdownOpen, setTabsDropdownOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Drag and Drop Tab Reordering State
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverTabIndex, setDragOverTabIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'left' | 'right' | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const tabsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  // Click outside to dismiss context menu and dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
      if (tabsMenuRef.current && !tabsMenuRef.current.contains(e.target as Node)) {
        setTabsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setEditingTabId(null);
        setFileMenuOpen(false);
        setShapesDropdownOpen(false);
        setTabsDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleStartRename = (tabId: string, currentTitle: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setContextMenu(null);
    setEditingTabId(tabId);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (tabId: string) => {
    if (editingTitle.trim()) {
      renameTab(tabId, editingTitle.trim());
    }
    setEditingTabId(null);
  };

  const handleContextMenu = (tabId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      tabId,
      x: e.clientX,
      y: e.clientY
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (editingTabId) {
      e.preventDefault();
      return;
    }
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabs[index].id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTabIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const position = e.clientX < midX ? 'left' : 'right';

    setDragOverTabIndex(index);
    setDropPosition(position);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedTabIndex === null) return;
    if (draggedTabIndex !== targetIndex) {
      let dest = targetIndex;
      if (dropPosition === 'right') {
        dest = draggedTabIndex < targetIndex ? targetIndex : targetIndex + 1;
      } else {
        dest = draggedTabIndex < targetIndex ? (targetIndex > 0 ? targetIndex - 1 : 0) : targetIndex;
      }
      reorderTabs(draggedTabIndex, dest);
    }
    setDraggedTabIndex(null);
    setDragOverTabIndex(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverTabIndex(null);
    setDropPosition(null);
  };

  const tools: { id: ToolMode; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: TOOL_REGISTRY.select.label, icon: <MousePointer className="w-3.5 h-3.5" /> },
    { id: 'direct-select', label: TOOL_REGISTRY['direct-select'].label, icon: <Crop className="w-3.5 h-3.5" /> },
    { id: 'frame', label: TOOL_REGISTRY.frame.label, icon: <Square className="w-3.5 h-3.5" /> },
    { id: 'pen', label: TOOL_REGISTRY.pen.label, icon: <PenTool className="w-3.5 h-3.5" /> },
    { id: 'hand', label: TOOL_REGISTRY.hand.label, icon: <Hand className="w-3.5 h-3.5" /> },
  ];

  const handleAddShape = (type: 'rect' | 'circle' | 'star') => {
    const id = `shape-${Date.now()}`;
    addNode({
      id,
      name: type === 'circle' ? 'Circle' : type === 'star' ? 'Star' : 'Rectangle',
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
      tracks: [] // STATIC SHAPE (User explicitly animates if desired)
    });
    setShapesDropdownOpen(false);
    showToast(`Added ${type} shape!`);
  };

  const handleOpenProject = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.osvg,.kinetic,application/json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          useStudioStore.getState().loadOpenSVGDocument(text);
          showToast(`Opened OpenSVG document: ${file.name}`, 'success');
        } catch (err: any) {
          showToast(`Failed to parse OpenSVG: ${err?.message || err}`, 'error');
        }
      };
      input.click();
      setFileMenuOpen(false);
    } catch (err: any) {
      showToast(`Failed to open project: ${err?.message || err}`, 'error');
    }
  };

  const handleSaveProject = () => {
    const osvgStr = useStudioStore.getState().exportOpenSVGDocument();
    const blob = new Blob([osvgStr], { type: 'application/vnd.opensvg+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rootFrame.name.toLowerCase().replace(/\s+/g, '-')}.osvg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Saved OpenSVG document (.osvg)!', 'success');
    setFileMenuOpen(false);
  };

  const handleImportSvg = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.svg,image/svg+xml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const svgContent = ev.target?.result as string;
          if (svgContent) {
            try {
              const { nodes: imported } = importSvgString(svgContent);
              if (imported.length > 0) {
                for (const node of imported) {
                  addNode(node);
                }
                showToast(`Imported ${imported.length} vector elements!`);
              }
            } catch {
              showToast('Failed to parse SVG file', 'error');
            }
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
    setFileMenuOpen(false);
  };

  return (
    <header className="h-14 border-b border-gray-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 flex items-center justify-between z-30 select-none">
      {/* Left: Brand, File Ops & Tabs */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Brand Menu Trigger */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            title="OpenSVG Studio Menu"
            aria-label="OpenSVG Studio Menu"
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 hover:dark:bg-zinc-800 text-xs transition-colors font-medium text-gray-700 dark:text-zinc-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent font-bold">
              OpenSVG
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-zinc-500" />
          </button>

          {/* File Dropdown Menu */}
          {fileMenuOpen && (
            <div className="absolute top-11 left-0 w-52 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 p-1.5 flex flex-col gap-0.5 z-50 animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  createNewProject();
                  setFileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 hover:dark:bg-zinc-800 rounded-xl transition-colors text-left"
              >
                <FilePlus className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                New Project
              </button>
              <button
                type="button"
                onClick={handleOpenProject}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 hover:dark:bg-zinc-800 rounded-xl transition-colors text-left"
              >
                <FolderOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                Open (.osvg)
              </button>
              <button
                type="button"
                onClick={handleImportSvg}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 hover:dark:bg-zinc-800 rounded-xl transition-colors text-left"
              >
                <UploadCloud className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                Import SVG Asset...
              </button>
              <button
                type="button"
                onClick={handleSaveProject}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 hover:dark:bg-zinc-800 rounded-xl transition-colors text-left"
              >
                <Save className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                Save (.osvg)
              </button>
              <div className="h-[1px] bg-gray-100 dark:bg-zinc-800 my-0.5" />
              <button
                type="button"
                onClick={() => {
                  setExportOpen(true);
                  setFileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-blue-50 hover:dark:bg-blue-950/40 hover:text-blue-600 hover:dark:text-blue-400 rounded-xl transition-colors text-left"
              >
                <Download className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Export OpenSVG / SVG...
              </button>
            </div>
          )}
        </div>

        <div className="w-[1px] h-4 bg-gray-200 dark:bg-zinc-800 shrink-0 mx-0.5" />

        {/* Dynamic Artboard Tab Bar with Smooth Wheel-Scroll (Zero Scrollbar) */}
        <div
          role="tablist"
          aria-label="Document Artboard Tabs"
          onWheel={(e) => {
            e.currentTarget.scrollLeft += e.deltaY;
          }}
          className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5"
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTabId;
            const isEditing = editingTabId === tab.id;
            const isDragging = draggedTabIndex === index;
            const isOver = dragOverTabIndex === index;

            return (
              <div
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                tabIndex={0}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => switchTab(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (!isEditing) switchTab(tab.id);
                  } else if (e.key === 'F2') {
                    handleStartRename(tab.id, tab.title);
                  }
                }}
                onDoubleClick={(e) => handleStartRename(tab.id, tab.title, e)}
                onContextMenu={(e) => handleContextMenu(tab.id, e)}
                className={`group relative h-9 shrink-0 max-w-[155px] min-w-[100px] px-3 rounded-2xl flex items-center justify-between text-xs cursor-grab active:cursor-grabbing transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isDragging
                    ? 'opacity-40 scale-95 border-2 border-dashed border-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                    : isActive
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-300 dark:border-zinc-700 shadow-xs ring-1 ring-black/5 dark:ring-white/10 font-semibold z-10'
                    : 'bg-slate-100/80 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:bg-slate-200/70 hover:dark:bg-zinc-800 hover:text-slate-900 hover:dark:text-zinc-200 border border-slate-200/90 dark:border-zinc-700/80 hover:border-slate-300 hover:dark:border-zinc-600 font-medium'
                }`}
              >
                {/* Drop Insertion Bar Indicator */}
                {isOver && !isDragging && (
                  <div
                    className={`absolute top-1 bottom-1 w-1 bg-blue-600 rounded-full z-30 motion-safe:animate-pulse pointer-events-none ${
                      dropPosition === 'left' ? '-left-1' : '-right-1'
                    }`}
                  />
                )}

                {/* Tab Title / Inline Input */}
                <div className="flex items-center gap-1.5 truncate mr-1 flex-1 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                      isActive ? 'bg-blue-600 shadow-xs ring-2 ring-blue-100 dark:ring-blue-900/40' : 'bg-slate-300 dark:bg-zinc-600 group-hover:bg-slate-400 group-hover:dark:bg-zinc-500'
                    }`}
                  />
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleSaveRename(tab.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(tab.id);
                        if (e.key === 'Escape') setEditingTabId(null);
                      }}
                      className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs px-1.5 py-0.5 rounded-lg border border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/50 outline-none w-full font-medium"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate text-xs tracking-tight" title={`${tab.title} (Double-click to rename, Drag to reorder)`}>
                      {tab.title}
                    </span>
                  )}
                </div>

                {/* Tab Actions: Close */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    title="Close Tab (Ctrl+W)"
                    aria-label={`Close ${tab.title}`}
                    tabIndex={isActive ? 0 : -1}
                    aria-hidden={!isActive}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className={`p-1 rounded-lg hover:bg-red-50 hover:dark:bg-red-950/40 hover:text-red-500 hover:dark:text-red-400 transition-all outline-none ${
                      isActive ? 'text-slate-400 dark:text-zinc-500' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fixed New Tab Button (+) & Artboards Quick Switcher */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="New Artboard / Composition (Ctrl+T)"
            aria-label="New Artboard / Composition"
            onClick={() => openNewTab()}
            className="h-9 w-9 flex items-center justify-center rounded-2xl bg-white/80 dark:bg-zinc-800/80 hover:bg-white hover:dark:bg-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-blue-600 hover:dark:text-blue-400 border border-slate-200 dark:border-zinc-700 shadow-2xs hover:shadow-xs transition-all shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 font-semibold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* All Tabs Quick Switcher Dropdown (Shown when >= 3 tabs) */}
          {tabs.length >= 3 && (
            <div className="relative shrink-0">
              <button
                type="button"
                title={`View all ${tabs.length} open artboards`}
                aria-label={`View all ${tabs.length} open artboards`}
                onClick={() => setTabsDropdownOpen(!tabsDropdownOpen)}
                className="h-9 px-2 flex items-center justify-center gap-1 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200/80 hover:dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition-all text-xs font-semibold"
              >
                <span>{tabs.length}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
              </button>

              {tabsDropdownOpen && (
                <div
                  ref={tabsMenuRef}
                  className="absolute top-11 left-0 w-56 max-h-80 overflow-y-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 p-1.5 flex flex-col gap-0.5 z-50 animate-in fade-in zoom-in-95"
                >
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Open Artboards ({tabs.length})
                  </div>
                  {tabs.map((tab) => {
                    const isTabActive = tab.id === activeTabId;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          switchTab(tab.id);
                          setTabsDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl transition-colors text-left ${
                          isTabActive ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 hover:dark:bg-zinc-800 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${isTabActive ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-600'}`} />
                          <span className="truncate">{tab.title}</span>
                        </div>
                        {isTabActive && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center: Tool Group Floating Pill (PERMANENTLY DEAD-CENTERED) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-gray-100/90 dark:bg-zinc-800/90 rounded-full p-1 shadow-inner border border-gray-200/80 dark:border-zinc-700/80 z-30 pointer-events-auto">
        {tools.map((t) => {
          const isActive = selectedTool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              title={t.label}
              aria-label={t.label}
              onClick={() => setSelectedTool(t.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ${
                isActive
                  ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-400/30 font-bold'
                  : 'text-gray-600 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700 hover:text-gray-900 hover:dark:text-zinc-100'
              }`}
            >
              {t.icon}
            </button>
          );
        })}

        {/* Shapes Menu (Interactive Tool Selector & Quick Insert) */}
        <div className="relative">
          <button
            type="button"
            title="Shape Tools (R, O, S)"
            aria-label="Shape Tools"
            onClick={() => setShapesDropdownOpen(!shapesDropdownOpen)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ${
              shapesDropdownOpen || selectedTool === 'rect' || selectedTool === 'circle' || selectedTool === 'star'
                ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-400/30'
                : 'text-gray-600 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700 hover:text-gray-900 hover:dark:text-zinc-100'
            }`}
          >
            {selectedTool === 'circle' ? (
              <Circle className="w-3.5 h-3.5" />
            ) : selectedTool === 'star' ? (
              <Star className="w-3.5 h-3.5" />
            ) : selectedTool === 'rect' ? (
              <Square className="w-3.5 h-3.5" />
            ) : (
              <Shapes className="w-3.5 h-3.5" />
            )}
          </button>

          {shapesDropdownOpen && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 p-1.5 flex flex-col gap-1 min-w-[170px] z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                Select Shape Tool
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTool('rect');
                  setShapesDropdownOpen(false);
                  showToast('Rectangle Tool selected (drag on canvas to draw)');
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-colors text-left ${
                  selectedTool === 'rect'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 hover:dark:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Square className="w-3.5 h-3.5 text-purple-500" />
                  <span>Rectangle (R)</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">Drag</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTool('circle');
                  setShapesDropdownOpen(false);
                  showToast('Circle Tool selected (drag on canvas to draw)');
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-colors text-left ${
                  selectedTool === 'circle'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 hover:dark:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Circle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Circle / Oval (O)</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">Drag</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTool('star');
                  setShapesDropdownOpen(false);
                  showToast('Star Tool selected (drag on canvas to draw)');
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-colors text-left ${
                  selectedTool === 'star'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 hover:dark:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>Star (S)</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">Drag</span>
              </button>

              <div className="h-[1px] bg-gray-100 dark:bg-zinc-800 my-0.5" />

              <div className="px-2.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-zinc-500">
                Or Insert Instantly:
              </div>
              <div className="flex items-center gap-1 px-1">
                <button
                  type="button"
                  title="Insert Rectangle at Center"
                  onClick={() => handleAddShape('rect')}
                  className="flex-1 py-1 flex items-center justify-center bg-gray-50 dark:bg-zinc-800 hover:bg-purple-50 hover:dark:bg-purple-950/40 rounded-lg text-purple-600 dark:text-purple-400 transition-colors"
                >
                  <Square className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Insert Circle at Center"
                  onClick={() => handleAddShape('circle')}
                  className="flex-1 py-1 flex items-center justify-center bg-gray-50 dark:bg-zinc-800 hover:bg-emerald-50 hover:dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors"
                >
                  <Circle className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Insert Star at Center"
                  onClick={() => handleAddShape('star')}
                  className="flex-1 py-1 flex items-center justify-center bg-gray-50 dark:bg-zinc-800 hover:bg-amber-50 hover:dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400 transition-colors"
                >
                  <Star className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          title="Text Tool (T)"
          aria-label="Text Tool (T)"
          onClick={() => {
            setSelectedTool('text');
            showToast('Text Tool selected (click on canvas to place text)');
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ${
            selectedTool === 'text'
              ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-400/30'
              : 'text-gray-600 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700 hover:text-gray-900 hover:dark:text-zinc-100'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          title="Pivot Point Tool (Y)"
          aria-label="Pivot Point Tool (Y)"
          onClick={() => {
            setSelectedTool('pivot');
            showToast('Pivot Tool selected (drag crosshair to change pivot)');
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ${
            selectedTool === 'pivot'
              ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-400/30'
              : 'text-gray-600 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700 hover:text-gray-900 hover:dark:text-zinc-100'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-gray-300 dark:bg-zinc-700 mx-1" />

        <button
          type="button"
          title="Undo (Ctrl+Z)"
          aria-label="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={past.length === 0}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:text-gray-900 hover:dark:text-zinc-100 hover:bg-white hover:dark:bg-zinc-700 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          aria-label="Redo (Ctrl+Y)"
          onClick={redo}
          disabled={future.length === 0}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:text-gray-900 hover:dark:text-zinc-100 hover:bg-white hover:dark:bg-zinc-700 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-gray-300 dark:bg-zinc-700 mx-1" />

        <button
          type="button"
          title="Motion Presets & Transitions Library"
          aria-label="Motion Presets & Transitions"
          onClick={() => setPresetsModalOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-amber-500 dark:text-amber-400 hover:bg-amber-50 hover:dark:bg-amber-950/40 hover:text-amber-600 hover:dark:text-amber-300 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          title="Export Animation (Ctrl+E)"
          aria-label="Export Animation"
          onClick={() => setExportOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-zinc-400 hover:bg-blue-50 hover:dark:bg-blue-950/40 hover:text-blue-600 hover:dark:text-blue-400 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Project Settings"
          aria-label="Project Settings"
          onClick={() => setSettingsOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-zinc-400 hover:bg-white hover:dark:bg-zinc-700 hover:text-gray-900 hover:dark:text-zinc-100 transition-all"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Resolution Info, Theme Switcher & New Element */}
      <div className="flex items-center gap-2 shrink-0 z-10">
        <span className="text-xs font-mono bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-full border border-gray-200 dark:border-zinc-700 hidden xl:inline-block">
          {rootFrame.width} × {rootFrame.height} • {fps} FPS
        </span>

        {/* Workspace Layout Presets Dropdown */}
        <div className="relative">
          <button
            type="button"
            title="Switch Workspace Layout"
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border text-xs font-medium transition-all ${
              workspaceMenuOpen
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-2xs'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden md:inline capitalize">{workspace.activePreset} Layout</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {workspaceMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-50 flex flex-col gap-0.5 text-xs animate-in fade-in zoom-in-95"
              onMouseLeave={() => setWorkspaceMenuOpen(false)}
            >
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase">
                Workspace Presets
              </div>
              <button
                type="button"
                onClick={() => {
                  setWorkspacePreset('default');
                  setWorkspaceMenuOpen(false);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors text-left font-medium ${
                  workspace.activePreset === 'default'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'hover:bg-slate-100 hover:dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Default Studio</span>
                </div>
                {workspace.activePreset === 'default' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setWorkspacePreset('animation');
                  setWorkspaceMenuOpen(false);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors text-left font-medium ${
                  workspace.activePreset === 'animation'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'hover:bg-slate-100 hover:dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Animation Focus</span>
                </div>
                {workspace.activePreset === 'animation' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setWorkspacePreset('design');
                  setWorkspaceMenuOpen(false);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors text-left font-medium ${
                  workspace.activePreset === 'design'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'hover:bg-slate-100 hover:dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Design Focus</span>
                </div>
                {workspace.activePreset === 'design' && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="h-[1px] bg-slate-100 dark:bg-zinc-800 my-1" />

              <button
                type="button"
                onClick={() => {
                  resetWorkspace();
                  setWorkspaceMenuOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 hover:dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors text-left font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Workspace</span>
              </button>
            </div>
          )}
        </div>

        {/* Circular Reveal Theme Switcher Button with Dynamic Micro-Animation & Glow Hover */}
        <button
          type="button"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={(e) => toggleThemeWithAnimation(e)}
          className="group relative w-9 h-9 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 shadow-2xs hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:border-amber-400/50 hover:bg-amber-50/40 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/10 hover:shadow-amber-500/10 dark:hover:shadow-amber-400/20"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-all duration-300 ease-out group-hover:rotate-90 group-hover:scale-115 group-hover:text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 transition-all duration-300 ease-out group-hover:-rotate-20 group-hover:scale-115 group-hover:text-indigo-600 drop-shadow-[0_0_6px_rgba(99,102,241,0.4)]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleAddShape('rect')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> New Element
        </button>
      </div>

      {/* Tab Right-Click Context Menu Popup */}
      {contextMenu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Artboard options"
          style={{ top: contextMenu.y + 4, left: Math.min(contextMenu.x, window.innerWidth - 190) }}
          className="fixed bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-zinc-800 p-1.5 flex flex-col gap-0.5 z-50 min-w-[170px] text-xs text-slate-700 dark:text-zinc-300 animate-in fade-in zoom-in-95 select-none"
        >
          <button
            type="button"
            onClick={() => {
              const tab = tabs.find((t) => t.id === contextMenu.tabId);
              if (tab) handleStartRename(tab.id, tab.title);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 hover:dark:bg-zinc-800 transition-colors text-left font-medium"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            Rename Artboard
          </button>
          <button
            type="button"
            onClick={() => {
              duplicateTab(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 hover:dark:bg-zinc-800 transition-colors text-left font-medium"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            Duplicate Artboard
          </button>
          <div className="h-[1px] bg-slate-100 dark:bg-zinc-800 my-0.5" />
          <button
            type="button"
            onClick={() => {
              closeTab(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-red-50 hover:dark:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors text-left font-medium"
          >
            <X className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
            Close Artboard
          </button>
          <button
            type="button"
            onClick={() => {
              closeOtherTabs(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 hover:dark:bg-zinc-800 transition-colors text-left font-medium"
          >
            <ShieldClose className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            Close Other Artboards
          </button>
          <button
            type="button"
            onClick={() => {
              closeTabsToRight(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 hover:dark:bg-zinc-800 transition-colors text-left font-medium"
          >
            <ArrowRightToLine className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            Close Tabs to the Right
          </button>
        </div>
      )}
    </header>
  );
};
