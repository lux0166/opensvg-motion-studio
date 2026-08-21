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
        case 't':
        case 'a':
          setSelectedTool('direct-select');
          break;
        case 'p':
          setSelectedTool('pen');
          break;
        case 'f':
          setSelectedTool('frame');
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
