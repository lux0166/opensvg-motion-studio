import { SceneProject, SceneNode } from '../types';
import { RuntimeClock, LoopMode } from './runtimeClock';
import { Constraint } from '../constraints/constraintSolver';
import { ComponentRegistry, ComponentInstance } from '../components/componentSystem';
import { DataBindingEngine } from '../binding/dataBinding';
import { StateMachineRuntime } from '../stateMachine/runtimeStateMachine';
import { evaluateScenePipeline, EvaluatedSceneState } from './evaluationPipeline';
import { RenderScene } from './coreContracts';
import { OpenSVGDocument } from '../format/nativeDocument';
import { convertNativeDocumentToProject } from '../format/documentParser';
import { createRuntimeSnapshot } from './runtimeSnapshot';
import { DocumentInteraction, InteractionEventType, InteractionAction } from '../interaction/interactionModel';

/**
 * OpenSVG Single Runtime Owner (Headless Runtime Kernel)
 * Standardized according to CORE_ENGINE_DEPTH.md, Section 13 & OPENSVG_CURRENT_STRATEGIC_ROADMAP.md (Section 1).
 * INVARIANT: Sole runtime owner of Clock, StateMachine, ComponentRegistry, DataBindings, Constraints, and Document Interactions.
 */
export class OpenSVGRuntime {
  private clock: RuntimeClock;
  private project: SceneProject;
  private constraints: Constraint[] = [];
  private componentRegistry?: ComponentRegistry;
  private componentInstances: ComponentInstance[] = [];
  private dataBindingEngine?: DataBindingEngine;
  private stateMachineRuntime?: StateMachineRuntime;
  private interactions: DocumentInteraction[] = [];
  private propertyOverrides: Record<string, Partial<SceneNode>> = {};

  constructor(duration: number = 3.0, fps: number = 60, loopMode: LoopMode = 'loop') {
    this.clock = new RuntimeClock(duration, fps, loopMode);
    this.project = {
      id: 'empty-scene',
      name: 'Empty Scene',
      version: '2.0.0',
      duration,
      fps,
      rootFrame: {
        id: 'root-default',
        name: 'Root Frame',
        type: 'frame',
        visible: true,
        locked: false,
        clipContent: true,
        canvasBg: '#ffffff',
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
        tracks: []
      },
      nodes: {},
      nodeOrder: []
    };
  }

  /**
   * Loads an OpenSVG document (.osvg) or legacy SceneProject directly into the runtime owner
   */
  public load(docOrProject: OpenSVGDocument | SceneProject): void {
    if ('format' in docOrProject && docOrProject.format === 'opensvg') {
      const doc = docOrProject as OpenSVGDocument;
      const converted = convertNativeDocumentToProject(doc);
      this.project = createRuntimeSnapshot(converted);

      // Initialize State Machine if present
      if (doc.stateMachines && doc.stateMachines.length > 0) {
        this.stateMachineRuntime = new StateMachineRuntime(doc.stateMachines[0]);
      } else {
        this.stateMachineRuntime = undefined;
      }

      // Initialize Document Interactions if present
      if (doc.interactions && doc.interactions.length > 0) {
        this.interactions = [...doc.interactions];
      } else {
        this.interactions = [];
      }

      // Initialize Components if present
      if (doc.components && doc.components.length > 0) {
        this.componentRegistry = new ComponentRegistry();
        for (const comp of doc.components) {
          this.componentRegistry.register(comp);
        }
      } else {
        this.componentRegistry = undefined;
      }
      this.componentInstances = [];

      // Initialize Data Bindings if present
      if (doc.bindings && doc.bindings.length > 0) {
        this.dataBindingEngine = new DataBindingEngine();
        for (const b of doc.bindings) {
          this.dataBindingEngine.registerBinding(b);
        }
      } else {
        this.dataBindingEngine = undefined;
      }

      // Initialize Constraints if present
      if (doc.constraints && doc.constraints.length > 0) {
        this.constraints = [...doc.constraints];
      } else {
        this.constraints = [];
      }
    } else {
      this.project = createRuntimeSnapshot(docOrProject as SceneProject);
      this.interactions = [];
    }

    this.clock.setDuration(this.project.duration || 1);
    this.clock.setFps(this.project.fps || 60);
    this.clock.reset();
    this.propertyOverrides = {};
  }

  public setInteractions(interactions: DocumentInteraction[]): void {
    this.interactions = [...interactions];
  }

  public getInteractions(): DocumentInteraction[] {
    return [...this.interactions];
  }

