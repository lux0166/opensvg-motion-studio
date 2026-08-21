import { describe, it, expect } from 'vitest';
import { solveCubicBezier, EASING_CURVES, interpolateNumeric, evaluateTrack, evaluateNode } from '../evaluator';
import { PropertyTrack, SceneNode } from '../types';

describe('Cubic Bézier Solver', () => {
  it('correctly calculates linear progress (0.0 to 1.0)', () => {
    expect(solveCubicBezier(EASING_CURVES.linear, 0.0)).toBeCloseTo(0.0, 3);
    expect(solveCubicBezier(EASING_CURVES.linear, 0.5)).toBeCloseTo(0.5, 3);
    expect(solveCubicBezier(EASING_CURVES.linear, 1.0)).toBeCloseTo(1.0, 3);
  });

  it('correctly applies ease-in-out easing', () => {
    const easeInOut = EASING_CURVES['ease-in-out'];
    // At t=0.5, ease-in-out should be symmetric at 0.5
    expect(solveCubicBezier(easeInOut, 0.5)).toBeCloseTo(0.5, 2);
    // At t=0.2, progress should be slower than linear
    expect(solveCubicBezier(easeInOut, 0.2)).toBeLessThan(0.2);
    // At t=0.8, progress should be further than linear
    expect(solveCubicBezier(easeInOut, 0.8)).toBeGreaterThan(0.8);
  });
});

describe('Keyframe Interpolator', () => {
  it('interpolates numeric value between two keyframes', () => {
    const k0 = { id: 'k0', time: 0, value: 100, easing: 'linear' as const };
    const k1 = { id: 'k1', time: 2, value: 300, easing: 'linear' as const };

    expect(interpolateNumeric(k0, k1, 0)).toBe(100);
    expect(interpolateNumeric(k0, k1, 1)).toBeCloseTo(200, 1);
    expect(interpolateNumeric(k0, k1, 2)).toBe(300);
  });

  it('clamps values outside keyframe time range', () => {
    const k0 = { id: 'k0', time: 1, value: 50 };
    const k1 = { id: 'k1', time: 3, value: 150 };

    expect(interpolateNumeric(k0, k1, 0.5)).toBe(50);
    expect(interpolateNumeric(k0, k1, 3.5)).toBe(150);
  });
});

describe('Track & Scene Evaluator', () => {
  it('evaluates track value accurately across multi-keyframes', () => {
    const track: PropertyTrack<number> = {
      id: 'tr-rot',
      property: 'rotation',
      label: 'Rotation',
      unit: '°',
      keyframes: [
        { id: 'k1', time: 0, value: 0, easing: 'linear' },
        { id: 'k2', time: 1, value: 90, easing: 'linear' },
        { id: 'k3', time: 2, value: 360, easing: 'linear' }
      ]
    };

    expect(evaluateTrack(track, 0, 0)).toBe(0);
    expect(evaluateTrack(track, 0.5, 0)).toBeCloseTo(45, 1);
    expect(evaluateTrack(track, 1.0, 0)).toBe(90);
    expect(evaluateTrack(track, 1.5, 0)).toBeCloseTo(225, 1);
    expect(evaluateTrack(track, 2.0, 0)).toBe(360);
  });

  it('evaluates complete SceneNode animated state at timestamp', () => {
    const node: SceneNode = {
      id: 'test-card',
      name: 'Card',
      type: 'rect',
      visible: true,
      locked: false,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 12,
      fill: '#111827',
      tracks: [
        {
          id: 'tr-x',
          property: 'x',
          label: 'X',
          unit: 'px',
          keyframes: [
            { id: 'k1', time: 0, value: 100, easing: 'linear' },
            { id: 'k2', time: 2, value: 500, easing: 'linear' }
          ]
        }
      ]
    };

    const evaluated = evaluateNode(node, 1.0);
    expect(evaluated.x).toBeCloseTo(300, 1);
    expect(evaluated.y).toBe(100);
    expect(evaluated.name).toBe('Card');
  });
});
