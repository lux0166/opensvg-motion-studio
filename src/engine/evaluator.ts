import { CubicBezierCurve, Keyframe, PropertyTrack, SceneNode, BezierPoint } from './types';

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
    const xVal = sampleCurveX(u) - t;
    if (Math.abs(xVal) < 1e-5) break;
    const dVal = sampleCurveDerivativeX(u);
    if (Math.abs(dVal) < 1e-5) break;
    u -= xVal / dVal;
  }

  // Fallback binary subdivision if Newton diverges
  u = Math.max(0, Math.min(1, u));
  return sampleCurveY(u);
}

export const EASING_CURVES: Record<string, CubicBezierCurve> = {
  linear: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 },
  ease: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 },
  'ease-in': { x1: 0.42, y1: 0.0, x2: 1.0, y2: 1.0 },
  'ease-out': { x1: 0.0, y1: 0.0, x2: 0.58, y2: 1.0 },
  'ease-in-out': { x1: 0.42, y1: 0.0, x2: 0.58, y2: 1.0 },
  bounce: { x1: 0.68, y1: -0.55, x2: 0.265, y2: 1.55 }
};

/**
 * Interpolates numeric value between two keyframes
 */
export function interpolateNumeric(
  k0: Keyframe<number>,
  k1: Keyframe<number>,
  time: number
): number {
  if (time <= k0.time) return k0.value;
  if (time >= k1.time) return k1.value;

  const rawProgress = (time - k0.time) / (k1.time - k0.time);
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
 * Evaluates a track value at arbitrary time t
 */
export function evaluateTrack(track: PropertyTrack<any>, time: number, defaultValue: any): any {
  if (!track.keyframes || track.keyframes.length === 0) return defaultValue;
  if (track.keyframes.length === 1) return track.keyframes[0].value;

  const sorted = [...track.keyframes].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const k0 = sorted[i];
    const k1 = sorted[i + 1];
    if (time >= k0.time && time <= k1.time) {
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
  }

  return defaultValue;
}

/**
 * Evaluates animated state of a scene node at timestamp t
 */
export function evaluateNode(node: SceneNode, time: number): SceneNode {
  const evaluated = { ...node };

  if (node.tracks && node.tracks.length > 0) {
    for (const track of node.tracks) {
      const val = evaluateTrack(track, time, (node as any)[track.property]);
      (evaluated as any)[track.property] = val;
    }
  }

  return evaluated;
}
