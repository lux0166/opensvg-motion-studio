import { describe, it, expect } from 'vitest';
import { evaluateScenePipeline, computeCanonicalWorldTransforms } from '../evaluationPipeline';
import { SceneProject, FrameNode, SceneNode } from '../../types';
import { Constraint } from '../../constraints/constraintSolver';
import { ComponentRegistry } from '../../components/componentSystem';
import { DataBindingEngine } from '../../binding/dataBinding';

describe('Evaluation Pipeline & Runtime State Boundary (P0 & P1)', () => {
  const rootFrame: FrameNode = {
    id: 'root-1',
    name: 'Root Frame',
    type: 'frame',
    visible: true,
    locked: false,
    clipContent: true,
    canvasBg: '#1e1e1e',
    borderRadius: 0,
    fill: '#1e1e1e',
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    tracks: []
  };

  const sampleProject: SceneProject = {
    id: 'proj-pipe',
    name: 'Pipeline Test Project',
    version: '1.0.0',
    fps: 60,
    duration: 4.0,
    rootFrame,
    nodeOrder: ['parent-frame', 'child-rect'],
    nodes: {
      'parent-frame': {
        id: 'parent-frame',
        name: 'Parent Frame',
        type: 'frame',
        visible: true,
        locked: false,
        clipContent: true,
        canvasBg: '#1e1e1e',
        borderRadius: 0,
        fill: '#1e1e1e',
        x: 50,
        y: 50,
        width: 400,
        height: 300,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        tracks: [
          {
            id: 'tr-rot',
            property: 'rotation',
            label: 'Rotation',
            unit: '°',
            color: '#8b5cf6',
            keyframes: [
              { id: 'k1', time: 0, value: 0, easing: 'linear' },
              { id: 'k2', time: 4, value: 360, easing: 'linear' }
            ]
          }
        ]
      },
      'child-rect': {
        id: 'child-rect',
        name: 'Child Rect',
        type: 'rect',
        visible: true,
        locked: false,
        borderRadius: 0,
        parentId: 'parent-frame',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#10b981',
        tracks: [
          {
            id: 'tr-scale',
            property: 'scaleX',
            label: 'Scale X',
            unit: 'x',
            color: '#10b981',
            keyframes: [
              { id: 'k3', time: 0, value: 1.0, easing: 'linear' },
              { id: 'k4', time: 2, value: 2.0, easing: 'linear' }
            ]
          }
        ]
      }
    }
  };

  it('evaluates complete scene deterministically at timestamp t', () => {
    const evaluatedAt1 = evaluateScenePipeline(sampleProject, { time: 1.0 });

    expect(evaluatedAt1.projectId).toBe('proj-pipe');
    expect(evaluatedAt1.time).toBe(1.0);
    expect(evaluatedAt1.evaluatedNodes['parent-frame'].rotation).toBeCloseTo(90, 2);
    expect(evaluatedAt1.evaluatedNodes['child-rect'].scaleX).toBeCloseTo(1.5, 2);

    expect(evaluatedAt1.renderScene.nodes).toHaveLength(2);
    expect(evaluatedAt1.renderScene.drawOrder).toEqual(['parent-frame', 'child-rect']);
  });

  it('integrates constraint solver seamlessly into evaluation pipeline', () => {
    const constraint: Constraint = {
      id: 'c1',
      type: 'rotation',
      ownerId: 'child-rect',
      targetId: 'parent-frame',
      enabled: true,
      strength: 1.0
    };

    const evaluated = evaluateScenePipeline(sampleProject, {
      time: 2.0,
      constraints: [constraint]
    });

    // Parent rotation at t=2 is 180 deg
    expect(evaluated.evaluatedNodes['parent-frame'].rotation).toBeCloseTo(180, 2);
    // Child rect copies rotation from parent via rotation constraint
    expect(evaluated.evaluatedNodes['child-rect'].rotation).toBeCloseTo(180, 2);
  });

  it('guarantees zero mutation of authoring document during evaluation', () => {
    const originalRotation = sampleProject.nodes['parent-frame'].rotation;
    const originalScale = sampleProject.nodes['child-rect'].scaleX;

    // Run multiple evaluations
    evaluateScenePipeline(sampleProject, { time: 0.5 });
    evaluateScenePipeline(sampleProject, { time: 2.0 });
    evaluateScenePipeline(sampleProject, { time: 3.5 });

    // Canonical document must remain 100% untouched
    expect(sampleProject.nodes['parent-frame'].rotation).toBe(originalRotation);
    expect(sampleProject.nodes['child-rect'].scaleX).toBe(originalScale);
  });

  it('integrates Component Registry and Data Binding seamlessly in pipeline phases', () => {
    const registry = new ComponentRegistry();
    const buttonNode: SceneNode = {
      id: 'btn-def-root',
      name: 'Button Master',
      type: 'rect',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 8,
      fill: '#6366f1',
      tracks: []
    };

    registry.register({
      id: 'comp-button',
      name: 'Button Component',
      rootNode: buttonNode
    });

    const instance = registry.instantiate('comp-button', 'btn-instance-1', 'Save Button', { x: 300, y: 400 }, {
      fill: '#4f46e5'
    });

    const dataBindingEngine = new DataBindingEngine();
    dataBindingEngine.registerBinding({
      id: 'bind-1',
      sourcePath: 'theme.primary',
      targetNodeId: 'btn-instance-1',
      targetProperty: 'fill'
    });
    dataBindingEngine.setSourceValue('theme.primary', '#ec4899');

    const result = evaluateScenePipeline(sampleProject, {
      time: 0,
      componentRegistry: registry,
      componentInstances: [instance],
      dataBindingEngine
    });

    expect(result.evaluatedNodes['btn-instance-1']).toBeDefined();
    // Data binding overwrites component instance fill with '#ec4899'
    expect(result.evaluatedNodes['btn-instance-1'].fill).toBe('#ec4899');
    expect(result.evaluatedNodes['btn-instance-1'].x).toBe(300);
  });

  it('computes canonical world transforms and safely breaks hierarchy cycles', () => {
    const cyclicNodes: Record<string, SceneNode> = {
      nodeA: {
        id: 'nodeA', name: 'Node A', type: 'rect', visible: true, locked: false,
        parentId: 'nodeB', x: 10, y: 10, width: 50, height: 50, rotation: 0, scaleX: 1, scaleY: 1,
        opacity: 1, borderRadius: 0, fill: '#ffffff', tracks: []
      },
      nodeB: {
        id: 'nodeB', name: 'Node B', type: 'rect', visible: true, locked: false,
        parentId: 'nodeA', x: 20, y: 20, width: 50, height: 50, rotation: 0, scaleX: 1, scaleY: 1,
        opacity: 1, borderRadius: 0, fill: '#ffffff', tracks: []
      }
    };

    const transforms = computeCanonicalWorldTransforms(cyclicNodes, ['nodeA', 'nodeB']);
    expect(transforms['nodeA']).toBeDefined();
    expect(transforms['nodeB']).toBeDefined();
  });
});
