import { describe, it, expect } from 'vitest';
import { computeVelocityCurve } from '../velocityGraph';
import { PropertyTrack } from '../types';

describe('Velocity Graph Derivative Engine (Rules T6 & T10)', () => {
  it('computes velocity derivative over linear track', () => {
    const track: PropertyTrack<number> = {
      id: 'tr-pos',
      property: 'x',
      label: 'X',
      unit: 'px',
      keyframes: [
        { id: 'k1', time: 0, value: 0, easing: 'linear' },
        { id: 'k2', time: 2.0, value: 200, easing: 'linear' }
      ]
    };

    const res = computeVelocityCurve(track, 2.0, 20);
    expect(res.samples.length).toBe(21);
    // Linear velocity = 200px / 2s = 100 px/s
    expect(res.samples[10].velocity).toBeCloseTo(100, -1);
    expect(res.maxVelocity).toBeGreaterThan(90);
  });
});
