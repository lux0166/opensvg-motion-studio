import { describe, it, expect } from 'vitest';
import {
  scaleKeyframes,
  slideKeyframes,
  reverseKeyframes,
  invertCubicBezierCurve,
  createKeyframeClipboard,
  pasteKeyframesToNode,
  isPropertyCompatibleWithNode
} from '../timelineOps';
import { Keyframe, SceneNode } from '../types';

describe('Timeline Operations Engine (Rules T1, T2, T3, T5, T7, T8, T9)', () => {
  const sampleKeyframes: Keyframe<number>[] = [
    { id: 'k1', time: 0.0, value: 0, curve: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 } },
    { id: 'k2', time: 1.0, value: 100, curve: { x1: 0.42, y1: 0.0, x2: 0.58, y2: 1.0 } },
    { id: 'k3', time: 2.0, value: 200, curve: { x1: 0.0, y1: 0.0, x2: 0.58, y2: 1.0 } }
  ];

  it('scales keyframes around an anchor timestamp (Rule T2 & T7)', () => {
    const scaled = scaleKeyframes(sampleKeyframes, 2.0, 0.0, 10.0);
    expect(scaled.length).toBe(3);
    expect(scaled[0].time).toBe(0.0);
    expect(scaled[1].time).toBe(2.0);
    expect(scaled[2].time).toBe(4.0);
    expect(scaled[2].value).toBe(200);
  });

  it('slides keyframes by a time delta (Rule T2)', () => {
    const slid = slideKeyframes(sampleKeyframes, 0.5, 10.0);
    expect(slid[0].time).toBe(0.5);
    expect(slid[1].time).toBe(1.5);
    expect(slid[2].time).toBe(2.5);
  });

  it('reverses keyframes with mathematical cubic-bezier inversion (Rule T3)', () => {
    const reversed = reverseKeyframes(sampleKeyframes, 0.0, 2.0);
    expect(reversed.length).toBe(3);
    // Times should be sorted ascending: 0.0, 1.0, 2.0
    expect(reversed[0].time).toBe(0.0);
    expect(reversed[0].value).toBe(200); // Originally at 2.0s
    expect(reversed[1].time).toBe(1.0);
    expect(reversed[1].value).toBe(100);
    expect(reversed[2].time).toBe(2.0);
    expect(reversed[2].value).toBe(0); // Originally at 0.0s

    // Test curve inversion
    const origCurve = { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 };
    const inv = invertCubicBezierCurve(origCurve);
    expect(inv.x1).toBeCloseTo(0.75);
    expect(inv.y1).toBeCloseTo(0.0);
    expect(inv.x2).toBeCloseTo(0.75);
    expect(inv.y2).toBeCloseTo(0.9);
  });

  it('creates clipboard data and generates fresh IDs when pasted (Rule T8)', () => {
    const mockNodes: Record<string, SceneNode> = {
      box: {
        id: 'box',
        name: 'Box',
        type: 'rect',
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#ffffff',
        tracks: [
          {
            id: 'tr-x',
            property: 'x',
            label: 'X Position',
            unit: 'px',
            keyframes: [
              { id: 'kf-orig-1', time: 1.0, value: 50 },
              { id: 'kf-orig-2', time: 2.5, value: 150 }
            ]
          }
        ]
      }
    };

    const clipboard = createKeyframeClipboard(['kf-orig-1', 'kf-orig-2'], mockNodes);
    expect(clipboard).toBeDefined();
    expect(clipboard?.items.length).toBe(2);
    expect(clipboard?.items[0].relativeTime).toBe(0);
    expect(clipboard?.items[1].relativeTime).toBe(1.5);

    // Paste onto another node
    const targetNode: SceneNode = {
      id: 'target-circle',
      name: 'Target Circle',
      type: 'circle',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: '#ff0000',
      tracks: []
    };

    const res = pasteKeyframesToNode(clipboard!, targetNode, 0.5);
    expect(res.pastedCount).toBe(2);
    expect(res.updatedTracks.length).toBe(1);

    const pastedTrack = res.updatedTracks[0];
    expect(pastedTrack.keyframes[0].time).toBe(0.5);
    expect(pastedTrack.keyframes[1].time).toBe(2.0);
    // Must NOT have copied original ID
    expect(pastedTrack.keyframes[0].id).not.toBe('kf-orig-1');
  });

  it('rejects incompatible properties on target nodes (Rule T9)', () => {
    const circleNode: SceneNode = {
      id: 'circle',
      name: 'Circle',
      type: 'circle',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: '#ff0000',
      tracks: []
    };

    expect(isPropertyCompatibleWithNode(circleNode, 'x')).toBe(true);
    expect(isPropertyCompatibleWithNode(circleNode, 'rotation')).toBe(true);
    expect(isPropertyCompatibleWithNode(circleNode, 'textContent')).toBe(false);
    expect(isPropertyCompatibleWithNode(circleNode, 'pathPoints')).toBe(false);
  });
});
