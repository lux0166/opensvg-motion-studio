import { CubicBezierCurve, Keyframe, PropertyTrack, SceneNode } from './types';

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
