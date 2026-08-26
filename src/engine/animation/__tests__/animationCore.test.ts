import { describe, it, expect } from 'vitest';
import {
  solveCubicBezier,
  EASING_CURVES,
  frameToTime,
  timeToFrame,
  interpolateColor,
  interpolatePathPoints,
  evaluateNodeTransform,
  evaluateNode,
  evaluateSceneNodes
} from '../index';
import { Keyframe, SceneNode, BezierPoint } from '../../types';

describe('Animation Core — Timing & Frame Conversions', () => {
  it('converts frame to time and time to frame correctly', () => {
    expect(frameToTime(60, 60)).toBe(1.0);
    expect(frameToTime(30, 60)).toBe(0.5);
    expect(timeToFrame(1.0, 60)).toBe(60);
    expect(timeToFrame(0.5, 60)).toBe(30);
  });

  it('solves cubic bezier accurately across standard easing curves', () => {
    expect(solveCubicBezier(EASING_CURVES.linear, 0.5)).toBeCloseTo(0.5, 3);
    expect(solveCubicBezier(EASING_CURVES['ease-in'], 0.5)).toBeLessThan(0.5);
    expect(solveCubicBezier(EASING_CURVES['ease-out'], 0.5)).toBeGreaterThan(0.5);
  });
});

describe('Animation Core — Color & Path Interpolation', () => {
  it('interpolates hex colors smoothly across keyframes', () => {
    const k0: Keyframe<string> = { id: 'c0', time: 0.0, value: '#000000', easing: 'linear' };
    const k1: Keyframe<string> = { id: 'c1', time: 1.0, value: '#ffffff', easing: 'linear' };

    const midColor = interpolateColor(k0, k1, 0.5);
    expect(midColor.toLowerCase()).toBe('#808080');
  });

  it('interpolates path morphing Bezier points', () => {
    const pts0: BezierPoint[] = [{ x: 0, y: 0, type: 'cubic' }];
    const pts1: BezierPoint[] = [{ x: 100, y: 200, type: 'cubic' }];

    const k0: Keyframe<BezierPoint[]> = { id: 'p0', time: 0.0, value: pts0, easing: 'linear' };
    const k1: Keyframe<BezierPoint[]> = { id: 'p1', time: 2.0, value: pts1, easing: 'linear' };

    const midPts = interpolatePathPoints(k0, k1, 1.0);
    expect(midPts[0].x).toBe(50);
    expect(midPts[0].y).toBe(100);
  });
});

describe('Animation Core — Transform & Node Evaluator', () => {
  const node: SceneNode = {
    id: 'test-node',
    name: 'Test Node',
    type: 'rect',
    visible: true,
    locked: false,
    x: 10,
    y: 20,
    width: 100,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 0,
    fill: '#ff0000',
    tracks: [
      {
        id: 'tr-x',
        property: 'x',
        label: 'Position X',
        unit: 'px',
        color: '#ff0000',
        keyframes: [
          { id: 'k1', time: 0.0, value: 10, easing: 'linear' },
          { id: 'k2', time: 2.0, value: 110, easing: 'linear' }
        ]
      },
      {
        id: 'tr-rot',
        property: 'rotation',
        label: 'Rotation',
        unit: '°',
        color: '#00ff00',
        keyframes: [
          { id: 'kr1', time: 0.0, value: 0, easing: 'linear' },
          { id: 'kr2', time: 2.0, value: 90, easing: 'linear' }
        ]
      }
    ]
  };

  it('evaluates node transform properties accurately', () => {
    const transform = evaluateNodeTransform(node, 1.0);
    expect(transform.x).toBeCloseTo(60, 2);
    expect(transform.rotation).toBeCloseTo(45, 2);
    expect(transform.y).toBe(20);
  });

  it('evaluates entire scene node without modifying original node', () => {
    const evaluated = evaluateNode(node, 1.0);
    expect(evaluated.x).toBeCloseTo(60, 2);
    expect(evaluated.rotation).toBeCloseTo(45, 2);
    expect(node.x).toBe(10); // Invariant: no mutation
  });

  it('evaluates batch scene nodes deterministically', () => {
    const evaluatedNodes = evaluateSceneNodes([node], 1.0);
    expect(evaluatedNodes).toHaveLength(1);
    expect(evaluatedNodes[0].x).toBeCloseTo(60, 2);
  });
});
