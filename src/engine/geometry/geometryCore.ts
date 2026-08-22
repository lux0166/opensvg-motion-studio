import { BezierPoint } from '../types';
import { Vec2 } from '../runtime/coreContracts';
import { pointDistance } from '../geometry';

/**
 * OpenSVG Geometry Core Engine
 * Adheres strictly to CORE_ENGINE_DEPTH.md (Section 5) & RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md (CORE-10)
 * W3C SVG Paths reference: https://www.w3.org/TR/SVG/paths.html
 */

export interface PathMetricSample {
  distance: number;
  point: Vec2;
  tangent: Vec2; // Normalized direction vector
  angle: number; // in degrees
}

export interface PathMetrics {
  totalLength: number;
  samples: PathMetricSample[];
}

/**
 * Evaluates a point along a cubic Bezier segment at parameter t (0 <= t <= 1)
 */
export function evalCubicBezier(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  t: number
): Vec2 {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
  };
}

/**
 * Computes exact cumulative arc-length and high-density metric samples along a Bezier path
 */
export function computePathMetrics(points: BezierPoint[], samplesPerSegment: number = 20): PathMetrics {
  if (!points || points.length < 2) {
    return { totalLength: 0, samples: [] };
  }

  const samples: PathMetricSample[] = [];
  let totalLength = 0;
  let prevPt: Vec2 = { x: points[0].x, y: points[0].y };

  samples.push({
    distance: 0,
    point: prevPt,
    tangent: { x: 1, y: 0 },
    angle: 0
  });

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p3 = points[i];

    const cp1 = { x: p0.cp2x ?? p0.x, y: p0.cp2y ?? p0.y };
    const cp2 = { x: p3.cp1x ?? p3.x, y: p3.cp1y ?? p3.y };

    for (let step = 1; step <= samplesPerSegment; step++) {
      const t = step / samplesPerSegment;
      const currentPt = evalCubicBezier(p0, cp1, cp2, p3, t);
      const d = pointDistance(prevPt.x, prevPt.y, currentPt.x, currentPt.y);
      totalLength += d;

      const dx = currentPt.x - prevPt.x;
      const dy = currentPt.y - prevPt.y;
      const len = Math.hypot(dx, dy) || 1;
      const tangent = { x: dx / len, y: dy / len };
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      samples.push({
        distance: totalLength,
        point: currentPt,
        tangent,
        angle
      });

      prevPt = currentPt;
    }
  }

  return { totalLength, samples };
}

/**
 * Samples a point and tangent at arbitrary distance along the path using binary search
 */
export function samplePointAtDistance(metrics: PathMetrics, targetDistance: number): PathMetricSample {
  const { samples, totalLength } = metrics;
  if (!samples || samples.length === 0) {
    return { distance: 0, point: { x: 0, y: 0 }, tangent: { x: 1, y: 0 }, angle: 0 };
  }

  const clampedDist = Math.max(0, Math.min(totalLength, targetDistance));

  let low = 0;
  let high = samples.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const sample = samples[mid];

    if (Math.abs(sample.distance - clampedDist) < 1e-3) {
      return sample;
    }

    if (sample.distance < clampedDist) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const idx = Math.min(samples.length - 1, Math.max(0, low));
  return samples[idx];
}

/**
 * Flattens a Bezier path into a polygon vertex list
 */
export function flattenPathToPolygon(points: BezierPoint[], tolerance: number = 10): Vec2[] {
  const metrics = computePathMetrics(points, tolerance);
  return metrics.samples.map((s) => s.point);
}

/**
 * Performs Ray-Casting Point-in-Polygon hit testing (Even-Odd winding rule)
 */
export function isPointInsidePolygon(pt: Vec2, polygon: Vec2[]): boolean {
  if (!polygon || polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}
