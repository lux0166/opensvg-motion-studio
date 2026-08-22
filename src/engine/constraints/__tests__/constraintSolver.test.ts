import { describe, it, expect } from 'vitest';
import { solveConstraint, solveAllConstraints, Constraint } from '../constraintSolver';
import { SceneNode } from '../../types';

describe('Constraint Engine v1 (CORE-05 & Section 7)', () => {
  const nodeA: SceneNode = {
    id: 'nodeA', name: 'Node A', type: 'rect', visible: true, locked: false,
    x: 0, y: 0, width: 50, height: 50, rotation: 0, scaleX: 1, scaleY: 1,
    opacity: 1, borderRadius: 0, fill: '#fff', tracks: []
  };

  const nodeB: SceneNode = {
    id: 'nodeB', name: 'Node B', type: 'rect', visible: true, locked: false,
    x: 100, y: 100, width: 50, height: 50, rotation: 90, scaleX: 2, scaleY: 2,
    opacity: 1, borderRadius: 0, fill: '#fff', tracks: []
  };

  it('solves translation constraint with strength weighting', () => {
    const constraint: Constraint = {
      id: 'c1', type: 'translation', ownerId: 'nodeA', targetId: 'nodeB',
      enabled: true, strength: 0.5
    };

    // Owner (0,0) -> Target (100,100) with strength 0.5 => (50, 50)
    const updates = solveConstraint(constraint, nodeA, nodeB);
    expect(updates.x).toBe(50);
    expect(updates.y).toBe(50);
  });

  it('solves rotation constraint with full strength', () => {
    const constraint: Constraint = {
      id: 'c2', type: 'rotation', ownerId: 'nodeA', targetId: 'nodeB',
      enabled: true, strength: 1.0
    };

    const updates = solveConstraint(constraint, nodeA, nodeB);
    expect(updates.rotation).toBe(90);
  });

  it('solves distance constraint with exact distance', () => {
    const constraint: Constraint = {
      id: 'c3', type: 'distance', ownerId: 'nodeA', targetId: 'nodeB',
      enabled: true, strength: 1.0, distance: 50, mode: 'exact'
    };

    const updates = solveConstraint(constraint, nodeA, nodeB);
    expect(updates.x).toBeDefined();
    expect(updates.y).toBeDefined();
  });

  it('safely detects and breaks circular constraint loops (Rule CORE-05)', () => {
    const constraints: Constraint[] = [
      { id: 'c-ab', type: 'translation', ownerId: 'nodeA', targetId: 'nodeB', enabled: true, strength: 1 },
      { id: 'c-ba', type: 'translation', ownerId: 'nodeB', targetId: 'nodeA', enabled: true, strength: 1 }
    ];

    const result = solveAllConstraints({ nodeA, nodeB }, constraints);
    expect(result.nodeA.x).toBe(100);
    // NodeB should not get stuck in infinite recursive loop
    expect(result.nodeB.x).toBe(100);
  });
});
