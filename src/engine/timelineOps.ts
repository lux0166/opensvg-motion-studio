import { Keyframe, PropertyTrack, SceneNode, CubicBezierCurve } from './types';

/**
 * Timeline Time Transformation and Keyframe Manipulation Operations
 * Adheres strictly to OpenSVG Feature Engineering Rules T1, T2, T3, T5, T7, T8, T9.
 */

export interface KeyframeClipboardItem {
  property: string;
  sourceNodeId: string;
  relativeTime: number; // Time relative to the first copied keyframe
  value: any;
  curve?: CubicBezierCurve;
  easing?: string;
}

export interface KeyframeClipboard {
  copiedAt: number;
  duration: number;
  items: KeyframeClipboardItem[];
}

/**
 * Inverts a cubic-bezier curve for time-reversed playback (Rule T3).
 * Given (x1, y1, x2, y2), the time-reversed curve is (1 - x2, 1 - y2, 1 - x1, 1 - y1).
 */
export function invertCubicBezierCurve(curve: CubicBezierCurve): CubicBezierCurve {
  return {
    x1: parseFloat((1 - curve.x2).toFixed(4)),
    y1: parseFloat((1 - curve.y2).toFixed(4)),
    x2: parseFloat((1 - curve.x1).toFixed(4)),
    y2: parseFloat((1 - curve.y1).toFixed(4))
  };
}

/**
 * Normalizes and sorts keyframes by ascending time (Rule T5).
 */
export function normalizeKeyframes<T = any>(keyframes: Keyframe<T>[]): Keyframe<T>[] {
  return [...keyframes].sort((a, b) => a.time - b.time);
}

/**
 * Scales a collection of keyframes around an anchor timestamp (Rule T2 & T7).
 */
export function scaleKeyframes<T = any>(
  keyframes: Keyframe<T>[],
  scaleFactor: number,
  anchorTime: number = 0,
  maxDuration: number = 60
): Keyframe<T>[] {
  if (scaleFactor <= 0) return keyframes;

  return normalizeKeyframes(
    keyframes.map((kf) => {
      const delta = kf.time - anchorTime;
      const newTime = parseFloat(Math.max(0, Math.min(maxDuration, anchorTime + delta * scaleFactor)).toFixed(3));
      return {
        ...kf,
        time: newTime
      };
    })
  );
}

/**
 * Slides (offsets) a collection of keyframes by deltaSeconds (Rule T2 & T7).
 */
export function slideKeyframes<T = any>(
  keyframes: Keyframe<T>[],
  deltaSeconds: number,
  maxDuration: number = 60
): Keyframe<T>[] {
  return normalizeKeyframes(
    keyframes.map((kf) => ({
      ...kf,
      time: parseFloat(Math.max(0, Math.min(maxDuration, kf.time + deltaSeconds)).toFixed(3))
    }))
  );
}

/**
 * Reverses a sequence of keyframes within a time range, inverting both timestamps
 * and cubic bezier easing curves (Rule T3).
 */
export function reverseKeyframes<T = any>(
  keyframes: Keyframe<T>[],
  rangeStart?: number,
  rangeEnd?: number
): Keyframe<T>[] {
  if (keyframes.length <= 1) return keyframes;

  const minT = rangeStart !== undefined ? rangeStart : Math.min(...keyframes.map((k) => k.time));
  const maxT = rangeEnd !== undefined ? rangeEnd : Math.max(...keyframes.map((k) => k.time));

  return normalizeKeyframes(
    keyframes.map((kf) => {
      const reversedTime = parseFloat((minT + maxT - kf.time).toFixed(3));
      const reversedCurve = kf.curve ? invertCubicBezierCurve(kf.curve) : undefined;
      return {
        ...kf,
        time: reversedTime,
        curve: reversedCurve
      };
    })
  );
}

/**
 * Copies selected keyframes across nodes into clipboard data (Rule T8).
 */
