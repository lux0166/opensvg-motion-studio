import { describe, it, expect } from 'vitest';
import { isPointInPathGeometry, flattenBezierPath } from '../geometryHitTest';
import { BezierPoint } from '../../types';

describe('Exact Cubic Bézier Path Hit Testing (Section 5)', () => {
  it('correctly flattens curved bezier segments using cubic de Casteljau / polynomial evaluation', () => {
    // S-curve segment
    const points: BezierPoint[] = [
      { x: 0, y: 0, cp2x: 0, cp2y: 100 },
      { x: 100, y: 100, cp1x: 100, cp1y: 0 }
    ];

    const flattened = flattenBezierPath(points, 10);
    expect(flattened.length).toBeGreaterThanOrEqual(10);
    expect(flattened[0]).toEqual({ x: 0, y: 0 });
    expect(flattened[flattened.length - 1]).toEqual({ x: 100, y: 100 });
  });

  it('tests points inside and outside the convex bulge of a curved Bezier path', () => {
    // Path forming a curved teardrop / arch:
    // Bottom line from (0,0) to (100,0)
    // Curved top from (100,0) curving up to (50, 80) and back to (0,0)
    const archPath: BezierPoint[] = [
      { x: 0, y: 0, cp2x: 0, cp2y: 80 },
      { x: 100, y: 0, cp1x: 100, cp1y: 80 },
      { x: 0, y: 0 }
    ];

    // Point (50, 40) is clearly inside the arch's curved region
    expect(isPointInPathGeometry({ x: 50, y: 40 }, archPath)).toBe(true);

    // Point (50, 100) is far above the curve apex (outside)
    expect(isPointInPathGeometry({ x: 50, y: 100 }, archPath)).toBe(false);

    // Point (50, -10) is below the flat base (outside)
    expect(isPointInPathGeometry({ x: 50, y: -10 }, archPath)).toBe(false);
  });
});
