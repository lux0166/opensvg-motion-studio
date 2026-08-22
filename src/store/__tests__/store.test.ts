import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '../useStudioStore';

describe('Studio Central Store (Zustand + Immer)', () => {
  beforeEach(() => {
    // Reset basic state
    useStudioStore.setState({
      currentTime: 0,
      duration: 3.0,
      isPlaying: false,
      selectedId: 'card'
    });
  });

  it('handles playback toggling and scrubbing', () => {
    const store = useStudioStore.getState();
    expect(store.isPlaying).toBe(false);

    store.setPlaying(true);
    expect(useStudioStore.getState().isPlaying).toBe(true);

    store.setCurrentTime(1.5);
    expect(useStudioStore.getState().currentTime).toBe(1.5);

    // Clamps within duration
    store.setCurrentTime(99.0);
    expect(useStudioStore.getState().currentTime).toBe(3.0);
  });

  it('adds and modifies Scene Nodes', () => {
    const store = useStudioStore.getState();
    const newId = `test-star-${Date.now()}`;

    store.addNode({
      id: newId,
      name: 'Star Element',
      type: 'star',
      visible: true,
      locked: false,
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: '#f59e0b',
      tracks: []
    });

    expect(useStudioStore.getState().nodes[newId]).toBeDefined();
    expect(useStudioStore.getState().nodeOrder).toContain(newId);

    // Update properties
    store.updateNode(newId, { rotation: 45, fill: '#ef4444' });
    expect(useStudioStore.getState().nodes[newId].rotation).toBe(45);
    expect(useStudioStore.getState().nodes[newId].fill).toBe('#ef4444');
  });

  it('manages keyframes and timeline curve updates', () => {
    const store = useStudioStore.getState();
    const nodeId = 'card';

    store.addOrUpdateKeyframe(nodeId, 'rotation', 1.2, 180);
    const track = useStudioStore.getState().nodes[nodeId].tracks.find(t => t.property === 'rotation');
    expect(track).toBeDefined();
    const kf = track?.keyframes.find(k => Math.abs(k.time - 1.2) < 0.05);
    expect(kf).toBeDefined();
    expect(kf?.value).toBe(180);

    // Update curve
    if (kf) {
      store.updateKeyframeCurve(nodeId, 'rotation', kf.id, { x1: 0.1, y1: 0.2, x2: 0.8, y2: 0.9 });
      const updatedKf = useStudioStore.getState().nodes[nodeId].tracks.find(t => t.property === 'rotation')?.keyframes.find(k => k.id === kf.id);
      expect(updatedKf?.curve?.x1).toBe(0.1);
    }
  });

  it('supports vector path anchor point additions', () => {
    const store = useStudioStore.getState();
    const pathId = `path-${Date.now()}`;

    store.addNode({
      id: pathId,
      name: 'Custom Path',
      type: 'path',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: 'transparent',
      pathPoints: [{ x: 10, y: 10, type: 'move' }],
      tracks: []
    });

    store.addPathPoint(pathId, { x: 50, y: 80, cp1x: 30, cp1y: 60, type: 'cubic' });
    expect(useStudioStore.getState().nodes[pathId].pathPoints?.length).toBe(2);
  });

  it('automatically inserts keyframes when Auto-Keyframing is active', () => {
    const store = useStudioStore.getState();
    const nodeId = 'card';

    // Enable Auto-Keyframing
    store.toggleAutoKeyframe();
    expect(useStudioStore.getState().isAutoKeyframe).toBe(true);

    // Set time to 1.5s
    store.setCurrentTime(1.5);

    // Update node properties
    store.updateNode(nodeId, { x: 280, rotation: 90, pivotX: 0.25 });

    const cardNode = useStudioStore.getState().nodes[nodeId];
    const xTrack = cardNode.tracks.find(t => t.property === 'x');
    const rotTrack = cardNode.tracks.find(t => t.property === 'rotation');
    const pivotTrack = cardNode.tracks.find(t => t.property === 'pivotX');

    expect(xTrack).toBeDefined();
    expect(rotTrack).toBeDefined();
    expect(pivotTrack).toBeDefined();

    const xKf = xTrack?.keyframes.find(k => Math.abs(k.time - 1.5) < 0.05);
    expect(xKf?.value).toBe(280);

    const rotKf = rotTrack?.keyframes.find(k => Math.abs(k.time - 1.5) < 0.05);
    expect(rotKf?.value).toBe(90);

    const pivotKf = pivotTrack?.keyframes.find(k => Math.abs(k.time - 1.5) < 0.05);
    expect(pivotKf?.value).toBe(0.25);
  });
});
