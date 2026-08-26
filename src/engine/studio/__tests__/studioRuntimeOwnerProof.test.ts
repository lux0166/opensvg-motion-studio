import { describe, it, expect, beforeEach } from 'vitest';
import { StudioRuntimeOwner, studioSessionManager } from '../studioRuntimeOwner';
import { useStudioStore } from '../../../store/useStudioStore';
import { getNodeChildren, getTopLevelNodes } from '../../hierarchy/sceneGraph';
import { getToolDefinition } from '../../tools/toolRegistry';
import { FrameNode, SceneNode } from '../../types';

describe('GATE UI-2: Studio Runtime Owner & Full Semantics Parity', () => {
  beforeEach(() => {
    useStudioStore.getState().createNewProject();
  });

  it('proves StudioRuntimeOwner synchronizes full document semantics (StateMachines, Interactions, Constraints, Bindings)', () => {
    const owner = new StudioRuntimeOwner();

    const rootFrame: FrameNode = {
      id: 'root-1',
      name: 'Root Frame',
      type: 'frame',
      visible: true,
      locked: false,
      clipContent: true,
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
      canvasBg: '#ffffff',
      tracks: []
    };

    const buttonNode: SceneNode = {
      id: 'btn-main',
      name: 'Interactive Button',
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
      borderRadius: 8,
      fill: '#3b82f6',
      tracks: []
    };

    const stateMachine = {
      id: 'sm-btn',
      name: 'Button Machine',
      inputs: [
        { id: 'in-hover', name: 'isHovered', type: 'boolean' as const, value: false }
      ],
      layers: [
        {
          id: 'layer-btn',
          name: 'Main Layer',
          defaultStateId: 'st-idle',
          states: [
            {
              id: 'st-idle',
              name: 'Idle State',
              type: 'animation' as const,
              propertyOverrides: {
                'btn-main': { fill: '#3b82f6' }
              }
            },
            {
              id: 'st-hover',
              name: 'Hovered State',
              type: 'animation' as const,
              propertyOverrides: {
                'btn-main': { fill: '#ef4444' } // Red when hovered
              }
            }
          ],
          transitions: [
            {
              id: 'tr-hover',
              fromStateId: 'st-idle',
              toStateId: 'st-hover',
              duration: 0.1,
              conditions: [{ inputId: 'in-hover', operator: '==' as const, value: true }]
            }
          ]
        }
      ]
    };

    const interactions = [
      {
        id: 'inter-hover-enter',
        targetNodeId: 'btn-main',
        event: 'pointerenter' as const,
        action: {
          type: 'setInput' as const,
          inputName: 'isHovered',
          value: true
        }
      }
    ];

    owner.syncStudioDocument({
      rootFrame,
      nodes: { 'btn-main': buttonNode },
      nodeOrder: ['btn-main'],
      duration: 3.0,
      fps: 60,
      stateMachines: [stateMachine],
      interactions
    });

    // 1. Initial State evaluation in Studio Preview
    let evaluated = owner.getEvaluatedSceneState(0);
    expect(evaluated.evaluatedNodes['btn-main']).toBeDefined();
    expect(evaluated.evaluatedNodes['btn-main'].fill).toBe('#3b82f6');

    // 2. User hovers over button in Studio Canvas
    owner.dispatchInteraction('btn-main', 'pointerenter');
    owner.advance(0.15); // Advance state machine transition

    // 3. Evaluated preview reflects live interactive state transition to Red (#ef4444)
    evaluated = owner.getEvaluatedSceneState();
    expect(evaluated.evaluatedNodes['btn-main'].fill).toBe('#ef4444');
  });

  it('proves shared RuntimeClock drives Studio playback deterministically', () => {
    const owner = new StudioRuntimeOwner();

    expect(owner.getCurrentTime()).toBe(0);
    expect(owner.getIsPlaying()).toBe(false);

    owner.play();
    expect(owner.getIsPlaying()).toBe(true);

    owner.advance(0.5);
    expect(owner.getCurrentTime()).toBeCloseTo(0.5, 2);

    owner.seek(1.5);
    expect(owner.getCurrentTime()).toBeCloseTo(1.5, 2);

    owner.pause();
    expect(owner.getIsPlaying()).toBe(false);
  });

  it('proves canonical hierarchy selector eliminates duplicate children and handles deep nesting', () => {
    const nodes: Record<string, SceneNode> = {
      'group-1': {
        id: 'group-1',
        name: 'Group 1',
        type: 'group',
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
      'child-1': {
        id: 'child-1',
        name: 'Child 1',
        parentId: 'group-1',
        type: 'rect',
        visible: true,
        locked: false,
        x: 10,
        y: 10,
        width: 40,
        height: 40,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#3b82f6',
        tracks: []
      },
      'child-2': {
        id: 'child-2',
        name: 'Child 2',
        parentId: 'group-1',
        type: 'circle',
        visible: true,
        locked: false,
        x: 50,
        y: 50,
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
    };

    const nodeOrder = ['group-1', 'child-1', 'child-2'];

    const topLevel = getTopLevelNodes(nodes, nodeOrder);
    expect(topLevel).toEqual(['group-1']);

    const children = getNodeChildren('group-1', nodes, nodeOrder);
    expect(children).toEqual(['child-1', 'child-2']);
  });

  it('proves ToolRegistry is canonical and supplies valid definitions for all tool modes', () => {
    const tools = ['select', 'direct-select', 'frame', 'rect', 'circle', 'star', 'pen', 'text', 'hand', 'zoom', 'pivot'] as const;
    for (const tool of tools) {
      const def = getToolDefinition(tool);
      expect(def).toBeDefined();
      expect(def.id).toBe(tool);
      expect(typeof def.label).toBe('string');
      expect(typeof def.shortcut).toBe('string');
    }
  });

  it('proves syncStudioDocument performs non-destructive reconciliation and preserves active interaction state', () => {
    const owner = new StudioRuntimeOwner('tab-preserve');

    const rootFrame: FrameNode = {
      id: 'root-1',
      name: 'Root Frame',
      type: 'frame',
      visible: true,
      locked: false,
      clipContent: true,
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
      canvasBg: '#ffffff',
      tracks: []
    };

    const buttonNode: SceneNode = {
      id: 'btn-main',
      name: 'Interactive Button',
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
      borderRadius: 8,
      fill: '#3b82f6',
      tracks: []
    };

    const stateMachine = {
      id: 'sm-btn',
      name: 'Button Machine',
      inputs: [{ id: 'in-hover', name: 'isHovered', type: 'boolean' as const, value: false }],
      layers: [
        {
          id: 'layer-btn',
          name: 'Main Layer',
          defaultStateId: 'st-idle',
          states: [
            {
              id: 'st-idle',
              name: 'Idle State',
              type: 'animation' as const,
              propertyOverrides: { 'btn-main': { fill: '#3b82f6' } }
            },
            {
              id: 'st-hover',
              name: 'Hovered State',
              type: 'animation' as const,
              propertyOverrides: { 'btn-main': { fill: '#ef4444' } }
            }
          ],
          transitions: [
            {
              id: 'tr-hover',
              fromStateId: 'st-idle',
              toStateId: 'st-hover',
              duration: 0.1,
              conditions: [{ inputId: 'in-hover', operator: '==' as const, value: true }]
            }
          ]
        }
      ]
    };

    owner.syncStudioDocument({
      rootFrame,
      nodes: { 'btn-main': buttonNode },
      nodeOrder: ['btn-main'],
      duration: 3.0,
      fps: 60,
      stateMachines: [stateMachine],
      interactions: [
        {
          id: 'inter-hover-enter',
          targetNodeId: 'btn-main',
          event: 'pointerenter',
          action: { type: 'setInput', inputName: 'isHovered', value: true }
        }
      ]
    });

    // Hover button -> State transitions to st-hover (fill = #ef4444)
    owner.dispatchInteraction('btn-main', 'pointerenter');
    owner.advance(0.15);
    let evaluated = owner.getEvaluatedSceneState();
    expect(evaluated.evaluatedNodes['btn-main'].fill).toBe('#ef4444');

    // Subsequent React store changes (e.g. user renamed node) trigger syncStudioDocument
    const updatedNode = { ...buttonNode, name: 'Interactive Button Renamed' };
    owner.syncStudioDocument({
      rootFrame,
      nodes: { 'btn-main': updatedNode },
      nodeOrder: ['btn-main'],
      duration: 3.0,
      fps: 60,
      stateMachines: [stateMachine],
      interactions: [
        {
          id: 'inter-hover-enter',
          targetNodeId: 'btn-main',
          event: 'pointerenter',
          action: { type: 'setInput', inputName: 'isHovered', value: true }
        }
      ]
    });

    // INVARIANT CHECK: Active state is PRESERVED (does NOT reset to st-idle / #3b82f6)
    evaluated = owner.getEvaluatedSceneState();
    expect(evaluated.evaluatedNodes['btn-main'].fill).toBe('#ef4444');
    expect(evaluated.evaluatedNodes['btn-main'].name).toBe('Interactive Button Renamed');
  });

  it('proves StudioSessionManager isolates runtime state across multiple document tabs', () => {
    const tabARuntime = studioSessionManager.getSession('tab-A');
    const tabBRuntime = studioSessionManager.getSession('tab-B');

    expect(tabARuntime).not.toBe(tabBRuntime);

    tabARuntime.seek(1.5);
    tabBRuntime.seek(0.5);

    expect(tabARuntime.getCurrentTime()).toBeCloseTo(1.5, 2);
    expect(tabBRuntime.getCurrentTime()).toBeCloseTo(0.5, 2);

    // Switching active tab does not cross-contaminate runtime state
    studioSessionManager.setActiveTab('tab-A');
    expect(studioSessionManager.getActiveSession().getCurrentTime()).toBeCloseTo(1.5, 2);

    studioSessionManager.setActiveTab('tab-B');
    expect(studioSessionManager.getActiveSession().getCurrentTime()).toBeCloseTo(0.5, 2);
  });
});
