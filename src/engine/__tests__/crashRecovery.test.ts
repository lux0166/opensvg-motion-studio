import { describe, it, expect } from 'vitest';
import { createRecoverySnapshot, validateRecoverySnapshot, computeProjectChecksum } from '../crashRecovery';
import { SceneProject } from '../types';

describe('Atomic Crash Recovery Engine (Rules D3, D4, D5)', () => {
  const mockProject: SceneProject = {
    id: 'proj-rec-1',
    name: 'Crash Recovery Test',
    version: '1.0',
    duration: 3.0,
    fps: 60,
    rootFrame: {
      id: 'frame-1', name: 'Root', type: 'frame', visible: true, locked: false, clipContent: true,
      canvasBg: '#fff', x: 0, y: 0, width: 600, height: 400, rotation: 0, scaleX: 1, scaleY: 1,
      opacity: 1, borderRadius: 0, fill: '#fff', tracks: []
    },
    nodes: {},
    nodeOrder: []
  };

  it('creates valid snapshot with matching integrity checksum (Rule D4)', () => {
    const snap = createRecoverySnapshot(mockProject);
    expect(snap.id).toBeDefined();
    expect(snap.checksum).toBe(computeProjectChecksum(mockProject));
    expect(validateRecoverySnapshot(snap)).toBe(true);
  });

  it('rejects corrupt snapshots (Rule D5)', () => {
    const corruptSnap = {
      id: 'rec-corrupt',
      timestamp: Date.now(),
      checksum: 'bad_hash',
      project: mockProject
    };
    expect(validateRecoverySnapshot(corruptSnap)).toBe(false);
  });
});
