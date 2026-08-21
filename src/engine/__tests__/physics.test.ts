import { describe, it, expect } from 'vitest';
import { evaluateSpring, SPRING_PRESETS } from '../physics';
import { interpolateNumeric } from '../evaluator';
import { Keyframe } from '../types';

describe('Spring Physics Motion Engine', () => {
  it('evaluates spring position with overshoot for underdamped preset', () => {
    const from = 0;
    const to = 100;

    // At t=0, value is from
    expect(evaluateSpring(from, to, 0, SPRING_PRESETS.bouncy)).toBe(0);

    // Mid-flight value oscillates
    const midVal = evaluateSpring(from, to, 0.2, SPRING_PRESETS.bouncy);
    expect(midVal).toBeGreaterThan(0);

    // Bouncy spring exhibits overshoot (>100) before settling
    let maxVal = 0;
    for (let t = 0; t <= 1.0; t += 0.02) {
      const v = evaluateSpring(from, to, t, SPRING_PRESETS.bouncy);
      if (v > maxVal) maxVal = v;
    }
    expect(maxVal).toBeGreaterThan(100);

    // At t > 1.5, settles closely to target
    const settled = evaluateSpring(from, to, 2.0, SPRING_PRESETS.bouncy);
    expect(settled).toBeCloseTo(100, 0);
  });

  it('interpolates numeric keyframe with spring physics', () => {
    const k0: Keyframe<number> = {
      id: 'k0',
      time: 0,
      value: 50,
      easing: 'spring',
      spring: SPRING_PRESETS.snappy
    };

    const k1: Keyframe<number> = {
      id: 'k1',
      time: 1.0,
      value: 200
    };

    const valAtZero = interpolateNumeric(k0, k1, 0);
    expect(valAtZero).toBe(50);

    const valAtMid = interpolateNumeric(k0, k1, 0.3);
    expect(valAtMid).toBeGreaterThan(50);
  });
});