export function createKeyframeClipboard(
  selectedKeyframeIds: string[],
  nodes: Record<string, SceneNode>
): KeyframeClipboard | null {
  if (selectedKeyframeIds.length === 0) return null;

  const items: KeyframeClipboardItem[] = [];
  let minTime = Infinity;
  let maxTime = -Infinity;

  for (const nodeId in nodes) {
    const node = nodes[nodeId];
    if (!node.tracks) continue;

    for (const track of node.tracks) {
      for (const kf of track.keyframes) {
        if (selectedKeyframeIds.includes(kf.id)) {
          minTime = Math.min(minTime, kf.time);
          maxTime = Math.max(maxTime, kf.time);
          items.push({
            property: track.property,
            sourceNodeId: nodeId,
            relativeTime: kf.time, // Will adjust below
            value: JSON.parse(JSON.stringify(kf.value)),
            curve: kf.curve ? { ...kf.curve } : undefined,
            easing: kf.easing
          });
        }
      }
    }
  }

  if (items.length === 0) return null;

  // Make relative times 0-indexed based on minTime
  for (const item of items) {
    item.relativeTime = parseFloat((item.relativeTime - minTime).toFixed(3));
  }

  return {
    copiedAt: Date.now(),
    duration: maxTime - minTime,
    items
  };
}

/**
 * Resolves node property capability for pasting keyframes (Rule T9).
 */
export function isPropertyCompatibleWithNode(node: SceneNode, property: string): boolean {
  if (property === 'textContent' || property === 'fontSize') {
    return node.type === 'text';
  }
  if (property === 'pathPoints') {
    return node.type === 'path';
  }
  if (property === 'borderRadius') {
    return node.type === 'rect' || node.type === 'frame';
  }
  // Standard spatial and appearance properties work across all nodes
  const universalProps = [
    'x', 'y', 'width', 'height', 'rotation', 'scaleX', 'scaleY',
    'pivotX', 'pivotY', 'opacity', 'fill', 'stroke', 'strokeWidth',
    'trimStart', 'trimEnd', 'trimOffset', 'shadowBlur', 'shadowOffsetX',
    'shadowOffsetY', 'filterBlur'
  ];
  return universalProps.includes(property);
}

/**
 * Pastes clipboard keyframes onto a target node at pasteTime (Rule T8 & T9).
 */
export function pasteKeyframesToNode(
  clipboard: KeyframeClipboard,
  targetNode: SceneNode,
  pasteTime: number,
  targetPropertyOverride?: string
): { updatedTracks: PropertyTrack[]; pastedCount: number } {
  const updatedTracks: PropertyTrack[] = JSON.parse(JSON.stringify(targetNode.tracks || []));
  let pastedCount = 0;

  for (const item of clipboard.items) {
    const propToApply = targetPropertyOverride || item.property;
    if (!isPropertyCompatibleWithNode(targetNode, propToApply)) {
      continue; // Skip incompatible properties (Rule T9)
    }

    let track = updatedTracks.find((t) => t.property === propToApply);
    if (!track) {
      track = {
        id: `tr-${Date.now()}-${propToApply}`,
        property: propToApply as any,
        label: propToApply.toUpperCase(),
        unit: '',
        color: '#3b82f6',
        keyframes: []
      };
      updatedTracks.push(track);
    }

    const calculatedTime = parseFloat((pasteTime + item.relativeTime).toFixed(3));
    const newKfId = `kf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`; // Fresh unique ID (Rule T8)

    const existingKf = track.keyframes.find((k) => Math.abs(k.time - calculatedTime) < 0.03);
    if (existingKf) {
      existingKf.value = item.value;
      existingKf.curve = item.curve;
      existingKf.easing = item.easing as any;
    } else {
      track.keyframes.push({
        id: newKfId,
        time: calculatedTime,
        value: item.value,
        curve: item.curve,
        easing: item.easing as any
      });
    }

    track.keyframes = normalizeKeyframes(track.keyframes);
    pastedCount++;
  }

  return { updatedTracks, pastedCount };
}
