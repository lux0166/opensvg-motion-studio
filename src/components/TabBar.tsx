import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { Plus, X, Film, Copy } from 'lucide-react';

export const TabBar: React.FC = () => {
  const {
    tabs,
    activeTabId,
    openNewTab,
    closeTab,
    switchTab,
    renameTab,
    duplicateTab
  } = useStudioStore();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  const handleStartRename = (tabId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabId(tabId);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (tabId: string) => {
    if (editingTitle.trim()) {
      renameTab(tabId, editingTitle.trim());
    }
    setEditingTabId(null);
  };

  return (
    <div className="h-10 bg-[#121316] border-b border-[#26282e] flex items-center justify-between px-3 select-none shrink-0 z-30">
      {/* Left: Window Controls & Studio Brand */}
      <div className="flex items-center gap-3 shrink-0 mr-2">
        {/* Mac OS Window Traffic Dots */}
        <div className="flex items-center gap-1.5 px-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] hover:opacity-80 cursor-pointer shadow-2xs" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] hover:opacity-80 cursor-pointer shadow-2xs" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] hover:opacity-80 cursor-pointer shadow-2xs" />
        </div>

        {/* Studio Brand Icon */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#26282e]">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xs">
            <Film className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-bold tracking-wide text-gray-300 font-mono hidden sm:inline">
            OPENSVG
          </span>
        </div>
      </div>

      {/* Center: Tabs Strip */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar h-full pt-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isEditing = editingTabId === tab.id;

          return (
            <div
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              onDoubleClick={(e) => handleStartRename(tab.id, tab.title, e)}
              className={`group relative h-9 max-w-[200px] min-w-[120px] px-3 rounded-t-lg flex items-center justify-between text-xs font-medium cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#202227] text-white border-t border-x border-[#2e313a] shadow-xs'
                  : 'bg-[#16171b] text-gray-400 hover:bg-[#1a1b20] hover:text-gray-200'
              }`}
            >
              {/* Tab Title / Inline Input */}
              <div className="flex items-center gap-1.5 truncate mr-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isActive ? 'bg-indigo-400 animate-pulse' : 'bg-gray-500'
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
                    className="bg-[#121316] text-white text-xs px-1 py-0.5 rounded outline-none border border-indigo-500 w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate text-[11px] font-semibold tracking-tight" title={tab.title}>
                    {tab.title}
                  </span>
                )}
              </div>

              {/* Action Buttons: Duplicate & Close */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  title="Duplicate Tab"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#2c2e35] text-gray-400 hover:text-gray-200 transition-opacity"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>

                <button
                  title="Close Tab (Ctrl+W)"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className={`p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors ${
                    isActive ? 'text-gray-400' : 'opacity-0 group-hover:opacity-100 text-gray-500'
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
          title="New Document Tab (Ctrl+T)"
          onClick={() => openNewTab()}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#202227] transition-colors ml-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Studio Status Indicator */}
      <div className="flex items-center gap-2 pl-2 text-[10px] font-mono text-gray-500 shrink-0">
        <span className="bg-[#1a1b20] px-2 py-0.5 rounded text-gray-400 border border-[#26282e]">
          {tabs.length} {tabs.length === 1 ? 'Tab' : 'Tabs'}
        </span>
      </div>
    </div>
  );
};
