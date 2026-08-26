import { describe, it, expect } from 'vitest';
import { validateDocument, parseDocument } from '../documentParser';
import { OpenSVGDocument } from '../nativeDocument';

describe('Strict Native .osvg Schema Validation (P0-3, P1-1, P1-2, P1-3)', () => {
  const createValidDocument = (): OpenSVGDocument => ({
    format: 'opensvg',
    schemaVersion: '2.0.0',
    metadata: {
      id: 'doc-valid',
      title: 'Valid Document',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    scene: {
      width: 800,
      height: 600,
      fps: 60,
      duration: 3.0,
      background: '#ffffff'
    },
    nodes: {
      'node-root': {
        id: 'node-root',
        name: 'Root Node',
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
        opacity: 1,
        borderRadius: 0,
        fill: '#ffffff',
        tracks: []
      },
      'node-child': {
        id: 'node-child',
        name: 'Child Node',
        type: 'circle',
        visible: true,
        locked: false,
        parentId: 'node-root',
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#000000',
        tracks: []
      }
    },
    nodeOrder: ['node-root', 'node-child']
  });

  it('accepts valid schema 2.0.0 document', () => {
    const doc = createValidDocument();
    const result = validateDocument(doc);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('rejects unsupported schema versions (P1-3)', () => {
    const doc = createValidDocument();
    (doc as any).schemaVersion = '999.0.0';
    const result = validateDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Unsupported schemaVersion '999.0.0'"))).toBe(true);
  });

  it('rejects missing parent node references (P1-2)', () => {
    const doc = createValidDocument();
    doc.nodes['node-child'].parentId = 'ghost-parent-not-exist';
    const result = validateDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("references non-existent parentId 'ghost-parent-not-exist'"))).toBe(true);
  });

  it('detects and rejects cyclic parent hierarchies (P1-1)', () => {
    const doc = createValidDocument();
    doc.nodes['node-root'].parentId = 'node-child'; // node-root -> node-child -> node-root
    const result = validateDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Cyclic hierarchy detected'))).toBe(true);
  });

  it('rejects interaction targeting non-existent node (P0-3)', () => {
    const doc = createValidDocument();
    doc.interactions = [
      {
        id: 'inter-1',
        targetNodeId: 'HAHA_NOT_EXIST',
        event: 'click',
        action: { type: 'setInput', inputName: 'foo', value: true }
      }
    ];
    const result = validateDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("targets non-existent node 'HAHA_NOT_EXIST'"))).toBe(true);
  });

  it('rejects invalid interaction event names (P0-3)', () => {
    const doc = createValidDocument();
    doc.interactions = [
      {
        id: 'inter-2',
        targetNodeId: 'node-root',
        event: 'teleportToMars' as any,
        action: { type: 'setInput', inputName: 'foo', value: true }
      }
    ];
    const result = validateDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("has invalid event 'teleportToMars'"))).toBe(true);
  });

  it('rejects invalid interaction action payloads (P0-3)', () => {
    const doc = createValidDocument();
    doc.interactions = [
      {
        id: 'inter-3',
        targetNodeId: 'node-root',
        event: 'pointerdown',
        action: { type: 'setInput', inputName: '', value: true }
      },
      {
        id: 'inter-4',
        targetNodeId: 'node-root',
        event: 'click',
        action: { type: 'seek', time: -5 }
      }
    ];
    const result = validateDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("requires valid 'inputName'"))).toBe(true);
    expect(result.errors.some((e) => e.includes("requires non-negative 'time'"))).toBe(true);
  });

  it('rejects state machine with invalid default state or transition target', () => {
    const doc = createValidDocument();
    doc.stateMachines = [
      {
        id: 'sm-invalid',
        name: 'Invalid SM',
        inputs: [],
        layers: [
          {
            id: 'layer-1',
            name: 'Layer 1',
            defaultStateId: 'state-missing',
            states: [{ id: 'state-1', name: 'State 1', type: 'animation' }],
            transitions: [
              {
                id: 'tr-1',
                fromStateId: 'state-1',
                toStateId: 'state-destination-missing',
                duration: 0.1,
                conditions: []
              }
            ]
          }
        ]
      }
    ];
    const result = validateDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("unknown defaultStateId 'state-missing'"))).toBe(true);
    expect(result.errors.some((e) => e.includes("unknown toStateId 'state-destination-missing'"))).toBe(true);
  });

  it('rejects component instances with invalid componentDefId', () => {
    const doc = createValidDocument();
    doc.components = [
      {
        id: 'comp-real',
        name: 'Real Component',
        rootNode: doc.nodes['node-root']
      }
    ];
    doc.componentInstances = [
      {
        id: 'inst-1',
        name: 'Instance 1',
        componentDefId: 'comp-fake-unknown',
        x: 0,
        y: 0,
        overrides: {}
      }
    ];
    const result = validateDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("unknown componentDefId 'comp-fake-unknown'"))).toBe(true);
  });

  it('throws on parseDocument when given invalid JSON or schema', () => {
    expect(() => parseDocument('invalid json')).toThrow(/JSON Syntax Error/);
    const doc = createValidDocument();
    doc.nodes['node-child'].parentId = 'missing';
    expect(() => parseDocument(JSON.stringify(doc))).toThrow(/Invalid OpenSVG document format/);
  });
});
