import { Keyframe, PropertyTrack } from '../types';
import { interpolateNumeric } from './numericInterpolation';
import { interpolateColor } from './colorInterpolation';
import { interpolatePathPoints } from './pathInterpolation';

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
