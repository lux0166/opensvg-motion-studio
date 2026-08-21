export type PanelId =
  | 'layers'
  | 'properties'
  | 'timeline'
  | 'graphEditor'
  | 'assets'
  | 'colorHarmony'
  | 'stateMachine';

export type SnapPosition = 'tab' | 'top' | 'bottom' | 'left' | 'right';

export interface DockContainer {
  id: string;
  panels: PanelId[];
  activePanelId: PanelId;
  sizePercent: number; // For vertical distribution within a column (e.g. 50% / 50%)
}

export interface WorkspaceLayoutState {
  leftWidth: number; // width in px (e.g. 260)
  rightWidth: number; // width in px (e.g. 288)
  bottomHeight: number; // height in px (e.g. 256)
  graphEditorWidth?: number; // width in px (e.g. 300)
  leftContainers: DockContainer[];
  rightContainers: DockContainer[];
  bottomContainers: DockContainer[];
  isLeftCollapsed: boolean;
  isRightCollapsed: boolean;
  isBottomCollapsed: boolean;
  activePreset: 'default' | 'animation' | 'design' | 'custom';
}

export interface PanelMeta {
  id: PanelId;
  title: string;
  iconName: string;
}

export interface ActiveDraggingState {
  panelId: PanelId;
  sourceContainerId: string;
  title: string;
  iconName: string;
  currentX: number;
  currentY: number;
}

export interface DragHoverTargetState {
  containerId: string;
  position: SnapPosition;
  rect: { left: number; top: number; width: number; height: number };
}

export const PANEL_CATALOG: Record<PanelId, PanelMeta> = {
  layers: { id: 'layers', title: 'Hierarchy & Layers', iconName: 'Layers' },
  properties: { id: 'properties', title: 'Inspector & Properties', iconName: 'Sliders' },
  timeline: { id: 'timeline', title: 'Timeline & Curves', iconName: 'Activity' },
  graphEditor: { id: 'graphEditor', title: 'Graph Editor', iconName: 'Activity' },
  assets: { id: 'assets', title: 'Media & Audio Assets', iconName: 'Music' },
  colorHarmony: { id: 'colorHarmony', title: 'Color Harmonies', iconName: 'Palette' },
  stateMachine: { id: 'stateMachine', title: 'State Machine & Triggers', iconName: 'Workflow' },
};

export const WORKSPACE_PRESETS: Record<'default' | 'animation' | 'design', WorkspaceLayoutState> = {
  default: {
    leftWidth: 260,
    rightWidth: 290,
    bottomHeight: 256,
    isLeftCollapsed: false,
    isRightCollapsed: false,
    isBottomCollapsed: false,
    activePreset: 'default',
    leftContainers: [
      { id: 'left-top', panels: ['layers'], activePanelId: 'layers', sizePercent: 100 }
    ],
    rightContainers: [
      { id: 'right-top', panels: ['properties', 'colorHarmony'], activePanelId: 'properties', sizePercent: 100 }
    ],
    bottomContainers: [
      { id: 'bottom-main', panels: ['timeline'], activePanelId: 'timeline', sizePercent: 100 }
    ]
  },
  animation: {
    leftWidth: 280,
    rightWidth: 320,
    bottomHeight: 290,
    isLeftCollapsed: false,
    isRightCollapsed: false,
    isBottomCollapsed: false,
    activePreset: 'animation',
    leftContainers: [
      { id: 'left-top', panels: ['layers'], activePanelId: 'layers', sizePercent: 60 },
      { id: 'left-bottom', panels: ['assets'], activePanelId: 'assets', sizePercent: 40 }
    ],
    rightContainers: [
      { id: 'right-top', panels: ['properties'], activePanelId: 'properties', sizePercent: 65 },
      { id: 'right-bottom', panels: ['colorHarmony'], activePanelId: 'colorHarmony', sizePercent: 35 }
    ],
    bottomContainers: [
      { id: 'bottom-main', panels: ['timeline'], activePanelId: 'timeline', sizePercent: 100 }
    ]
  },
  design: {
    leftWidth: 280,
    rightWidth: 300,
    bottomHeight: 180,
    isLeftCollapsed: false,
    isRightCollapsed: false,
    isBottomCollapsed: false,
    activePreset: 'design',
    leftContainers: [
      { id: 'left-top', panels: ['layers', 'assets'], activePanelId: 'layers', sizePercent: 55 },
      { id: 'left-bottom', panels: ['colorHarmony'], activePanelId: 'colorHarmony', sizePercent: 45 }
    ],
    rightContainers: [
      { id: 'right-top', panels: ['properties'], activePanelId: 'properties', sizePercent: 100 }
    ],
    bottomContainers: [
      { id: 'bottom-main', panels: ['timeline'], activePanelId: 'timeline', sizePercent: 100 }
    ]
  }
};
