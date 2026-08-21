import { describe, it, expect } from 'vitest';
import { serializeProject, parseAndValidateProject } from '../projectManager';
import { FrameNode, SceneNode } from '../types';

describe('Project Serialization & Schema Validation (.kinetic)', () => {
  const rootFrame: FrameNode = {
    id: 'frame-1',
    name: 'Logo Animation',
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
  };

  const nodes: Record<string, SceneNode> = {
    card: {
      id: 'card',
      name: 'Card Element',
      type: 'rect',
      visible: true,
      locked: false,
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      rotation: 45,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 16,
      fill: '#111827',
      tracks: []
    }
  };

  it('serializes project correctly with version and metadata', () => {
    const jsonStr = serializeProject(rootFrame, nodes, ['card'], 4.5, 60);
    expect(jsonStr).toContain('"version": "1.0.0"');
    expect(jsonStr).toContain('"name": "Logo Animation"');
    expect(jsonStr).toContain('"duration": 4.5');
  });

  it('parses valid kinetic project file', () => {
    const jsonStr = serializeProject(rootFrame, nodes, ['card'], 4.5, 60);
    const parsed = parseAndValidateProject(jsonStr);
    expect(parsed.name).toBe('Logo Animation');
    expect(parsed.duration).toBe(4.5);
    expect(parsed.rootFrame.width).toBe(800);
    expect(parsed.nodes['card'].rotation).toBe(45);
  });

  it('rejects corrupt or invalid project schema', () => {
    expect(() => parseAndValidateProject('{ "foo": "bar" }')).toThrow();
    expect(() => parseAndValidateProject('corrupted-json')).toThrow();
  });
});
