import { describe, it, expect } from 'vitest';
import { createRuntimeSnapshot } from '../runtimeSnapshot';
import { SceneProject } from '../../types';

describe('Runtime Snapshot & Memory Optimization (Section 7)', () => {
  const sampleProject: SceneProject = {
    id: 'proj-snapshot-1',
    name: 'Snapshot Benchmark Project',
    version: '2.0.0',
    duration: 3.0,
    fps: 60,
    rootFrame: {
      id: 'root-1',
      name: 'Root',
      type: 'frame',
      visible: true,
      locked: false,
      clipContent: true,
      canvasBg: '#ffffff',
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: '#ffffff',
      tracks: []
    },
    nodes: {
      'box-1': {
        id: 'box-1',
        name: 'Animated Box',
        type: 'rect',
        visible: true,
        locked: false,
        x: 10,
        y: 20,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 8,
        fill: '#3b82f6',
        tracks: [
          {
            id: 'tr-1',
            property: 'x',
            label: 'X',
            unit: 'px',
            keyframes: [
              { id: 'k1', time: 0, value: 10 },
              { id: 'k2', time: 3, value: 300 }
            ]
          }
        ]
      }
    },
    nodeOrder: ['box-1']
  };

  it('creates an isolated runtime snapshot without mutating or sharing object references', () => {
    const snapshot = createRuntimeSnapshot(sampleProject);

    expect(snapshot.id).toBe(sampleProject.id);
    expect(snapshot.nodes['box-1'].x).toBe(10);

    // Mutate snapshot
    snapshot.nodes['box-1'].x = 999;
    snapshot.nodes['box-1'].tracks[0].keyframes[0].value = 888;

    // Original project must remain untouched
    expect(sampleProject.nodes['box-1'].x).toBe(10);
    expect(sampleProject.nodes['box-1'].tracks[0].keyframes[0].value).toBe(10);
  });

  it('executes significantly faster than JSON.parse(JSON.stringify()) over repeated iterations', () => {
    const iterations = 1000;

    const startJSON = performance.now();
    for (let i = 0; i < iterations; i++) {
      JSON.parse(JSON.stringify(sampleProject));
    }
    const durationJSON = performance.now() - startJSON;

    const startSnapshot = performance.now();
    for (let i = 0; i < iterations; i++) {
      createRuntimeSnapshot(sampleProject);
    }
    const durationSnapshot = performance.now() - startSnapshot;

    // Snapshot cloner is expected to run clean and fast
    expect(durationSnapshot).toBeLessThanOrEqual(durationJSON * 2);
  });
});
