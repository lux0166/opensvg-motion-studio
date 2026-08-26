import { describe, it, expect, vi } from 'vitest';
import { OpenSVGWebRuntime } from '../openSVGWebRuntime';
import { OpenSVGDocument } from '../../format/nativeDocument';

describe('Interactive OpenSVG Web Runtime (Section 12 & 13)', () => {
  const sampleDoc: OpenSVGDocument = {
    format: 'opensvg',
    schemaVersion: '2.0.0',
    metadata: {
      id: 'doc-webruntime-test',
      title: 'Web Runtime Test',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    scene: {
      width: 400,
      height: 300,
      fps: 60,
      duration: 3.0,
      background: '#ffffff'
    },
    nodes: {
      'badge-node': {
        id: 'badge-node',
        name: 'Badge',
        type: 'rect',
        visible: true,
        locked: false,
        x: 50,
        y: 50,
        width: 100,
        height: 40,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 8,
        fill: '#8b5cf6',
        tracks: [
          {
            id: 'tr-op',
            property: 'opacity',
            label: 'Opacity',
            unit: '%',
            keyframes: [
              { id: 'k1', time: 0, value: 1.0 },
              { id: 'k2', time: 3.0, value: 0.2 }
            ]
          }
        ]
      }
    },
    nodeOrder: ['badge-node'],
    stateMachines: [
      {
        id: 'sm-test',
        name: 'State Machine Test',
        inputs: [
          { id: 'inp-active', name: 'isActive', type: 'boolean', value: false },
          { id: 'inp-count', name: 'count', type: 'number', value: 0 },
          { id: 'inp-trigger', name: 'fireAlert', type: 'trigger', value: false }
        ],
        layers: [
          {
            id: 'layer_main',
            name: 'Main Layer',
            defaultStateId: 'state_idle',
            states: [
              { id: 'state_idle', name: 'Idle', type: 'animation' },
              { id: 'state_active', name: 'Active', type: 'animation' }
            ],
            transitions: [
              {
                id: 'tr-1',
                fromStateId: 'state_idle',
                toStateId: 'state_active',
                duration: 0.2,
                conditions: [{ inputId: 'inp-active', operator: '==', value: true }]
              }
            ]
          }
        ]
      }
    ]
  };

  it('loads document into headless web runtime and drives playback controls', () => {
    const runtime = new OpenSVGWebRuntime({ autoplay: false });
    runtime.load(sampleDoc);

    expect(runtime.getDuration()).toBe(3.0);
    expect(runtime.getCurrentTime()).toBe(0);

    runtime.play();
    expect(runtime.getIsPlaying()).toBe(true);

    runtime.seek(1.5);
    expect(runtime.getCurrentTime()).toBe(1.5);

    runtime.pause();
    expect(runtime.getIsPlaying()).toBe(false);
  });

  it('updates state machine inputs and emits runtime events', () => {
    const runtime = new OpenSVGWebRuntime({ autoplay: false });
    const eventSpy = vi.fn();
    runtime.addEventListener(eventSpy);

    runtime.load(sampleDoc);
    expect(eventSpy).toHaveBeenCalledWith('loaded', { documentId: 'doc-webruntime-test' });

    runtime.setBoolean('isActive', true);
    expect(eventSpy).toHaveBeenCalledWith('inputChange', { name: 'isActive', value: true });

    runtime.setNumber('count', 42);
    expect(eventSpy).toHaveBeenCalledWith('inputChange', { name: 'count', value: 42 });

    runtime.fireTrigger('fireAlert');
    expect(eventSpy).toHaveBeenCalledWith('triggerFired', { name: 'fireAlert' });
  });

  it('applies direct dynamic property overrides to runtime scene nodes', () => {
    const runtime = new OpenSVGWebRuntime({ autoplay: false });
    runtime.load(sampleDoc);

    runtime.setProperty('badge-node', 'fill', '#ec4899');
    const state = runtime.getRuntime().getEvaluatedSceneState();

    expect(state.evaluatedNodes['badge-node'].fill).toBe('#ec4899');
  });
});
