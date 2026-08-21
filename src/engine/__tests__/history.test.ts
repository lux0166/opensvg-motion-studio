import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '../../store/useStudioStore';
import { createStudioSnapshot } from '../history';

describe('Studio History & Undo/Redo Engine', () => {
  beforeEach(() => {
    useStudioStore.setState({
      past: [],
      future: [],
      nodes: {},
      nodeOrder: [],
      selectedId: 'frame-1'
    });
  });

  it('creates an isolated deep snapshot without mutating original references', () => {
    const rf = {
      id: 'frame-1',
      name: 'Frame',
      type: 'frame' as const,
      visible: true,
      locked: false,
      clipContent: true,
      canvasBg: '#ffffff',
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
    const nodes = {
      card: {
        id: 'card',
        name: 'Card',
        type: 'rect' as const,
        visible: true,
        locked: false,
        x: 10,
        y: 20,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#000',
        tracks: []
      }
    };

    const snap = createStudioSnapshot(rf, nodes, ['card']);
    nodes.card.x = 999;

    expect(snap.nodes.card.x).toBe(10);
  });

  it('correctly handles Undo and Redo cycles when nodes are added and deleted', () => {
    const store = useStudioStore.getState();

    // 1. Add node
    store.addNode({
      id: 'box-1',
      name: 'Box 1',
      type: 'rect',
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
      fill: '#3b82f6',
      tracks: []
    });

    expect(useStudioStore.getState().nodeOrder).toContain('box-1');
    expect(useStudioStore.getState().past.length).toBe(1);

    // 2. Undo
    useStudioStore.getState().undo();
    expect(useStudioStore.getState().nodeOrder).not.toContain('box-1');
    expect(useStudioStore.getState().future.length).toBe(1);

    // 3. Redo
    useStudioStore.getState().redo();
    expect(useStudioStore.getState().nodeOrder).toContain('box-1');
    expect(useStudioStore.getState().past.length).toBe(1);
    expect(useStudioStore.getState().future.length).toBe(0);
  });

  it('correctly duplicates selected node with offset', () => {
    const store = useStudioStore.getState();
    store.addNode({
      id: 'source-node',
      name: 'Target Element',
      type: 'circle',
      visible: true,
      locked: false,
      x: 100,
      y: 150,
      width: 60,
      height: 60,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 9999,
      fill: '#10b981',
      tracks: []
    });

    useStudioStore.setState({ selectedId: 'source-node' });
    useStudioStore.getState().duplicateSelected();

    const state = useStudioStore.getState();
    expect(state.nodeOrder.length).toBe(2);

    const dupId = state.selectedId!;
    expect(dupId).not.toBe('source-node');
    expect(state.nodes[dupId].name).toBe('Target Element Copy');
    expect(state.nodes[dupId].x).toBe(120);
    expect(state.nodes[dupId].y).toBe(170);
  });
});
