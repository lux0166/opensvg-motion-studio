import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { FrameNode, SceneNode, SceneProject, ToolMode, TimelineMode, BezierPoint, CubicBezierCurve, AudioTrackConfig, TimelineMarker, DocumentTab } from '../engine/types';
import { SnapLine } from '../engine/snapping';
import { StudioSnapshot, createStudioSnapshot, MAX_HISTORY_STEPS } from '../engine/history';
import { BooleanOpType, executeBooleanOperation } from '../engine/booleanOps';
import { detectSyntheticBeats } from '../engine/audioEngine';
import { applyMotionPresetToNode, PresetOptions } from '../engine/motionPresets';
import { scaleKeyframes, reverseKeyframes, createKeyframeClipboard, pasteKeyframesToNode, KeyframeClipboard } from '../engine/timelineOps';
import { WorkspaceLayoutState, WORKSPACE_PRESETS, PanelId, SnapPosition, DockContainer, ActiveDraggingState, DragHoverTargetState } from '../engine/workspaceTypes';
import { DocumentInteraction } from '../engine/interaction/interactionModel';
import { StateMachineDefinition } from '../engine/stateMachine/runtimeStateMachine';
import { OpenSVGDocument, AssetManifestEntry } from '../engine/format/nativeDocument';
import { serializeDocument, parseDocument } from '../engine/format/documentParser';
import { Constraint } from '../engine/constraints/constraintSolver';
import { DataBinding } from '../engine/binding/dataBinding';
import { ComponentDefinition, ComponentInstance } from '../engine/components/componentSystem';
import { studioSessionManager } from '../engine/studio/studioRuntimeOwner';

function pushDraftSnapshot(state: any) {
  const snap = createStudioSnapshot(state.rootFrame, state.nodes, state.nodeOrder, {
    stateMachines: state.stateMachines,
    interactions: state.interactions,
    constraints: state.constraints,
    bindings: state.bindings,
    components: state.components,
    componentInstances: state.componentInstances,
    assets: state.assets
  });
  state.past.push(snap);
  if (state.past.length > MAX_HISTORY_STEPS) {
    state.past.shift();
  }
  state.future = [];

  const tab = state.tabs?.find((t: any) => t.id === state.activeTabId);
  if (tab) {
    tab.isDirty = true;
  }
}

export function createDefaultTab(id = `tab-${Date.now()}`, title = 'Untitled Project'): DocumentTab {
  const rootFrame: FrameNode = {
    id: 'frame-1',
    name: title,
    type: 'frame',
    visible: true,
    locked: false,
    clipContent: true,
    canvasBg: '#18191d',
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 0,
    fill: '#ffffff',
    tracks: []
  };

  return {
    id,
    title,
    isDirty: false,
    createdAt: Date.now(),
    project: {
      id: `proj-${id}`,
      name: title,
      version: '2.0.0',
      duration: 3.0,
      fps: 60,
      rootFrame,
      nodes: {},
      nodeOrder: []
    },
    history: {
      past: [],
      future: []
    },
    viewport: {
      zoom: 1.0,
      panX: 0,
      panY: 0,
      currentTime: 0,
      selectedId: 'frame-1',
      selectedIds: ['frame-1']
    },
    audioTrack: null,
    markers: []
  };
}

function syncCurrentTabState(state: any) {
  const currentTab = state.tabs.find((t: any) => t.id === state.activeTabId);
  if (currentTab) {
    currentTab.title = state.rootFrame.name || currentTab.title;
    currentTab.project = {
      id: currentTab.project?.id || `proj-${currentTab.id}`,
      name: state.rootFrame.name || currentTab.title,
      version: '1.0.0',
      duration: state.duration,
      fps: state.fps,
      rootFrame: state.rootFrame,
      nodes: state.nodes,
      nodeOrder: state.nodeOrder
    };
    currentTab.history = {
      past: [...state.past],
      future: [...state.future]
    };
    currentTab.viewport = {
      zoom: state.zoom,
      panX: state.panX,
      panY: state.panY,
      currentTime: state.currentTime,
      selectedId: state.selectedId,
      selectedIds: [...state.selectedIds]
    };
    currentTab.audioTrack = state.audioTrack;
    currentTab.markers = [...state.markers];
  }
}

function loadTabState(state: any, targetTab: DocumentTab) {
  state.activeTabId = targetTab.id;
  state.rootFrame = targetTab.project.rootFrame;
  state.nodes = targetTab.project.nodes;
  state.nodeOrder = targetTab.project.nodeOrder;
  state.duration = targetTab.project.duration;
  state.fps = targetTab.project.fps;
  state.past = targetTab.history.past ? [...targetTab.history.past] : [];
  state.future = targetTab.history.future ? [...targetTab.history.future] : [];
  state.zoom = targetTab.viewport.zoom ?? 0.56;
  state.panX = targetTab.viewport.panX ?? 0;
  state.panY = targetTab.viewport.panY ?? 0;
  state.currentTime = targetTab.viewport.currentTime ?? 0;
  state.selectedId = targetTab.viewport.selectedId ?? null;
  state.selectedIds = targetTab.viewport.selectedIds ? [...targetTab.viewport.selectedIds] : [];
  state.audioTrack = targetTab.audioTrack;
  state.markers = targetTab.markers ? [...targetTab.markers] : [];
  state.isPlaying = false;
}

interface StudioState {
  // Playback & Recording
  isPlaying: boolean;
  isAutoKeyframe: boolean;
  currentTime: number;
  duration: number;
  fps: number;
  loop: boolean;
  timelineMode: TimelineMode; // 'dopesheet' | 'graph'

  // Viewport
  zoom: number; // 0.25 to 2.5
  panX: number;
  panY: number;

  // Tools & Selection
  selectedTool: ToolMode;
  selectedId: string | null;
  selectedIds: string[];
  selectedKeyframeIds: string[];
  selectedPointIndex: number | null;
  selectedTrackId: string | null;
  expandedNodeIds: Record<string, boolean>;

  // Snapping
  activeSnapLines: SnapLine[];

  // History Time-travel
  past: StudioSnapshot[];
  future: StudioSnapshot[];

  // Scene Graph
  rootFrame: FrameNode;
  nodes: Record<string, SceneNode>;
  nodeOrder: string[]; // Z-index order

  // Modals
  isExportOpen: boolean;
  isSettingsOpen: boolean;
  isGraphEditorOpen: boolean;
  toastMessage: string | null;
  toastType: 'success' | 'info' | 'error';

  // Actions
  setPlaying: (playing: boolean) => void;
  toggleAutoKeyframe: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setFps: (fps: number) => void;
  setLoop: (loop: boolean) => void;
  toggleGraphEditor: () => void;
  setTimelineMode: (mode: TimelineMode) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setSelectedTool: (tool: ToolMode) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectId: (id: string, isShift: boolean) => void;
  setSelectedPointIndex: (index: number | null) => void;
  setSelectedTrackId: (trackId: string | null) => void;
  setActiveSnapLines: (lines: SnapLine[]) => void;
  toggleNodeExpand: (id: string) => void;

