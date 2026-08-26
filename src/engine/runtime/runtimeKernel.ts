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
import { AssetStore } from '../assets/assetStore';

/**
 * OpenSVG Single Runtime Owner (Headless Runtime Kernel)
 * Standardized according to CORE_ENGINE_DEPTH.md, Section 13 & OPENSVG_CURRENT_STRATEGIC_ROADMAP.md (Section 1).
 * INVARIANT: Sole runtime owner of Clock, Multi-StateMachines, ComponentRegistry, ComponentInstances, AssetStore, DataBindings, Constraints, and Document Interactions.
 */
export class OpenSVGRuntime {
  private clock: RuntimeClock;
  private project: SceneProject;
  private constraints: Constraint[] = [];
  private componentRegistry?: ComponentRegistry;
  private componentInstances: ComponentInstance[] = [];
  private dataBindingEngine?: DataBindingEngine;
  private stateMachineRuntimes: Map<string, StateMachineRuntime> = new Map();
  private assetStore: AssetStore = new AssetStore();
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

      // 1. Initialize Multi-State-Machines if present
      this.stateMachineRuntimes.clear();
      if (doc.stateMachines && doc.stateMachines.length > 0) {
        for (const sm of doc.stateMachines) {
          const runtime = new StateMachineRuntime(sm);
          this.stateMachineRuntimes.set(sm.id, runtime);
          if (sm.name) this.stateMachineRuntimes.set(sm.name, runtime);
        }
      }

      // 2. Initialize Document Interactions if present
      if (doc.interactions && doc.interactions.length > 0) {
        this.interactions = [...doc.interactions];
      } else {
        this.interactions = [];
      }

      // 3. Initialize Component Definitions & Instances
      if (doc.components && doc.components.length > 0) {
        this.componentRegistry = new ComponentRegistry();
        for (const comp of doc.components) {
          this.componentRegistry.register(comp);
        }
      } else {
        this.componentRegistry = undefined;
      }

      if (doc.componentInstances && doc.componentInstances.length > 0) {
        this.componentInstances = [...doc.componentInstances];
      } else {
        this.componentInstances = [];
      }

      // 4. Initialize Asset Store
      this.assetStore.loadManifest(doc.assets);

      // 5. Initialize Data Bindings if present
      if (doc.bindings && doc.bindings.length > 0) {
        this.dataBindingEngine = new DataBindingEngine();
        for (const b of doc.bindings) {
          this.dataBindingEngine.registerBinding(b);
        }
      } else {
        this.dataBindingEngine = undefined;
      }

