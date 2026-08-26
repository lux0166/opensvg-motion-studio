import { describe, it, expect } from 'vitest';
import {
  validateDocument,
  serializeDocument,
  parseDocument,
  convertProjectToNativeDocument,
  convertNativeDocumentToProject
} from '../index';
import { OpenSVGDocument } from '../nativeDocument';
import { SceneProject } from '../../types';

describe('Native OpenSVG Document Format (.osvg) (Section 9 & 10)', () => {
  const sampleDoc: OpenSVGDocument = {
    format: 'opensvg',
    schemaVersion: '2.0.0',
    metadata: {
      id: 'doc-sample-1',
      title: 'Sample Animation Document',
      description: 'Test document for native format validation',
      author: 'Tester',
      createdAt: 1787380000000,
      updatedAt: 1787380000000,
      generator: 'OpenSVG Motion Studio 2.0'
    },
    scene: {
      width: 800,
      height: 600,
      fps: 60,
      duration: 5.0,
      background: '#111827',
      clipContent: true
    },
    nodes: {
      'shape-1': {
        id: 'shape-1',
        name: 'Glowing Circle',
        type: 'circle',
        visible: true,
        locked: false,
        x: 100,
        y: 100,
        width: 80,
        height: 80,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 9999,
        fill: '#38bdf8',
        tracks: [
          {
            id: 'tr-1',
            property: 'scaleX',
            label: 'Pulse Scale',
            unit: 'x',
            keyframes: [
              { id: 'k1', time: 0.0, value: 1.0 },
              { id: 'k2', time: 2.5, value: 1.5 }
            ]
          }
        ]
      }
    },
    nodeOrder: ['shape-1']
  };

  it('validates canonical document structure successfully', () => {
    const report = validateDocument(sampleDoc);
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('rejects malformed or invalid documents with clear error descriptions', () => {
    const invalidDoc = {
      format: 'unknown_format',
      nodes: {}
    };

    const report = validateDocument(invalidDoc);
    expect(report.valid).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.errors[0]).toContain("Expected 'opensvg'");
  });

  it('performs lossless serialization and parse round-trip', () => {
    const jsonString = serializeDocument(sampleDoc, true);
    expect(typeof jsonString).toBe('string');

    const parsedDoc = parseDocument(jsonString);
    expect(parsedDoc.metadata.id).toBe(sampleDoc.metadata.id);
    expect(parsedDoc.scene.duration).toBe(sampleDoc.scene.duration);
    expect(parsedDoc.nodes['shape-1'].name).toBe('Glowing Circle');
  });

  it('converts SceneProject to OpenSVGDocument and back without loss of data', () => {
    const project: SceneProject = {
      id: 'proj-roundtrip',
      name: 'Project Conversion',
      version: '2.0.0',
      duration: 4.0,
      fps: 60,
      rootFrame: {
        id: 'root-1',
        name: 'Root Frame',
        type: 'frame',
        visible: true,
        locked: false,
        clipContent: true,
        canvasBg: '#1e293b',
        borderRadius: 0,
        fill: '#1e293b',
        x: 0,
        y: 0,
        width: 1000,
        height: 700,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        tracks: []
      },
      nodes: {
        'rect-1': {
          id: 'rect-1',
          name: 'Hero Rect',
          type: 'rect',
          visible: true,
          locked: false,
          x: 200,
          y: 200,
          width: 300,
          height: 150,
          rotation: 15,
          scaleX: 1,
          scaleY: 1,
          opacity: 0.8,
          borderRadius: 16,
          fill: '#10b981',
          tracks: []
        }
      },
      nodeOrder: ['rect-1']
    };

    const nativeDoc = convertProjectToNativeDocument(project);
    expect(nativeDoc.format).toBe('opensvg');
    expect(nativeDoc.scene.width).toBe(1000);
    expect(nativeDoc.scene.height).toBe(700);

    const convertedBackProject = convertNativeDocumentToProject(nativeDoc);
    expect(convertedBackProject.id).toBe(project.id);
    expect(convertedBackProject.duration).toBe(project.duration);
    expect(convertedBackProject.nodes['rect-1'].fill).toBe('#10b981');
  });
});
