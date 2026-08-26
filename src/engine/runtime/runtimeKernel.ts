import { SceneProject, SceneNode } from '../types';
import { RenderScene } from './coreContracts';
import { evaluateScenePipeline, EvaluatedSceneState } from './evaluationPipeline';
import { RuntimeClock, LoopMode } from './runtimeClock';
import { createRuntimeSnapshot } from './runtimeSnapshot';
import { Constraint } from '../constraints/constraintSolver';
import { ComponentRegistry, ComponentInstance } from '../components/componentSystem';
import { DataBindingEngine } from '../binding/dataBinding';
import { StateMachineRuntime } from '../stateMachine/runtimeStateMachine';
import { OpenSVGDocument } from '../format/nativeDocument';
import { convertNativeDocumentToProject } from '../format/documentParser';

/**
 * Headless OpenSVG Runtime Kernel
 * Adheres strictly to OPENSVG_CURRENT_STRATEGIC_ROADMAP.md (P0 & P1)
 * INVARIANT: Single runtime owner & single evaluation truth via `evaluateScenePipeline()`.
 * Invariant: Evaluation produces derived state. Playback/evaluation never mutates authoring document.
 */
export class OpenSVGRuntime {
  private project: SceneProject | null = null;
  private clock: RuntimeClock;
  private constraints: Constraint[] = [];
  private componentRegistry?: ComponentRegistry;
  private componentInstances: ComponentInstance[] = [];
  private dataBindingEngine?: DataBindingEngine;
  private stateMachineRuntime?: StateMachineRuntime;
  private propertyOverrides: Record<string, Partial<SceneNode>> = {};

  constructor(duration: number = 3.0, fps: number = 60, loopMode: LoopMode = 'loop') {
    this.clock = new RuntimeClock(duration, fps, loopMode);
  }

  /**
   * Loads a canonical SceneProject or OpenSVGDocument into the runtime
   */
  public load(docOrProject: SceneProject | OpenSVGDocument): void {
    if (!docOrProject) return;

    if ((docOrProject as OpenSVGDocument).format === 'opensvg') {
      const doc = docOrProject as OpenSVGDocument;
      const converted = convertNativeDocumentToProject(doc);
      this.project = createRuntimeSnapshot(converted);

      // Initialize State Machine if present
      if (doc.stateMachines && doc.stateMachines.length > 0) {
        this.stateMachineRuntime = new StateMachineRuntime(doc.stateMachines[0]);
      } else {
        this.stateMachineRuntime = undefined;
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
    }

    this.clock.setDuration(this.project.duration || 1);
    this.clock.setFps(this.project.fps || 60);
    this.clock.reset();
    this.propertyOverrides = {};
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
  }

  /**
   * Resets runtime clock to t = 0
   */
  public reset(): void {
    this.clock.reset();
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

  // State Machine APIs
  public setBoolean(inputName: string, value: boolean): void {
    this.stateMachineRuntime?.setInput(inputName, value);
  }

  public setNumber(inputName: string, value: number): void {
    this.stateMachineRuntime?.setInput(inputName, value);
  }

  public fireTrigger(inputName: string): void {
    this.stateMachineRuntime?.fireTrigger(inputName);
  }

  public setState(layerNameOrStateId: string, stateName?: string): void {
    if (!this.stateMachineRuntime) return;
    if (stateName) {
      this.stateMachineRuntime.forceState(layerNameOrStateId, stateName);
    } else {
      this.stateMachineRuntime.forceState('layer_main', layerNameOrStateId);
    }
  }

  // Data Binding APIs
  public setBindingValue(sourcePath: string, value: any): void {
    this.dataBindingEngine?.setSourceValue(sourcePath, value);
  }

  /**
   * Evaluates and returns the complete EvaluatedSceneState using the canonical pipeline
   */
  public getEvaluatedSceneState(): EvaluatedSceneState {
    if (!this.project) {
      return {
        projectId: 'empty',
        time: 0,
        duration: 0,
        fps: 60,
        evaluatedNodes: {},
        nodeStates: {},
        nodeOrder: [],
        renderScene: {
          id: 'empty',
          viewport: { width: 800, height: 600, dpr: 1, background: '#ffffff' },
          nodes: [],
          drawOrder: []
        }
      };
    }

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
   * Returns current evaluated RenderScene (Single evaluation path via pipeline)
   */
  public getRenderState(): RenderScene {
    return this.getEvaluatedSceneState().renderScene;
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

  public getClock(): RuntimeClock {
    return this.clock;
  }

  public getStateMachineRuntime(): StateMachineRuntime | undefined {
    return this.stateMachineRuntime;
  }

  public getComponentRegistry(): ComponentRegistry | undefined {
    return this.componentRegistry;
  }

  public getDataBindingEngine(): DataBindingEngine | undefined {
    return this.dataBindingEngine;
  }

  public getProject(): SceneProject | null {
    return this.project;
  }
}
