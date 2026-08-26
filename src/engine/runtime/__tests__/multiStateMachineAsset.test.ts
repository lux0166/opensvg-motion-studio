import { describe, it, expect } from 'vitest';
import { OpenSVGRuntime } from '../runtimeKernel';
import { OpenSVGDocument } from '../../format/nativeDocument';

describe('Multi-StateMachine & Asset Runtime Subsystem (P0-2, P0-4, P0-5)', () => {
  const createMultiMachineDocument = (): OpenSVGDocument => ({
    format: 'opensvg',
    schemaVersion: '2.0.0',
    metadata: {
      id: 'doc-multi',
      title: 'Multi Machine & Asset Test',
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
      'hero-box': {
        id: 'hero-box',
        name: 'Hero Box',
        type: 'rect',
        visible: true,
        locked: false,
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#3b82f6',
        tracks: []
      },
      'status-light': {
        id: 'status-light',
        name: 'Status Light',
        type: 'circle',
        visible: true,
        locked: false,
        x: 300,
        y: 100,
        width: 40,
        height: 40,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#ef4444',
        tracks: []
      }
    },
    nodeOrder: ['hero-box', 'status-light'],
    stateMachines: [
      {
        id: 'sm-hero',
        name: 'Hero Machine',
        inputs: [{ id: 'inp-hero-active', name: 'heroActive', type: 'boolean', value: false }],
        layers: [
          {
            id: 'layer-hero-anim',
            name: 'Hero Anim Layer',
            defaultStateId: 'state-hero-idle',
            states: [
              {
                id: 'state-hero-idle',
                name: 'Hero Idle',
                type: 'animation',
                propertyOverrides: { 'hero-box': { fill: '#3b82f6' } }
              },
              {
                id: 'state-hero-active',
                name: 'Hero Active',
                type: 'animation',
                propertyOverrides: { 'hero-box': { fill: '#10b981' } }
              }
            ],
            transitions: [
              {
                id: 'tr-h1',
                fromStateId: 'state-hero-idle',
                toStateId: 'state-hero-active',
                duration: 0.1,
                conditions: [{ inputId: 'inp-hero-active', operator: '==', value: true }]
              }
            ]
          }
        ]
      },
      {
        id: 'sm-status',
        name: 'Status Machine',
        inputs: [{ id: 'trig-pulse', name: 'triggerPulse', type: 'trigger', value: false }],
        layers: [
          {
            id: 'layer-beacon',
            name: 'Beacon Layer',
            defaultStateId: 'state-beacon-off',
            states: [
              {
                id: 'state-beacon-off',
                name: 'Beacon Off',
                type: 'animation',
                propertyOverrides: { 'status-light': { fill: '#ef4444' } }
              },
              {
                id: 'state-beacon-pulsing',
                name: 'Beacon Pulsing',
                type: 'animation',
                propertyOverrides: { 'status-light': { fill: '#eab308' } }
              }
            ],
            transitions: [
              {
                id: 'tr-b1',
                fromStateId: 'state-beacon-off',
                toStateId: 'state-beacon-pulsing',
                duration: 0.1,
                conditions: [{ inputId: 'trig-pulse', operator: '==', value: true }]
              }
            ]
          }
        ]
      }
    ],
    assets: {
      'asset-logo': {
        id: 'asset-logo',
        name: 'Logo Image',
        type: 'image',
        mimeType: 'image/png',
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      },
      'asset-font': {
        id: 'asset-font',
        name: 'Brand Font',
        type: 'font',
        mimeType: 'font/woff2',
        url: 'https://cdn.example.com/fonts/inter.woff2'
      }
    }
  });

  it('runs multiple independent state machines simultaneously without interference', () => {
    const doc = createMultiMachineDocument();
    const runtime = new OpenSVGRuntime();
    runtime.load(doc);

    // Initial evaluation
    let state = runtime.getEvaluatedSceneState();
    expect(state.evaluatedNodes['hero-box'].fill).toBe('#3b82f6');
    expect(state.evaluatedNodes['status-light'].fill).toBe('#ef4444');

    // Trigger heroActive on Hero Machine
    runtime.setBoolean('heroActive', true);
    runtime.advance(0.1);
    state = runtime.getEvaluatedSceneState();
    expect(state.evaluatedNodes['hero-box'].fill).toBe('#10b981');
    expect(state.evaluatedNodes['status-light'].fill).toBe('#ef4444'); // status remains unaffected

    // Fire triggerPulse on Status Machine
    runtime.fireTrigger('triggerPulse');
    runtime.advance(0.1);
    state = runtime.getEvaluatedSceneState();
    expect(state.evaluatedNodes['hero-box'].fill).toBe('#10b981');
    expect(state.evaluatedNodes['status-light'].fill).toBe('#eab308'); // beacon active now
  });

  it('allows canonical setState without layer-main assumptions', () => {
    const doc = createMultiMachineDocument();
    const runtime = new OpenSVGRuntime();
    runtime.load(doc);

    // Force state explicitly using (layerId, stateId)
    runtime.setState('layer-hero-anim', 'state-hero-active');
    runtime.advance(0.016);
    expect(runtime.getEvaluatedSceneState().evaluatedNodes['hero-box'].fill).toBe('#10b981');

    // Force state explicitly using (machineId, layerId, stateId)
    runtime.setState('sm-status', 'layer-beacon', 'state-beacon-pulsing');
    runtime.advance(0.016);
    expect(runtime.getEvaluatedSceneState().evaluatedNodes['status-light'].fill).toBe('#eab308');
  });

  it('loads and resolves assets in AssetStore with proper status lifecycle', () => {
    const doc = createMultiMachineDocument();
    const runtime = new OpenSVGRuntime();
    runtime.load(doc);

    const assetStore = runtime.getAssetStore();
    expect(assetStore.size).toBe(2);

    const logoAsset = assetStore.getAsset('asset-logo');
    expect(logoAsset).toBeDefined();
    expect(logoAsset?.status).toBe('ready');
    expect(assetStore.resolveSource('asset-logo')).toContain('data:image/png;base64');

    const fontAsset = assetStore.getAsset('asset-font');
    expect(fontAsset).toBeDefined();
    expect(fontAsset?.status).toBe('unloaded');
    expect(assetStore.resolveSource('asset-font')).toBe('https://cdn.example.com/fonts/inter.woff2');
  });
});
