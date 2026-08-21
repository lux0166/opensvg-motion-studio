import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '../../store/useStudioStore';

describe('Multi-Selection & Grouping Engine', () => {
  beforeEach(() => {
    useStudioStore.setState({
      past: [],
      future: [],
      nodes: {
        nodeA: {
          id: 'nodeA',
          name: 'Box A',
          type: 'rect',
          visible: true,
          locked: false,
          x: 10,
          y: 20,
          width: 50,
          height: 60,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          borderRadius: 0,
          fill: '#ff0000',
          tracks: []
        },
        nodeB: {
          id: 'nodeB',
          name: 'Box B',
          type: 'rect',
          visible: true,
          locked: false,
          x: 100,
          y: 120,
          width: 80,
          height: 80,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          borderRadius: 0,
          fill: '#00ff00',
          tracks: []
        }
      },
      nodeOrder: ['nodeA', 'nodeB'],
      selectedId: 'nodeA',
      selectedIds: ['nodeA']
    });
  });

  it('correctly toggles and manages multi-selection with shift key', () => {
    const store = useStudioStore.getState();

    // Shift select nodeB
    store.toggleSelectId('nodeB', true);
    expect(useStudioStore.getState().selectedIds).toEqual(['nodeA', 'nodeB']);

    // Shift click nodeA to deselect it
    store.toggleSelectId('nodeA', true);
    expect(useStudioStore.getState().selectedIds).toEqual(['nodeB']);
    expect(useStudioStore.getState().selectedId).toBe('nodeB');
  });

  it('groups multiple selected nodes into a GroupNode with collective bounding box', () => {
    const store = useStudioStore.getState();
    store.setSelectedIds(['nodeA', 'nodeB']);

    store.groupSelected();

    const state = useStudioStore.getState();
    const groupId = state.selectedId!;
    expect(groupId).toMatch(/^group-/);

    const groupNode = state.nodes[groupId];
    expect(groupNode).toBeDefined();
    expect(groupNode.type).toBe('group');
    expect(groupNode.childrenIds).toEqual(['nodeA', 'nodeB']);

    // Check collective bounding box (minX=10, minY=20, maxX=180, maxY=200 -> w=170, h=180)
    expect(groupNode.x).toBe(10);
    expect(groupNode.y).toBe(20);
    expect(groupNode.width).toBe(170);
    expect(groupNode.height).toBe(180);

    // Check children have parentId set
    expect(state.nodes['nodeA'].parentId).toBe(groupId);
    expect(state.nodes['nodeB'].parentId).toBe(groupId);
  });

  it('ungroups a group node and restores children to top-level order', () => {
    const store = useStudioStore.getState();
    store.setSelectedIds(['nodeA', 'nodeB']);
    store.groupSelected();

    const groupId = useStudioStore.getState().selectedId!;
    expect(useStudioStore.getState().nodes[groupId]).toBeDefined();

    // Ungroup
    useStudioStore.getState().ungroupSelected();

    const state = useStudioStore.getState();
    expect(state.nodes[groupId]).toBeUndefined();
    expect(state.nodes['nodeA'].parentId).toBeNull();
    expect(state.nodes['nodeB'].parentId).toBeNull();
    expect(state.nodeOrder).toContain('nodeA');
    expect(state.nodeOrder).toContain('nodeB');
  });
});
