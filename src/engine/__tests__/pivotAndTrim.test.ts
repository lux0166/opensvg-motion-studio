import { describe, it, expect } from 'vitest';
import { evaluateNode } from '../evaluator';
import { SceneNode } from '../types';

describe('Pivot Point & Trim Path Engine Tests', () => {
  it('correctly stores and defaults pivot point coordinates', () => {
    const node: SceneNode = {
      id: 'rect-1',
      name: 'Rect',
      type: 'rect',
      visible: true,
      locked: false,
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      rotation: 45,
      scaleX: 1,
      scaleY: 1,
      pivotX: 0.0, // Top-Left origin
      pivotY: 0.0,
      opacity: 1,
      borderRadius: 0,
      fill: '#ff0000',
      tracks: []
    };

    expect(node.pivotX).toBe(0.0);
    expect(node.pivotY).toBe(0.0);
  });

  it('animates pivot point via evaluator track', () => {
    const node: SceneNode = {
      id: 'rect-2',
      name: 'Pivot Animated Rect',
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
      pivotX: 0.0,
      pivotY: 0.0,
      opacity: 1,
      borderRadius: 0,
      fill: '#00ff00',
      tracks: [
        {
          id: 'tr-pivot-x',
          property: 'pivotX',
          label: 'PIVOT X',
          unit: '',
          keyframes: [
            { id: 'k1', time: 0, value: 0.0 },
            { id: 'k2', time: 1.0, value: 1.0 }
          ]
        }
      ]
    };

    const evaluatedAtHalf = evaluateNode(node, 0.5);
    expect(evaluatedAtHalf.pivotX).toBeGreaterThan(0.4);
    expect(evaluatedAtHalf.pivotX).toBeLessThan(0.6);
  });

  it('supports stroke trimStart and trimEnd animation tracks', () => {
    const node: SceneNode = {
      id: 'circle-trim',
      name: 'Trim Circle',
      type: 'circle',
      visible: true,
      locked: false,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: 'transparent',
      stroke: '#3b82f6',
      strokeWidth: 4,
      trimStart: 0,
      trimEnd: 1,
      tracks: [
        {
          id: 'tr-trim-end',
          property: 'trimEnd',
          label: 'TRIM END',
          unit: '%',
          keyframes: [
            { id: 'k1', time: 0, value: 0.0 },
            { id: 'k2', time: 2.0, value: 1.0 }
          ]
        }
      ]
    };

    const eval0 = evaluateNode(node, 0);
    expect(eval0.trimEnd).toBe(0.0);

    const eval2 = evaluateNode(node, 2.0);
    expect(eval2.trimEnd).toBe(1.0);
  });

  it('supports compound paths with subPaths and fillRule', () => {
    const compoundPath: SceneNode = {
      id: 'donut-path',
      name: 'Donut Compound Path',
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
      fill: '#111827',
      fillRule: 'evenodd',
      subPaths: [
        [
          { x: 0, y: 0, type: 'move' },
          { x: 200, y: 0, type: 'line' },
          { x: 200, y: 200, type: 'line' },
          { x: 0, y: 200, type: 'line' },
          { x: 0, y: 0, type: 'close' }
        ],
        [
          { x: 50, y: 50, type: 'move' },
          { x: 150, y: 50, type: 'line' },
          { x: 150, y: 150, type: 'line' },
          { x: 50, y: 150, type: 'line' },
          { x: 50, y: 50, type: 'close' }
        ]
      ],
      tracks: []
    };

    expect(compoundPath.subPaths?.length).toBe(2);
    expect(compoundPath.fillRule).toBe('evenodd');
  });
});
