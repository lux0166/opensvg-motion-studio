import { describe, it, expect } from 'vitest';
import { computeSnapping } from '../snapping';
import { FrameNode, SceneNode } from '../types';

describe('Smart Magnetic Snapping Engine', () => {
  const rootFrame: FrameNode = {
    id: 'frame-1',
    name: 'Frame',
    type: 'frame',
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

  const otherNodes: SceneNode[] = [
    {
      id: 'target-card',
      name: 'Card',
      type: 'rect',
      visible: true,
      locked: false,
      x: 100,
      y: 100,
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
  ];

  it('snaps to canvas center X when dragging near center (300px)', () => {
    // dragging node with width 100 near center (x = 248 -> center = 298, threshold < 6)
    const result = computeSnapping('drag-node', 248, 50, 100, 100, rootFrame, otherNodes);
    expect(result.x).toBe(250); // 300 - 100/2 = 250
    expect(result.snapLines.length).toBeGreaterThanOrEqual(1);
    expect(result.snapLines[0].value).toBe(300);
  });

  it('snaps to target node left edge when dragging within threshold', () => {
    // target node x = 100. dragging node x = 103
    const result = computeSnapping('drag-node', 103, 300, 80, 80, rootFrame, otherNodes);
    expect(result.x).toBe(100);
    expect(result.snapLines.some(s => s.type === 'x' && s.value === 100)).toBe(true);
  });

  it('does not snap when outside threshold distance', () => {
    const result = computeSnapping('drag-node', 20, 20, 50, 50, rootFrame, otherNodes);
    expect(result.x).toBe(20);
    expect(result.y).toBe(20);
    expect(result.snapLines.length).toBe(0);
  });
});
