import { describe, it, expect } from 'vitest';
import { deriveRenderScene } from '../renderState';
import { SceneProject } from '../../types';

describe('Render State Derivation (CORE-03 & Section 3)', () => {
  const mockProject: SceneProject = {
    id: 'proj-rs-1',
    name: 'Render State Test',
    version: '1.0',
    duration: 2.0,
    fps: 60,
    rootFrame: {
      id: 'frame-1', name: 'Root', type: 'frame', visible: true, locked: false, clipContent: true,
      canvasBg: '#1e293b', x: 0, y: 0, width: 800, height: 600, rotation: 0, scaleX: 1, scaleY: 1,
      opacity: 1, borderRadius: 0, fill: '#1e293b', tracks: []
    },
    nodes: {
      child1: {
        id: 'child1', name: 'Child 1', type: 'rect', visible: true, locked: false,
        x: 50, y: 60, width: 100, height: 80, rotation: 0, scaleX: 1, scaleY: 1,
        opacity: 0.8, borderRadius: 8, fill: '#ef4444',
        stroke: '#ffffff', strokeWidth: 2, tracks: []
      }
    },
    nodeOrder: ['child1']
  };

  it('derives pure RenderScene with worldTransform and paints', () => {
    const scene = deriveRenderScene(mockProject, [mockProject.nodes.child1]);
    expect(scene.id).toBe('proj-rs-1');
    expect(scene.viewport.width).toBe(800);
    expect(scene.nodes.length).toBe(1);

    const nodeState = scene.nodes[0];
    expect(nodeState.id).toBe('child1');
    expect(nodeState.opacity).toBe(0.8);
    expect(nodeState.fill?.color).toBe('#ef4444');
    expect(nodeState.stroke?.width).toBe(2);
    expect(nodeState.worldTransform.e).toBe(50);
    expect(nodeState.worldTransform.f).toBe(60);
  });
});
