import { describe, it, expect } from 'vitest';
import { evaluateMotionPath, evaluateCubicSegment } from '../motionPath';
import { evaluateNode } from '../evaluator';
import { BezierPoint, SceneNode } from '../types';

describe('Motion Path & Auto-Orientation Engine', () => {
  it('evaluates position and tangent on a linear segment', () => {
    // Horizontal line from (0, 0) to (100, 0) -> Angle should be 0 deg
    const points: BezierPoint[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 }
    ];

    const start = evaluateMotionPath(points, 0.0);
    expect(start.x).toBeCloseTo(0, 1);
    expect(start.y).toBeCloseTo(0, 1);
    expect(start.angle).toBeCloseTo(0, 1);

    const mid = evaluateMotionPath(points, 0.5);
    expect(mid.x).toBeCloseTo(50, 1);
    expect(mid.y).toBeCloseTo(0, 1);
    expect(mid.angle).toBeCloseTo(0, 1);

    const end = evaluateMotionPath(points, 1.0);
    expect(end.x).toBeCloseTo(100, 1);
    expect(end.y).toBeCloseTo(0, 1);
    expect(end.angle).toBeCloseTo(0, 1);
  });

  it('evaluates vertical movement and 90 deg tangent angle', () => {
    // Vertical line going downwards (0, 0) to (0, 200) -> Angle should be 90 deg
    const points: BezierPoint[] = [
      { x: 0, y: 0 },
      { x: 0, y: 200 }
    ];

    const mid = evaluateMotionPath(points, 0.5);
    expect(mid.x).toBeCloseTo(0, 1);
    expect(mid.y).toBeCloseTo(100, 1);
    expect(mid.angle).toBeCloseTo(90, 1);
  });

  it('evaluates smooth cubic Bezier curved trajectory', () => {
    // Arch curve
    const p0 = { x: 0, y: 100 };
    const p1 = { x: 50, y: 0 };
    const p2 = { x: 150, y: 0 };
    const p3 = { x: 200, y: 100 };

    const peak = evaluateCubicSegment(p0, p1, p2, p3, 0.5);
    expect(peak.x).toBeCloseTo(100, 1);
    expect(peak.y).toBeLessThan(100);
    // At the top of the symmetric arch, the tangent is horizontal (0 deg)
    expect(peak.angle).toBeCloseTo(0, 1);
  });

  it('evaluates SceneNode linked to a Motion Path with autoOrient', () => {
    const pathNode: SceneNode = {
      id: 'path-track',
      name: 'Guide Path',
      type: 'path',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: 'none',
      pathPoints: [
        { x: 0, y: 0 },
        { x: 0, y: 200 }
      ],
      tracks: []
    };

    const rocketNode: SceneNode = {
      id: 'rocket-1',
      name: 'Rocket',
      type: 'rect',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 4,
      fill: '#ef4444',
      motionPath: {
        pathNodeId: 'path-track',
        progress: 0.5,
        autoOrient: true
      },
      tracks: []
    };

    const allNodes = { 'path-track': pathNode, 'rocket-1': rocketNode };
    const evaluated = evaluateNode(rocketNode, 0.0, allNodes);

    // Rocket center should align to (0, 100) -> top-left is (0 - 20, 100 - 20) = (-20, 80)
    expect(evaluated.x).toBeCloseTo(-20, 1);
    expect(evaluated.y).toBeCloseTo(80, 1);
    expect(evaluated.rotation).toBeCloseTo(90, 1); // 90 deg tangent
  });
});
