import { useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { serializeProject } from '../engine/projectManager';

/**
 * Studio Global Keyboard Shortcuts Engine
 * Handles professional tool hotkeys, playback toggles, undo/redo, and file shortcuts
 */
export function useStudioShortcuts() {
  const {
    undo,
    redo,
    isPlaying,
    setPlaying,
    selectedId,
    deleteNode,
    duplicateSelected,
    groupSelected,
    ungroupSelected,
    setSelectedTool,
    setExportOpen,
    rootFrame,
    nodes,
    nodeOrder,
    duration,
    fps,
    tabs,
    activeTabId,
    openNewTab,
    closeTab,
    switchTab,
    showToast
  } = useStudioStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.isContentEditable;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 0. Browser Tab Shortcuts: Ctrl+T (New), Ctrl+W (Close), Ctrl+Tab (Switch), Ctrl+1..9 (Jump)
      if (isCtrlOrCmd && e.key.toLowerCase() === 't' && !e.shiftKey) {
        e.preventDefault();
        openNewTab();
        return;
      }

      if (isCtrlOrCmd && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        closeTab(activeTabId);
        return;
      }

      if (isCtrlOrCmd && e.key === 'Tab') {
        e.preventDefault();
        const currentIdx = tabs.findIndex((t) => t.id === activeTabId);
        if (currentIdx !== -1 && tabs.length > 1) {
          const nextIdx = e.shiftKey
            ? (currentIdx - 1 + tabs.length) % tabs.length
            : (currentIdx + 1) % tabs.length;
          switchTab(tabs[nextIdx].id);
        }
        return;
      }

      if (isCtrlOrCmd && /^[1-9]$/.test(e.key)) {
        const targetIdx = parseInt(e.key, 10) - 1;
        if (targetIdx < tabs.length) {
          e.preventDefault();
          switchTab(tabs[targetIdx].id);
          return;
        }
      }

      // 1. Undo: Ctrl+Z / Cmd+Z
      if (isCtrlOrCmd && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // 2. Redo: Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z
      if (isCtrlOrCmd && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
        return;
      }

      // 3. Duplicate: Ctrl+D
      if (isCtrlOrCmd && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // 4. Group: Ctrl+G / Ungroup: Ctrl+Shift+G
      if (isCtrlOrCmd && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelected();
        } else {
          groupSelected();
        }
        return;
      }

      // 4. Save: Ctrl+S
      if (isCtrlOrCmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
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
        return;
      }

      // 5. Export Modal: Ctrl+E
      if (isCtrlOrCmd && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setExportOpen(true);
        return;
      }

      // Skip single-key shortcuts when typing in an input
      if (isInput) return;

      // 6. Play / Pause: Space
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(!isPlaying);
        return;
      }

      // 7. Delete Selected: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && selectedId !== 'frame-1') {
          e.preventDefault();
          deleteNode(selectedId);
          showToast('Element deleted', 'info');
        }
        return;
      }

      // 8. Tool Switchers
      switch (e.key.toLowerCase()) {
        case 'v':
          setSelectedTool('select');
          break;
        case 'a':
          setSelectedTool('direct-select');
          break;
        case 'p':
          setSelectedTool('pen');
          break;
        case 'f':
          setSelectedTool('frame');
          break;
        case 'r':
          setSelectedTool('rect');
          break;
        case 'o':
          setSelectedTool('circle');
          break;
        case 's':
          if (!isCtrlOrCmd) setSelectedTool('star');
          break;
        case 't':
          if (!isCtrlOrCmd) setSelectedTool('text');
          break;
        case 'y':
          if (!isCtrlOrCmd) setSelectedTool('pivot');
          break;
        case 'h':
          setSelectedTool('hand');
          break;
        case 'z':
          if (!isCtrlOrCmd) setSelectedTool('zoom');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    isPlaying,
    setPlaying,
    selectedId,
    deleteNode,
    duplicateSelected,
    setSelectedTool,
    setExportOpen,
    rootFrame,
    nodes,
    nodeOrder,
    duration,
    fps,
    showToast
  ]);
}
