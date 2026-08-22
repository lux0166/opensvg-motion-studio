import { describe, it, expect } from 'vitest';
import { updateVertexTangent, setVertexPointType, pointDistance, pointAngle } from '../geometry';
import { BezierPoint } from '../types';

describe('Geometry Engine - Vertex Types & Tangents (Rule G4 & G5)', () => {
  it('calculates point distance and angle correctly', () => {
    expect(pointDistance(0, 0, 3, 4)).toBe(5);
    expect(pointAngle(0, 0, 10, 0)).toBe(0);
    expect(pointAngle(0, 0, 0, 10)).toBeCloseTo(Math.PI / 2);
  });

  it('maintains symmetric equal-distance and collinear angle in smooth mode', () => {
    const pt: BezierPoint = {
      x: 100,
      y: 100,
      cp1x: 70,
      cp1y: 100,
      cp2x: 130,
      cp2y: 100,
      pointType: 'smooth'
    };

    // Drag cp1 to (60, 100) (dx = -40)
    const updated = updateVertexTangent(pt, 'cp1', 60, 100);
    expect(updated.cp1x).toBe(60);
    expect(updated.cp1y).toBe(100);

    // Opposite handle cp2 must be at (140, 100) (dx = +40)
    expect(updated.cp2x).toBe(140);
    expect(updated.cp2y).toBe(100);
  });

  it('maintains collinear angle but independent magnitude in asymmetric mode', () => {
    const pt: BezierPoint = {
      x: 100,
      y: 100,
      cp1x: 50, // dist = 50
      cp1y: 100,
      cp2x: 120, // dist = 20
      cp2y: 100,
      pointType: 'asymmetric'
    };

    // Drag cp1 to (100, 50) (rotated 90deg upward, dist = 50)
    const updated = updateVertexTangent(pt, 'cp1', 100, 50);
    expect(updated.cp1x).toBe(100);
    expect(updated.cp1y).toBe(50);

    // Opposite handle cp2 must point downward (100, 120) keeping its original dist of 20
    expect(updated.cp2x).toBeCloseTo(100);
    expect(updated.cp2y).toBeCloseTo(120);
  });

  it('allows independent handles in corner mode', () => {
    const pt: BezierPoint = {
      x: 100,
      y: 100,
      cp1x: 70,
      cp1y: 100,
      cp2x: 130,
      cp2y: 100,
      pointType: 'corner'
    };

    // Drag cp1 to (50, 50)
    const updated = updateVertexTangent(pt, 'cp1', 50, 50);
    expect(updated.cp1x).toBe(50);
    expect(updated.cp1y).toBe(50);

    // cp2 must remain completely unchanged
    expect(updated.cp2x).toBe(130);
    expect(updated.cp2y).toBe(100);
  });

  it('switches vertex point types correctly', () => {
    const pt: BezierPoint = {
      x: 50,
      y: 50,
      cp1x: 20,
      cp1y: 50,
      cp2x: 80,
      cp2y: 50,
      pointType: 'smooth'
    };

    const corner = setVertexPointType(pt, 'corner');
    expect(corner.pointType).toBe('corner');
    expect(corner.cp1x).toBeUndefined();
    expect(corner.cp2x).toBeUndefined();

    const smooth = setVertexPointType(corner, 'smooth', 40);
    expect(smooth.pointType).toBe('smooth');
    expect(smooth.cp1x).toBe(10);
    expect(smooth.cp2x).toBe(90);
  });
});
