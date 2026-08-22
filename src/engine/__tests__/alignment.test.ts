import { describe, it, expect } from 'vitest';
import { alignNodes, distributeSpacing } from '../alignment';
import { SceneNode } from '../types';

describe('Alignment & Equal Spacing Engine (Rules G9 & G10)', () => {
  const nodes: Record<string, SceneNode> = {
    n1: {
      id: 'n1', name: 'N1', type: 'rect', visible: true, locked: false,
      x: 10, y: 20, width: 50, height: 40, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, borderRadius: 0, fill: '#fff', tracks: []
    },
    n2: {
      id: 'n2', name: 'N2', type: 'rect', visible: true, locked: false,
      x: 100, y: 80, width: 60, height: 40, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, borderRadius: 0, fill: '#fff', tracks: []
    },
    n3: {
      id: 'n3', name: 'N3', type: 'rect', visible: true, locked: false,
      x: 200, y: 150, width: 40, height: 40, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, borderRadius: 0, fill: '#fff', tracks: []
    }
  };

  it('aligns left edges correctly', () => {
    const updates = alignNodes(nodes, ['n1', 'n2', 'n3'], 'left');
    expect(updates.length).toBe(3);
    expect(updates.every((u) => u.x === 10)).toBe(true);
  });

  it('aligns centers correctly', () => {
    const updates = alignNodes(nodes, ['n1', 'n2'], 'center');
    expect(updates.length).toBe(2);
    // n1 (10..60), n2 (100..160) -> span 10..160, center = 85
    // n1 x = 85 - 25 = 60, n2 x = 85 - 30 = 55
    expect(updates[0].x).toBe(60);
    expect(updates[1].x).toBe(55);
  });

  it('distributes horizontal spacing evenly between edges (Rule G10)', () => {
    const updates = distributeSpacing(nodes, ['n1', 'n2', 'n3'], 'horizontal');
    // Total span: 10 to (200 + 40) = 230. Total item widths = 50 + 60 + 40 = 150.
    // Available gap space = 230 - 150 = 80. Gap = 80 / 2 = 40.
    // n1 stays at 10. n2 placed at 10 + 50 + 40 = 100. n3 stays at 200.
    expect(updates.length).toBe(1);
    expect(updates[0].id).toBe('n2');
    expect(updates[0].x).toBe(100);
  });
});
