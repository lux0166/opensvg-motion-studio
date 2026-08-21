import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { Plus, X, Copy, Edit2, Layers, ShieldClose, ArrowRightToLine } from 'lucide-react';

interface ContextMenuState {
  tabId: string;
  x: number;
  y: number;
}

export const TabBar: React.FC = () => {
  const {
    tabs,
    activeTabId,
    rootFrame,
    fps,
    openNewTab,
    closeTab,
    switchTab,
    renameTab,
    duplicateTab,
    closeOtherTabs,
    closeTabsToRight
  } = useStudioStore();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  // Click outside to dismiss context menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setEditingTabId(null);
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

  return (
    <div className="h-10 bg-slate-100/90 backdrop-blur-sm border-b border-slate-200/80 flex items-center justify-between px-3 select-none shrink-0 z-30">
      {/* Left: Studio Brand & Icon */}
      <div className="flex items-center gap-1.5 shrink-0 mr-2 px-1">
        <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-2xs">
          <Layers className="w-3 h-3 text-blue-600" />
        </div>
        <span className="text-[11px] font-bold tracking-tight text-slate-700 font-sans hidden sm:inline">
          Artboards
        </span>
      </div>

      {/* Center: Tabs Strip */}
      <div
        role="tablist"
        aria-label="Document Artboard Tabs"
        className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar h-full py-1"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isEditing = editingTabId === tab.id;

          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
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
              className={`group relative h-8 max-w-[200px] min-w-[120px] px-2.5 rounded-lg flex items-center justify-between text-xs font-medium cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 font-semibold'
                  : 'bg-transparent text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 border border-transparent'
              }`}
            >
              {/* Tab Title / Inline Input */}
              <div className="flex items-center gap-1.5 truncate mr-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isActive ? 'bg-blue-500 shadow-xs' : 'bg-slate-300 group-hover:bg-slate-400'
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
                    className="bg-white text-slate-900 text-xs px-1.5 py-0.5 rounded border border-blue-500 ring-2 ring-blue-100 outline-none w-full font-medium shadow-inner"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate text-[11px]" title={`${tab.title} (Double-click to rename)`}>
                    {tab.title}
                  </span>
                )}
              </div>

              {/* Action Buttons: Duplicate & Close */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  title="Duplicate Artboard"
                  aria-label={`Duplicate ${tab.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  <Copy className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  title="Close Tab (Ctrl+W)"
                  aria-label={`Close ${tab.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className={`p-1 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-red-500 ${
                    isActive ? 'text-slate-400' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 text-slate-400'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* New Tab Button (+) */}
        <button
          type="button"
          title="New Artboard / Composition (Ctrl+T)"
          aria-label="New Artboard / Composition"
          onClick={() => openNewTab()}
          className="h-7 px-2.5 flex items-center gap-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white hover:shadow-2xs border border-transparent hover:border-slate-200/80 transition-all ml-0.5 shrink-0 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-xs hidden md:inline">New</span>
        </button>
      </div>

      {/* Right: Studio Status & Active Resolution */}
      <div className="flex items-center gap-2 pl-2 text-xs font-mono text-slate-500 shrink-0">
        <span className="bg-white/80 px-2.5 py-0.5 rounded-md text-slate-600 border border-slate-200/80 shadow-2xs hidden lg:inline text-xs">
          {rootFrame.width} × {rootFrame.height} • {fps} FPS
        </span>
        <span className="bg-white/80 px-2.5 py-0.5 rounded-md text-slate-600 border border-slate-200/80 shadow-2xs text-xs">
          {tabs.length} {tabs.length === 1 ? 'Artboard' : 'Artboards'}
        </span>
      </div>

      {/* Context Menu Popup */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y + 4, left: Math.min(contextMenu.x, window.innerWidth - 190) }}
          className="fixed bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-1.5 flex flex-col gap-0.5 z-50 min-w-[170px] text-xs text-slate-700 animate-in fade-in zoom-in-95 select-none"
        >
          <button
            onClick={() => {
              const tab = tabs.find((t) => t.id === contextMenu.tabId);
              if (tab) handleStartRename(tab.id, tab.title);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left font-medium"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            Rename Artboard
          </button>
          <button
            onClick={() => {
              duplicateTab(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left font-medium"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            Duplicate Artboard
          </button>
          <div className="h-[1px] bg-slate-100 my-0.5" />
          <button
            onClick={() => {
              closeTab(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-left font-medium"
          >
            <X className="w-3.5 h-3.5 text-red-500" />
            Close Artboard
          </button>
          <button
            onClick={() => {
              closeOtherTabs(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left font-medium"
          >
            <ShieldClose className="w-3.5 h-3.5 text-slate-500" />
            Close Other Artboards
          </button>
          <button
            onClick={() => {
              closeTabsToRight(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left font-medium"
          >
            <ArrowRightToLine className="w-3.5 h-3.5 text-slate-500" />
            Close Tabs to the Right
          </button>
        </div>
      )}
    </div>
  );
};
