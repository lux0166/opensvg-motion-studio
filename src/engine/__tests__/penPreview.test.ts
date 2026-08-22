import { describe, it, expect } from 'vitest';
import { computePenPreview, snapAngleToCardinal } from '../penPreview';
import { BezierPoint } from '../types';

describe('Pen Tool Ephemeral Preview Engine (Rules G6, G7, G8)', () => {
  it('snaps angles to nearest 45 degree cardinal angle (Rule G8)', () => {
    // 10 deg (0.174 rad) snaps to 0 deg
    expect(snapAngleToCardinal(0.174, 45)).toBeCloseTo(0);
    // 40 deg (0.698 rad) snaps to 45 deg (0.785 rad)
    expect(snapAngleToCardinal(0.698, 45)).toBeCloseTo((45 * Math.PI) / 180);
  });

  it('generates ephemeral preview line to cursor (Rule G6)', () => {
    const points: BezierPoint[] = [
      { x: 0, y: 0, type: 'move' },
      { x: 100, y: 0, type: 'line' }
    ];

    const res = computePenPreview(points, { x: 100, y: 100 });
    expect(res.previewPoints.length).toBe(3);
    expect(res.previewPoints[2].x).toBe(100);
    expect(res.previewPoints[2].y).toBe(100);
    expect(res.isClosed).toBe(false);
  });

  it('detects path close hover near first point (Rule G7)', () => {
    const points: BezierPoint[] = [
      { x: 50, y: 50, type: 'move' },
      { x: 150, y: 50, type: 'line' },
      { x: 150, y: 150, type: 'line' }
    ];

    // Hover at (52, 51) near first point (50, 50)
    const res = computePenPreview(points, { x: 52, y: 51 }, false, 10);
    expect(res.isClosed).toBe(true);
    expect(res.previewPoints[res.previewPoints.length - 1].type).toBe('close');
  });
});
