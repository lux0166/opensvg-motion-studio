import { describe, it, expect } from 'vitest';
import { computeTextOnPath, computeKineticTextStagger, samplePathMetrics } from '../textOnPath';
import { BezierPoint } from '../types';

describe('Kinetic Typography & Text on Path Engine (Rules K1, K2, K3, K4, K5)', () => {
  const linePath: BezierPoint[] = [
    { x: 0, y: 100, type: 'move' },
    { x: 500, y: 100, type: 'line' }
  ];

  it('samples path metrics and calculates arc length (Rule K1)', () => {
    const samples = samplePathMetrics(linePath, 10);
    expect(samples.length).toBeGreaterThan(5);
    const totalDist = samples[samples.length - 1].distance;
    expect(totalDist).toBeCloseTo(500, 0);
  });

  it('places glyphs along path with correct tangent orientation (Rule K1 & K3)', () => {
    const glyphs = computeTextOnPath('HELLO', linePath, 0.0, 20, 2);
    expect(glyphs.length).toBe(5);
    expect(glyphs[0].char).toBe('H');
    expect(glyphs[0].y).toBe(100);
    expect(glyphs[0].rotation).toBeCloseTo(0); // Horizontal line tangent = 0 deg
    expect(glyphs[1].x).toBeGreaterThan(glyphs[0].x);
  });

  it('computes typewriter stagger opacity (Rule K4 & K5)', () => {
    const glyphs0 = computeKineticTextStagger('OPEN', 0.0, 'typewriter', 0.1);
    expect(glyphs0[0].opacity).toBe(1);
    expect(glyphs0[1].opacity).toBe(0); // Char at index 1 appears at 0.1s

    const glyphs1 = computeKineticTextStagger('OPEN', 0.15, 'typewriter', 0.1);
    expect(glyphs1[0].opacity).toBe(1);
    expect(glyphs1[1].opacity).toBe(1);
    expect(glyphs1[2].opacity).toBe(0);
  });

  it('computes wave and cascade stagger transformations', () => {
    const wave = computeKineticTextStagger('MOTION', 0.2, 'wave', 0.05);
    expect(wave.length).toBe(6);
    expect(wave[0].y).toBeDefined();

    const cascade = computeKineticTextStagger('MOTION', 0.2, 'cascade', 0.05);
    expect(cascade.length).toBe(6);
  });
});
