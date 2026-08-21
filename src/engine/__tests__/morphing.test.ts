import { describe, it, expect } from 'vitest';
import { interpolatePathPoints, interpolateColor, evaluateNode } from '../evaluator';
import { BezierPoint, Keyframe, SceneNode } from '../types';

describe('Morphing & Path Tweening Engine', () => {
  it('smoothly interpolates vector path points across keyframes', () => {
    const k0: Keyframe<BezierPoint[]> = {
      id: 'k0',
      time: 0,
      value: [
        { x: 0, y: 0, cp1x: 10, cp1y: 20, type: 'cubic' },
        { x: 100, y: 100, cp1x: 110, cp1y: 120, type: 'cubic' }
      ],
      easing: 'linear'
    };

    const k1: Keyframe<BezierPoint[]> = {
      id: 'k1',
      time: 2.0,
      value: [
        { x: 100, y: 200, cp1x: 50, cp1y: 60, type: 'cubic' },
        { x: 300, y: 300, cp1x: 210, cp1y: 220, type: 'cubic' }
      ],
      easing: 'linear'
    };

    // At time 1.0 (50% progress linear)
    const midPoints = interpolatePathPoints(k0, k1, 1.0);
    expect(midPoints.length).toBe(2);
    expect(midPoints[0].x).toBe(50);
    expect(midPoints[0].y).toBe(100);
    expect(midPoints[0].cp1x).toBe(30);
    expect(midPoints[0].cp1y).toBe(40);

    expect(midPoints[1].x).toBe(200);
    expect(midPoints[1].y).toBe(200);
    expect(midPoints[1].cp1x).toBe(160);
    expect(midPoints[1].cp1y).toBe(170);
  });

  it('smoothly interpolates hex colors', () => {
    const k0: Keyframe<string> = { id: 'k0', time: 0, value: '#000000', easing: 'linear' };
    const k1: Keyframe<string> = { id: 'k1', time: 2.0, value: '#ffffff', easing: 'linear' };

    const midColor = interpolateColor(k0, k1, 1.0);
    expect(midColor.toLowerCase()).toBe('#808080');
  });

  it('evaluates dynamic path morphing inside evaluateNode', () => {
    const morphNode: SceneNode = {
      id: 'morph-shape',
      name: 'Morphing Path',
      type: 'path',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: '#3b82f6',
      pathPoints: [{ x: 0, y: 0, type: 'line' }],
      tracks: [
        {
          id: 'tr-morph',
          property: 'pathPoints',
          label: 'Path Morph',
          unit: '',
          color: '#8b5cf6',
          keyframes: [
            {
              id: 'mk1',
              time: 0,
              value: [{ x: 10, y: 10, type: 'line' }],
              easing: 'linear'
            },
            {
              id: 'mk2',
              time: 2.0,
              value: [{ x: 50, y: 90, type: 'line' }],
              easing: 'linear'
            }
          ]
        }
      ]
    };

    const evaluated = evaluateNode(morphNode, 1.0);
    expect(evaluated.pathPoints).toBeDefined();
    expect(evaluated.pathPoints![0].x).toBe(30);
    expect(evaluated.pathPoints![0].y).toBe(50);
  });
});
