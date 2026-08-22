import { describe, it, expect } from 'vitest';
import { StateMachineRuntime, StateMachineDefinition } from '../runtimeStateMachine';

describe('State Machine Runtime v2 (CORE-06 & Section 8)', () => {
  const sampleMachine: StateMachineDefinition = {
    id: 'sm-btn',
    name: 'Interactive Button',
    inputs: [
      { id: 'inp-hover', name: 'isHovered', type: 'boolean', value: false },
      { id: 'inp-speed', name: 'speed', type: 'number', value: 1.0, min: 0, max: 5 },
      { id: 'inp-click', name: 'clickTrigger', type: 'trigger', value: false }
    ],
    layers: [
      {
        id: 'layer-main',
        name: 'Base Layer',
        defaultStateId: 'state-idle',
        states: [
          { id: 'state-idle', name: 'Idle', type: 'animation' },
          { id: 'state-hover', name: 'Hover', type: 'animation' },
          { id: 'state-active', name: 'Active', type: 'animation' }
        ],
        transitions: [
          {
            id: 't1',
            fromStateId: 'state-idle',
            toStateId: 'state-hover',
            duration: 0.2,
            conditions: [{ inputId: 'inp-hover', operator: '==', value: true }]
          },
          {
            id: 't2',
            fromStateId: 'state-hover',
            toStateId: 'state-idle',
            duration: 0.2,
            conditions: [{ inputId: 'inp-hover', operator: '==', value: false }]
          },
          {
            id: 't3',
            fromStateId: 'state-hover',
            toStateId: 'state-active',
            duration: 0,
            conditions: [{ inputId: 'inp-click', operator: 'fired' }]
          }
        ]
      }
    ]
  };

  it('starts at default state on initialization', () => {
    const runtime = new StateMachineRuntime(sampleMachine);
    const layerState = runtime.getLayerState('layer-main');
    expect(layerState).toBeDefined();
    expect(layerState?.currentStateId).toBe('state-idle');
  });

  it('transitions to Hover when isHovered becomes true', () => {
    const runtime = new StateMachineRuntime(sampleMachine);
    runtime.setInput('isHovered', true);
    runtime.advance(0.016);

    const layerState = runtime.getLayerState('layer-main');
    expect(layerState?.currentStateId).toBe('state-hover');
    expect(layerState?.isTransitioning).toBe(true);

    // Complete transition duration (0.2s)
    runtime.advance(0.25);
    const completedState = runtime.getLayerState('layer-main');
    expect(completedState?.isTransitioning).toBe(false);
    expect(completedState?.transitionProgress).toBe(1.0);
  });

  it('does not transition if condition is not satisfied', () => {
    const runtime = new StateMachineRuntime(sampleMachine);
    // Setting speed does not satisfy hover condition
    runtime.setInput('speed', 3.0);
    runtime.advance(0.05);

    const layerState = runtime.getLayerState('layer-main');
    expect(layerState?.currentStateId).toBe('state-idle');
  });

  it('fires trigger and transitions instantaneously', () => {
    const runtime = new StateMachineRuntime(sampleMachine);
    runtime.setInput('isHovered', true);
    runtime.advance(0.016); // Starts transition idle -> hover
    runtime.advance(0.25);  // Completes transition duration (0.2s) -> fully in state-hover

    runtime.fireTrigger('clickTrigger');
    runtime.advance(0.016); // Evaluates trigger -> transitions to state-active

    const layerState = runtime.getLayerState('layer-main');
    expect(layerState?.currentStateId).toBe('state-active');
  });

  it('replays recorded events deterministically', () => {
    const runtime = new StateMachineRuntime(sampleMachine);
    runtime.setInput('isHovered', true);
    runtime.advance(0.3);
    runtime.fireTrigger('clickTrigger');
    runtime.advance(0.1);

    const events = runtime.getRecordedEvents();
    expect(events.length).toBe(2);

    const replayed = StateMachineRuntime.replay(sampleMachine, events, 0.45);
    const replayedState = replayed.getLayerState('layer-main');
    expect(replayedState?.currentStateId).toBe('state-active');
  });
});