  // History Actions
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  // Project Management
  loadProject: (project: SceneProject) => void;
  createNewProject: () => void;

  // Multi-select & Grouping & Boolean Operations
  groupSelected: () => void;
  ungroupSelected: () => void;
  applyBooleanOp: (op: BooleanOpType) => void;

  // Alignments & Duplicate
  alignSelected: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  duplicateSelected: () => void;

  // Scene manipulation
  updateRootFrame: (updates: Partial<FrameNode>) => void;
  updateNode: (id: string, updates: Partial<SceneNode>, recordHistory?: boolean) => void;
  addNode: (node: SceneNode) => void;
  deleteNode: (id: string) => void;
  reorderNode: (sourceIndex: number, targetIndex: number) => void;

  // Vector Path manipulation
  addPathPoint: (nodeId: string, point: BezierPoint) => void;
  updatePathPoint: (nodeId: string, index: number, updates: Partial<BezierPoint>) => void;

  // Keyframes & Time Transformations (Task 2.2 & 2.5)
  keyframeClipboard: KeyframeClipboard | null;
  setSelectedKeyframeIds: (ids: string[]) => void;
  toggleKeyframeSelection: (kfId: string, isShift: boolean) => void;
  staggerSelectedKeyframes: (offsetStep?: number) => void;
  scaleSelectedKeyframes: (factor: number) => void;
  reverseSelectedKeyframes: () => void;
  copySelectedKeyframes: () => void;
  pasteKeyframes: () => void;
  addOrUpdateKeyframe: (nodeId: string, property: string, time: number, value: any) => void;
  removeKeyframe: (nodeId: string, property: string, keyframeId: string) => void;
  updateKeyframeTime: (nodeId: string, property: string, keyframeId: string, newTime: number) => void;
  updateKeyframeCurve: (nodeId: string, property: string, keyframeId: string, curve: CubicBezierCurve) => void;

  // Audio Track & Sync
  audioTrack: AudioTrackConfig | null;
  setAudioTrack: (track: AudioTrackConfig | null) => void;
  updateAudioTrack: (updates: Partial<AudioTrackConfig>) => void;

  // Timeline Markers & Beat Detection
  markers: TimelineMarker[];
  addMarker: (time: number, label?: string, color?: string) => void;
  removeMarker: (id: string) => void;
  generateMarkersFromAudioBeats: () => void;

  // Browser Tabs Management
  tabs: DocumentTab[];
  activeTabId: string;
  openNewTab: (title?: string, project?: SceneProject) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  renameTab: (tabId: string, newTitle: string) => void;
  duplicateTab: (tabId: string) => void;
  reorderTabs: (sourceIndex: number, destinationIndex: number) => void;
  closeOtherTabs: (tabId: string) => void;
  closeTabsToRight: (tabId: string) => void;

  // Motion Presets & Transitions Engine
  isPresetsModalOpen: boolean;
  setPresetsModalOpen: (open: boolean) => void;
  applyMotionPreset: (nodeId: string, presetId: string, options?: Partial<PresetOptions>) => void;
  applyMotionPresetToSelection: (presetId: string, options?: Partial<PresetOptions>) => void;

  // Flexible Workspace & Dockable Panels Engine
  workspace: WorkspaceLayoutState;
  activeDraggingPanel: ActiveDraggingState | null;
  dragHoverTarget: DragHoverTargetState | null;
  movePanel: (sourceContainerId: string, targetContainerId: string, position: SnapPosition, panelId: PanelId) => void;
  setActivePanelInContainer: (containerId: string, panelId: PanelId) => void;
  resizeWorkspaceColumn: (column: 'left' | 'right' | 'bottom' | 'graphEditor', deltaPx: number) => void;
  resizeContainerInColumn: (column: 'left' | 'right', index: number, stepDeltaPx: number) => void;
  toggleWorkspaceCollapse: (column: 'left' | 'right' | 'bottom') => void;
  setWorkspacePreset: (preset: 'default' | 'animation' | 'design') => void;
  resetWorkspace: () => void;
  setDraggingPanel: (drag: ActiveDraggingState | null) => void;
  setDragHoverTarget: (target: DragHoverTargetState | null) => void;

  // Document-Defined Interactions & State Machines (P0 Strategic Foundation)
  interactions: DocumentInteraction[];
  addInteraction: (interaction: DocumentInteraction) => void;
  updateInteraction: (id: string, updates: Partial<DocumentInteraction>) => void;
  removeInteraction: (id: string) => void;
  setInteractions: (interactions: DocumentInteraction[]) => void;

  stateMachines: StateMachineDefinition[];
  addStateMachine: (sm: StateMachineDefinition) => void;
  updateStateMachine: (id: string, updates: Partial<StateMachineDefinition>) => void;
  removeStateMachine: (id: string) => void;
  setStateMachines: (sms: StateMachineDefinition[]) => void;

  constraints: Constraint[];
  setConstraints: (constraints: Constraint[]) => void;

  bindings: DataBinding[];
  setBindings: (bindings: DataBinding[]) => void;

  components: ComponentDefinition[];
  setComponents: (components: ComponentDefinition[]) => void;

  componentInstances: ComponentInstance[];
  setComponentInstances: (instances: ComponentInstance[]) => void;

  assets: Record<string, AssetManifestEntry>;
  setAssets: (assets: Record<string, AssetManifestEntry>) => void;

  // Native OpenSVG Document Serialization & Deserialization
  exportOpenSVGDocument: () => string;
  loadOpenSVGDocument: (osvgOrDoc: string | OpenSVGDocument) => void;

