import { describe, it, expect } from 'vitest';
import { computeWorldTransform, getDescendantNodeIds } from '../hierarchy';
import { SceneNode } from '../types';

describe('Hierarchy & Transform Inheritance Engine (Rules L4 & L5)', () => {
  const nodes: Record<string, SceneNode> = {
    group1: {
      id: 'group1',
      name: 'Group 1',
      type: 'frame',
      visible: true,
      locked: false,
      x: 100,
      y: 50,
      width: 400,
      height: 300,
      rotation: 0,
      scaleX: 2,
      scaleY: 2,
      opacity: 0.8,
      borderRadius: 0,
      fill: '#ffffff',
      tracks: []
    },
    child1: {
      id: 'child1',
      name: 'Child 1',
      type: 'rect',
      parentId: 'group1',
      visible: true,
      locked: false,
      x: 20,
      y: 30,
      width: 100,
      height: 80,
      rotation: 45,
      scaleX: 1,
      scaleY: 1,
      opacity: 0.5,
      borderRadius: 0,
      fill: '#ff0000',
      tracks: []
    },
    grandchild: {
      id: 'grandchild',
      name: 'Grandchild',
      type: 'circle',
      parentId: 'child1',
      visible: true,
      locked: false,
      x: 10,
      y: 10,
      width: 30,
      height: 30,
      rotation: 15,
      scaleX: 1,
      scaleY: 1,
      opacity: 0.9,
      borderRadius: 0,
      fill: '#00ff00',
      tracks: []
    }
  };

  it('correctly calculates derived world transform through parent chain', () => {
    const worldTransform = computeWorldTransform(nodes.child1, nodes);

    // Parent group1 is at (100, 50) with scale (2, 2). Local child is at (20, 30).
    // World pos = 100 + 20*2 = 140, 50 + 30*2 = 110.
    expect(worldTransform.x).toBe(140);
    expect(worldTransform.y).toBe(110);
    expect(worldTransform.rotation).toBe(45);
    expect(worldTransform.scaleX).toBe(2);
    expect(worldTransform.scaleY).toBe(2);
    expect(worldTransform.opacity).toBeCloseTo(0.4); // 0.8 * 0.5 = 0.4
  });

  it('multiplies opacity across deep hierarchy', () => {
    const worldTransform = computeWorldTransform(nodes.grandchild, nodes);
    expect(worldTransform.opacity).toBeCloseTo(0.8 * 0.5 * 0.9); // 0.36
  });

  it('safely breaks cycles in parent references without freezing', () => {
    const cyclicNodes: Record<string, SceneNode> = {
      nodeA: { ...nodes.child1, id: 'nodeA', parentId: 'nodeB' },
      nodeB: { ...nodes.child1, id: 'nodeB', parentId: 'nodeA' }
    };

    const res = computeWorldTransform(cyclicNodes.nodeA, cyclicNodes);
    expect(res).toBeDefined();
  });

  it('retrieves all descendant IDs correctly', () => {
    const descendants = getDescendantNodeIds('group1', nodes);
    expect(descendants).toContain('child1');
    expect(descendants).toContain('grandchild');
    expect(descendants.length).toBe(2);
  });
});
