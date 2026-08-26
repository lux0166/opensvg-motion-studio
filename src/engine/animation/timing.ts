import { CubicBezierCurve } from '../types';

/**
 * Cubic Bezier solver using Newton-Raphson approximation.
 * Solves for y given x on cubic bezier curve defined by (0,0), (x1, y1), (x2, y2), (1,1).
 * Time Complexity: O(1)
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
 * Converts frame number to timeline time in seconds
 */
export function frameToTime(frame: number, fps: number = 60): number {
  return frame / fps;
}

/**
 * Converts timeline time in seconds to nearest frame number
 */
export function timeToFrame(time: number, fps: number = 60): number {
  return Math.round(time * fps);
}
