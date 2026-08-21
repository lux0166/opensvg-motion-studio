import React, { useRef } from 'react';
import { DockContainer as IDockContainer, PANEL_CATALOG } from '../../engine/workspaceTypes';
import { useStudioStore } from '../../store/useStudioStore';
import { useWorkspaceDrag } from './useWorkspaceDrag';
import { GraphEditorPanel } from './GraphEditorPanel';
import { LayersPanel } from '../LayersPanel';
import { PropertiesPanel } from '../PropertiesPanel';
import { AssetsPanel } from './AssetsPanel';
import { ColorHarmonyPanel } from './ColorHarmonyPanel';
import { Timeline } from '../Timeline';
import { TimelinePlaybackControls, TimelineActionButtons } from './TimelineControls';
import { Layers, Sliders, Activity, Music, Palette, Workflow, GripVertical, X } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Layers: <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />,
  Sliders: <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />,
  Activity: <Activity className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />,
  Music: <Music className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />,
  Palette: <Palette className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />,
  Workflow: <Workflow className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />,
};

interface DockContainerProps {
  container: IDockContainer;
  className?: string;
  style?: React.CSSProperties;
}

export const DockContainer: React.FC<DockContainerProps> = ({
  container,
  className = '',
  style
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { toggleGraphEditor, setActivePanelInContainer } = useStudioStore();
  const { handleTabPointerDown } = useWorkspaceDrag();

  const renderActivePanel = () => {
    switch (container.activePanelId) {
      case 'layers':
        return <LayersPanel />;
      case 'properties':
        return <PropertiesPanel />;
      case 'assets':
        return <AssetsPanel />;
      case 'colorHarmony':
        return <ColorHarmonyPanel />;
      case 'timeline':
        return <Timeline />;
      case 'graphEditor':
        return <GraphEditorPanel />;
      default:
        return <div className="p-4 text-xs text-slate-400">Empty Panel</div>;
    }
  };

  return (
    <div
      ref={containerRef}
      data-container-id={container.id}
      style={style}
      className={`dock-container relative flex flex-col min-h-0 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs ${className}`}
    >
      {/* Single Unified Tab & Action Header Bar */}
      <div className="relative flex items-center justify-between px-2 py-1 bg-slate-50/90 dark:bg-zinc-800/80 border-b border-slate-200/80 dark:border-zinc-800 text-xs shrink-0 select-none min-h-[42px] gap-2">
        {/* Left: Tab List (or Action Buttons directly if standalone Timeline) */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 z-10">
          {(container.panels.length > 1 || container.activePanelId !== 'timeline') && (
            <div role="tablist" aria-label="Docked panel tabs" className="flex items-center gap-1 shrink-0">
              {container.panels.map((panelId) => {
                const meta = PANEL_CATALOG[panelId] || { id: panelId, title: panelId, iconName: 'Layers' };
                const isActive = container.activePanelId === panelId;

                return (
                  <button
                    key={panelId}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActivePanelInContainer(container.id, panelId)}
                    onPointerDown={(e) => handleTabPointerDown(panelId, container.id, e)}
                    className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-grab active:cursor-grabbing transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-none ${
                      isActive
                        ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                        : 'text-slate-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-700/50 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <GripVertical className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 text-slate-400 -mr-0.5" />
                    {ICON_MAP[meta.iconName] || <Layers className="w-3.5 h-3.5 text-blue-500" />}
                    <span className="truncate max-w-[130px]">{meta.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Left Action Buttons when Timeline is active (Stagger, Audio, Graph Editor, Marker, Keyframe) */}
          {container.activePanelId === 'timeline' && (
            <>
              {container.panels.length > 1 && (
                <div className="w-[1px] h-4 bg-slate-200 dark:bg-zinc-700 mx-0.5" />
              )}
              <TimelineActionButtons />
            </>
          )}
        </div>

        {/* Center: Mathematically Centered Playback Transport Controls (Skip, Step, Play/Pause, Loop, Time) */}
        {container.activePanelId === 'timeline' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
            <TimelinePlaybackControls />
          </div>
        )}

        {/* Right: Close button if standalone Graph Editor */}
        {container.activePanelId === 'graphEditor' && container.id === 'bottom-graph' ? (
          <button
            type="button"
            title="Close Graph Editor"
            aria-label="Close Graph Editor"
            onClick={toggleGraphEditor}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60 rounded-md transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ) : (
          <div className="shrink-0 w-2" />
        )}
      </div>

      {/* Panel Content Body */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {renderActivePanel()}
      </div>
    </div>
  );
};

