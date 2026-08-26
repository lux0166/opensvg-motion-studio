import { BezierPoint, Keyframe } from '../types';
import { solveCubicBezier, EASING_CURVES } from './timing';

/**
 * Interpolates vector Bezier points for smooth Path Morphing
 */
export function interpolatePathPoints(
  k0: Keyframe<BezierPoint[]>,
  k1: Keyframe<BezierPoint[]>,
  time: number
): BezierPoint[] {
  if (time <= k0.time) return k0.value;
  if (time >= k1.time) return k1.value;

  const rawProgress = (time - k0.time) / (k1.time - k0.time);
  const curve = k0.curve || (k0.easing ? EASING_CURVES[k0.easing] : EASING_CURVES['ease-in-out']);
  const easedProgress = solveCubicBezier(curve, rawProgress);

  const pts0 = k0.value || [];
  const pts1 = k1.value || [];
  const maxLen = Math.max(pts0.length, pts1.length);
  const result: BezierPoint[] = [];

  for (let i = 0; i < maxLen; i++) {
    const p0 = pts0[i] || pts0[pts0.length - 1] || { x: 0, y: 0, type: 'cubic' as const };
    const p1 = pts1[i] || pts1[pts1.length - 1] || { x: 0, y: 0, type: 'cubic' as const };

    const x = p0.x + (p1.x - p0.x) * easedProgress;
    const y = p0.y + (p1.y - p0.y) * easedProgress;

    const pt: BezierPoint = {
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2)),
      type: p1.type || p0.type || 'cubic'
    };

    if (p0.cp1x !== undefined || p1.cp1x !== undefined) {
      const c1x0 = p0.cp1x ?? p0.x;
      const c1x1 = p1.cp1x ?? p1.x;
      const c1y0 = p0.cp1y ?? p0.y;
      const c1y1 = p1.cp1y ?? p1.y;
      pt.cp1x = parseFloat((c1x0 + (c1x1 - c1x0) * easedProgress).toFixed(2));
      pt.cp1y = parseFloat((c1y0 + (c1y1 - c1y0) * easedProgress).toFixed(2));
    }

    if (p0.cp2x !== undefined || p1.cp2x !== undefined) {
      const c2x0 = p0.cp2x ?? p0.x;
      const c2x1 = p1.cp2x ?? p1.x;
      const c2y0 = p0.cp2y ?? p0.y;
      const c2y1 = p1.cp2y ?? p1.y;
      pt.cp2x = parseFloat((c2x0 + (c2x1 - c2x0) * easedProgress).toFixed(2));
      pt.cp2y = parseFloat((c2y0 + (c2y1 - c2y0) * easedProgress).toFixed(2));
    }

    result.push(pt);
  }

  return result;
}
