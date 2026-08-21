import { BezierPoint } from './types';

export interface MotionPathResult {
  x: number;
  y: number;
  angle: number; // in degrees (-180 to 180)
}

interface PathSegment {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  p3: { x: number; y: number };
  length: number;
}

/**
 * Evaluates position and tangent derivative along a cubic Bezier segment
 */
export function evaluateCubicSegment(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  u: number
): MotionPathResult {
  const clampedU = Math.max(0, Math.min(1, u));
  const omt = 1 - clampedU;
  const omt2 = omt * omt;
  const omt3 = omt2 * omt;
  const u2 = clampedU * clampedU;
  const u3 = u2 * clampedU;

  // Cubic Bezier position
  const x = omt3 * p0.x + 3 * omt2 * clampedU * p1.x + 3 * omt * u2 * p2.x + u3 * p3.x;
  const y = omt3 * p0.y + 3 * omt2 * clampedU * p1.y + 3 * omt * u2 * p2.y + u3 * p3.y;

  // Tangent derivative vector B'(u)
  const dx = 3 * omt2 * (p1.x - p0.x) + 6 * omt * clampedU * (p2.x - p1.x) + 3 * u2 * (p3.x - p2.x);
  const dy = 3 * omt2 * (p1.y - p0.y) + 6 * omt * clampedU * (p2.y - p1.y) + 3 * u2 * (p3.y - p2.y);

  // Angle in degrees
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (isNaN(angle)) angle = 0;

  return { x, y, angle };
}

/**
 * Estimates segment length via polyline chord sampling
 */
function estimateSegmentLength(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  samples = 10
): number {
  let total = 0;
  let prevX = p0.x;
  let prevY = p0.y;

  for (let i = 1; i <= samples; i++) {
    const u = i / samples;
    const pt = evaluateCubicSegment(p0, p1, p2, p3, u);
    const d = Math.hypot(pt.x - prevX, pt.y - prevY);
    total += d;
    prevX = pt.x;
    prevY = pt.y;
  }

  return total;
}

/**
 * Evaluates coordinates and auto-orientation tangent along a multi-segment Bezier path
 * (Constitution Rule 08 & 45 - Pure, Deterministic Geometry Function)
 */
export function evaluateMotionPath(
  pathPoints: BezierPoint[],
  progress: number, // 0.0 to 1.0
  closed = false
): MotionPathResult {
  if (!pathPoints || pathPoints.length === 0) {
    return { x: 0, y: 0, angle: 0 };
  }

  if (pathPoints.length === 1) {
    return { x: pathPoints[0].x, y: pathPoints[0].y, angle: 0 };
  }

  const segments: PathSegment[] = [];
  const count = closed ? pathPoints.length : pathPoints.length - 1;

  for (let i = 0; i < count; i++) {
    const ptA = pathPoints[i];
    const ptB = pathPoints[(i + 1) % pathPoints.length];

    const p0 = { x: ptA.x, y: ptA.y };
    const p1 = { x: ptA.cp2x ?? ptA.x, y: ptA.cp2y ?? ptA.y };
    const p2 = { x: ptB.cp1x ?? ptB.x, y: ptB.cp1y ?? ptB.y };
    const p3 = { x: ptB.x, y: ptB.y };

    const length = Math.max(0.001, estimateSegmentLength(p0, p1, p2, p3));
    segments.push({ p0, p1, p2, p3, length });
  }

  const totalLength = segments.reduce((sum, s) => sum + s.length, 0);
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const targetDist = clampedProgress * totalLength;

  let accumulated = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (targetDist <= accumulated + seg.length || i === segments.length - 1) {
      const localDist = targetDist - accumulated;
      const u = Math.max(0, Math.min(1, localDist / seg.length));
      return evaluateCubicSegment(seg.p0, seg.p1, seg.p2, seg.p3, u);
    }
    accumulated += seg.length;
  }

  const last = segments[segments.length - 1];
  return evaluateCubicSegment(last.p0, last.p1, last.p2, last.p3, 1.0);
}
