import { CubicBezierCurve, Keyframe, PropertyTrack, SceneNode, BezierPoint } from './types';
import { evaluateSpring } from './physics';
import { evaluateMotionPath } from './motionPath';

/**
 * Cubic Bezier solver using Newton-Raphson approximation
 * Solves for y given x on cubic bezier curve defined by (0,0), (x1, y1), (x2, y2), (1,1)
 */
export function solveCubicBezier(curve: CubicBezierCurve, t: number): number {
  const { x1, y1, x2, y2 } = curve;

  // Pre-calculated preset curves
  if (x1 === y1 && x2 === y2) return t; // Linear

  // Sample cubic bezier for x(u)
  function sampleCurveX(u: number): number {
    return ((1 - 3 * x2 + 3 * x1) * u + (3 * x2 - 6 * x1)) * u * u + 3 * x1 * u;
  }

  // Sample cubic bezier for y(u)
  function sampleCurveY(u: number): number {
    return ((1 - 3 * y2 + 3 * y1) * u + (3 * y2 - 6 * y1)) * u * u + 3 * y1 * u;
  }

  // Sample derivative dx/du
  function sampleCurveDerivativeX(u: number): number {
    return (3 * (1 - 3 * x2 + 3 * x1) * u + 2 * (3 * x2 - 6 * x1)) * u + 3 * x1;
  }

  // Find u for given t with Newton-Raphson
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = sampleCurveX(u) - t;
    if (Math.abs(x) < 1e-4) break;
    const d = sampleCurveDerivativeX(u);
    if (Math.abs(d) < 1e-4) break;
    u = u - x / d;
  }
  return sampleCurveY(Math.max(0, Math.min(1, u)));
}

export const EASING_CURVES: Record<string, CubicBezierCurve> = {
  linear: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 },
  ease: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 },
  'ease-in': { x1: 0.42, y1: 0.0, x2: 1.0, y2: 1.0 },
  'ease-out': { x1: 0.0, y1: 0.0, x2: 0.58, y2: 1.0 },
  'ease-in-out': { x1: 0.42, y1: 0.0, x2: 0.58, y2: 1.0 },
  'cubic-bezier': { x1: 0.42, y1: 0.0, x2: 0.58, y2: 1.0 },
  spring: { x1: 0.175, y1: 0.885, x2: 0.32, y2: 1.275 }
};

/**
 * Interpolates numeric value between two keyframes (with Spring support)
 */
export function interpolateNumeric(
  k0: Keyframe<number>,
  k1: Keyframe<number>,
  time: number
): number {
  if (time <= k0.time) return k0.value;
  if (time >= k1.time && !k0.spring && k0.easing !== 'spring') return k1.value;

  const duration = Math.max(0.01, k1.time - k0.time);
  const elapsed = time - k0.time;
  const rawProgress = elapsed / duration;

  if (k0.easing === 'spring' || k0.spring) {
    // Spring physics animation
    return evaluateSpring(k0.value, k1.value, elapsed, k0.spring);
  }

  const curve = k0.curve || (k0.easing ? EASING_CURVES[k0.easing] : EASING_CURVES['ease-in-out']);
  const easedProgress = solveCubicBezier(curve, rawProgress);

  return k0.value + (k1.value - k0.value) * easedProgress;
}

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

function parseHexColor(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  if (c.length === 6) {
    const num = parseInt(c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  return [0, 0, 0];
}

/**
 * Interpolates hex color values
 */
export function interpolateColor(
  k0: Keyframe<string>,
  k1: Keyframe<string>,
  time: number
): string {
  if (time <= k0.time) return k0.value;
  if (time >= k1.time) return k1.value;

  const rawProgress = (time - k0.time) / (k1.time - k0.time);
  const curve = k0.curve || (k0.easing ? EASING_CURVES[k0.easing] : EASING_CURVES['ease-in-out']);
  const easedProgress = solveCubicBezier(curve, rawProgress);

  const [r0, g0, b0] = parseHexColor(k0.value);
  const [r1, g1, b1] = parseHexColor(k1.value);

  const r = Math.round(r0 + (r1 - r0) * easedProgress);
  const g = Math.round(g0 + (g1 - g0) * easedProgress);
  const b = Math.round(b0 + (b1 - b0) * easedProgress);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Binary search for the active keyframe segment [k0, k1] covering timestamp t.
 * Assumes keyframes array is pre-sorted by time (Constitution Rule 56 & 130).
 * Space Complexity: O(1) (zero allocations)
 * Time Complexity: O(log N)
 */
export function findKeyframeSegment<T>(
  keyframes: Keyframe<T>[],
  time: number
): [Keyframe<T>, Keyframe<T>] | null {
  const len = keyframes.length;
  if (len < 2) return null;

  let low = 0;
  let high = len - 2;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const k0 = keyframes[mid];
    const k1 = keyframes[mid + 1];

    if (time < k0.time) {
      high = mid - 1;
    } else if (time > k1.time) {
      low = mid + 1;
    } else {
      return [k0, k1];
    }
  }

  return null;
}

/**
 * Evaluates a track value at arbitrary time t using O(log N) binary search.
 * Zero array allocation in the animation evaluation hot path.
 */
export function evaluateTrack(track: PropertyTrack<any>, time: number, defaultValue: any): any {
  const keyframes = track.keyframes;
  if (!keyframes || keyframes.length === 0) return defaultValue;
  if (keyframes.length === 1) return keyframes[0].value;

  // Boundary checks (O(1))
  if (time <= keyframes[0].time) return keyframes[0].value;
  const lastKf = keyframes[keyframes.length - 1];
  if (time >= lastKf.time) return lastKf.value;

  // O(log N) Binary Search Segment Lookup
  const segment = findKeyframeSegment(keyframes, time);
  if (!segment) return defaultValue;

  const [k0, k1] = segment;
  if (typeof k0.value === 'number' && typeof k1.value === 'number') {
    return interpolateNumeric(k0, k1, time);
  }
  if (Array.isArray(k0.value) && Array.isArray(k1.value)) {
    return interpolatePathPoints(k0, k1, time);
  }
  if (
    typeof k0.value === 'string' &&
    typeof k1.value === 'string' &&
    k0.value.startsWith('#') &&
    k1.value.startsWith('#')
  ) {
    return interpolateColor(k0, k1, time);
  }

  return k0.value;
}

/**
 * Evaluates animated state of a scene node at timestamp t
 * (Supports Motion Path & Auto-Orientation when linked to a Path node)
 */
export function evaluateNode(
  node: SceneNode,
  time: number,
  allNodes?: Record<string, SceneNode>
): SceneNode {
  const evaluated = { ...node };

  if (node.tracks && node.tracks.length > 0) {
    for (const track of node.tracks) {
      const val = evaluateTrack(track, time, (node as any)[track.property]);
      (evaluated as any)[track.property] = val;
    }
  }

  // Evaluate Motion Path Trajectory & Auto-Orientation
  if (node.motionPath && node.motionPath.pathNodeId && allNodes) {
    const targetPath = allNodes[node.motionPath.pathNodeId];
    if (targetPath && targetPath.pathPoints && targetPath.pathPoints.length > 0) {
      const progress = (evaluated as any).motionPathProgress ?? node.motionPath.progress;
      const motion = evaluateMotionPath(targetPath.pathPoints, progress, (targetPath as any).closed);

      evaluated.x = motion.x - node.width / 2;
      evaluated.y = motion.y - node.height / 2;

      if (node.motionPath.autoOrient) {
        evaluated.rotation = motion.angle + (node.motionPath.offsetAngle || 0);
      }
    }
  }

  return evaluated;
}