  // Modals & Feedback
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  setExportOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const initialTab1 = createDefaultTab('tab-1', 'Frame 1');
const initialTab2 = createDefaultTab('tab-2', 'Composition 2');

export const useStudioStore = create<StudioState>()(
  immer((set, get) => ({
    theme: (typeof window !== 'undefined' && localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    setTheme: (theme) => set({ theme }),

    tabs: [initialTab1, initialTab2],
    activeTabId: initialTab1.id,

    isPlaying: false,
    isAutoKeyframe: false,
    currentTime: 1.05,
    duration: 3.0,
    fps: 60,
    loop: true,
    timelineMode: 'dopesheet',

    zoom: 0.56,
    panX: 0,
    panY: 0,

    selectedTool: 'select',
    selectedId: 'card',
    selectedIds: ['card'],
    selectedKeyframeIds: [],
    keyframeClipboard: null,
    selectedPointIndex: null,
    selectedTrackId: 'tr-rot',
    expandedNodeIds: { 'frame-1': true, card: true, ball: true },

    activeSnapLines: [],

    past: [],
    future: [],

    rootFrame: {
      id: 'frame-1',
      name: 'Frame 1',
      type: 'frame',
      visible: true,
      locked: false,
      clipContent: true,
      canvasBg: '#f1f2f5',
      x: 0,
      y: 0,
      width: 600,
      height: 400,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: '#ffffff',
      tracks: []
    },

    nodes: {},
    nodeOrder: [],
    audioTrack: null,
    markers: [],

    isExportOpen: false,
    isSettingsOpen: false,
    isGraphEditorOpen: true,
    toastMessage: null,
    toastType: 'info',

    interactions: [],
    stateMachines: [],
    constraints: [],
    bindings: [],
    components: [],
    componentInstances: [],
    assets: {},

    setConstraints: (constraints) => set({ constraints }),
    setBindings: (bindings) => set({ bindings }),
    setComponents: (components) => set({ components }),
    setComponentInstances: (componentInstances) => set({ componentInstances }),
    setAssets: (assets) => set({ assets }),

    // History implementation
    pushSnapshot: () =>
      set((state) => {
        pushDraftSnapshot(state);
      }),

    undo: () =>
      set((state) => {
        if (state.past.length === 0) return;
        const current = createStudioSnapshot(state.rootFrame, state.nodes, state.nodeOrder, {
          stateMachines: state.stateMachines,
          interactions: state.interactions,
          constraints: state.constraints,
          bindings: state.bindings,
          components: state.components,
          componentInstances: state.componentInstances,
          assets: state.assets
        });
        state.future.push(current);

        const previous = state.past.pop()!;
        state.rootFrame = previous.rootFrame;
        state.nodes = previous.nodes;
        state.nodeOrder = previous.nodeOrder;
        if (previous.stateMachines !== undefined) state.stateMachines = previous.stateMachines;
        if (previous.interactions !== undefined) state.interactions = previous.interactions;
        if (previous.constraints !== undefined) state.constraints = previous.constraints;
        if (previous.bindings !== undefined) state.bindings = previous.bindings;
        if (previous.components !== undefined) state.components = previous.components;
        if (previous.componentInstances !== undefined) state.componentInstances = previous.componentInstances;
        if (previous.assets !== undefined) state.assets = previous.assets;

        // Keep selection valid (fallback if current selected node was deleted in previous state)
        if (state.selectedId && !state.nodes[state.selectedId] && state.selectedId !== 'frame-1') {
          state.selectedId = state.nodeOrder[0] || 'frame-1';
          state.selectedIds = state.nodeOrder[0] ? [state.nodeOrder[0]] : [];
        }

        const tab = state.tabs?.find((t: any) => t.id === state.activeTabId);
        if (tab) {
          const savedIdx = tab.savedSnapshotIndex ?? 0;
          tab.isDirty = state.past.length !== savedIdx;
        }

        state.toastMessage = 'Undo';
        state.toastType = 'info';
      }),

    redo: () =>
      set((state) => {
        if (state.future.length === 0) return;
        const current = createStudioSnapshot(state.rootFrame, state.nodes, state.nodeOrder, {
          stateMachines: state.stateMachines,
          interactions: state.interactions,
          constraints: state.constraints,
          bindings: state.bindings,
          components: state.components,
          componentInstances: state.componentInstances,
          assets: state.assets
        });
        state.past.push(current);

        const next = state.future.pop()!;
        state.rootFrame = next.rootFrame;
        state.nodes = next.nodes;
        state.nodeOrder = next.nodeOrder;
        if (next.stateMachines !== undefined) state.stateMachines = next.stateMachines;
        if (next.interactions !== undefined) state.interactions = next.interactions;
        if (next.constraints !== undefined) state.constraints = next.constraints;
        if (next.bindings !== undefined) state.bindings = next.bindings;
        if (next.components !== undefined) state.components = next.components;
        if (next.componentInstances !== undefined) state.componentInstances = next.componentInstances;
        if (next.assets !== undefined) state.assets = next.assets;

        // Keep selection valid
        if (state.selectedId && !state.nodes[state.selectedId] && state.selectedId !== 'frame-1') {
          state.selectedId = state.nodeOrder[0] || 'frame-1';
          state.selectedIds = state.nodeOrder[0] ? [state.nodeOrder[0]] : [];
        }

        const tab = state.tabs?.find((t: any) => t.id === state.activeTabId);
        if (tab) {
          const savedIdx = tab.savedSnapshotIndex ?? 0;
          tab.isDirty = state.past.length !== savedIdx;
        }

        state.toastMessage = 'Redo';
        state.toastType = 'info';
      }),

    // Action implementations
    setPlaying: (playing) => set({ isPlaying: playing }),
    toggleAutoKeyframe: () =>
      set((state) => {
        state.isAutoKeyframe = !state.isAutoKeyframe;
        state.toastMessage = state.isAutoKeyframe ? 'Auto-Keyframing Record ON' : 'Auto-Keyframing OFF';
        state.toastType = state.isAutoKeyframe ? 'success' : 'info';
      }),
    setCurrentTime: (time) => set({ currentTime: Math.max(0, Math.min(get().duration, time)) }),
    setDuration: (duration) => set({ duration: Math.max(1, duration) }),
    setFps: (fps) => set({ fps: Math.max(1, Math.min(240, fps)) }),
    setLoop: (loop) => set({ loop }),
    toggleGraphEditor: () => set((state) => ({ isGraphEditorOpen: !state.isGraphEditorOpen })),
    setTimelineMode: (mode) => set({ timelineMode: mode }),
    setZoom: (zoom) => set({ zoom: Math.max(0.15, Math.min(3.0, zoom)) }),
    setPan: (panX, panY) => set({ panX, panY }),
    setSelectedTool: (tool) => set({ selectedTool: tool }),
    setSelectedId: (id) =>
      set((state) => {
        state.selectedId = id;
        state.selectedIds = id ? [id] : [];
        state.selectedPointIndex = null;
        if (id && state.nodes[id] && state.nodes[id].tracks?.length > 0) {
          state.selectedTrackId = state.nodes[id].tracks[0].id;
        }
      }),
    setSelectedIds: (ids) =>
      set((state) => {
        state.selectedIds = ids;
        state.selectedId = ids.length > 0 ? ids[0] : null;
        state.selectedPointIndex = null;
      }),
    toggleSelectId: (id, isShift) =>
      set((state) => {
        if (isShift) {
          if (state.selectedIds.includes(id)) {
            state.selectedIds = state.selectedIds.filter((item) => item !== id);
            state.selectedId = state.selectedIds.length > 0 ? state.selectedIds[0] : null;
          } else {
            state.selectedIds.push(id);
            state.selectedId = id;
          }
        } else {
          state.selectedId = id;
          state.selectedIds = [id];
        }
      }),
    setSelectedPointIndex: (index) => set({ selectedPointIndex: index }),
    setSelectedTrackId: (trackId) => set({ selectedTrackId: trackId }),
    setActiveSnapLines: (lines) => set({ activeSnapLines: lines }),
    toggleNodeExpand: (id) =>
      set((state) => {
        state.expandedNodeIds[id] = !state.expandedNodeIds[id];
      }),

    loadProject: (project) =>
      set((state) => {
        pushDraftSnapshot(state);
        state.rootFrame = project.rootFrame;

        // Normalize & sort all keyframes at load time (Constitution Rule 56 & 130)
        for (const nodeId in project.nodes) {
          const n = project.nodes[nodeId];
          if (n.tracks) {
            for (const t of n.tracks) {
              if (t.keyframes) {
                t.keyframes.sort((a, b) => a.time - b.time);
              }
            }
          }
        }

        state.nodes = project.nodes;
        state.nodeOrder = project.nodeOrder;
        state.stateMachines = project.stateMachines ? [...project.stateMachines] : [];
        state.interactions = project.interactions ? [...project.interactions] : [];
        state.duration = project.duration;
        state.fps = project.fps;
        state.currentTime = 0;
        state.selectedId = project.nodeOrder[0] || 'frame-1';
        state.selectedIds = project.nodeOrder[0] ? [project.nodeOrder[0]] : [];
        state.selectedTrackId = null;
        state.toastMessage = `Loaded project: ${project.name}`;
        state.toastType = 'success';
      }),

    createNewProject: () =>
      set((state) => {
        pushDraftSnapshot(state);
        state.rootFrame = {
          id: 'frame-1',
          name: 'New Project',
          type: 'frame',
          visible: true,
          locked: false,
          clipContent: true,
          canvasBg: '#f1f2f5',
          x: 0,
          y: 0,
          width: 600,
          height: 400,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          borderRadius: 0,
          fill: '#ffffff',
          tracks: []
        };
        state.nodes = {};
        state.nodeOrder = [];
        state.interactions = [];
        state.stateMachines = [];
        state.currentTime = 0;
        state.duration = 3.0;
        state.selectedId = 'frame-1';
        state.selectedIds = ['frame-1'];
        state.selectedTrackId = null;
        state.toastMessage = 'Created new project';
        state.toastType = 'info';
      }),

    groupSelected: () =>
      set((state) => {
        const validIds = state.selectedIds.filter((id) => id !== 'frame-1' && state.nodes[id]);
        if (validIds.length < 2) return;
        pushDraftSnapshot(state);

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const id of validIds) {
          const n = state.nodes[id];
          minX = Math.min(minX, n.x);
          minY = Math.min(minY, n.y);
          maxX = Math.max(maxX, n.x + n.width);
          maxY = Math.max(maxY, n.y + n.height);
        }

        const groupId = `group-${Date.now()}`;
        const groupNode: SceneNode = {
          id: groupId,
          name: 'Group',
          type: 'group',
          visible: true,
          locked: false,
          x: minX,
          y: minY,
          width: Math.max(20, maxX - minX),
          height: Math.max(20, maxY - minY),
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          borderRadius: 0,
          fill: 'transparent',
          childrenIds: [...validIds],
          tracks: []
        };

        for (const id of validIds) {
          state.nodes[id].parentId = groupId;
        }

        state.nodes[groupId] = groupNode;
        state.nodeOrder = state.nodeOrder.filter((id) => !validIds.includes(id));
        state.nodeOrder.push(groupId);
        state.selectedId = groupId;
        state.selectedIds = [groupId];
        state.toastMessage = 'Grouped elements (Ctrl+G)';
        state.toastType = 'info';
      }),

    ungroupSelected: () =>
      set((state) => {
        const id = state.selectedId;
        if (!id || !state.nodes[id] || state.nodes[id].type !== 'group') return;
        pushDraftSnapshot(state);

        const group = state.nodes[id];
        const children = group.childrenIds || [];

        for (const childId of children) {
          if (state.nodes[childId]) {
            state.nodes[childId].parentId = null;
            if (!state.nodeOrder.includes(childId)) {
              state.nodeOrder.push(childId);
            }
          }
        }

        delete state.nodes[id];
        state.nodeOrder = state.nodeOrder.filter((nId) => nId !== id);
        state.selectedIds = [...children];
        state.selectedId = children[0] || 'frame-1';
        state.toastMessage = 'Ungrouped elements (Ctrl+Shift+G)';
        state.toastType = 'info';
      }),

    applyBooleanOp: (op) =>
      set((state) => {
        const validNodes = state.selectedIds
          .filter((id) => id !== 'frame-1' && state.nodes[id])
          .map((id) => state.nodes[id]);

        if (validNodes.length < 2) {
          state.toastMessage = 'Select at least 2 shapes for Boolean Operations';
          state.toastType = 'error';
          return;
        }

        pushDraftSnapshot(state);

        const compoundNode = executeBooleanOperation(validNodes, op);
        if (!compoundNode) return;

        // Delete old nodes
        for (const n of validNodes) {
          delete state.nodes[n.id];
          state.nodeOrder = state.nodeOrder.filter((id) => id !== n.id);
        }

        // Add compound node
        state.nodes[compoundNode.id] = compoundNode;
        state.nodeOrder.push(compoundNode.id);
        state.selectedId = compoundNode.id;
        state.selectedIds = [compoundNode.id];
        state.toastMessage = `Applied Boolean ${op.toUpperCase()}`;
        state.toastType = 'success';
      }),

    duplicateSelected: () =>
      set((state) => {
        const idsToDuplicate = state.selectedIds.filter((id) => id !== 'frame-1' && state.nodes[id]);
        if (idsToDuplicate.length === 0) return;
        pushDraftSnapshot(state);

        const newSelectedIds: string[] = [];
        for (const id of idsToDuplicate) {
          const srcNode = state.nodes[id];
          const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const cloned: SceneNode = JSON.parse(JSON.stringify(srcNode));
          cloned.id = newId;
          cloned.name = `${srcNode.name} Copy`;
          cloned.x += 20;
          cloned.y += 20;

          state.nodes[newId] = cloned;
          state.nodeOrder.push(newId);
          newSelectedIds.push(newId);
        }

        state.selectedIds = newSelectedIds;
        state.selectedId = newSelectedIds[0] || null;
        state.toastMessage = `Duplicated ${idsToDuplicate.length} element(s)`;
        state.toastType = 'info';
      }),

    alignSelected: (type) =>
      set((state) => {
        const idsToAlign = state.selectedIds.filter((id) => id !== 'frame-1' && state.nodes[id]);
        if (idsToAlign.length === 0) return;
        pushDraftSnapshot(state);

        const rf = state.rootFrame;
        for (const id of idsToAlign) {
          const node = state.nodes[id];
          switch (type) {
            case 'left':
              node.x = 0;
              break;
            case 'center':
              node.x = Math.round((rf.width - node.width) / 2);
              break;
            case 'right':
              node.x = rf.width - node.width;
              break;
            case 'top':
              node.y = 0;
              break;
            case 'middle':
              node.y = Math.round((rf.height - node.height) / 2);
              break;
            case 'bottom':
              node.y = rf.height - node.height;
              break;
          }
        }
      }),

    updateRootFrame: (updates) =>
      set((state) => {
        pushDraftSnapshot(state);
        Object.assign(state.rootFrame, updates);
      }),

    updateNode: (id, updates, recordHistory = false) =>
      set((state) => {
        const node = state.nodes[id];
        if (node) {
          if (recordHistory) pushDraftSnapshot(state);
          Object.assign(node, updates);

          // Auto-Keyframing Record Mode (Task 2.3)
          if (state.isAutoKeyframe && state.currentTime > 0) {
            const animatableProps = [
              'x', 'y', 'width', 'height', 'rotation', 'scaleX', 'scaleY',
              'pivotX', 'pivotY', 'opacity', 'borderRadius', 'fill', 'stroke',
              'strokeWidth', 'trimStart', 'trimEnd', 'trimOffset', 'fontSize',
              'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'filterBlur'
            ];

            for (const [prop, val] of Object.entries(updates)) {
              if (animatableProps.includes(prop) && val !== undefined) {
                let track = node.tracks.find((t) => t.property === prop);
                if (!track) {
                  track = {
                    id: `tr-${Date.now()}-${prop}`,
                    property: prop as any,
                    label: prop.toUpperCase(),
                    unit: '',
                    color: '#3b82f6',
                    keyframes: []
                  };
                  node.tracks.push(track);
                }

                const existing = track.keyframes.find((k) => Math.abs(k.time - state.currentTime) < 0.04);
                if (existing) {
                  existing.value = val as any;
                } else {
                  track.keyframes.push({
                    id: `kf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    time: parseFloat(state.currentTime.toFixed(2)),
                    value: val as any,
                    curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 }
                  });
                  track.keyframes.sort((a, b) => a.time - b.time);
                }
              }
            }
          }
        }
      }),

    addNode: (node) =>
      set((state) => {
        pushDraftSnapshot(state);
        state.nodes[node.id] = node;
        state.nodeOrder.push(node.id);
        state.selectedId = node.id;
        state.selectedIds = [node.id];
        if (node.tracks?.length > 0) {
          state.selectedTrackId = node.tracks[0].id;
        }
      }),

    deleteNode: (id) =>
      set((state) => {
        if (id === 'frame-1') return;
        pushDraftSnapshot(state);
        delete state.nodes[id];
        state.nodeOrder = state.nodeOrder.filter((nId) => nId !== id);
        state.selectedIds = state.selectedIds.filter((sId) => sId !== id);
        if (state.selectedId === id) state.selectedId = state.selectedIds[0] || 'frame-1';
      }),

    reorderNode: (sourceIndex, targetIndex) =>
      set((state) => {
        pushDraftSnapshot(state);
        const [moved] = state.nodeOrder.splice(sourceIndex, 1);
        state.nodeOrder.splice(targetIndex, 0, moved);
      }),

    addPathPoint: (nodeId, point) =>
      set((state) => {
        pushDraftSnapshot(state);
        const node = state.nodes[nodeId];
        if (!node) return;
        if (!node.pathPoints) node.pathPoints = [];
        node.pathPoints.push(point);
      }),

    updatePathPoint: (nodeId, index, updates) =>
      set((state) => {
        const node = state.nodes[nodeId];
        if (!node || !node.pathPoints || !node.pathPoints[index]) return;
        Object.assign(node.pathPoints[index], updates);
      }),

    setSelectedKeyframeIds: (ids) => set({ selectedKeyframeIds: ids }),
    toggleKeyframeSelection: (kfId, isShift) =>
      set((state) => {
        if (isShift) {
          if (state.selectedKeyframeIds.includes(kfId)) {
            state.selectedKeyframeIds = state.selectedKeyframeIds.filter((id) => id !== kfId);
          } else {
            state.selectedKeyframeIds.push(kfId);
          }
        } else {
          state.selectedKeyframeIds = [kfId];
        }
      }),

    staggerSelectedKeyframes: (offsetStep = 0.05) =>
      set((state) => {
        pushDraftSnapshot(state);

        // If specific keyframes are selected, stagger them by selection order
        if (state.selectedKeyframeIds.length > 1) {
          let count = 0;
          for (const kfId of state.selectedKeyframeIds) {
            for (const n of Object.values(state.nodes)) {
              for (const t of n.tracks || []) {
                const kf = t.keyframes.find((k) => k.id === kfId);
                if (kf) {
                  kf.time = parseFloat(
                    Math.max(0, Math.min(state.duration, kf.time + count * offsetStep)).toFixed(2)
                  );
                  t.keyframes.sort((a, b) => a.time - b.time);
                  count++;
                }
              }
            }
          }
          state.toastMessage = `Staggered ${count} keyframes by +${offsetStep}s`;
          state.toastType = 'info';
          return;
        }

        // Otherwise stagger tracks of the selected node
        const node = state.selectedId ? state.nodes[state.selectedId] : null;
        if (node && node.tracks && node.tracks.length > 1) {
          node.tracks.forEach((track, index) => {
            const shift = index * offsetStep;
            track.keyframes.forEach((kf) => {
              kf.time = parseFloat(Math.max(0, Math.min(state.duration, kf.time + shift)).toFixed(2));
            });
            track.keyframes.sort((a, b) => a.time - b.time);
          });
          state.toastMessage = `Staggered ${node.tracks.length} tracks by +${offsetStep}s`;
          state.toastType = 'info';
        }
      }),

    scaleSelectedKeyframes: (factor) =>
      set((state) => {
        if (state.selectedKeyframeIds.length === 0) return;
        pushDraftSnapshot(state);

        for (const nodeId in state.nodes) {
          const n = state.nodes[nodeId];
          if (!n.tracks) continue;
          for (const t of n.tracks) {
            const affected = t.keyframes.filter((k) => state.selectedKeyframeIds.includes(k.id));
            if (affected.length > 0) {
              const anchor = Math.min(...affected.map((k) => k.time));
              t.keyframes = scaleKeyframes(t.keyframes, factor, anchor, state.duration);
            }
          }
        }
        state.toastMessage = `Scaled keyframes by ${factor}x`;
        state.toastType = 'info';
      }),

    reverseSelectedKeyframes: () =>
      set((state) => {
        if (state.selectedKeyframeIds.length <= 1) {
          const node = state.selectedId ? state.nodes[state.selectedId] : null;
          if (!node || !node.tracks) return;
          pushDraftSnapshot(state);
          for (const t of node.tracks) {
            t.keyframes = reverseKeyframes(t.keyframes, 0, state.duration);
          }
          state.toastMessage = `Reversed keyframes on ${node.name}`;
          state.toastType = 'info';
          return;
        }

        pushDraftSnapshot(state);
        for (const nodeId in state.nodes) {
          const n = state.nodes[nodeId];
          if (!n.tracks) continue;
          for (const t of n.tracks) {
            const hasSelected = t.keyframes.some((k) => state.selectedKeyframeIds.includes(k.id));
            if (hasSelected) {
              t.keyframes = reverseKeyframes(t.keyframes);
            }
          }
        }
        state.toastMessage = `Reversed ${state.selectedKeyframeIds.length} keyframes`;
        state.toastType = 'info';
      }),

    copySelectedKeyframes: () =>
      set((state) => {
        const clipboard = createKeyframeClipboard(state.selectedKeyframeIds, state.nodes);
        if (!clipboard) {
          state.toastMessage = 'No keyframes selected to copy';
          state.toastType = 'error';
          return;
        }
        state.keyframeClipboard = clipboard;
        state.toastMessage = `Copied ${clipboard.items.length} keyframe(s)`;
        state.toastType = 'success';
      }),

    pasteKeyframes: () =>
      set((state) => {
        if (!state.keyframeClipboard || state.keyframeClipboard.items.length === 0) {
          state.toastMessage = 'Keyframe clipboard is empty';
          state.toastType = 'error';
          return;
        }
        const targetNodeId = state.selectedId;
        if (!targetNodeId || !state.nodes[targetNodeId]) {
          state.toastMessage = 'Select a target node to paste keyframes';
          state.toastType = 'error';
          return;
        }

        pushDraftSnapshot(state);
        const targetNode = state.nodes[targetNodeId];
        const res = pasteKeyframesToNode(state.keyframeClipboard, targetNode, state.currentTime);
        targetNode.tracks = res.updatedTracks;

        state.toastMessage = `Pasted ${res.pastedCount} keyframe(s) at ${state.currentTime.toFixed(2)}s`;
        state.toastType = 'success';
      }),

    addOrUpdateKeyframe: (nodeId, property, time, value) =>
      set((state) => {
        pushDraftSnapshot(state);
        const node = state.nodes[nodeId];
        if (!node) return;

        let track = node.tracks.find((t) => t.property === property);
        if (!track) {
          track = {
            id: `tr-${Date.now()}`,
            property: property as any,
            label: property.toUpperCase(),
            unit: '',
            color: '#3b82f6',
            keyframes: []
          };
          node.tracks.push(track);
        }

        const existing = track.keyframes.find((k) => Math.abs(k.time - time) < 0.04);
        if (existing) {
          existing.value = value;
        } else {
          track.keyframes.push({
            id: `kf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            time: parseFloat(time.toFixed(2)),
            value,
            curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 }
          });
          track.keyframes.sort((a, b) => a.time - b.time);
        }
      }),

    removeKeyframe: (nodeId, property, keyframeId) =>
      set((state) => {
        pushDraftSnapshot(state);
        const node = state.nodes[nodeId];
        if (!node) return;
        const track = node.tracks.find((t) => t.property === property);
        if (track) {
          track.keyframes = track.keyframes.filter((k) => k.id !== keyframeId);
        }
      }),

    updateKeyframeTime: (nodeId, property, keyframeId, newTime) =>
      set((state) => {
        const node = state.nodes[nodeId];
        if (!node) return;
        const track = node.tracks.find((t) => t.property === property);
        if (track) {
          const kf = track.keyframes.find((k) => k.id === keyframeId);
          if (kf) {
            kf.time = Math.max(0, Math.min(get().duration, parseFloat(newTime.toFixed(2))));
            track.keyframes.sort((a, b) => a.time - b.time);
          }
        }
      }),

    updateKeyframeCurve: (nodeId, property, keyframeId, curve) =>
      set((state) => {
        pushDraftSnapshot(state);
        const node = state.nodes[nodeId];
        if (!node) return;
        const track = node.tracks.find((t) => t.property === property);
        if (track) {
          const kf = track.keyframes.find((k) => k.id === keyframeId);
          if (kf) {
            kf.curve = curve;
          }
        }
      }),

    setAudioTrack: (track) => set({ audioTrack: track }),
    updateAudioTrack: (updates) =>
      set((state) => {
        if (state.audioTrack) {
          Object.assign(state.audioTrack, updates);
        }
      }),

    addMarker: (time, label = 'Marker', color = '#8b5cf6') =>
      set((state) => {
        const newM = {
          id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          time: parseFloat(Math.max(0, Math.min(state.duration, time)).toFixed(2)),
          label,
          color
        };
        state.markers.push(newM);
        state.markers.sort((a, b) => a.time - b.time);
        state.toastMessage = `Added marker at ${newM.time}s`;
        state.toastType = 'success';
      }),

    removeMarker: (id) =>
      set((state) => {
        state.markers = state.markers.filter((m) => m.id !== id);
        state.toastMessage = 'Removed marker';
        state.toastType = 'info';
      }),

    generateMarkersFromAudioBeats: () =>
      set((state) => {
        const beats = detectSyntheticBeats(state.duration, 120);
        state.markers = beats.map((time, idx) => ({
          id: `beat-${idx}`,
          time,
          label: `Beat ${idx + 1}`,
          color: '#ec4899'
        }));
        state.toastMessage = `Detected ${beats.length} beats and created markers`;
        state.toastType = 'success';
      }),

    // Browser Tabs Management Actions
    openNewTab: (title, project) =>
      set((state) => {
        syncCurrentTabState(state);
        const newId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const newTitle = title || `Composition ${state.tabs.length + 1}`;
        let newTab: DocumentTab;

        if (project) {
          newTab = {
            id: newId,
            title: newTitle,
            isDirty: false,
            createdAt: Date.now(),
            project,
            history: { past: [], future: [] },
            viewport: {
              zoom: 0.56,
              panX: 0,
              panY: 0,
              currentTime: 0.0,
              selectedId: project.nodeOrder[0] || null,
              selectedIds: project.nodeOrder[0] ? [project.nodeOrder[0]] : []
            },
            audioTrack: null,
            markers: []
          };
        } else {
          newTab = createDefaultTab(newId, newTitle);
          newTab.project.nodes = {};
          newTab.project.nodeOrder = [];
          newTab.viewport.selectedId = 'frame-1';
          newTab.viewport.selectedIds = ['frame-1'];
          newTab.markers = [];
        }

        state.tabs.push(newTab);
        loadTabState(state, newTab);
      }),

    closeTab: (tabId) =>
      set((state) => {
        if (state.tabs.length <= 1) {
          const freshTab = createDefaultTab(`tab-${Date.now()}`, 'Composition 1');
          freshTab.project.nodes = {};
          freshTab.project.nodeOrder = [];
          freshTab.viewport.selectedId = 'frame-1';
          freshTab.viewport.selectedIds = ['frame-1'];
          freshTab.markers = [];
          state.tabs = [freshTab];
          loadTabState(state, freshTab);
          return;
        }

        const closeIdx = state.tabs.findIndex((t) => t.id === tabId);
        if (closeIdx === -1) return;

        studioSessionManager.destroySession(tabId);
        const isClosingActive = state.activeTabId === tabId;
        state.tabs.splice(closeIdx, 1);

        if (isClosingActive) {
          const nextIdx = Math.min(closeIdx, state.tabs.length - 1);
          const nextTab = state.tabs[nextIdx];
          loadTabState(state, nextTab);
        }
      }),

    switchTab: (tabId) =>
      set((state) => {
        if (state.activeTabId === tabId) return;
        const targetTab = state.tabs.find((t) => t.id === tabId);
        if (!targetTab) return;

        syncCurrentTabState(state);
        loadTabState(state, targetTab);
      }),

    renameTab: (tabId, newTitle) =>
      set((state) => {
        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab) {
          tab.title = newTitle.trim() || 'Untitled';
          if (state.activeTabId === tabId) {
            state.rootFrame.name = tab.title;
          }
        }
      }),

    duplicateTab: (tabId) =>
      set((state) => {
        const sourceTab = state.tabs.find((t) => t.id === tabId);
        if (!sourceTab) return;
        syncCurrentTabState(state);

        const newId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const newTab: DocumentTab = JSON.parse(JSON.stringify(sourceTab));
        newTab.id = newId;
        newTab.title = `${sourceTab.title} (Copy)`;
        newTab.createdAt = Date.now();
        newTab.history = { past: [], future: [] };

        state.tabs.push(newTab);
        loadTabState(state, newTab);
      }),

    reorderTabs: (sourceIndex, destinationIndex) =>
      set((state) => {
        const [moved] = state.tabs.splice(sourceIndex, 1);
        if (moved) {
          state.tabs.splice(destinationIndex, 0, moved);
        }
      }),

    closeOtherTabs: (tabId) =>
      set((state) => {
        const targetTab = state.tabs.find((t) => t.id === tabId);
        if (!targetTab) return;
        syncCurrentTabState(state);

        for (const t of state.tabs) {
          if (t.id !== tabId) {
            studioSessionManager.destroySession(t.id);
          }
        }

        state.tabs = [targetTab];
        loadTabState(state, targetTab);
      }),

    closeTabsToRight: (tabId) =>
      set((state) => {
        const targetIdx = state.tabs.findIndex((t) => t.id === tabId);
        if (targetIdx === -1 || targetIdx === state.tabs.length - 1) return;
        syncCurrentTabState(state);

        const closedTabs = state.tabs.slice(targetIdx + 1);
        for (const t of closedTabs) {
          studioSessionManager.destroySession(t.id);
        }

        state.tabs = state.tabs.slice(0, targetIdx + 1);
        const currentActiveStillExists = state.tabs.some((t) => t.id === state.activeTabId);
        if (!currentActiveStillExists) {
          loadTabState(state, state.tabs[state.tabs.length - 1]);
        }
      }),

    isPresetsModalOpen: false,
    setPresetsModalOpen: (open) => set({ isPresetsModalOpen: open }),

    applyMotionPreset: (nodeId, presetId, options) =>
      set((state) => {
        pushDraftSnapshot(state);
        const node = state.nodes[nodeId];
        if (!node) return;
        state.nodes[nodeId] = applyMotionPresetToNode(node, presetId, options);
        state.toastMessage = `Applied motion preset to ${node.name}`;
        state.toastType = 'success';
      }),

    applyMotionPresetToSelection: (presetId, options) =>
      set((state) => {
        const targetIds = state.selectedIds.length > 0
          ? state.selectedIds
          : state.selectedId
          ? [state.selectedId]
          : [];

        if (targetIds.length === 0) {
          state.toastMessage = 'Please select at least one layer to apply preset';
          state.toastType = 'info';
          return;
        }

        pushDraftSnapshot(state);
        for (const id of targetIds) {
          const node = state.nodes[id];
          if (node && node.id !== 'frame-1') {
            state.nodes[id] = applyMotionPresetToNode(node, presetId, options);
          }
        }
        state.toastMessage = `Applied preset to ${targetIds.length} layer${targetIds.length > 1 ? 's' : ''}`;
        state.toastType = 'success';
      }),

    // Flexible Workspace & Dockable Panels State & Actions
    workspace: (() => {
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('opensvg_workspace_v2');
          if (saved) return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
      return WORKSPACE_PRESETS.default;
    })(),

    activeDraggingPanel: null,
    dragHoverTarget: null,

    setDraggingPanel: (drag) => set({ activeDraggingPanel: drag }),
    setDragHoverTarget: (target) => set({ dragHoverTarget: target }),

    setActivePanelInContainer: (containerId, panelId) =>
      set((state) => {
        const findAndSet = (containers: DockContainer[]) => {
          const c = containers.find((item) => item.id === containerId);
          if (c && c.panels.includes(panelId)) {
            c.activePanelId = panelId;
            return true;
          }
          return false;
        };
        findAndSet(state.workspace.leftContainers) ||
          findAndSet(state.workspace.rightContainers) ||
          findAndSet(state.workspace.bottomContainers);
        if (typeof window !== 'undefined') {
          localStorage.setItem('opensvg_workspace_v2', JSON.stringify(state.workspace));
        }
      }),

    movePanel: (sourceContainerId, targetContainerId, position, panelId) =>
      set((state) => {
        const allColumns: DockContainer[][] = [
          state.workspace.leftContainers,
          state.workspace.rightContainers,
          state.workspace.bottomContainers
        ];

        // 1. Remove panel from source container
        for (const col of allColumns) {
          const srcIdx = col.findIndex((c) => c.id === sourceContainerId);
          if (srcIdx !== -1) {
            const srcCont = col[srcIdx];
            srcCont.panels = srcCont.panels.filter((p) => p !== panelId);
            if (srcCont.panels.length === 0) {
              if (col.length > 1) {
                col.splice(srcIdx, 1);
              }
            } else if (srcCont.activePanelId === panelId) {
              srcCont.activePanelId = srcCont.panels[0];
            }
          }
        }

        // 2. Insert into target
        for (const col of allColumns) {
          const tgtIdx = col.findIndex((c) => c.id === targetContainerId);
          if (tgtIdx !== -1) {
            const tgtCont = col[tgtIdx];
            if (position === 'tab') {
              if (!tgtCont.panels.includes(panelId)) {
                tgtCont.panels.push(panelId);
              }
              tgtCont.activePanelId = panelId;
            } else if (position === 'top' || position === 'left') {
              const newCont: DockContainer = {
                id: `dock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                panels: [panelId],
                activePanelId: panelId,
                sizePercent: 50
              };
              tgtCont.sizePercent = 50;
              col.splice(tgtIdx, 0, newCont);
            } else if (position === 'bottom' || position === 'right') {
              const newCont: DockContainer = {
                id: `dock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                panels: [panelId],
                activePanelId: panelId,
                sizePercent: 50
              };
              tgtCont.sizePercent = 50;
              col.splice(tgtIdx + 1, 0, newCont);
            }
            break;
          }
        }

        state.workspace.activePreset = 'custom';
        state.activeDraggingPanel = null;
        state.dragHoverTarget = null;
        if (typeof window !== 'undefined') {
          localStorage.setItem('opensvg_workspace_v2', JSON.stringify(state.workspace));
        }
      }),

    resizeWorkspaceColumn: (column, deltaPx) =>
      set((state) => {
        if (column === 'left') {
          state.workspace.leftWidth = Math.max(160, Math.min(600, state.workspace.leftWidth + deltaPx));
        } else if (column === 'right') {
          state.workspace.rightWidth = Math.max(200, Math.min(600, state.workspace.rightWidth - deltaPx));
        } else if (column === 'bottom') {
          state.workspace.bottomHeight = Math.max(80, Math.min(650, state.workspace.bottomHeight - deltaPx));
        } else if (column === 'graphEditor') {
          state.workspace.graphEditorWidth = Math.max(200, Math.min(600, (state.workspace.graphEditorWidth || 320) - deltaPx));
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('opensvg_workspace_v2', JSON.stringify(state.workspace));
        }
      }),

    resizeContainerInColumn: (column, index, stepDeltaPx) =>
      set((state) => {
        const containers = column === 'left' ? state.workspace.leftContainers : state.workspace.rightContainers;
        if (index < 0 || index >= containers.length - 1) return;
        const topCont = containers[index];
        const bottomCont = containers[index + 1];
        if (!topCont || !bottomCont) return;

        const percentDelta = (stepDeltaPx / 400) * 100;
        const currentTop = topCont.sizePercent || 50;
        const currentBottom = bottomCont.sizePercent || 50;

        const newTop = Math.max(15, Math.min(85, currentTop + percentDelta));
        const newBottom = Math.max(15, Math.min(85, currentBottom - percentDelta));

        topCont.sizePercent = newTop;
        bottomCont.sizePercent = newBottom;

        if (typeof window !== 'undefined') {
          localStorage.setItem('opensvg_workspace_v2', JSON.stringify(state.workspace));
        }
      }),

    toggleWorkspaceCollapse: (column) =>
      set((state) => {
        if (column === 'left') state.workspace.isLeftCollapsed = !state.workspace.isLeftCollapsed;
        if (column === 'right') state.workspace.isRightCollapsed = !state.workspace.isRightCollapsed;
        if (column === 'bottom') state.workspace.isBottomCollapsed = !state.workspace.isBottomCollapsed;
        if (typeof window !== 'undefined') {
          localStorage.setItem('opensvg_workspace_v2', JSON.stringify(state.workspace));
        }
      }),

    setWorkspacePreset: (preset) =>
      set((state) => {
        const config = WORKSPACE_PRESETS[preset];
        if (config) {
          state.workspace = JSON.parse(JSON.stringify(config));
          if (typeof window !== 'undefined') {
            localStorage.setItem('opensvg_workspace_v2', JSON.stringify(state.workspace));
          }
          state.toastMessage = `Switched to ${preset.toUpperCase()} workspace`;
          state.toastType = 'info';
        }
      }),

    resetWorkspace: () =>
      set((state) => {
        state.workspace = JSON.parse(JSON.stringify(WORKSPACE_PRESETS.default));
        if (typeof window !== 'undefined') {
          localStorage.removeItem('opensvg_workspace_v2');
        }
        state.toastMessage = 'Reset workspace to default layout';
        state.toastType = 'success';
      }),

    // Interaction Actions
    addInteraction: (interaction) =>
      set((state) => {
        pushDraftSnapshot(state);
        state.interactions.push(interaction);
      }),
    updateInteraction: (id, updates) =>
      set((state) => {
        pushDraftSnapshot(state);
        const idx = state.interactions.findIndex((i) => i.id === id);
        if (idx !== -1) {
          state.interactions[idx] = { ...state.interactions[idx], ...updates };
        }
      }),
    removeInteraction: (id) =>
      set((state) => {
        pushDraftSnapshot(state);
        state.interactions = state.interactions.filter((i) => i.id !== id);
      }),
    setInteractions: (interactions) =>
      set((state) => {
        state.interactions = [...interactions];
      }),

    // State Machine Actions
    addStateMachine: (sm) =>
      set((state) => {
        pushDraftSnapshot(state);
        state.stateMachines.push(sm);
      }),
    updateStateMachine: (id, updates) =>
      set((state) => {
        pushDraftSnapshot(state);
        const idx = state.stateMachines.findIndex((s) => s.id === id);
        if (idx !== -1) {
          state.stateMachines[idx] = { ...state.stateMachines[idx], ...updates };
        }
      }),
    removeStateMachine: (id) =>
      set((state) => {
        pushDraftSnapshot(state);
        state.stateMachines = state.stateMachines.filter((s) => s.id !== id);
      }),
    setStateMachines: (sms) =>
      set((state) => {
        state.stateMachines = [...sms];
      }),

    // Native OpenSVG Serialization & Deserialization
    exportOpenSVGDocument: () => {
      const state = get();
      const doc: OpenSVGDocument = {
        format: 'opensvg',
        schemaVersion: '2.0.0',
        metadata: {
          id: `doc-${state.rootFrame.name.toLowerCase().replace(/\s+/g, '-')}`,
          title: state.rootFrame.name,
          author: 'OpenSVG Motion Studio',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        scene: {
          width: state.rootFrame.width,
          height: state.rootFrame.height,
          fps: state.fps,
          duration: state.duration,
          background: state.rootFrame.canvasBg || state.rootFrame.fill || '#ffffff',
          clipContent: state.rootFrame.clipContent ?? true
        },
        rootFrame: state.rootFrame,
        nodes: state.nodes,
        nodeOrder: state.nodeOrder,
        stateMachines: state.stateMachines.length > 0 ? state.stateMachines : undefined,
        interactions: state.interactions.length > 0 ? state.interactions : undefined,
        constraints: state.constraints.length > 0 ? state.constraints : undefined,
        bindings: state.bindings.length > 0 ? state.bindings : undefined,
        components: state.components.length > 0 ? state.components : undefined,
        componentInstances: state.componentInstances.length > 0 ? state.componentInstances : undefined,
        assets: Object.keys(state.assets).length > 0 ? state.assets : undefined
      };

      // Mark current active tab as clean/saved
      set((draft) => {
        const tab = draft.tabs.find((t) => t.id === draft.activeTabId);
        if (tab) {
          tab.isDirty = false;
          tab.savedSnapshotIndex = draft.past.length;
        }
      });

      return serializeDocument(doc, true);
    },

    loadOpenSVGDocument: (osvgOrDoc) =>
      set((state) => {
        pushDraftSnapshot(state);
        const doc: OpenSVGDocument = typeof osvgOrDoc === 'string' ? parseDocument(osvgOrDoc) : osvgOrDoc;
        state.duration = doc.scene.duration || 3.0;
        state.fps = doc.scene.fps || 60;
        state.currentTime = 0;
        if (doc.rootFrame) {
          state.rootFrame = { ...doc.rootFrame };
        } else {
          state.rootFrame = {
            id: `root-${doc.metadata.id}`,
            name: doc.metadata.title || 'Scene',
            type: 'frame',
            visible: true,
            locked: false,
            clipContent: doc.scene.clipContent ?? true,
            canvasBg: doc.scene.background || '#ffffff',
            x: 0,
            y: 0,
            width: doc.scene.width,
            height: doc.scene.height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            borderRadius: 0,
            fill: '#ffffff',
            tracks: []
          };
        }
        state.nodes = { ...doc.nodes };
        state.nodeOrder = [...doc.nodeOrder];
        state.stateMachines = doc.stateMachines ? [...doc.stateMachines] : [];
        state.interactions = doc.interactions ? [...doc.interactions] : [];
        state.constraints = doc.constraints ? [...doc.constraints] : [];
        state.bindings = doc.bindings ? [...doc.bindings] : [];
        state.components = doc.components ? [...doc.components] : [];
        state.componentInstances = doc.componentInstances ? [...doc.componentInstances] : [];
        state.assets = doc.assets ? { ...doc.assets } : {};
        state.selectedId = state.nodeOrder[0] || null;
        state.selectedIds = state.selectedId ? [state.selectedId] : [];
        state.toastMessage = `Loaded OpenSVG: ${doc.metadata.title || 'Document'}`;
        state.toastType = 'success';
      }),

    setExportOpen: (open) => set({ isExportOpen: open }),
    setSettingsOpen: (open) => set({ isSettingsOpen: open }),
    showToast: (msg, type = 'info') => set({ toastMessage: msg, toastType: type })
  }))
);
