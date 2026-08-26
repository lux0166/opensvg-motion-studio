import { Keyframe } from '../types';
import { solveCubicBezier, EASING_CURVES } from './timing';

export function parseHexColor(hex: string): [number, number, number] {
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
