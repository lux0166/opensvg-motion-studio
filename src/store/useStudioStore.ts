import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { FrameNode, SceneNode, ToolMode, TimelineMode } from '../engine/types';

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
  expandedNodeIds: Record<string, boolean>;

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
  toggleNodeExpand: (id: string) => void;

  // Scene manipulation
  updateRootFrame: (updates: Partial<FrameNode>) => void;
  updateNode: (id: string, updates: Partial<SceneNode>) => void;
  addNode: (node: SceneNode) => void;
  deleteNode: (id: string) => void;
  reorderNode: (sourceIndex: number, targetIndex: number) => void;

  // Keyframes
  addOrUpdateKeyframe: (nodeId: string, property: string, time: number, value: any) => void;
  removeKeyframe: (nodeId: string, property: string, keyframeId: string) => void;
  updateKeyframeCurve: (nodeId: string, property: string, keyframeId: string, curve: { x1: number; y1: number; x2: number; y2: number }) => void;

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
    expandedNodeIds: { 'frame-1': true, card: true, ball: true },

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

    isExportOpen: false,
    isSettingsOpen: false,
    toastMessage: null,
    toastType: 'info',

    // Action implementations
    setPlaying: (playing) => set({ isPlaying: playing }),
    setCurrentTime: (time) => set({ currentTime: Math.max(0, Math.min(get().duration, time)) }),
    setDuration: (duration) => set({ duration: Math.max(1, duration) }),
    setLoop: (loop) => set({ loop }),
    setTimelineMode: (mode) => set({ timelineMode: mode }),
    setZoom: (zoom) => set({ zoom: Math.max(0.15, Math.min(3.0, zoom)) }),
    setPan: (panX, panY) => set({ panX, panY }),
    setSelectedTool: (tool) => set({ selectedTool: tool }),
    setSelectedId: (id) => set({ selectedId: id }),
    toggleNodeExpand: (id) =>
      set((state) => {
        state.expandedNodeIds[id] = !state.expandedNodeIds[id];
      }),

    updateRootFrame: (updates) =>
      set((state) => {
        Object.assign(state.rootFrame, updates);
      }),

    updateNode: (id, updates) =>
      set((state) => {
        if (state.nodes[id]) {
          Object.assign(state.nodes[id], updates);
        }
      }),

    addNode: (node) =>
      set((state) => {
        state.nodes[node.id] = node;
        state.nodeOrder.push(node.id);
        state.selectedId = node.id;
      }),

    deleteNode: (id) =>
      set((state) => {
        delete state.nodes[id];
        state.nodeOrder = state.nodeOrder.filter((nId) => nId !== id);
        if (state.selectedId === id) state.selectedId = 'frame-1';
      }),

    reorderNode: (sourceIndex, targetIndex) =>
      set((state) => {
        const [moved] = state.nodeOrder.splice(sourceIndex, 1);
        state.nodeOrder.splice(targetIndex, 0, moved);
      }),

    addOrUpdateKeyframe: (nodeId, property, time, value) =>
      set((state) => {
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
        const node = state.nodes[nodeId];
        if (!node) return;
        const track = node.tracks.find((t) => t.property === property);
        if (track) {
          track.keyframes = track.keyframes.filter((k) => k.id !== keyframeId);
        }
      }),

    updateKeyframeCurve: (nodeId, property, keyframeId, curve) =>
      set((state) => {
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

    setExportOpen: (open) => set({ isExportOpen: open }),
    setSettingsOpen: (open) => set({ isSettingsOpen: open }),
    showToast: (msg, type = 'info') => set({ toastMessage: msg, toastType: type })
  }))
);
