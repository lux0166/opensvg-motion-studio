import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { DockContainer } from './DockContainer';
import { Splitter } from './Splitter';
import { Canvas } from '../Canvas';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  GripVertical
} from 'lucide-react';

export const WorkspaceLayout: React.FC = () => {
  const {
    workspace,
    activeDraggingPanel,
    dragHoverTarget,
    isGraphEditorOpen,
    resizeWorkspaceColumn,
    resizeContainerInColumn,
    toggleWorkspaceCollapse
  } = useStudioStore();

  const {
    leftWidth,
    rightWidth,
    bottomHeight,
    leftContainers,
    rightContainers,
    bottomContainers,
    isLeftCollapsed,
    isRightCollapsed,
    isBottomCollapsed
  } = workspace;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative p-2 gap-1.5 select-none">
      {/* Top Main Workspace: Left Column + Canvas + Right Column */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative gap-1.5">
        {/* Left Column */}
        {!isLeftCollapsed && (
          <div
            style={{ width: `${leftWidth}px` }}
            className="flex flex-col h-full min-h-0 shrink-0 overflow-hidden relative"
          >
            {leftContainers.map((container, idx) => (
              <React.Fragment key={container.id}>
                <DockContainer
                  container={container}
                  style={{ flex: `${container.sizePercent ?? (100 / leftContainers.length)} 1 0%` }}
                  className="min-h-0"
                />
                {idx < leftContainers.length - 1 && (
                  <Splitter
                    direction="vertical"
                    onResize={(stepDelta) => resizeContainerInColumn('left', idx, stepDelta)}
                    className="my-1"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Left Splitter */}
        {!isLeftCollapsed && (
          <Splitter
            direction="horizontal"
            onResize={(delta) => resizeWorkspaceColumn('left', delta)}
          />
        )}

        {/* Left Collapse Toggle Pill */}
        <button
          type="button"
          onClick={() => toggleWorkspaceCollapse('left')}
          title={isLeftCollapsed ? 'Expand Left Sidebar' : 'Collapse Left Sidebar'}
          className="absolute top-1/2 left-0.5 -translate-y-1/2 z-40 py-2 px-0.5 bg-slate-200/80 dark:bg-zinc-800/80 hover:bg-white hover:dark:bg-zinc-700 rounded-r-md flex items-center text-[10px] text-slate-600 dark:text-zinc-400 transition-all shadow-xs"
        >
          {isLeftCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Center Canvas Area */}
        <div className="flex-1 min-w-0 h-full flex flex-col relative overflow-hidden bg-slate-100/60 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60">
          <Canvas />
        </div>

        {/* Right Splitter */}
        {!isRightCollapsed && (
          <Splitter
            direction="horizontal"
            onResize={(delta) => resizeWorkspaceColumn('right', delta)}
          />
        )}

        {/* Right Collapse Toggle Pill */}
        <button
          type="button"
          onClick={() => toggleWorkspaceCollapse('right')}
          title={isRightCollapsed ? 'Expand Inspector' : 'Collapse Inspector'}
          className="absolute top-1/2 right-0.5 -translate-y-1/2 z-40 py-2 px-0.5 bg-slate-200/80 dark:bg-zinc-800/80 hover:bg-white hover:dark:bg-zinc-700 rounded-l-md flex items-center text-[10px] text-slate-600 dark:text-zinc-400 transition-all shadow-xs"
        >
          {isRightCollapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* Right Column (Inspector / Color Harmonies / Assets) */}
        {!isRightCollapsed && (
          <div
            style={{ width: `${rightWidth}px` }}
            className="flex flex-col h-full min-h-0 shrink-0 overflow-hidden relative"
          >
            {rightContainers.map((container, idx) => (
              <React.Fragment key={container.id}>
                <DockContainer
                  container={container}
                  style={{ flex: `${container.sizePercent ?? (100 / rightContainers.length)} 1 0%` }}
                  className="min-h-0"
                />
                {idx < rightContainers.length - 1 && (
                  <Splitter
                    direction="vertical"
                    onResize={(stepDelta) => resizeContainerInColumn('right', idx, stepDelta)}
                    className="my-1"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Vertical Splitter */}
      {!isBottomCollapsed && (
        <Splitter
          direction="vertical"
          onResize={(delta) => resizeWorkspaceColumn('bottom', delta)}
        />
      )}

      {/* Bottom Row (Timeline & Independent Graph Editor Tile) */}
      {!isBottomCollapsed && (
        <div
          style={{ height: `${bottomHeight}px` }}
          className="w-full shrink-0 min-h-0 overflow-hidden relative flex gap-1.5"
        >
          {/* Main Timeline Floating Tile */}
          <div className="flex-1 min-w-0 h-full">
            <DockContainer
              container={bottomContainers[0] || { id: 'bottom-main', panels: ['timeline'], activePanelId: 'timeline', sizePercent: 100 }}
              className="w-full h-full"
            />
          </div>

          {/* Independent Graph Editor Floating Tile */}
          {isGraphEditorOpen && (
            <>
              <Splitter
                direction="horizontal"
                onResize={(delta) => resizeWorkspaceColumn('graphEditor', delta)}
              />
              <div
                style={{ width: `${workspace.graphEditorWidth || 320}px` }}
                className="shrink-0 h-full min-w-0"
              >
                <DockContainer
                  container={{
                    id: 'bottom-graph',
                    panels: ['graphEditor'],
                    activePanelId: 'graphEditor',
                    sizePercent: 100
                  }}
                  className="w-full h-full"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom Collapse Toggle Pill */}
      <button
        type="button"
        onClick={() => toggleWorkspaceCollapse('bottom')}
        title={isBottomCollapsed ? 'Expand Timeline' : 'Collapse Timeline'}
        className="absolute bottom-1 right-8 z-40 px-2 py-0.5 bg-slate-200/80 dark:bg-zinc-800/80 hover:bg-white hover:dark:bg-zinc-700 rounded-t-md flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-zinc-400 transition-all shadow-xs"
      >
        <span>Timeline</span>
        {isBottomCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Global Translucent Blue Snap Preview Overlay */}
      {dragHoverTarget && (
        <div
          style={{
            left: `${dragHoverTarget.rect.left}px`,
            top: `${dragHoverTarget.rect.top}px`,
            width: `${dragHoverTarget.rect.width}px`,
            height: `${dragHoverTarget.rect.height}px`
          }}
          className="fixed pointer-events-none z-[9990] p-1.5 transition-all duration-100"
        >
          <div className="relative w-full h-full">
            <div
              className={`absolute bg-blue-500/25 dark:bg-blue-600/35 border-2 border-blue-500 dark:border-blue-400 rounded-2xl shadow-xl transition-all duration-150 backdrop-blur-2xs ${
                dragHoverTarget.position === 'tab'
                  ? 'inset-0'
                  : dragHoverTarget.position === 'top'
                  ? 'inset-x-0 top-0 h-[48%]'
                  : dragHoverTarget.position === 'bottom'
                  ? 'inset-x-0 bottom-0 h-[48%]'
                  : dragHoverTarget.position === 'left'
                  ? 'inset-y-0 left-0 w-[48%]'
                  : 'inset-y-0 right-0 w-[48%]'
              }`}
            />

            {/* Centered Docking Compass Indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-slate-900/90 border border-white/20 rounded-2xl p-2.5 shadow-2xl flex flex-col items-center gap-1 text-white animate-in zoom-in-95">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                  {dragHoverTarget.position === 'top' && <ArrowUp className="w-4 h-4" />}
                  {dragHoverTarget.position === 'bottom' && <ArrowDown className="w-4 h-4" />}
                  {dragHoverTarget.position === 'left' && <ArrowLeft className="w-4 h-4" />}
                  {dragHoverTarget.position === 'right' && <ArrowRight className="w-4 h-4" />}
                  {dragHoverTarget.position === 'tab' && <Layers className="w-4 h-4" />}
                  <span className="capitalize">Dock as {dragHoverTarget.position}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Drag Ghost Badge following cursor */}
      {activeDraggingPanel && (
        <div
          style={{
            left: `${activeDraggingPanel.currentX + 12}px`,
            top: `${activeDraggingPanel.currentY + 12}px`
          }}
          className="fixed z-[9999] pointer-events-none bg-slate-900/95 text-white backdrop-blur-md px-3 py-2 rounded-xl border border-blue-400/80 shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in zoom-in-95 select-none"
        >
          <GripVertical className="w-3.5 h-3.5 text-blue-400" />
          <span>{activeDraggingPanel.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 font-mono">
            Dragging
          </span>
        </div>
      )}
    </div>
  );
};