      // 6. Initialize Constraints if present
      if (doc.constraints && doc.constraints.length > 0) {
        this.constraints = [...doc.constraints];
      } else {
        this.constraints = [];
      }
    } else {
      this.project = createRuntimeSnapshot(docOrProject as SceneProject);
      this.interactions = [];
      this.stateMachineRuntimes.clear();
      this.componentInstances = [];
      this.assetStore.clear();
    }

    this.clock.setDuration(this.project.duration || 1);
    this.clock.setFps(this.project.fps || 60);
    this.clock.reset();
    this.propertyOverrides = {};
  }

  /**
   * Reconciles document structure and definitions without wiping active runtime state
   * (preserves clock position, active state machine states, input values, transition progress, and event history).
   */
  public reconcile(docOrProject: OpenSVGDocument | SceneProject): void {
    if ('format' in docOrProject && docOrProject.format === 'opensvg') {
      const doc = docOrProject as OpenSVGDocument;
      const converted = convertNativeDocumentToProject(doc);
      this.project = createRuntimeSnapshot(converted);

      // 1. Reconcile State Machines (preserve existing runtime state if machine exists)
      if (doc.stateMachines && doc.stateMachines.length > 0) {
        const nextMap = new Map<string, StateMachineRuntime>();
        for (const sm of doc.stateMachines) {
          const existing = this.stateMachineRuntimes.get(sm.id);
          if (existing) {
            existing.reconcileDefinition(sm);
            nextMap.set(sm.id, existing);
            if (sm.name) nextMap.set(sm.name, existing);
          } else {
            const newRuntime = new StateMachineRuntime(sm);
            nextMap.set(sm.id, newRuntime);
            if (sm.name) nextMap.set(sm.name, newRuntime);
          }
        }
        this.stateMachineRuntimes = nextMap;
      } else {
        this.stateMachineRuntimes.clear();
      }

      // 2. Reconcile Document Interactions
      this.interactions = doc.interactions ? [...doc.interactions] : [];

      // 3. Reconcile Components
      if (doc.components && doc.components.length > 0) {
        if (!this.componentRegistry) {
          this.componentRegistry = new ComponentRegistry();
        }
        for (const comp of doc.components) {
          this.componentRegistry.register(comp);
        }
      }
      this.componentInstances = doc.componentInstances ? [...doc.componentInstances] : [];

      // 4. Reconcile Asset Store
      if (doc.assets) {
        this.assetStore.loadManifest(doc.assets);
      }

      // 5. Reconcile Data Bindings
      if (doc.bindings && doc.bindings.length > 0) {
        if (!this.dataBindingEngine) {
          this.dataBindingEngine = new DataBindingEngine();
        }
        for (const b of doc.bindings) {
          this.dataBindingEngine.registerBinding(b);
        }
      }

      // 6. Reconcile Constraints
      this.constraints = doc.constraints ? [...doc.constraints] : [];
    } else {
      this.project = createRuntimeSnapshot(docOrProject as SceneProject);
    }

    // Update clock duration/fps without resetting currentTime or isPlaying
    this.clock.setDuration(this.project.duration || 1);
    this.clock.setFps(this.project.fps || 60);
  }

  public setInteractions(interactions: DocumentInteraction[]): void {
    this.interactions = [...interactions];
  }

  public getInteractions(): DocumentInteraction[] {
    return [...this.interactions];
  }

  public getAssetStore(): AssetStore {
    return this.assetStore;
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
        this.setInput(action.inputName, action.value);
        break;
      case 'fireTrigger':
        this.fireTrigger(action.triggerName);
        break;
      case 'setState':
        this.setState(action.layerId || '', action.stateId);
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

  public setStateMachineRuntime(runtime: StateMachineRuntime, id: string = 'sm-default'): void {
    this.stateMachineRuntimes.set(id, runtime);
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
    for (const sm of this.getUniqueStateMachineRuntimes()) {
      sm.advance(dt);
    }
  }

  /**
   * Seeks deterministically to exact time t
   */
  public seek(time: number): void {
    this.clock.seek(time);
    for (const sm of this.getUniqueStateMachineRuntimes()) {
      sm.seek(time);
    }
  }

  /**
   * Resets runtime clock to t = 0
   */
  public reset(): void {
    this.clock.reset();
    for (const sm of this.getUniqueStateMachineRuntimes()) {
      sm.reset();
    }
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

  // Multi-State Machine control forwarding
  public setInput(inputNameOrId: string, value: boolean | number, stateMachineId?: string): void {
    if (stateMachineId) {
      const sm = this.stateMachineRuntimes.get(stateMachineId);
      sm?.setInput(inputNameOrId, value);
      return;
    }

    for (const sm of this.getUniqueStateMachineRuntimes()) {
      if (sm.getInput(inputNameOrId)) {
        sm.setInput(inputNameOrId, value);
      }
    }
  }

  public setBoolean(inputName: string, value: boolean, stateMachineId?: string): void {
    this.setInput(inputName, value, stateMachineId);
  }

  public setNumber(inputName: string, value: number, stateMachineId?: string): void {
    this.setInput(inputName, value, stateMachineId);
  }

  public fireTrigger(triggerName: string, stateMachineId?: string): void {
    if (stateMachineId) {
      const sm = this.stateMachineRuntimes.get(stateMachineId);
      sm?.fireTrigger(triggerName);
      return;
    }

    for (const sm of this.getUniqueStateMachineRuntimes()) {
      if (sm.getInput(triggerName)) {
        sm.fireTrigger(triggerName);
      }
    }
  }

  /**
   * Sets state machine state without assuming any default layer name
   */
  public setState(layerIdOrMachineId: string, stateIdOrLayerId: string, stateId?: string): void {
    if (stateId) {
      // (stateMachineId, layerId, stateId)
      const sm = this.stateMachineRuntimes.get(layerIdOrMachineId);
      sm?.forceState(stateIdOrLayerId, stateId);
      return;
    }

    // (layerId, stateId) -> apply to first matching state machine
    const layerId = layerIdOrMachineId;
    const targetState = stateIdOrLayerId;
    for (const sm of this.getUniqueStateMachineRuntimes()) {
      sm.forceState(layerId, targetState);
    }
  }

  // Data Binding forwarding
  public setBindingValue(sourcePath: string, value: any): void {
    this.dataBindingEngine?.setSourceValue(sourcePath, value);
  }

  /**
   * Single Source of Evaluation Truth: Runs the canonical evaluation pipeline
   */
  public getEvaluatedSceneState(): EvaluatedSceneState {
    const runtimes = this.getUniqueStateMachineRuntimes();
    return evaluateScenePipeline(this.project, {
      time: this.clock.getCurrentTime(),
      constraints: this.constraints,
      componentRegistry: this.componentRegistry,
      componentInstances: this.componentInstances,
      dataBindingEngine: this.dataBindingEngine,
      stateMachineRuntime: runtimes.length > 0 ? runtimes : undefined,
      externalPropertyOverrides: this.propertyOverrides
    });
  }

  /**
   * Derives current render scene for backends
   */
  public getRenderState(): RenderScene {
    return this.getEvaluatedSceneState().renderScene;
  }

  public getStateMachineRuntime(idOrName?: string): StateMachineRuntime | undefined {
    if (idOrName) {
      return this.stateMachineRuntimes.get(idOrName);
    }
    const runtimes = this.getUniqueStateMachineRuntimes();
    return runtimes[0];
  }

  private getUniqueStateMachineRuntimes(): StateMachineRuntime[] {
    return Array.from(new Set(this.stateMachineRuntimes.values()));
  }
}
