import { describe, it, expect } from 'vitest';
import {
  isPointInRect,
  isPointInCircle,
  isPointInPolygon,
  worldToLocalPoint,
  hitTestScene
} from '../geometryHitTest';
import { EvaluatedSceneState } from '../../runtime/evaluationPipeline';
import { composeTransform } from '../../transform/matrix2D';

describe('SVG Geometry Hit Testing (Section 5)', () => {
  it('correctly tests rectangle and rounded corner bounds', () => {
    // Standard rect: width 100, height 50
    expect(isPointInRect({ x: 50, y: 25 }, 100, 50, 0)).toBe(true);
    expect(isPointInRect({ x: 105, y: 25 }, 100, 50, 0)).toBe(false);
    expect(isPointInRect({ x: -2, y: 25 }, 100, 50, 0)).toBe(false);

    // Rounded rect: width 100, height 100, borderRadius 20
    // Corner point (2, 2) is outside the rounded corner circle
    expect(isPointInRect({ x: 2, y: 2 }, 100, 100, 20)).toBe(false);
    // Center point is inside
    expect(isPointInRect({ x: 50, y: 50 }, 100, 100, 20)).toBe(true);
  });

  it('correctly tests circle and ellipse geometry', () => {
    // Circle width 80, height 80 (radius 40, center 40, 40)
    expect(isPointInCircle({ x: 40, y: 40 }, 80, 80)).toBe(true);
    expect(isPointInCircle({ x: 20, y: 20 }, 80, 80)).toBe(true);
    expect(isPointInCircle({ x: 10, y: 10 }, 80, 80)).toBe(false);
    expect(isPointInCircle({ x: 1, y: 1 }, 80, 80)).toBe(false);
    expect(isPointInCircle({ x: 80, y: 80 }, 80, 80)).toBe(false);
  });

  it('correctly tests polygon containment via ray-casting', () => {
    // Triangle: (0,0), (100, 0), (50, 100)
    const triangle = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 100 }
    ];

    expect(isPointInPolygon({ x: 50, y: 20 }, triangle)).toBe(true);
    expect(isPointInPolygon({ x: 10, y: 80 }, triangle)).toBe(false);
  });

  it('transforms scene coordinates into local coordinates via inverse matrix', () => {
    // Node at (100, 50), rotated 90 degrees
    const matrix = composeTransform(
      {
        translation: { x: 100, y: 50 },
        rotation: 90,
        scale: { x: 1, y: 1 },
        pivot: { x: 0, y: 0 }
      },
      100,
      100
    );

    // Scene point (100, 50) maps to local (0, 0)
    const local1 = worldToLocalPoint(matrix, { x: 100, y: 50 });
    expect(local1.x).toBeCloseTo(0, 2);
    expect(local1.y).toBeCloseTo(0, 2);

    // Point translated along rotated axis
    const local2 = worldToLocalPoint(matrix, { x: 100, y: 100 });
    expect(local2.x).toBeCloseTo(50, 2);
  });

  it('performs accurate Top-to-Bottom Z-order hit testing in scene graph', () => {
    const mockSceneState: EvaluatedSceneState = {
      projectId: 'p1',
      time: 0,
      duration: 3,
      fps: 60,
      evaluatedNodes: {},
      nodeOrder: ['bg-rect', 'hero-circle'],
      nodeStates: {
        'bg-rect': {
          id: 'bg-rect',
          name: 'Background Rect',
          type: 'rect',
          totalOpacity: 1,
          worldTransform: composeTransform(
            { translation: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, pivot: { x: 0, y: 0 } },
            400,
            400
          ),
          evaluatedNode: {
            id: 'bg-rect', name: 'Background Rect', type: 'rect', visible: true, locked: false,
            x: 0, y: 0, width: 400, height: 400, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1,
            borderRadius: 0, fill: '#111827', tracks: []
          }
        },
        'hero-circle': {
          id: 'hero-circle',
          name: 'Hero Circle',
          type: 'circle',
          totalOpacity: 1,
          worldTransform: composeTransform(
            { translation: { x: 100, y: 100 }, rotation: 0, scale: { x: 1, y: 1 }, pivot: { x: 0, y: 0 } },
            100,
            100
          ),
          evaluatedNode: {
            id: 'hero-circle', name: 'Hero Circle', type: 'circle', visible: true, locked: false,
            x: 100, y: 100, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1,
            borderRadius: 9999, fill: '#38bdf8', tracks: []
          }
        }
      },
      renderScene: {
        id: 'p1',
        viewport: { width: 400, height: 400, dpr: 1, background: '#111827' },
        nodes: [],
        drawOrder: ['bg-rect', 'hero-circle']
      }
    };

    // Point (150, 150) is inside both bg-rect and hero-circle.
    // In Z-order (top-down), hero-circle must be selected first!
    const hit1 = hitTestScene(mockSceneState, { x: 150, y: 150 });
    expect(hit1?.id).toBe('hero-circle');

    // Point (10, 10) is only inside bg-rect
    const hit2 = hitTestScene(mockSceneState, { x: 10, y: 10 });
    expect(hit2?.id).toBe('bg-rect');

    // Point (500, 500) is outside
    const hit3 = hitTestScene(mockSceneState, { x: 500, y: 500 });
    expect(hit3).toBeNull();
  });
});
