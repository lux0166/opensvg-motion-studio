import { describe, it, expect } from 'vitest';
import {
  nodeToPolygon,
  isPointInPolygon,
  computeConvexHull,
  executeBooleanOperation
} from '../booleanOps';
import { SceneNode } from '../types';
import { useStudioStore } from '../../store/useStudioStore';

describe('Vector Path Boolean Operations Engine', () => {
  const rectA: SceneNode = {
    id: 'rect-a',
    name: 'Rect A',
    type: 'rect',
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
    fill: '#3b82f6',
    tracks: []
  };

  const rectB: SceneNode = {
    id: 'rect-b',
    name: 'Rect B',
    type: 'rect',
    visible: true,
    locked: false,
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 0,
    fill: '#ef4444',
    tracks: []
  };

  it('converts nodes to polygon coordinates accurately', () => {
    const polyA = nodeToPolygon(rectA);
    expect(polyA.length).toBe(4);
    expect(polyA[0]).toEqual({ x: 0, y: 0 });
    expect(polyA[2]).toEqual({ x: 100, y: 100 });
  });

  it('identifies points inside and outside polygon', () => {
    const poly = nodeToPolygon(rectA);
    expect(isPointInPolygon({ x: 50, y: 50 }, poly)).toBe(true);
    expect(isPointInPolygon({ x: 150, y: 150 }, poly)).toBe(false);
  });

  it('computes 2D convex hull of overlapping shapes', () => {
    const allPoints = [...nodeToPolygon(rectA), ...nodeToPolygon(rectB)];
    const hull = computeConvexHull(allPoints);
    expect(hull.length).toBeGreaterThanOrEqual(4);
  });

  it('executes Union operation creating compound path node', () => {
    const result = executeBooleanOperation([rectA, rectB], 'union', 'compound-1');
    expect(result).toBeDefined();
    expect(result?.type).toBe('path');
    expect(result?.pathPoints).toBeDefined();
    expect(result?.pathPoints!.length).toBeGreaterThanOrEqual(4);
    expect(result?.width).toBe(150);
    expect(result?.height).toBe(150);
  });

  it('applies boolean operations in studio store', () => {
    useStudioStore.setState({
      nodes: {
        'rect-a': rectA,
        'rect-b': rectB
      },
      nodeOrder: ['rect-a', 'rect-b'],
      selectedIds: ['rect-a', 'rect-b']
    });

    useStudioStore.getState().applyBooleanOp('union');

    const state = useStudioStore.getState();
    expect(state.nodeOrder.length).toBe(1);
    const compoundId = state.nodeOrder[0];
    const compoundNode = state.nodes[compoundId];
    expect(compoundNode.type).toBe('path');
    expect(state.selectedId).toBe(compoundId);
  });
});
