import { describe, it, expect } from 'vitest';
import { useStudioStore } from '../../../store/useStudioStore';
import { validateDocument, parseDocument } from '../../format/documentParser';
import { OpenSVGWebRuntime } from '../../webRuntime/openSVGWebRuntime';
import { SceneNode } from '../../types';
import { StateMachineDefinition } from '../../stateMachine/runtimeStateMachine';
import { DocumentInteraction } from '../../interaction/interactionModel';

describe('Studio-Authored Interaction to Native .osvg and WebRuntime Execution (P0 Proof)', () => {
  it('certifies complete Studio Authoring -> .osvg Export -> Studio Reload -> WebRuntime Execution Pipeline', () => {
    // ------------------------------------------------------------------------
    // Step 1: User Authors Vector Scene & Interactions inside Studio Store
    // ------------------------------------------------------------------------
    const store = useStudioStore;
    store.getState().createNewProject();

    // 1.1 Add Canvas Elements
    const shieldNode: SceneNode = {
      id: 'shield-visual',
      name: 'Shield Visual',
      type: 'rect',
      visible: true,
      locked: false,
      x: 150,
      y: 100,
      width: 300,
      height: 300,
      rotation: 0,
      scaleX: 1.0,
      scaleY: 1.0,
      opacity: 1,
      borderRadius: 16,
      fill: '#3b82f6',
      tracks: [
        {
          id: 'tr-shield-scale',
          property: 'scaleY',
          label: 'Shield Pulse',
          unit: '',
          keyframes: [
            { id: 'k1', time: 0, value: 1.0, easing: 'ease-in-out' },
            { id: 'k2', time: 1.5, value: 1.05, easing: 'ease-in-out' },
            { id: 'k3', time: 3.0, value: 1.0, easing: 'ease-in-out' }
          ]
        }
      ]
    };

    const actionButton: SceneNode = {
      id: 'arm-trigger-btn',
      name: 'Arm Button',
      type: 'rect',
      visible: true,
      locked: false,
      x: 200,
      y: 420,
      width: 200,
      height: 50,
      rotation: 0,
      scaleX: 1.0,
      scaleY: 1.0,
      opacity: 1,
      borderRadius: 10,
      fill: '#2563eb',
      tracks: []
    };

    store.getState().addNode(shieldNode);
    store.getState().addNode(actionButton);

    // 1.2 Add State Machine
    const customStateMachine: StateMachineDefinition = {
      id: 'sm-authored-controller',
      name: 'Authored Shield Controller',
      inputs: [
        { id: 'inp-armed', name: 'shieldArmed', type: 'boolean', value: false },
        { id: 'trig-warp', name: 'triggerWarp', type: 'trigger', value: false }
      ],
      layers: [
        {
          id: 'layer-authored-shield',
          name: 'Shield Layer',
          defaultStateId: 'state-idle',
          states: [
            {
              id: 'state-idle',
              name: 'Idle',
              type: 'animation',
              propertyOverrides: {
                'shield-visual': { fill: '#3b82f6', scaleX: 1.0 },
                'arm-trigger-btn': { fill: '#2563eb' }
              }
            },
            {
              id: 'state-ready',
              name: 'Ready to Arm',
              type: 'animation',
              propertyOverrides: {
                'shield-visual': { fill: '#60a5fa', scaleX: 1.1 },
                'arm-trigger-btn': { fill: '#3b82f6' }
              }
            },
            {
              id: 'state-overdrive',
              name: 'Warp Overdrive',
              type: 'animation',
              propertyOverrides: {
                'shield-visual': { fill: '#10b981', scaleX: 1.3 },
                'arm-trigger-btn': { fill: '#059669' }
              }
            }
          ],
          transitions: [
            {
              id: 'tr-1',
              fromStateId: 'state-idle',
              toStateId: 'state-ready',
              duration: 0.2,
              conditions: [{ inputId: 'inp-armed', operator: '==', value: true }]
            },
            {
              id: 'tr-2',
              fromStateId: 'state-ready',
              toStateId: 'state-idle',
              duration: 0.2,
              conditions: [{ inputId: 'inp-armed', operator: '==', value: false }]
            },
            {
              id: 'tr-3',
              fromStateId: 'state-ready',
              toStateId: 'state-overdrive',
              duration: 0.15,
              conditions: [{ inputId: 'trig-warp', operator: '==', value: true }]
            }
          ]
        }
      ]
    };

    store.getState().addStateMachine(customStateMachine);

    // 1.3 Add Document-Defined Interactions
    const hoverEnterInteraction: DocumentInteraction = {
      id: 'inter-hover-enter',
      name: 'Hover Trigger Button',
      targetNodeId: 'arm-trigger-btn',
      event: 'pointerenter',
      action: { type: 'setInput', inputName: 'shieldArmed', value: true }
    };

    const hoverLeaveInteraction: DocumentInteraction = {
      id: 'inter-hover-leave',
      name: 'Leave Trigger Button',
      targetNodeId: 'arm-trigger-btn',
      event: 'pointerleave',
      action: { type: 'setInput', inputName: 'shieldArmed', value: false }
    };

    const clickInteraction: DocumentInteraction = {
      id: 'inter-click-warp',
      name: 'Click Trigger Button',
      targetNodeId: 'arm-trigger-btn',
      event: 'click',
      action: { type: 'fireTrigger', triggerName: 'triggerWarp' }
    };

    store.getState().addInteraction(hoverEnterInteraction);
    store.getState().addInteraction(hoverLeaveInteraction);
    store.getState().addInteraction(clickInteraction);

    // Verify store has 3 interactions and 1 state machine
    expect(store.getState().interactions.length).toBe(3);
    expect(store.getState().stateMachines.length).toBe(1);

    // ------------------------------------------------------------------------
    // Step 2: Export from Studio directly into canonical .osvg Native Format
    // ------------------------------------------------------------------------
    const exportedOsvgJson = store.getState().exportOpenSVGDocument();

    // 2.1 Validate .osvg format
    const validation = validateDocument(exportedOsvgJson);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
    expect(exportedOsvgJson).toContain('"schemaVersion": "2.0.0"');
    expect(exportedOsvgJson).toContain('"interactions"');
    expect(exportedOsvgJson).toContain('"shieldArmed"');
    expect(exportedOsvgJson).toContain('"triggerWarp"');

    // ------------------------------------------------------------------------
    // Step 3: Roundtrip Test — Reload .osvg back into Studio
    // ------------------------------------------------------------------------
    store.getState().createNewProject();
    expect(store.getState().interactions.length).toBe(0);
    expect(store.getState().stateMachines.length).toBe(0);

    store.getState().loadOpenSVGDocument(exportedOsvgJson);
    expect(store.getState().nodes['shield-visual']).toBeDefined();
    expect(store.getState().nodes['arm-trigger-btn']).toBeDefined();
    expect(store.getState().stateMachines.length).toBe(1);
    expect(store.getState().interactions.length).toBe(3);
    expect(store.getState().interactions[0].action).toEqual({
      type: 'setInput',
      inputName: 'shieldArmed',
      value: true
    });

    // ------------------------------------------------------------------------
    // Step 4: Standalone WebRuntime Execution (Outside Studio Environment)
    // ------------------------------------------------------------------------
    const webRuntime = new OpenSVGWebRuntime({ autoplay: false, interactive: true });
    const parsedDoc = parseDocument(exportedOsvgJson);
    webRuntime.load(parsedDoc);

    // 4.1 Initial state evaluation
    let scene = webRuntime.getRuntime().getEvaluatedSceneState();
    expect(scene.evaluatedNodes['shield-visual'].fill).toBe('#3b82f6');
    expect(scene.evaluatedNodes['shield-visual'].scaleX).toBe(1.0);

    // 4.2 User hovers pointer over button -> Interaction Resolver triggers 'shieldArmed: true'
    webRuntime.getRuntime().dispatchInteraction('arm-trigger-btn', 'pointerenter');
    webRuntime.getRuntime().advance(0.2); // Complete transition to 'state-ready'

    scene = webRuntime.getRuntime().getEvaluatedSceneState();
    expect(scene.evaluatedNodes['shield-visual'].fill).toBe('#60a5fa');
    expect(scene.evaluatedNodes['shield-visual'].scaleX).toBe(1.1);

    // 4.3 User clicks button -> Interaction Resolver fires 'triggerWarp'
    webRuntime.getRuntime().dispatchInteraction('arm-trigger-btn', 'click');
    webRuntime.getRuntime().advance(0.15); // Complete transition to 'state-overdrive'

    scene = webRuntime.getRuntime().getEvaluatedSceneState();
    expect(scene.evaluatedNodes['shield-visual'].fill).toBe('#10b981');
    expect(scene.evaluatedNodes['shield-visual'].scaleX).toBe(1.3);

    // 4.4 User leaves pointer -> Interaction Resolver sets 'shieldArmed: false'
    webRuntime.getRuntime().dispatchInteraction('arm-trigger-btn', 'pointerleave');
    webRuntime.getRuntime().advance(0.2);
    expect(webRuntime.getRuntime().getStateMachineRuntime()?.getInput('shieldArmed')?.value).toBe(false);
  });
});
