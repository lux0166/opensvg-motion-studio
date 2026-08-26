import { Keyframe } from '../types';
import { solveCubicBezier, EASING_CURVES } from './timing';
import { evaluateSpring } from '../physics';

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
