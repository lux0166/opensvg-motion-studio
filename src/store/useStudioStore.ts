import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { FrameNode, SceneNode, SceneProject, ToolMode, TimelineMode, BezierPoint, CubicBezierCurve, AudioTrackConfig, NodeTrigger, TimelineMarker } from '../engine/types';
import { SnapLine } from '../engine/snapping';
import { StudioSnapshot, createStudioSnapshot, MAX_HISTORY_STEPS } from '../engine/history';
import { BooleanOpType, executeBooleanOperation } from '../engine/booleanOps';
import { detectSyntheticBeats } from '../engine/audioEngine';

function pushDraftSnapshot(state: any) {
  const snap = createStudioSnapshot(state.rootFrame, state.nodes, state.nodeOrder);
  state.past.push(snap);
  if (state.past.length > MAX_HISTORY_STEPS) {
    state.past.shift();
  }
  state.future = [];
}

interface StudioState {
  // Playback
  isPlaying: boolean;
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
  toastMessage: string | null;
  toastType: 'success' | 'info' | 'error';

  // Actions
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setLoop: (loop: boolean) => void;
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

  // Keyframes
  setSelectedKeyframeIds: (ids: string[]) => void;
  toggleKeyframeSelection: (kfId: string, isShift: boolean) => void;
  staggerSelectedKeyframes: (offsetStep?: number) => void;
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

  // Interactive State Machine Triggers
  addTrigger: (nodeId: string, trigger: NodeTrigger) => void;
  removeTrigger: (nodeId: string, triggerId: string) => void;

  // Modals & Feedback
  setExportOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const useStudioStore = create<StudioState>()(
  immer((set, get) => ({
    isPlaying: false,
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

    nodes: {
      card: {
        id: 'card',
        name: 'Card',
        type: 'rect',
        visible: true,
        locked: false,
        x: 150,
        y: 100,
        width: 128,
        height: 128,
        rotation: 12,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 24,
        fill: '#111827',
        tracks: [
          {
            id: 'tr-rot',
            property: 'rotation',
            label: 'Rotation',
            unit: '°',
            color: '#6366f1',
            keyframes: [
              { id: 'k1', time: 0.15, value: 12, curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
              { id: 'k2', time: 0.90, value: 102, curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
              { id: 'k3', time: 2.10, value: 200, curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
              { id: 'k4', time: 3.00, value: 372, curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } }
            ]
          },
          {
            id: 'tr-x',
            property: 'x',
            label: 'X Position',
            unit: 'px',
            color: '#3b82f6',
            keyframes: [
              { id: 'kx1', time: 0.00, value: 150, curve: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 } },
              { id: 'kx2', time: 1.50, value: 240, curve: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 } },
              { id: 'kx3', time: 3.00, value: 150, curve: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 } }
            ]
          }
        ]
      },
      ball: {
        id: 'ball',
        name: 'Ball',
        type: 'circle',
        visible: true,
        locked: false,
        x: 340,
        y: 250,
        width: 96,
        height: 96,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 9999,
        fill: '#3b82f6',
        tracks: [
          {
            id: 'tr-bx',
            property: 'x',
            label: 'X Position',
            unit: 'px',
            color: '#10b981',
            keyframes: [
              { id: 'bk1', time: 0.06, value: 180, curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
              { id: 'bk2', time: 0.66, value: 340, curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
              { id: 'bk3', time: 1.20, value: 450, curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
              { id: 'bk4', time: 2.10, value: 280, curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
              { id: 'bk5', time: 3.00, value: 180, curve: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } }
            ]
          },
          {
            id: 'tr-bsx',
            property: 'scaleX',
            label: 'Scale X',
            unit: '',
            color: '#f59e0b',
            keyframes: [
              { id: 'bsk1', time: 0.06, value: 1.0 },
              { id: 'bsk2', time: 0.36, value: 1.35 },
              { id: 'bsk3', time: 0.66, value: 1.0 },
              { id: 'bsk4', time: 1.20, value: 1.25 },
              { id: 'bsk5', time: 2.10, value: 0.85 },
              { id: 'bsk6', time: 3.00, value: 1.0 }
            ]
          }
        ]
      }
    },

    nodeOrder: ['card', 'ball'],
    audioTrack: null,
    markers: [
      { id: 'm-start', time: 0.0, label: 'Start', color: '#10b981' },
      { id: 'm-drop', time: 1.5, label: 'Drop', color: '#f59e0b' }
    ],

    isExportOpen: false,
    isSettingsOpen: false,
    toastMessage: null,
    toastType: 'info',

    // History implementation
    pushSnapshot: () =>
      set((state) => {
        pushDraftSnapshot(state);
      }),

    undo: () =>
      set((state) => {
        if (state.past.length === 0) return;
        const current = createStudioSnapshot(state.rootFrame, state.nodes, state.nodeOrder);
        state.future.push(current);

        const previous = state.past.pop()!;
        state.rootFrame = previous.rootFrame;
        state.nodes = previous.nodes;
        state.nodeOrder = previous.nodeOrder;

        // Keep selection valid (fallback if current selected node was deleted in previous state)
        if (state.selectedId && !state.nodes[state.selectedId] && state.selectedId !== 'frame-1') {
          state.selectedId = state.nodeOrder[0] || 'frame-1';
          state.selectedIds = state.nodeOrder[0] ? [state.nodeOrder[0]] : [];
        }
        state.toastMessage = 'Undo';
        state.toastType = 'info';
      }),

    redo: () =>
      set((state) => {
        if (state.future.length === 0) return;
        const current = createStudioSnapshot(state.rootFrame, state.nodes, state.nodeOrder);
        state.past.push(current);

        const next = state.future.pop()!;
        state.rootFrame = next.rootFrame;
        state.nodes = next.nodes;
        state.nodeOrder = next.nodeOrder;

        // Keep selection valid
        if (state.selectedId && !state.nodes[state.selectedId] && state.selectedId !== 'frame-1') {
          state.selectedId = state.nodeOrder[0] || 'frame-1';
          state.selectedIds = state.nodeOrder[0] ? [state.nodeOrder[0]] : [];
        }
        state.toastMessage = 'Redo';
        state.toastType = 'info';
      }),

    // Action implementations
    setPlaying: (playing) => set({ isPlaying: playing }),
    setCurrentTime: (time) => set({ currentTime: Math.max(0, Math.min(get().duration, time)) }),
    setDuration: (duration) => set({ duration: Math.max(1, duration) }),
    setLoop: (loop) => set({ loop }),
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
        if (state.nodes[id]) {
          if (recordHistory) pushDraftSnapshot(state);
          Object.assign(state.nodes[id], updates);
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

    addTrigger: (nodeId, trigger) =>
      set((state) => {
        pushDraftSnapshot(state);
        const node = state.nodes[nodeId];
        if (!node) return;
        if (!node.triggers) node.triggers = [];
        node.triggers.push(trigger);
        state.toastMessage = `Added ${trigger.event} trigger`;
        state.toastType = 'success';
      }),

    removeTrigger: (nodeId, triggerId) =>
      set((state) => {
        pushDraftSnapshot(state);
        const node = state.nodes[nodeId];
        if (!node || !node.triggers) return;
        node.triggers = node.triggers.filter((t) => t.id !== triggerId);
        state.toastMessage = 'Removed trigger';
        state.toastType = 'info';
      }),

    setExportOpen: (open) => set({ isExportOpen: open }),
    setSettingsOpen: (open) => set({ isSettingsOpen: open }),
    showToast: (msg, type = 'info') => set({ toastMessage: msg, toastType: type })
  }))
);
