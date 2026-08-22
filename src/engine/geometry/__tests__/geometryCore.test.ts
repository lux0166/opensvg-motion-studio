import { describe, it, expect } from 'vitest';
import {
  evalCubicBezier,
  computePathMetrics,
  samplePointAtDistance,
  flattenPathToPolygon,
  isPointInsidePolygon
} from '../geometryCore';
import { BezierPoint } from '../../types';

describe('Geometry Core Engine (CORE-10 & Section 5)', () => {
  it('evaluates cubic Bezier points at t=0, t=0.5, t=1', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 0, y: 100 };
    const p2 = { x: 100, y: 100 };
    const p3 = { x: 100, y: 0 };

    const ptStart = evalCubicBezier(p0, p1, p2, p3, 0);
    const ptMid = evalCubicBezier(p0, p1, p2, p3, 0.5);
    const ptEnd = evalCubicBezier(p0, p1, p2, p3, 1.0);

    expect(ptStart.x).toBe(0);
    expect(ptStart.y).toBe(0);
    expect(ptMid.x).toBe(50);
    expect(ptMid.y).toBe(75);
    expect(ptEnd.x).toBe(100);
    expect(ptEnd.y).toBe(0);
  });

  it('computes accurate arc-length and samples points at distance', () => {
    const straightLine: BezierPoint[] = [
      { x: 0, y: 0, type: 'move' },
      { x: 100, y: 0, type: 'line' }
    ];

    const metrics = computePathMetrics(straightLine, 10);
    expect(metrics.totalLength).toBeCloseTo(100, 1);

    const sampleHalfway = samplePointAtDistance(metrics, 50);
    expect(sampleHalfway.point.x).toBeCloseTo(50, 0);
    expect(sampleHalfway.point.y).toBeCloseTo(0, 1);
  });

  it('performs ray-casting point-in-polygon hit testing and path flattening', () => {
    const straightLine: BezierPoint[] = [
      { x: 0, y: 0, type: 'move' },
      { x: 100, y: 0, type: 'line' }
    ];
    const poly = flattenPathToPolygon(straightLine, 5);
    expect(poly.length).toBeGreaterThan(0);

    const polygon = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ];

    expect(isPointInsidePolygon({ x: 50, y: 50 }, polygon)).toBe(true);
    expect(isPointInsidePolygon({ x: 150, y: 50 }, polygon)).toBe(false);
    expect(isPointInsidePolygon({ x: -10, y: -10 }, polygon)).toBe(false);
  });
});
