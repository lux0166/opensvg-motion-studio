import { describe, it, expect } from 'vitest';
import { StateMachineRuntime, StateMachineDefinition } from '../runtimeStateMachine';
import { evaluateScenePipeline } from '../../runtime/evaluationPipeline';
import { SceneProject, FrameNode } from '../../types';

describe('State Machine Runtime Pipeline Integration (Section 3 & 7)', () => {
  const rootFrame: FrameNode = {
    id: 'root-sm-test',
    name: 'Root',
    type: 'frame',
    visible: true,
    locked: false,
    clipContent: true,
    canvasBg: '#ffffff',
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 0,
    fill: '#ffffff',
    tracks: []
  };

  const project: SceneProject = {
    id: 'proj-sm-pipe',
    name: 'SM Pipeline Project',
    version: '2.0.0',
    duration: 3.0,
    fps: 60,
    rootFrame,
    nodes: {
      'status-badge': {
        id: 'status-badge',
        name: 'Status Badge',
        type: 'rect',
        visible: true,
        locked: false,
        x: 100,
        y: 100,
        width: 120,
        height: 40,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 8,
        fill: '#3b82f6', // Default blue
        tracks: []
      }
    },
    nodeOrder: ['status-badge']
  };

  const smDef: StateMachineDefinition = {
    id: 'sm-status',
    name: 'Status Controller',
    inputs: [
      { id: 'inp-success', name: 'isSuccess', type: 'boolean', value: false },
      { id: 'inp-error', name: 'isError', type: 'boolean', value: false }
    ],
    layers: [
      {
        id: 'layer-color',
        name: 'Color Layer',
        defaultStateId: 'state-idle',
        states: [
          {
            id: 'state-idle',
            name: 'Idle State',
            type: 'animation',
            propertyOverrides: {
              'status-badge': { fill: '#3b82f6', scaleX: 1.0 }
            }
          },
          {
            id: 'state-success',
            name: 'Success State',
            type: 'animation',
            propertyOverrides: {
              'status-badge': { fill: '#10b981', scaleX: 1.1 }
            }
          },
          {
            id: 'state-error',
            name: 'Error State',
            type: 'animation',
            propertyOverrides: {
              'status-badge': { fill: '#ef4444', scaleX: 0.95 }
            }
          }
        ],
        transitions: [
          {
            id: 'tr-to-success',
            fromStateId: 'state-idle',
            toStateId: 'state-success',
            duration: 0,
            conditions: [{ inputId: 'inp-success', operator: '==', value: true }]
          },
          {
            id: 'tr-to-error',
            fromStateId: 'state-idle',
            toStateId: 'state-error',
            duration: 0,
            conditions: [{ inputId: 'inp-error', operator: '==', value: true }]
          }
        ]
      }
    ]
  };

  it('directly drives EvaluatedSceneState properties when State Machine transitions states', () => {
    const sm = new StateMachineRuntime(smDef);

    // Initial state: idle -> blue (#3b82f6)
    const initialScene = evaluateScenePipeline(project, { time: 0, stateMachineRuntime: sm });
    expect(initialScene.evaluatedNodes['status-badge'].fill).toBe('#3b82f6');
    expect(initialScene.evaluatedNodes['status-badge'].scaleX).toBe(1.0);

    // Trigger state transition: isSuccess = true
    sm.setInput('isSuccess', true);
    sm.advance(0.016);

    const successScene = evaluateScenePipeline(project, { time: 0.016, stateMachineRuntime: sm });
    expect(successScene.evaluatedNodes['status-badge'].fill).toBe('#10b981');
    expect(successScene.evaluatedNodes['status-badge'].scaleX).toBe(1.1);
  });

  it('seeks state machine deterministically forward and backward keeping state in sync with clock', () => {
    const sm = new StateMachineRuntime(smDef);

    // At t=0: idle
    sm.advance(0.5);
    // At t=0.5: user sets isError = true
    sm.setInput('isError', true);
    sm.advance(0.5); // now at t=1.0, state is 'state-error'

    expect(sm.getLayerState('layer-color')?.currentStateId).toBe('state-error');

    // Seek back to t=0.2 (before isError was set)
    sm.seek(0.2);
    expect(sm.getLayerState('layer-color')?.currentStateId).toBe('state-idle');

    // Seek forward to t=1.5 (after isError was set)
    sm.seek(1.5);
    expect(sm.getLayerState('layer-color')?.currentStateId).toBe('state-error');
  });
});
