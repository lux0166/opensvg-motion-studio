import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '../../../store/useStudioStore';
import { StudioRuntimeOwner, studioSessionManager } from '../studioRuntimeOwner';
import { importSvgString } from '../../svgImporter';
import { parseDocument } from '../../format/documentParser';
import { FrameNode, SceneNode } from '../../types';

describe('GATE UI-4: Real Editor Transaction Semantics & SVG-Native Authoring Certification', () => {
  beforeEach(() => {
    useStudioStore.getState().createNewProject();
    studioSessionManager.clear();
  });

  it('proves a 30-frame continuous drag gesture produces exactly ONE semantic undo entry', () => {
    const store = useStudioStore.getState();

    const boxNode: SceneNode = {
      id: 'box-drag',
      name: 'Draggable Box',
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
    };

    store.addNode(boxNode);
    const initialPastLength = useStudioStore.getState().past.length;

    // Simulate start of drag gesture: pushSnapshot() ONCE
    useStudioStore.getState().pushSnapshot();

    // Simulate 30 continuous mousemove updates during the drag gesture
    for (let frame = 1; frame <= 30; frame++) {
      useStudioStore.getState().updateNode('box-drag', {
        x: 100 + frame * 5,
        y: 100 + frame * 3
      }, false); // recordHistory = false during continuous drag
    }

    // INVARIANT 1: Node reached final position (250, 190)
    expect(useStudioStore.getState().nodes['box-drag'].x).toBe(250);
    expect(useStudioStore.getState().nodes['box-drag'].y).toBe(190);

    // INVARIANT 2: Exactly ONE semantic history entry was created (not 30)
    expect(useStudioStore.getState().past.length).toBe(initialPastLength + 1);

    // INVARIANT 3: A single undo operation completely rolls back to the initial drag position (100, 100)
    useStudioStore.getState().undo();
    expect(useStudioStore.getState().nodes['box-drag'].x).toBe(100);
    expect(useStudioStore.getState().nodes['box-drag'].y).toBe(100);
  });

  it('proves Undo/Redo preserves active interaction state and deterministically reconciles document mutations', () => {
    const owner = new StudioRuntimeOwner('tab-undo-compat');

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

    const cardNode: SceneNode = {
      id: 'card-inter',
      name: 'Interactive Card',
      type: 'rect',
      visible: true,
      locked: false,
      x: 50,
      y: 50,
      width: 200,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 8,
      fill: '#3b82f6',
      tracks: []
    };

    const stateMachine = {
      id: 'sm-card',
      name: 'Card SM',
      inputs: [{ id: 'in-hover', name: 'isHovered', type: 'boolean' as const, value: false }],
      layers: [
        {
          id: 'layer-card',
          name: 'Card Layer',
          defaultStateId: 'st-idle',
          states: [
            { id: 'st-idle', name: 'Idle', type: 'animation' as const, propertyOverrides: { 'card-inter': { fill: '#3b82f6' } } },
            { id: 'st-hover', name: 'Hover', type: 'animation' as const, propertyOverrides: { 'card-inter': { fill: '#ef4444' } } }
          ],
          transitions: [
            { id: 'tr-hover', fromStateId: 'st-idle', toStateId: 'st-hover', duration: 0.1, conditions: [{ inputId: 'in-hover', operator: '==' as const, value: true }] }
          ]
        }
      ]
    };

    owner.syncStudioDocument({
      rootFrame,
      nodes: { 'card-inter': cardNode },
      nodeOrder: ['card-inter'],
      duration: 3.0,
      fps: 60,
      stateMachines: [stateMachine],
      interactions: [
        { id: 'inter-hover', targetNodeId: 'card-inter', event: 'pointerenter', action: { type: 'setInput', inputName: 'isHovered', value: true } }
      ]
    });

    // 1. User triggers hover -> State Machine enters st-hover (fill = #ef4444)
    owner.dispatchInteraction('card-inter', 'pointerenter');
    owner.advance(0.15);
    let scene = owner.getEvaluatedSceneState();
    expect(scene.evaluatedNodes['card-inter'].fill).toBe('#ef4444');

    // 2. User performs a geometry edit: changes card width to 300
    const editedCard = { ...cardNode, width: 300 };
    owner.syncStudioDocument({
      rootFrame,
      nodes: { 'card-inter': editedCard },
      nodeOrder: ['card-inter'],
      duration: 3.0,
      fps: 60,
      stateMachines: [stateMachine],
      interactions: [
        { id: 'inter-hover', targetNodeId: 'card-inter', event: 'pointerenter', action: { type: 'setInput', inputName: 'isHovered', value: true } }
      ]
    });

    // 3. INVARIANT: Active hover state is PRESERVED, width is updated to 300
    scene = owner.getEvaluatedSceneState();
    expect(scene.evaluatedNodes['card-inter'].fill).toBe('#ef4444');
    expect(scene.evaluatedNodes['card-inter'].width).toBe(300);

    // 4. User performs Undo: width restored to 200, active hover state STILL PRESERVED
    owner.syncStudioDocument({
      rootFrame,
      nodes: { 'card-inter': cardNode },
      nodeOrder: ['card-inter'],
      duration: 3.0,
      fps: 60,
      stateMachines: [stateMachine],
      interactions: [
        { id: 'inter-hover', targetNodeId: 'card-inter', event: 'pointerenter', action: { type: 'setInput', inputName: 'isHovered', value: true } }
      ]
    });

    scene = owner.getEvaluatedSceneState();
    expect(scene.evaluatedNodes['card-inter'].fill).toBe('#ef4444');
    expect(scene.evaluatedNodes['card-inter'].width).toBe(200);
  });

  it('proves Dirty State & Autosave tracking across edit, save, undo and redo cycles', () => {
    const store = useStudioStore.getState();

    // 1. Initially saved: clean
    const initialJson = store.exportOpenSVGDocument();
    expect(initialJson).toBeDefined();

    const activeTab = useStudioStore.getState().tabs.find((t) => t.id === useStudioStore.getState().activeTabId)!;
    expect(activeTab.isDirty).toBe(false);

    // 2. Edit document -> isDirty becomes true
    store.addNode({
      id: 'rect-dirty-test',
      name: 'Dirty Rect',
      type: 'rect',
      visible: true,
      locked: false,
      x: 20,
      y: 20,
      width: 50,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: '#10b981',
      tracks: []
    });

    let currentTab = useStudioStore.getState().tabs.find((t) => t.id === useStudioStore.getState().activeTabId)!;
    expect(currentTab.isDirty).toBe(true);

    // 3. Save document -> isDirty becomes false
    store.exportOpenSVGDocument();
    currentTab = useStudioStore.getState().tabs.find((t) => t.id === useStudioStore.getState().activeTabId)!;
    expect(currentTab.isDirty).toBe(false);

    // 4. Further edit -> isDirty becomes true
    store.updateNode('rect-dirty-test', { x: 100 }, true);
    currentTab = useStudioStore.getState().tabs.find((t) => t.id === useStudioStore.getState().activeTabId)!;
    expect(currentTab.isDirty).toBe(true);

    // 5. Undo back to saved state -> isDirty becomes false
    store.undo();
    currentTab = useStudioStore.getState().tabs.find((t) => t.id === useStudioStore.getState().activeTabId)!;
    expect(currentTab.isDirty).toBe(false);

    // 6. Redo away from saved state -> isDirty becomes true again
    store.redo();
    currentTab = useStudioStore.getState().tabs.find((t) => t.id === useStudioStore.getState().activeTabId)!;
    expect(currentTab.isDirty).toBe(true);
  });

  it('proves complete SVG Import -> Authoring -> Animation -> StateMachine -> Save/Reload roundtrip', () => {
    // 1. Rich SVG sample with multiple layers, paths, and rects
    const richSvg = `
      <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
        <rect id="bg-plate" x="10" y="10" width="480" height="380" rx="16" fill="#1e293b"/>
        <g id="brand-group" opacity="0.9">
          <circle id="brand-badge" cx="100" cy="100" r="40" fill="#3b82f6"/>
          <path id="brand-icon" d="M 80 100 L 100 120 L 120 80 Z" fill="#ffffff"/>
        </g>
        <text id="brand-title" x="160" y="100" fill="#ffffff" font-size="24">OpenSVG Studio</text>
      </svg>
    `;

    // 2. Import SVG into Scene Graph
    const importResult = importSvgString(richSvg);
    expect(importResult.nodes.length).toBeGreaterThan(0);
    expect(importResult.viewBox?.width).toBe(500);

    const store = useStudioStore.getState();
    store.createNewProject();
    for (const n of importResult.nodes) {
      store.addNode(n);
    }

    const badgeId = importResult.nodes.find((n) => n.id === 'brand-badge' || n.name.includes('brand-badge'))?.id || importResult.nodes[0].id;

    // 3. Animate imported node with keyframes
    store.addOrUpdateKeyframe(badgeId, 'scaleX', 0, 1.0);
    store.addOrUpdateKeyframe(badgeId, 'scaleX', 1.0, 1.3);

    // 4. Add Interactive State Machine to imported node
    const badgeStateMachine = {
      id: 'sm-badge',
      name: 'Badge SM',
      inputs: [{ id: 'in-click', name: 'isClicked', type: 'boolean' as const, value: false }],
      layers: [
        {
          id: 'layer-badge',
          name: 'Badge Layer',
          defaultStateId: 'st-normal',
          states: [
            { id: 'st-normal', name: 'Normal', type: 'animation' as const, propertyOverrides: {} },
            { id: 'st-active', name: 'Active', type: 'animation' as const, propertyOverrides: { [badgeId]: { fill: '#f59e0b' } } }
          ],
          transitions: [
            { id: 'tr-click', fromStateId: 'st-normal', toStateId: 'st-active', duration: 0.1, conditions: [{ inputId: 'in-click', operator: '==' as const, value: true }] }
          ]
        }
      ]
    };

    store.addStateMachine(badgeStateMachine);
    store.addInteraction({
      id: 'inter-click',
      targetNodeId: badgeId,
      event: 'click',
      action: { type: 'setInput', inputName: 'isClicked', value: true }
    });

    // 5. Verify in StudioRuntimeOwner
    const activeTab = useStudioStore.getState().tabs.find((t) => t.id === useStudioStore.getState().activeTabId)!;
    const runtimeOwner = studioSessionManager.getSession(activeTab.id);

    runtimeOwner.syncStudioDocument({
      id: activeTab.id,
      rootFrame: useStudioStore.getState().rootFrame,
      nodes: useStudioStore.getState().nodes,
      nodeOrder: useStudioStore.getState().nodeOrder,
      duration: useStudioStore.getState().duration,
      fps: useStudioStore.getState().fps,
      stateMachines: useStudioStore.getState().stateMachines,
      interactions: useStudioStore.getState().interactions
    });

    // Pure evaluation snapshot check at t=1.0s (scaleX animated to 1.3)
    const evaluatedAt1s = runtimeOwner.evaluateAt(1.0);
    expect(evaluatedAt1s.evaluatedNodes[badgeId].scaleX).toBeCloseTo(1.3, 1);

    // Dispatch click interaction -> Badge transitions to amber (#f59e0b)
    runtimeOwner.dispatchInteraction(badgeId, 'click');
    runtimeOwner.advance(0.15);
    const evaluatedClicked = runtimeOwner.getEvaluatedSceneState();
    expect(evaluatedClicked.evaluatedNodes[badgeId].fill).toBe('#f59e0b');

    // 6. Export and Reload in Fresh Runtime
    const exportedJson = store.exportOpenSVGDocument();
    const parsedDoc = parseDocument(exportedJson);

    expect(parsedDoc.format).toBe('opensvg');
    expect(parsedDoc.schemaVersion).toBe('2.0.0');
    expect(parsedDoc.stateMachines?.length).toBe(1);
    expect(parsedDoc.interactions?.length).toBe(1);

    const freshOwner = new StudioRuntimeOwner('fresh-svg-imported');
    freshOwner.syncStudioDocument({
      rootFrame: {
        id: 'root-fresh',
        name: parsedDoc.metadata.title,
        type: 'frame',
        visible: true,
        locked: false,
        clipContent: true,
        x: 0,
        y: 0,
        width: parsedDoc.scene.width,
        height: parsedDoc.scene.height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: parsedDoc.scene.background,
        canvasBg: parsedDoc.scene.background,
        tracks: []
      },
      nodes: parsedDoc.nodes,
      nodeOrder: parsedDoc.nodeOrder,
      duration: parsedDoc.scene.duration,
      fps: parsedDoc.scene.fps,
      stateMachines: parsedDoc.stateMachines,
      interactions: parsedDoc.interactions
    });

    // Verify fresh reload retains identical interaction and state transitions
    freshOwner.dispatchInteraction(badgeId, 'click');
    freshOwner.advance(0.15);
    const freshEval = freshOwner.getEvaluatedSceneState();
    expect(freshEval.evaluatedNodes[badgeId].fill).toBe('#f59e0b');
  });
});
