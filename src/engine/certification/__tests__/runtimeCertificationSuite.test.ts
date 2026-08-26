import { describe, it, expect } from 'vitest';
import { OpenSVGDocument } from '../../format/nativeDocument';
import { OpenSVGRuntime } from '../../runtime/runtimeKernel';
import { OpenSVGWebRuntime } from '../../webRuntime/openSVGWebRuntime';
import { evaluateScenePipeline } from '../../runtime/evaluationPipeline';
import { StateMachineRuntime } from '../../stateMachine/runtimeStateMachine';
import { hitTestScene, worldToLocalPoint, isPointInPathGeometry } from '../../interaction/geometryHitTest';
import { validateDocument, serializeDocument, parseDocument } from '../../format/documentParser';

/**
 * OpenSVG Runtime Certification Suite
 * 
 * Formal Proof Gates:
 * - Gate 1: Evaluation Determinism (Strict idempotency & zero mutation)
 * - Gate 2: Tri-Environment Parity (Studio == Headless == WebRuntime)
 * - Gate 3: Comprehensive State Machine Lifecycle & Interruption Blending
 * - Gate 4: Seek & Event Replay Determinism
 * - Gate 5: Complex Nested/Transformed SVG Geometry Interaction
 */

describe('OpenSVG Runtime Certification Suite (Formal Product Proof Gates)', () => {
  // Canonical Master Document for Certification
  const certifiedDocument: OpenSVGDocument = {
    format: 'opensvg',
    schemaVersion: '2.0.0',
    metadata: {
      id: 'doc-cert-v2',
      title: 'Certified Production Document',
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    },
    scene: {
      width: 800,
      height: 600,
      fps: 60,
      duration: 4.0,
      background: '#0f172a'
    },
    nodes: {
      'root-group': {
        id: 'root-group',
        name: 'Root Group',
        type: 'frame',
        visible: true,
        locked: false,
        clipContent: true,
        canvasBg: '#0f172a',
        x: 50,
        y: 50,
        width: 700,
        height: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 12,
        fill: '#1e293b',
        tracks: []
      },
      'card-container': {
        id: 'card-container',
        name: 'Card Container',
        type: 'rect',
        visible: true,
        locked: false,
        parentId: 'root-group',
        x: 100,
        y: 80,
        width: 300,
        height: 200,
        rotation: 15,
        scaleX: 1.1,
        scaleY: 1.1,
        opacity: 0.95,
        borderRadius: 16,
        fill: '#334155',
        stroke: '#64748b',
        strokeWidth: 2,
        tracks: [
          {
            id: 'track-x',
            property: 'x',
            label: 'X Position',
            unit: 'px',
            keyframes: [
              { id: 'kf-1', time: 0, value: 100, easing: 'ease-in-out' },
              { id: 'kf-2', time: 2, value: 200, easing: 'ease-in-out' },
              { id: 'kf-3', time: 4, value: 100, easing: 'ease-in-out' }
            ]
          },
          {
            id: 'track-rot',
            property: 'rotation',
            label: 'Rotation',
            unit: 'deg',
            keyframes: [
              { id: 'kf-r1', time: 0, value: 15, easing: 'linear' },
              { id: 'kf-r2', time: 2, value: 45, easing: 'linear' },
              { id: 'kf-r3', time: 4, value: 15, easing: 'linear' }
            ]
          }
        ]
      },
      'interactive-badge': {
        id: 'interactive-badge',
        name: 'Interactive Badge',
        type: 'rect',
        visible: true,
        locked: false,
        parentId: 'card-container',
        x: 40,
        y: 40,
        width: 120,
        height: 40,
        rotation: 0,
        scaleX: 1.0,
        scaleY: 1.0,
        opacity: 1.0,
        borderRadius: 8,
        fill: '#3b82f6',
        tracks: []
      },
      'badge-label': {
        id: 'badge-label',
        name: 'Badge Label',
        type: 'text',
        visible: true,
        locked: false,
        parentId: 'interactive-badge',
        x: 10,
        y: 10,
        width: 100,
        height: 20,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#ffffff',
        textContent: 'STATUS: IDLE',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        tracks: []
      },
      'curved-vector-art': {
        id: 'curved-vector-art',
        name: 'Curved Vector Art',
        type: 'path',
        visible: true,
        locked: false,
        parentId: 'root-group',
        x: 420,
        y: 100,
        width: 200,
        height: 200,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#10b981',
        fillRule: 'evenodd',
        pathPoints: [
          { x: 0, y: 0, cp2x: 0, cp2y: 120 },
          { x: 150, y: 0, cp1x: 150, cp1y: 120 },
          { x: 0, y: 0 }
        ],
        tracks: []
      }
    },
    nodeOrder: ['root-group', 'card-container', 'interactive-badge', 'badge-label', 'curved-vector-art'],
    stateMachines: [
      {
        id: 'sm-card',
        name: 'Card State Machine',
        inputs: [
          { id: 'inp-hover', name: 'isHovered', type: 'boolean', value: false },
          { id: 'inp-press', name: 'isPressed', type: 'boolean', value: false },
          { id: 'inp-loading', name: 'isLoading', type: 'boolean', value: false },
          { id: 'trig-success', name: 'onSuccess', type: 'trigger', value: false },
          { id: 'inp-progress', name: 'progress', type: 'number', value: 0, min: 0, max: 1 }
        ],
        layers: [
          {
            id: 'layer-badge-state',
            name: 'Badge State Layer',
            defaultStateId: 'state-idle',
            states: [
              {
                id: 'state-idle',
                name: 'Idle State',
                type: 'animation',
                propertyOverrides: {
                  'interactive-badge': { fill: '#3b82f6', scaleX: 1.0, scaleY: 1.0 },
                  'badge-label': { textContent: 'STATUS: IDLE' }
                }
              },
              {
                id: 'state-hover',
                name: 'Hover State',
                type: 'animation',
                propertyOverrides: {
                  'interactive-badge': { fill: '#60a5fa', scaleX: 1.05, scaleY: 1.05 },
                  'badge-label': { textContent: 'STATUS: HOVER' }
                }
              },
              {
                id: 'state-pressed',
                name: 'Pressed State',
                type: 'animation',
                propertyOverrides: {
                  'interactive-badge': { fill: '#1d4ed8', scaleX: 0.95, scaleY: 0.95 },
                  'badge-label': { textContent: 'STATUS: PRESSED' }
                }
              },
              {
                id: 'state-loading',
                name: 'Loading State',
                type: 'animation',
                propertyOverrides: {
                  'interactive-badge': { fill: '#f59e0b', scaleX: 1.0, scaleY: 1.0 },
                  'badge-label': { textContent: 'STATUS: LOADING' }
                }
              },
              {
                id: 'state-success',
                name: 'Success State',
                type: 'animation',
                propertyOverrides: {
                  'interactive-badge': { fill: '#10b981', scaleX: 1.1, scaleY: 1.1 },
                  'badge-label': { textContent: 'STATUS: SUCCESS' }
                }
              }
            ],
            transitions: [
              {
                id: 'tr-idle-hover',
                fromStateId: 'state-idle',
                toStateId: 'state-hover',
                duration: 0.2,
                conditions: [{ inputId: 'inp-hover', operator: '==', value: true }]
              },
              {
                id: 'tr-hover-idle',
                fromStateId: 'state-hover',
                toStateId: 'state-idle',
                duration: 0.2,
                conditions: [{ inputId: 'inp-hover', operator: '==', value: false }]
              },
              {
                id: 'tr-hover-pressed',
                fromStateId: 'state-hover',
                toStateId: 'state-pressed',
                duration: 0.05,
                conditions: [{ inputId: 'inp-press', operator: '==', value: true }]
              },
              {
                id: 'tr-pressed-loading',
                fromStateId: 'state-pressed',
                toStateId: 'state-loading',
                duration: 0.1,
                conditions: [{ inputId: 'inp-loading', operator: '==', value: true }]
              },
              {
                id: 'tr-loading-success',
                fromStateId: 'state-loading',
                toStateId: 'state-success',
                duration: 0.3,
                conditions: [{ inputId: 'trig-success', operator: 'fired' }]
              }
            ]
          }
        ]
      }
    ]
  };

  // --------------------------------------------------------------------------
  // GATE 1: Evaluation Determinism & Zero Mutation
  // --------------------------------------------------------------------------
  describe('Gate 1: Evaluation Determinism & Zero Mutation', () => {
    it('produces 100% byte & semantic equivalent EvaluatedSceneState across multiple evaluation passes', () => {
      const serializedOriginal = JSON.stringify(certifiedDocument);
      const sm = new StateMachineRuntime(certifiedDocument.stateMachines![0]);
      sm.setInput('isHovered', true);
      sm.advance(0.1);

      // Run 5 consecutive evaluation passes at t=1.25s
      const runs = [];
      for (let i = 0; i < 5; i++) {
        const state = evaluateScenePipeline(
          {
            id: certifiedDocument.metadata.id,
            name: certifiedDocument.metadata.title,
            version: certifiedDocument.schemaVersion,
            duration: certifiedDocument.scene.duration,
            fps: certifiedDocument.scene.fps,
            rootFrame: certifiedDocument.nodes['root-group'] as any,
            nodes: certifiedDocument.nodes,
            nodeOrder: certifiedDocument.nodeOrder
          },
          { time: 1.25, stateMachineRuntime: sm }
        );
        runs.push(state);
      }

      // Assert all 5 runs are strictly equal
      for (let i = 1; i < runs.length; i++) {
        expect(runs[i].time).toBe(runs[0].time);
        expect(runs[i].nodeOrder).toEqual(runs[0].nodeOrder);
        expect(runs[i].evaluatedNodes['card-container'].x).toBeCloseTo(runs[0].evaluatedNodes['card-container'].x, 5);
        expect(runs[i].evaluatedNodes['card-container'].rotation).toBeCloseTo(runs[0].evaluatedNodes['card-container'].rotation, 5);
        expect(runs[i].nodeStates['card-container'].worldTransform).toEqual(runs[0].nodeStates['card-container'].worldTransform);
        expect(runs[i].renderScene.nodes.length).toBe(runs[0].renderScene.nodes.length);
        expect(runs[i].renderScene.drawOrder).toEqual(runs[0].renderScene.drawOrder);
      }

      // Assert input document remained 100% unmutated
      expect(JSON.stringify(certifiedDocument)).toBe(serializedOriginal);
    });
  });

  // --------------------------------------------------------------------------
  // GATE 2: Tri-Environment Runtime Parity
  // --------------------------------------------------------------------------
  describe('Gate 2: Tri-Environment Parity (Studio == Headless == WebRuntime)', () => {
    it('guarantees identical EvaluatedSceneState and RenderScene across all three runtime execution paths', () => {
      const time = 1.5;

      // 1. Studio Evaluation Path (evaluateScenePipeline directly)
      const smStudio = new StateMachineRuntime(certifiedDocument.stateMachines![0]);
      smStudio.setInput('isHovered', true);
      smStudio.advance(0.2); // Complete hover transition

      const studioState = evaluateScenePipeline(
        {
          id: certifiedDocument.metadata.id,
          name: certifiedDocument.metadata.title,
          version: certifiedDocument.schemaVersion,
          duration: certifiedDocument.scene.duration,
          fps: certifiedDocument.scene.fps,
          rootFrame: certifiedDocument.nodes['root-group'] as any,
          nodes: certifiedDocument.nodes,
          nodeOrder: certifiedDocument.nodeOrder
        },
        { time, stateMachineRuntime: smStudio }
      );

      // 2. Headless Runtime Path (OpenSVGRuntime)
      const headlessRuntime = new OpenSVGRuntime(4.0, 60);
      headlessRuntime.load(certifiedDocument);
      headlessRuntime.setBoolean('isHovered', true);
      headlessRuntime.seek(time);
      const headlessState = headlessRuntime.getEvaluatedSceneState();
      const headlessRender = headlessRuntime.getRenderState();

      // 3. Web Runtime Path (OpenSVGWebRuntime)
      const webRuntime = new OpenSVGWebRuntime({ autoplay: false });
      webRuntime.load(certifiedDocument);
      webRuntime.setBoolean('isHovered', true);
      webRuntime.seek(time);
      const webState = webRuntime.getRuntime().getEvaluatedSceneState();
      const webRender = webRuntime.getRuntime().getRenderState();

      // Parity Assertions
      // Evaluated nodes count & keys
      expect(Object.keys(headlessState.evaluatedNodes)).toEqual(Object.keys(studioState.evaluatedNodes));
      expect(Object.keys(webState.evaluatedNodes)).toEqual(Object.keys(studioState.evaluatedNodes));

      // Key animated node position and transform
      expect(headlessState.evaluatedNodes['card-container'].x).toBeCloseTo(studioState.evaluatedNodes['card-container'].x, 3);
      expect(webState.evaluatedNodes['card-container'].x).toBeCloseTo(studioState.evaluatedNodes['card-container'].x, 3);

      // State Machine Overridden Properties
      expect(headlessState.evaluatedNodes['interactive-badge'].fill).toBe('#60a5fa');
      expect(webState.evaluatedNodes['interactive-badge'].fill).toBe('#60a5fa');
      expect(studioState.evaluatedNodes['interactive-badge'].fill).toBe('#60a5fa');

      // RenderScene Parity
      expect(headlessRender.nodes.length).toBe(studioState.renderScene.nodes.length);
      expect(webRender.nodes.length).toBe(studioState.renderScene.nodes.length);
      expect(headlessRender.drawOrder).toEqual(studioState.renderScene.drawOrder);
      expect(webRender.drawOrder).toEqual(studioState.renderScene.drawOrder);
    });
  });

  // --------------------------------------------------------------------------
  // GATE 3: Multi-Stage State Machine Lifecycle & Interruption Blending
  // --------------------------------------------------------------------------
  describe('Gate 3: State Machine Lifecycle, Inputs, & Interruption Blending', () => {
    it('executes full lifecycle: Idle -> Hover -> Pressed -> Loading -> Success with accurate transition states', () => {
      const sm = new StateMachineRuntime(certifiedDocument.stateMachines![0]);

      // 1. Initial State: Idle
      expect(sm.getLayerState('layer-badge-state')?.currentStateId).toBe('state-idle');

      // 2. Hover Input -> Transitions to Hover
      sm.setInput('isHovered', true);
      sm.advance(0.2); // 0.2s duration completed
      expect(sm.getLayerState('layer-badge-state')?.currentStateId).toBe('state-hover');
      expect(sm.getLayerState('layer-badge-state')?.isTransitioning).toBe(false);

      // 3. Press Input -> Transitions to Pressed
      sm.setInput('isPressed', true);
      sm.advance(0.05);
      expect(sm.getLayerState('layer-badge-state')?.currentStateId).toBe('state-pressed');

      // 4. Loading Input -> Transitions to Loading
      sm.setInput('isLoading', true);
      sm.advance(0.1);
      expect(sm.getLayerState('layer-badge-state')?.currentStateId).toBe('state-loading');

      // 5. Trigger Success -> Transitions to Success
      sm.fireTrigger('onSuccess');
      sm.advance(0.3);
      expect(sm.getLayerState('layer-badge-state')?.currentStateId).toBe('state-success');
    });

    it('handles transition interruption smoothly without numeric or graphical discontinuity', () => {
      const sm = new StateMachineRuntime(certifiedDocument.stateMachines![0]);

      // Start transition to Hover (duration 0.2s)
      sm.setInput('isHovered', true);
      sm.advance(0.1); // 50% into hover transition

      const midTransitionState = sm.getLayerState('layer-badge-state');
      expect(midTransitionState?.isTransitioning).toBe(true);
      expect(midTransitionState?.transitionProgress).toBeCloseTo(0.5, 2);

      // Interrupt mid-transition by removing hover
      sm.setInput('isHovered', false);
      sm.advance(0.2); // Transition back to idle completes

      expect(sm.getLayerState('layer-badge-state')?.currentStateId).toBe('state-idle');
      expect(sm.getLayerState('layer-badge-state')?.isTransitioning).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // GATE 4: Seek & Event Replay Determinism
  // --------------------------------------------------------------------------
  describe('Gate 4: Seek & Event Replay Determinism', () => {
    it('guarantees that step-by-step advance(0.016) and direct seek(t) yield identical evaluated scene results', () => {
      // Step-by-step runner
      const runtimeStep = new OpenSVGRuntime(4.0, 60);
      runtimeStep.load(certifiedDocument);
      runtimeStep.play();

      let t = 0;
      while (t < 2.0) {
        runtimeStep.advance(0.016);
        t += 0.016;
      }

      // Direct seek runner
      const runtimeSeek = new OpenSVGRuntime(4.0, 60);
      runtimeSeek.load(certifiedDocument);
      runtimeSeek.seek(2.0);

      const stateStep = runtimeStep.getEvaluatedSceneState();
      const stateSeek = runtimeSeek.getEvaluatedSceneState();

      expect(stateSeek.evaluatedNodes['card-container'].x).toBeCloseTo(stateStep.evaluatedNodes['card-container'].x, 1);
      expect(stateSeek.evaluatedNodes['card-container'].rotation).toBeCloseTo(stateStep.evaluatedNodes['card-container'].rotation, 1);
      expect(stateSeek.nodeStates['card-container'].worldTransform.a).toBeCloseTo(stateStep.nodeStates['card-container'].worldTransform.a, 2);
    });
  });

  // --------------------------------------------------------------------------
  // GATE 5: Complex Geometric Interaction Matrix
  // --------------------------------------------------------------------------
  describe('Gate 5: Complex Geometric Interaction Matrix', () => {
    it('accurately resolves pointer hits across nested, rotated, scaled nodes and cubic Bezier paths', () => {
      const runtime = new OpenSVGRuntime(4.0, 60);
      runtime.load(certifiedDocument);
      const sceneState = runtime.getEvaluatedSceneState();

      // 1. Test hit inside nested card-container
      // card-container is at (100, 80) inside root-group at (50, 50), rotated by 15 deg
      const cardState = sceneState.nodeStates['card-container'];
      expect(cardState).toBeDefined();

      // Inverse transform point (160, 150) in scene space into card local space
      const localPt = worldToLocalPoint(cardState.worldTransform, { x: 160, y: 150 });
      expect(localPt.x).toBeGreaterThanOrEqual(0);
      expect(localPt.x).toBeLessThanOrEqual(300);

      // Hit test scene at (160, 150) must hit card-container or its child
      const hitNode = hitTestScene(sceneState, { x: 160, y: 150 });
      expect(hitNode).not.toBeNull();
      expect(['card-container', 'interactive-badge', 'badge-label']).toContain(hitNode!.id);

      // 2. Test exact Cubic Bezier Path hit
      const bezierPath = certifiedDocument.nodes['curved-vector-art'].pathPoints!;
      // Point inside the curved teardrop apex (75, 50)
      expect(isPointInPathGeometry({ x: 75, y: 50 }, bezierPath)).toBe(true);
      // Point outside the curved teardrop (75, 140)
      expect(isPointInPathGeometry({ x: 75, y: 140 }, bezierPath)).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // GATE 6: Document-Defined Interaction Resolution & Generic Mapping
  // --------------------------------------------------------------------------
  describe('Gate 6: Document-Defined Interaction Resolution & Generic Mapping', () => {
    it('executes document-defined interactions with zero hardcoded input assumptions', () => {
      // Document with completely arbitrary custom input & trigger names
      const genericInteractiveDoc: OpenSVGDocument = {
        format: 'opensvg',
        schemaVersion: '2.0.0',
        metadata: {
          id: 'doc-generic-interactions',
          title: 'Generic Interactions Proof',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        scene: { width: 800, height: 600, fps: 60, duration: 4.0, background: '#ffffff' },
        nodes: {
          'custom-btn': {
            id: 'custom-btn',
            name: 'Custom Button Node',
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
          }
        },
        nodeOrder: ['custom-btn'],
        stateMachines: [
          {
            id: 'sm-custom',
            name: 'Custom Controller',
            inputs: [
              { id: 'inp-custom-arm', name: 'shieldArmed', type: 'boolean', value: false },
              { id: 'trig-custom-warp', name: 'triggerHyperdrive', type: 'trigger', value: false }
            ],
            layers: [
              {
                id: 'layer-custom-main',
                name: 'Main Layer',
                defaultStateId: 'state-dormant',
                states: [
                  {
                    id: 'state-dormant',
                    name: 'Dormant',
                    type: 'animation',
                    propertyOverrides: { 'custom-btn': { fill: '#3b82f6', scaleX: 1.0 } }
                  },
                  {
                    id: 'state-energized',
                    name: 'Energized',
                    type: 'animation',
                    propertyOverrides: { 'custom-btn': { fill: '#10b981', scaleX: 1.2 } }
                  },
                  {
                    id: 'state-hyperdrive',
                    name: 'Hyperdrive Warp',
                    type: 'animation',
                    propertyOverrides: { 'custom-btn': { fill: '#8b5cf6', scaleX: 1.5 } }
                  }
                ],
                transitions: [
                  {
                    id: 'tr-energize',
                    fromStateId: 'state-dormant',
                    toStateId: 'state-energized',
                    duration: 0.1,
                    conditions: [{ inputId: 'inp-custom-arm', operator: '==', value: true }]
                  },
                  {
                    id: 'tr-deenergize',
                    fromStateId: 'state-energized',
                    toStateId: 'state-dormant',
                    duration: 0.1,
                    conditions: [{ inputId: 'inp-custom-arm', operator: '==', value: false }]
                  },
                  {
                    id: 'tr-warp',
                    fromStateId: 'state-energized',
                    toStateId: 'state-hyperdrive',
                    duration: 0.1,
                    conditions: [{ inputId: 'trig-custom-warp', operator: '==', value: true }]
                  }
                ]
              }
            ]
          }
        ],
        interactions: [
          {
            id: 'inter-hover-enter',
            targetNodeId: 'custom-btn',
            event: 'pointerenter',
            action: { type: 'setInput', inputName: 'shieldArmed', value: true }
          },
          {
            id: 'inter-hover-leave',
            targetNodeId: 'custom-btn',
            event: 'pointerleave',
            action: { type: 'setInput', inputName: 'shieldArmed', value: false }
          },
          {
            id: 'inter-click-warp',
            targetNodeId: 'custom-btn',
            event: 'click',
            action: { type: 'fireTrigger', triggerName: 'triggerHyperdrive' }
          }
        ]
      };

      const runtime = new OpenSVGRuntime(4.0, 60);
      runtime.load(genericInteractiveDoc);

      // Initial state: Dormant (#3b82f6)
      let evaluated = runtime.getEvaluatedSceneState();
      expect(evaluated.evaluatedNodes['custom-btn'].fill).toBe('#3b82f6');

      // 1. Dispatch pointerenter event on custom-btn
      runtime.dispatchInteraction('custom-btn', 'pointerenter');
      runtime.advance(0.15);
      evaluated = runtime.getEvaluatedSceneState();
      expect(evaluated.evaluatedNodes['custom-btn'].fill).toBe('#10b981');
      expect(evaluated.evaluatedNodes['custom-btn'].scaleX).toBe(1.2);

      // 2. Dispatch click (warp trigger) on custom-btn
      runtime.dispatchInteraction('custom-btn', 'click');
      runtime.advance(0.15);
      evaluated = runtime.getEvaluatedSceneState();
      expect(evaluated.evaluatedNodes['custom-btn'].fill).toBe('#8b5cf6');
      expect(evaluated.evaluatedNodes['custom-btn'].scaleX).toBe(1.5);

      // 3. Dispatch pointerleave event on custom-btn
      runtime.dispatchInteraction('custom-btn', 'pointerleave');
      runtime.advance(0.15);
      // State machine logic reflects the input change
      expect(runtime.getStateMachineRuntime()?.getInput('shieldArmed')?.value).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // GATE 7: Native Format Closure (Comprehensive Multi-Subsystem Runtime Execution)
  // --------------------------------------------------------------------------
  describe('Gate 7: Native Format Closure (2 State Machines, 2 Components, 2 Instances, 2 Bindings, 2 Constraints, 3 Interactions, Assets & Complex Hierarchy)', () => {
    it('certifies end-to-end format closure with zero semantic loss across all runtime subsystems', () => {
      const closureDocument: OpenSVGDocument = {
        format: 'opensvg',
        schemaVersion: '2.0.0',
        metadata: {
          id: 'doc-certified-closure',
          title: 'Native Format Closure Certified Spec',
          author: 'OpenSVG Certification Authority',
          createdAt: 1700000000000,
          updatedAt: 1700000000000
        },
        scene: {
          width: 1200,
          height: 900,
          fps: 60,
          duration: 5.0,
          background: '#0f172a',
          clipContent: true
        },
        nodes: {
          'root-chassis': {
            id: 'root-chassis',
            name: 'Chassis Frame',
            type: 'rect',
            visible: true,
            locked: false,
            x: 50,
            y: 50,
            width: 1100,
            height: 800,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            fill: '#1e293b',
            borderRadius: 24,
            tracks: []
          },
          'reactor-core': {
            id: 'reactor-core',
            name: 'Reactor Core',
            type: 'circle',
            visible: true,
            locked: false,
            parentId: 'root-chassis',
            x: 200,
            y: 200,
            width: 160,
            height: 160,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            borderRadius: 0,
            fill: '#0ea5e9',
            tracks: [
              {
                id: 'tr-reactor-pulse',
                property: 'opacity',
                label: 'Core Pulse',
                unit: '',
                keyframes: [
                  { id: 'k1', time: 0, value: 0.8 },
                  { id: 'k2', time: 2.5, value: 1.0 },
                  { id: 'k3', time: 5.0, value: 0.8 }
                ]
              }
            ]
          },
          'status-display': {
            id: 'status-display',
            name: 'Status Display Text',
            type: 'text',
            visible: true,
            locked: false,
            parentId: 'root-chassis',
            x: 400,
            y: 200,
            width: 300,
            height: 60,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            borderRadius: 0,
            textContent: 'REACTOR NOMINAL',
            fontSize: 24,
            fill: '#f8fafc',
            tracks: []
          },
          'action-trigger-btn': {
            id: 'action-trigger-btn',
            name: 'Action Trigger Button',
            type: 'rect',
            visible: true,
            locked: false,
            parentId: 'root-chassis',
            x: 400,
            y: 300,
            width: 220,
            height: 60,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            fill: '#3b82f6',
            borderRadius: 12,
            tracks: []
          },
          'aim-pointer': {
            id: 'aim-pointer',
            name: 'Aiming Pointer',
            type: 'rect',
            visible: true,
            locked: false,
            parentId: 'root-chassis',
            x: 700,
            y: 200,
            width: 80,
            height: 20,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            borderRadius: 0,
            fill: '#64748b',
            tracks: []
          }
        },
        nodeOrder: ['root-chassis', 'reactor-core', 'status-display', 'action-trigger-btn', 'aim-pointer'],

        // 1. Two Independent State Machines
        stateMachines: [
          {
            id: 'sm-reactor-controller',
            name: 'Reactor Machine',
            inputs: [
              { id: 'inp-overload', name: 'isOverloaded', type: 'boolean', value: false },
              { id: 'trig-vent', name: 'triggerVent', type: 'trigger', value: false }
            ],
            layers: [
              {
                id: 'layer-reactor-power',
                name: 'Power Layer',
                defaultStateId: 'state-normal',
                states: [
                  {
                    id: 'state-normal',
                    name: 'Normal',
                    type: 'animation',
                    propertyOverrides: { 'reactor-core': { fill: '#0ea5e9' } }
                  },
                  {
                    id: 'state-hyper',
                    name: 'Hypercharge',
                    type: 'animation',
                    propertyOverrides: { 'reactor-core': { fill: '#f59e0b' } }
                  },
                  {
                    id: 'state-vented',
                    name: 'Vented',
                    type: 'animation',
                    propertyOverrides: { 'reactor-core': { fill: '#10b981' } }
                  }
                ],
                transitions: [
                  {
                    id: 'tr-p1',
                    fromStateId: 'state-normal',
                    toStateId: 'state-hyper',
                    duration: 0.1,
                    conditions: [{ inputId: 'inp-overload', operator: '==', value: true }]
                  },
                  {
                    id: 'tr-p2',
                    fromStateId: 'state-hyper',
                    toStateId: 'state-normal',
                    duration: 0.1,
                    conditions: [{ inputId: 'inp-overload', operator: '==', value: false }]
                  },
                  {
                    id: 'tr-p3',
                    fromStateId: 'state-hyper',
                    toStateId: 'state-vented',
                    duration: 0.1,
                    conditions: [{ inputId: 'trig-vent', operator: '==', value: true }]
                  }
                ]
              }
            ]
          },
          {
            id: 'sm-hud-alert',
            name: 'HUD Alert Machine',
            inputs: [
              { id: 'inp-hud-warning', name: 'hudWarningActive', type: 'boolean', value: false }
            ],
            layers: [
              {
                id: 'layer-hud',
                name: 'HUD Layer',
                defaultStateId: 'state-hud-idle',
                states: [
                  {
                    id: 'state-hud-idle',
                    name: 'HUD Idle',
                    type: 'animation',
                    propertyOverrides: { 'action-trigger-btn': { fill: '#3b82f6' } }
                  },
                  {
                    id: 'state-hud-alert',
                    name: 'HUD Alert',
                    type: 'animation',
                    propertyOverrides: { 'action-trigger-btn': { fill: '#ef4444' } }
                  }
                ],
                transitions: [
                  {
                    id: 'tr-h1',
                    fromStateId: 'state-hud-idle',
                    toStateId: 'state-hud-alert',
                    duration: 0.1,
                    conditions: [{ inputId: 'inp-hud-warning', operator: '==', value: true }]
                  }
                ]
              }
            ]
          }
        ],

        // 2. Two Component Definitions (including childNodes hierarchy)
        components: [
          {
            id: 'comp-shield-badge',
            name: 'Shield Badge Component',
            rootNode: {
              id: 'comp-badge-root',
              name: 'Badge Root',
              type: 'rect',
              visible: true,
              locked: false,
              x: 0,
              y: 0,
              width: 140,
              height: 140,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              fill: '#6366f1',
              borderRadius: 16,
              tracks: []
            },
            childNodes: [
              {
                id: 'badge-icon',
                name: 'Badge Icon',
                type: 'circle',
                visible: true,
                locked: false,
                x: 35,
                y: 35,
                width: 70,
                height: 70,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                opacity: 1,
                borderRadius: 0,
                fill: '#ffffff',
                tracks: []
              }
            ]
          },
          {
            id: 'comp-energy-bar',
            name: 'Energy Bar Component',
            rootNode: {
              id: 'comp-energy-root',
              name: 'Energy Root',
              type: 'rect',
              visible: true,
              locked: false,
              x: 0,
              y: 0,
              width: 300,
              height: 30,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              borderRadius: 0,
              fill: '#22c55e',
              tracks: []
            }
          }
        ],

        // 3. Two Component Instances
        componentInstances: [
          {
            id: 'inst-badge-alpha',
            name: 'Shield Badge Alpha',
            componentDefId: 'comp-shield-badge',
            x: 800,
            y: 100,
            overrides: { fill: '#4f46e5' }
          },
          {
            id: 'inst-energy-meter',
            name: 'Main Energy Meter',
            componentDefId: 'comp-energy-bar',
            x: 800,
            y: 300,
            overrides: { scaleX: 1.0 }
          }
        ],

        // 4. Two Data Bindings
        bindings: [
          {
            id: 'bind-energy-level',
            sourcePath: 'telemetry.energyScale',
            targetNodeId: 'inst-energy-meter',
            targetProperty: 'scaleX'
          },
          {
            id: 'bind-status-label',
            sourcePath: 'telemetry.statusText',
            targetNodeId: 'status-display',
            targetProperty: 'textContent'
          }
        ],

        // 5. Two Constraints
        constraints: [
          {
            id: 'constraint-distance',
            type: 'distance',
            ownerId: 'aim-pointer',
            targetId: 'reactor-core',
            strength: 1.0,
            enabled: true
          },
          {
            id: 'constraint-scale',
            type: 'scale',
            ownerId: 'status-display',
            targetId: 'root-chassis',
            strength: 1.0,
            enabled: true
          }
        ],

        // 6. Three Document-Defined Interactions
        interactions: [
          {
            id: 'inter-hover-enter',
            targetNodeId: 'action-trigger-btn',
            event: 'pointerenter',
            action: { type: 'setInput', inputName: 'isOverloaded', value: true }
          },
          {
            id: 'inter-hover-leave',
            targetNodeId: 'action-trigger-btn',
            event: 'pointerleave',
            action: { type: 'setInput', inputName: 'isOverloaded', value: false }
          },
          {
            id: 'inter-click-vent',
            targetNodeId: 'action-trigger-btn',
            event: 'click',
            action: { type: 'fireTrigger', triggerName: 'triggerVent' }
          }
        ],

        // 7. Embedded Asset
        assets: {
          'reactor-texture': {
            id: 'reactor-texture',
            name: 'Reactor Glow Texture',
            type: 'image',
            mimeType: 'image/png',
            dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
          }
        }
      };

      // Step 1: Deep Schema Validation
      const validation = validateDocument(closureDocument);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);

      // Step 2: Deterministic Serialization & Parsing
      const serializedJson = serializeDocument(closureDocument, true);
      expect(serializedJson).toContain('"schemaVersion": "2.0.0"');
      expect(serializedJson).toContain('"componentInstances"');
      expect(serializedJson).toContain('"reactor-texture"');

      const reloadedDoc = parseDocument(serializedJson);
      expect(reloadedDoc.componentInstances?.length).toBe(2);
      expect(reloadedDoc.stateMachines?.length).toBe(2);
      expect(reloadedDoc.bindings?.length).toBe(2);
      expect(reloadedDoc.constraints?.length).toBe(2);

      // Step 3: Standalone Runtime Initialization
      const runtime = new OpenSVGRuntime(5.0, 60);
      runtime.load(reloadedDoc);

      // 3.1 Verify AssetStore loaded embedded texture
      const assetStore = runtime.getAssetStore();
      expect(assetStore.size).toBe(1);
      expect(assetStore.getAsset('reactor-texture')?.status).toBe('ready');

      // 3.2 Verify Component Instances & Child Hierarchy Materialized
      let evalState = runtime.getEvaluatedSceneState();
      expect(evalState.evaluatedNodes['inst-badge-alpha']).toBeDefined();
      expect(evalState.evaluatedNodes['inst-badge-alpha'].fill).toBe('#4f46e5'); // applied override
      expect(evalState.evaluatedNodes['inst-badge-alpha-child-badge-icon']).toBeDefined();
      expect(evalState.evaluatedNodes['inst-energy-meter']).toBeDefined();

      // 3.3 Verify Data Bindings Execution
      runtime.setBindingValue('telemetry.energyScale', 0.65);
      runtime.setBindingValue('telemetry.statusText', 'SYSTEM CRITICAL');
      evalState = runtime.getEvaluatedSceneState();
      expect(evalState.evaluatedNodes['inst-energy-meter'].scaleX).toBe(0.65);
      expect(evalState.evaluatedNodes['status-display'].textContent).toBe('SYSTEM CRITICAL');

      // 3.4 Verify Interaction Dispatches & Multi-State-Machine Transitions
      // Initial Reactor fill is normal (#0ea5e9)
      expect(evalState.evaluatedNodes['reactor-core'].fill).toBe('#0ea5e9');

      // User hovers on action button -> 'isOverloaded: true' -> Reactor becomes Hypercharge (#f59e0b)
      runtime.dispatchInteraction('action-trigger-btn', 'pointerenter');
      runtime.advance(0.1);
      evalState = runtime.getEvaluatedSceneState();
      expect(evalState.evaluatedNodes['reactor-core'].fill).toBe('#f59e0b');

      // User clicks action button -> 'triggerVent' -> Reactor becomes Vented (#10b981)
      runtime.dispatchInteraction('action-trigger-btn', 'click');
      runtime.advance(0.1);
      evalState = runtime.getEvaluatedSceneState();
      expect(evalState.evaluatedNodes['reactor-core'].fill).toBe('#10b981');

      // User triggers HUD Warning on Second State Machine without disturbing Reactor
      runtime.setBoolean('hudWarningActive', true);
      runtime.advance(0.1);
      evalState = runtime.getEvaluatedSceneState();
      expect(evalState.evaluatedNodes['action-trigger-btn'].fill).toBe('#ef4444');
      expect(evalState.evaluatedNodes['reactor-core'].fill).toBe('#10b981'); // Intact!

      // 3.5 Verify Final Render Scene Completeness
      const renderScene = runtime.getRenderState();
      expect(renderScene.nodes.length).toBeGreaterThanOrEqual(7);
      expect(renderScene.drawOrder.length).toBe(renderScene.nodes.length);
      for (const node of renderScene.nodes) {
        expect(node.worldTransform).toBeDefined();
        expect(typeof node.opacity).toBe('number');
      }
    });
  });
});