  /**
   * Dispatches a document-defined interaction event to matching registered interactions
   */
  public dispatchInteraction(targetNodeId: string, event: InteractionEventType): void {
    for (const inter of this.interactions) {
      if (inter.enabled === false) continue;
      if (inter.event === event && (inter.targetNodeId === targetNodeId || inter.targetNodeId === '*')) {
        this.executeInteractionAction(inter.action);
      }
    }
  }

  private executeInteractionAction(action: InteractionAction): void {
    switch (action.type) {
      case 'setInput':
        this.stateMachineRuntime?.setInput(action.inputName, action.value);
        break;
      case 'fireTrigger':
        this.stateMachineRuntime?.fireTrigger(action.triggerName);
        break;
      case 'setState':
        this.stateMachineRuntime?.forceState(action.layerId || '', action.stateId);
        break;
      case 'seek':
        this.seek(action.time);
        break;
      case 'play':
        this.play();
        break;
      case 'pause':
        this.pause();
        break;
      case 'togglePlay':
        this.togglePlay();
        break;
    }
  }

  public setConstraints(constraints: Constraint[]): void {
    this.constraints = [...constraints];
  }

  public setComponentSystem(registry: ComponentRegistry, instances: ComponentInstance[]): void {
    this.componentRegistry = registry;
    this.componentInstances = [...instances];
  }

  public setDataBindingEngine(engine: DataBindingEngine): void {
    this.dataBindingEngine = engine;
  }

  public setStateMachineRuntime(runtime: StateMachineRuntime): void {
    this.stateMachineRuntime = runtime;
  }

  public setPropertyOverrides(overrides: Record<string, Partial<SceneNode>>): void {
    this.propertyOverrides = { ...overrides };
  }

  public setProperty(nodeId: string, property: keyof SceneNode, value: any): void {
    if (!this.propertyOverrides[nodeId]) {
      this.propertyOverrides[nodeId] = {};
    }
    this.propertyOverrides[nodeId][property] = value;
  }

  /**
   * Advances runtime clock and active state machines by dt seconds
   */
  public advance(dt: number): void {
    this.clock.advance(dt);
    if (this.stateMachineRuntime) {
      this.stateMachineRuntime.advance(dt);
    }
  }

  /**
   * Seeks deterministically to exact time t
   */
  public seek(time: number): void {
    this.clock.seek(time);
    this.stateMachineRuntime?.seek(time);
  }

  /**
   * Resets runtime clock to t = 0
   */
  public reset(): void {
    this.clock.reset();
    this.stateMachineRuntime?.reset();
  }

  public play(): void {
    this.clock.play();
  }

  public pause(): void {
    this.clock.pause();
  }

  public togglePlay(): void {
    this.clock.togglePlay();
  }

  public getCurrentTime(): number {
    return this.clock.getCurrentTime();
  }

  public getDuration(): number {
    return this.clock.getDuration();
  }

  public getFps(): number {
    return this.clock.getFps();
  }

  public getIsPlaying(): boolean {
    return this.clock.getIsPlaying();
  }

  // State Machine control forwarding
  public setBoolean(inputName: string, value: boolean): void {
    this.stateMachineRuntime?.setInput(inputName, value);
  }

  public setNumber(inputName: string, value: number): void {
    this.stateMachineRuntime?.setInput(inputName, value);
  }

  public fireTrigger(triggerName: string): void {
    this.stateMachineRuntime?.fireTrigger(triggerName);
  }

  public setState(stateNameOrLayerId: string, stateName?: string): void {
    const layerId = stateName ? stateNameOrLayerId : 'layer-main';
    const targetState = stateName || stateNameOrLayerId;
    this.stateMachineRuntime?.forceState(layerId, targetState);
  }

  // Data Binding forwarding
  public setBindingValue(sourcePath: string, value: any): void {
    this.dataBindingEngine?.setSourceValue(sourcePath, value);
  }

  /**
   * Single Source of Evaluation Truth: Runs the canonical evaluation pipeline
   */
  public getEvaluatedSceneState(): EvaluatedSceneState {
    return evaluateScenePipeline(this.project, {
      time: this.clock.getCurrentTime(),
      constraints: this.constraints,
      componentRegistry: this.componentRegistry,
      componentInstances: this.componentInstances,
      dataBindingEngine: this.dataBindingEngine,
      stateMachineRuntime: this.stateMachineRuntime,
      externalPropertyOverrides: this.propertyOverrides
    });
  }

  /**
   * Derives current render scene for backends
   */
  public getRenderState(): RenderScene {
    return this.getEvaluatedSceneState().renderScene;
  }

  public getStateMachineRuntime(): StateMachineRuntime | undefined {
    return this.stateMachineRuntime;
  }
}
