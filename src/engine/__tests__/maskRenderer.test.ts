import { describe, it, expect } from 'vitest';
import { getRenderableNodes, resolveMaskPairs } from '../maskRenderer';
import { SceneNode } from '../types';

describe('Layer Masking & Solo Mode Engine (Rules L1, L2, L3, L6)', () => {
  const mockNodes: Record<string, SceneNode> = {
    rect1: {
      id: 'rect1', name: 'Rect 1', type: 'rect', visible: true, locked: false,
      x: 0, y: 0, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, borderRadius: 0, fill: '#f00', tracks: []
    },
    rect2: {
      id: 'rect2', name: 'Rect 2', type: 'rect', visible: true, locked: false,
      x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, borderRadius: 0, fill: '#0f0', tracks: []
    }
  };

  it('filters nodes in solo mode without mutating canonical visibility (Rule L6)', () => {
    const renderable = getRenderableNodes(mockNodes, ['rect1', 'rect2'], 'rect2');
    expect(renderable.length).toBe(1);
    expect(renderable[0].id).toBe('rect2');
    // Document visibility must still be true
    expect(mockNodes.rect1.visible).toBe(true);
  });

  it('resolves mask pairs explicitly (Rule L3)', () => {
    const nodesList: SceneNode[] = [
      { ...mockNodes.rect1, isMask: true, maskTargetId: 'rect2', maskMode: 'alpha' },
      mockNodes.rect2
    ];

    const { normalNodes, maskPairs } = resolveMaskPairs(nodesList);
    expect(maskPairs.length).toBe(1);
    expect(maskPairs[0].mask.id).toBe('rect1');
    expect(maskPairs[0].target.id).toBe('rect2');
    expect(maskPairs[0].mode).toBe('alpha');
    expect(normalNodes.length).toBe(0);
  });
});
