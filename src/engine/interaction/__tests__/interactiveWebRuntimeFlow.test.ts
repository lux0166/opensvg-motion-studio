import { describe, it, expect } from 'vitest';
import { OpenSVGWebRuntime } from '../../webRuntime/openSVGWebRuntime';
import { OpenSVGDocument } from '../../format/nativeDocument';

describe('End-to-End Interaction: Pointer -> StateMachine -> Animation (Section 4)', () => {
  const interactiveDoc: OpenSVGDocument = {
    format: 'opensvg',
    schemaVersion: '2.0.0',
    metadata: {
      id: 'doc-interactive-flow',
      title: 'Interactive Flow Test',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    scene: {
      width: 400,
      height: 200,
      fps: 60,
      duration: 3.0,
      background: '#ffffff'
    },
    nodes: {
      'action-btn': {
        id: 'action-btn',
        name: 'Action Button',
        type: 'rect',
        visible: true,
        locked: false,
        x: 50,
        y: 50,
        width: 200,
        height: 60,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 8,
        fill: '#4f46e5',
        tracks: []
      }
    },
    nodeOrder: ['action-btn'],
    stateMachines: [
      {
        id: 'sm-btn',
        name: 'Button Controller',
        inputs: [
          { id: 'inp-hover', name: 'isHovered', type: 'boolean', value: false },
          { id: 'inp-press', name: 'isPressed', type: 'boolean', value: false }
        ],
        layers: [
          {
            id: 'layer-btn',
            name: 'Button Layer',
            defaultStateId: 'state-idle',
            states: [
              {
                id: 'state-idle',
                name: 'Idle',
                type: 'animation',
                propertyOverrides: {
                  'action-btn': { fill: '#4f46e5', scaleX: 1.0 }
                }
              },
              {
                id: 'state-hover',
                name: 'Hover',
                type: 'animation',
                propertyOverrides: {
                  'action-btn': { fill: '#6366f1', scaleX: 1.05 }
                }
              },
              {
                id: 'state-pressed',
                name: 'Pressed',
                type: 'animation',
                propertyOverrides: {
                  'action-btn': { fill: '#4338ca', scaleX: 0.96 }
                }
              }
            ],
            transitions: [
              {
                id: 'tr-1',
                fromStateId: 'state-idle',
                toStateId: 'state-hover',
                duration: 0,
                conditions: [{ inputId: 'inp-hover', operator: '==', value: true }]
              },
              {
                id: 'tr-2',
                fromStateId: 'state-hover',
                toStateId: 'state-idle',
                duration: 0,
                conditions: [{ inputId: 'inp-hover', operator: '==', value: false }]
              },
              {
                id: 'tr-3',
                fromStateId: 'state-hover',
                toStateId: 'state-pressed',
                duration: 0,
                conditions: [{ inputId: 'inp-press', operator: '==', value: true }]
              }
            ]
          }
        ]
      }
    ]
  };

  it('drives StateMachine and visual animation seamlessly through WebRuntime interaction', () => {
    const webRuntime = new OpenSVGWebRuntime({ autoplay: false });
    webRuntime.load(interactiveDoc);

    // Initial state: Idle -> fill: '#4f46e5', scaleX: 1.0
    let state = webRuntime.getRuntime().getEvaluatedSceneState();
    expect(state.evaluatedNodes['action-btn'].fill).toBe('#4f46e5');
    expect(state.evaluatedNodes['action-btn'].scaleX).toBe(1.0);

    // Pointer hover enter -> sets isHovered = true -> advances runtime
    webRuntime.setBoolean('isHovered', true);
    webRuntime.getRuntime().advance(0.016);

    state = webRuntime.getRuntime().getEvaluatedSceneState();
    expect(state.evaluatedNodes['action-btn'].fill).toBe('#6366f1');
    expect(state.evaluatedNodes['action-btn'].scaleX).toBe(1.05);

    // Pointer down (press) -> sets isPressed = true -> advances runtime
    webRuntime.setBoolean('isPressed', true);
    webRuntime.getRuntime().advance(0.016);

    state = webRuntime.getRuntime().getEvaluatedSceneState();
    expect(state.evaluatedNodes['action-btn'].fill).toBe('#4338ca');
    expect(state.evaluatedNodes['action-btn'].scaleX).toBe(0.96);
  });
});
