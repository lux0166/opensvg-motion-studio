import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '../../../store/useStudioStore';
import { validateDocument, parseDocument } from '../../format/documentParser';
import { OpenSVGRuntime } from '../../runtime/runtimeKernel';
import { OpenSVGDocument } from '../../format/nativeDocument';

describe('GATE UI-1 — Real Studio Authoring & Format Proof', () => {
  beforeEach(() => {
    useStudioStore.getState().createNewProject();
  });

  it('guarantees clean starter canvas and static shape additions with zero auto-mock animation', () => {
    const store = useStudioStore.getState();

    // 1. Verify Clean / Empty Default State
    expect(Object.keys(store.nodes).length).toBe(0);
    expect(store.nodeOrder.length).toBe(0);
    expect(store.currentTime).toBe(0);
    expect(store.isPlaying).toBe(false);

    // 2. Add Shape: must be 100% STATIC (zero unsolicited animation tracks)
    const shapeId = 'user-button-bg';
    store.addNode({
      id: shapeId,
      name: 'Button Background',
      type: 'rect',
      visible: true,
      locked: false,
      x: 100,
      y: 100,
      width: 200,
      height: 60,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 12,
      fill: '#3b82f6',
      tracks: [] // Static by default
    });

    const addedNode = useStudioStore.getState().nodes[shapeId];
    expect(addedNode).toBeDefined();
    expect(addedNode.tracks.length).toBe(0);
  });

  it('proves end-to-end authoring workflow: Clean Canvas -> Add Shapes -> Keyframe -> Interact -> StateMachine -> Export .osvg -> Reload -> Runtime Execution', () => {
    const store = useStudioStore.getState();

    // Step 1: Add user nodes
    const buttonId = 'interactive-btn';
    store.addNode({
      id: buttonId,
      name: 'Interactive CTA Button',
      type: 'rect',
      visible: true,
      locked: false,
      x: 200,
      y: 150,
      width: 180,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 8,
      fill: '#2563eb',
      tracks: []
    });

    // Step 2: User explicitly authors keyframe animation
    store.addOrUpdateKeyframe(buttonId, 'scaleX', 0.0, 1.0);
    store.addOrUpdateKeyframe(buttonId, 'scaleX', 0.3, 1.1);
    store.addOrUpdateKeyframe(buttonId, 'scaleX', 0.6, 1.0);

    const authoredTracks = useStudioStore.getState().nodes[buttonId].tracks;
    expect(authoredTracks.length).toBe(1);
    expect(authoredTracks[0].keyframes.length).toBe(3);

    // Step 3: User authors Document Interactions via standard Interaction API
    store.addInteraction({
      id: 'inter-hover-enter',
      targetNodeId: buttonId,
      event: 'pointerenter',
      action: {
        type: 'setInput',
        inputName: 'isHovered',
        value: true
      }
    });

    store.addInteraction({
      id: 'inter-hover-leave',
      targetNodeId: buttonId,
      event: 'pointerleave',
      action: {
        type: 'setInput',
        inputName: 'isHovered',
        value: false
      }
    });

    store.addInteraction({
      id: 'inter-click-fire',
      targetNodeId: buttonId,
      event: 'click',
      action: {
        type: 'fireTrigger',
        triggerName: 'pressTrigger'
      }
    });

    expect(useStudioStore.getState().interactions.length).toBe(3);

    // Step 4: Attach a canonical State Machine definition to the project
    const authoredStateMachine = {
      id: 'sm-button-controller',
      name: 'Button Interactivity Machine',
      inputs: [
        { id: 'in-hover', name: 'isHovered', type: 'boolean' as const, value: false },
        { id: 'in-press', name: 'pressTrigger', type: 'trigger' as const, value: false }
      ],
      layers: [
        {
          id: 'layer-btn',
          name: 'Button Layer',
          defaultStateId: 'st-idle',
          states: [
            { id: 'st-idle', name: 'Idle', type: 'animation' as const },
            { id: 'st-hover', name: 'Hovered', type: 'animation' as const },
            { id: 'st-pressed', name: 'Pressed', type: 'animation' as const }
          ],
          transitions: [
            {
              id: 'tr-to-hover',
              fromStateId: 'st-idle',
              toStateId: 'st-hover',
              duration: 0.1,
              conditions: [{ inputId: 'in-hover', operator: '==' as const, value: true }]
            },
            {
              id: 'tr-to-idle',
              fromStateId: 'st-hover',
              toStateId: 'st-idle',
              duration: 0.1,
              conditions: [{ inputId: 'in-hover', operator: '==' as const, value: false }]
            },
            {
              id: 'tr-to-pressed',
              fromStateId: 'st-hover',
              toStateId: 'st-pressed',
              duration: 0.05,
              conditions: [{ inputId: 'in-press', operator: 'fired' as const }]
            }
          ]
        }
      ]
    };

    useStudioStore.setState({ stateMachines: [authoredStateMachine] });

    // Step 5: Export Document as Native .osvg JSON String
    const exportedOsvg = useStudioStore.getState().exportOpenSVGDocument();
    expect(typeof exportedOsvg).toBe('string');

    // Step 6: Validate Native Format Conformance
    const parsedDoc: OpenSVGDocument = parseDocument(exportedOsvg);
    const valResult = validateDocument(parsedDoc);
    expect(valResult.valid).toBe(true);
    expect(valResult.errors.length).toBe(0);

    // Step 7: Clear Studio & Reload .osvg
    useStudioStore.getState().createNewProject();
    expect(Object.keys(useStudioStore.getState().nodes).length).toBe(0);

    useStudioStore.getState().loadOpenSVGDocument(exportedOsvg);
    const reloadedStore = useStudioStore.getState();

    expect(reloadedStore.nodes[buttonId]).toBeDefined();
    expect(reloadedStore.interactions.length).toBe(3);
    expect(reloadedStore.stateMachines.length).toBe(1);

    // Step 8: Standalone OpenSVGRuntime execution test
    const runtime = new OpenSVGRuntime();
    runtime.load(parsedDoc);

    const smRuntime = runtime.getStateMachineRuntime();
    expect(smRuntime).toBeDefined();
    const getActiveState = () => smRuntime?.getLayerStates().get('layer-btn')?.currentStateId;
    expect(getActiveState()).toBe('st-idle');

    // Dispatch pointerenter interaction -> triggers state transition to st-hover
    runtime.dispatchInteraction(buttonId, 'pointerenter');
    runtime.advance(0.15);
    expect(getActiveState()).toBe('st-hover');

    // Dispatch click interaction -> triggers pressTrigger -> transitions to st-pressed
    runtime.dispatchInteraction(buttonId, 'click');
    runtime.advance(0.1);
    expect(getActiveState()).toBe('st-pressed');

    // Evaluate and obtain pure RenderScene
    const renderScene = runtime.getRenderState();
    expect(renderScene).toBeDefined();
    expect(renderScene.nodes.length).toBe(1);
    expect(renderScene.nodes[0].id).toBe(buttonId);
  });
});
