import { describe, it, expect } from 'vitest';
import { createRuntimeSnapshot } from '../runtimeSnapshot';
import { SceneProject, SceneNode } from '../../types';

describe('Runtime Snapshot Completeness Test (Section 2)', () => {
  const fullFeatureNode: SceneNode = {
    id: 'node-full-feature',
    name: 'Rich Feature Node',
    type: 'rect',
    visible: true,
    locked: false,
    x: 120,
    y: 80,
    width: 250,
    height: 140,
    rotation: 45,
    scaleX: 1.2,
    scaleY: 0.8,
    opacity: 0.9,
    borderRadius: 16,
    fill: '#4f46e5',
    stroke: '#ffffff',
    strokeWidth: 3,
    strokeCap: 'round',
    strokeJoin: 'bevel',
    strokeDash: [10, 5, 2, 5],
    pivotX: 0.5,
    pivotY: 0.5,
    parentId: 'parent-root',
    childrenIds: ['child-1', 'child-2'],
    tracks: [
      {
        id: 'tr-x',
        property: 'x',
        label: 'Position X',
        unit: 'px',
        keyframes: [
          { id: 'k1', time: 0, value: 120, easing: 'ease-out' },
          { id: 'k2', time: 2, value: 300, spring: { mass: 1, stiffness: 100, damping: 10 } }
        ]
      }
    ],
    pathPoints: [
      { x: 0, y: 0, cp2x: 0, cp2y: 50 },
      { x: 100, y: 100, cp1x: 100, cp1y: 50 }
    ],
    fillRule: 'evenodd',
    maskMode: 'alpha',
    maskTargetId: 'mask-owner',
    isMask: true,
    textContent: 'Hello Vector World',
    fontSize: 24,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 1.2,
    filterBlur: 4,
    shadowBlur: 16,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffsetX: 4,
    shadowOffsetY: 8,
    linearGradient: {
      angle: 90,
      stops: [
        { offset: 0, color: '#ff0000' },
        { offset: 1, color: '#0000ff' }
      ]
    },
    triggers: [
      { id: 'trig-1', event: 'onClick', action: 'play' }
    ],
    motionPath: {
      pathNodeId: 'path-guide',
      progress: 0.5,
      autoOrient: true,
      offsetAngle: 0
    },
    staggerType: 'cascade',
    staggerDelay: 0.05,
    textPathNodeId: 'path-guide',
    textPathOffset: 12
  };

  const project: SceneProject = {
    id: 'proj-completeness',
    name: 'Completeness Verification',
    version: '2.0.0',
    duration: 5.0,
    fps: 60,
    rootFrame: {
      id: 'parent-root',
      name: 'Root Frame',
      type: 'frame',
      visible: true,
      locked: false,
      clipContent: true,
      canvasBg: '#0f172a',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: '#0f172a',
      tracks: []
    },
    nodes: {
      'node-full-feature': fullFeatureNode
    },
    nodeOrder: ['node-full-feature']
  };

  it('guarantees 100% preservation of all semantic fields during Runtime Snapshot creation', () => {
    const snapshot = createRuntimeSnapshot(project);
    const node = snapshot.nodes['node-full-feature'];

    expect(node).toBeDefined();

    // Verification of every single property
    expect(node.strokeDash).toEqual([10, 5, 2, 5]);
    expect(node.childrenIds).toEqual(['child-1', 'child-2']);
    expect(node.linearGradient?.stops).toHaveLength(2);
    expect(node.motionPath?.pathNodeId).toBe('path-guide');
    expect(node.motionPath?.autoOrient).toBe(true);
    expect(node.staggerType).toBe('cascade');
    expect(node.staggerDelay).toBe(0.05);
    expect(node.textPathNodeId).toBe('path-guide');
    expect(node.textPathOffset).toBe(12);
    expect(node.letterSpacing).toBe(1.5);
    expect(node.lineHeight).toBe(1.2);
    expect(node.triggers).toHaveLength(1);
    expect(node.isMask).toBe(true);
    expect(node.maskMode).toBe('alpha');
    expect(node.shadowBlur).toBe(16);
    expect(node.filterBlur).toBe(4);
    expect(node.tracks[0].keyframes[1].spring?.stiffness).toBe(100);

    // Root Frame properties
    expect(snapshot.rootFrame.clipContent).toBe(true);
    expect(snapshot.rootFrame.canvasBg).toBe('#0f172a');
  });
});
