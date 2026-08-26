import { describe, it, expect } from 'vitest';
import { computeCanonicalWorldTransforms } from '../evaluationPipeline';
import { SceneNode } from '../../types';

describe('Unbounded Canonical Hierarchy Resolution (Section 6)', () => {
  it('correctly resolves deep 50-level nested hierarchy transforms without artificial depth cutoffs', () => {
    const depth = 50;
    const nodes: Record<string, SceneNode> = {};
    const nodeOrder: string[] = [];

    for (let i = 0; i < depth; i++) {
      const id = `node-${i}`;
      const parentId = i > 0 ? `node-${i - 1}` : undefined;

      nodes[id] = {
        id,
        name: `Node Level ${i}`,
        type: 'rect',
        visible: true,
        locked: false,
        parentId,
        x: 10,
        y: 5,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#ffffff',
        tracks: []
      };
      nodeOrder.push(id);
    }

    const transforms = computeCanonicalWorldTransforms(nodes, nodeOrder);

    // Deepest node (level 49) must have accumulated total X translation = 50 * 10 = 500, Y = 50 * 5 = 250
    const deepestNodeTransform = transforms[`node-${depth - 1}`];
    expect(deepestNodeTransform).toBeDefined();
    expect(deepestNodeTransform.worldTransform.e).toBeCloseTo(500, 1);
    expect(deepestNodeTransform.worldTransform.f).toBeCloseTo(250, 1);
  });
});
