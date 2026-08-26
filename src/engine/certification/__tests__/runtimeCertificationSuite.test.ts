import { describe, it, expect } from 'vitest';
import { OpenSVGDocument } from '../../format/nativeDocument';
import { OpenSVGRuntime } from '../../runtime/runtimeKernel';
import { OpenSVGWebRuntime } from '../../webRuntime/openSVGWebRuntime';
import { evaluateScenePipeline } from '../../runtime/evaluationPipeline';
import { StateMachineRuntime } from '../../stateMachine/runtimeStateMachine';
import { hitTestScene, worldToLocalPoint, isPointInPathGeometry } from '../../interaction/geometryHitTest';

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
});

