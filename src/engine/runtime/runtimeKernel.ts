import { SceneProject, SceneNode } from '../types';
import { RenderScene } from './coreContracts';
import { evaluateScenePipeline, EvaluatedSceneState } from './evaluationPipeline';
import { RuntimeClock, LoopMode } from './runtimeClock';
import { Constraint } from '../constraints/constraintSolver';
import { ComponentRegistry, ComponentInstance } from '../components/componentSystem';
import { DataBindingEngine } from '../binding/dataBinding';
import { StateMachineRuntime } from '../stateMachine/runtimeStateMachine';

/**
 * Headless OpenSVG Runtime Kernel
 * Adheres strictly to OPENSVG_POST_COMMIT_ARCHITECTURE_REVIEW.md (P0 Consolidation)
 * INVARIANT: Single source of evaluation truth via `evaluateScenePipeline()`.
 * Invariant: Evaluation produces derived state. Playback/evaluation never mutates authoring document.
 */
export class OpenSVGRuntime {
  private project: SceneProject | null = null;
  private clock: RuntimeClock;
  private constraints: Constraint[] = [];
  private componentRegistry?: ComponentRegistry;
  private componentInstances?: ComponentInstance[];
  private dataBindingEngine?: DataBindingEngine;
  private stateMachineRuntime?: StateMachineRuntime;
  private propertyOverrides: Record<string, Partial<SceneNode>> = {};

  constructor(duration: number = 3.0, fps: number = 60, loopMode: LoopMode = 'loop') {
    this.clock = new RuntimeClock(duration, fps, loopMode);
  }

  /**
   * Loads a canonical SceneProject into the runtime
   */
  public load(project: SceneProject): void {
    // Clone project structure to maintain runtime isolation
    this.project = JSON.parse(JSON.stringify(project));
    this.clock.setDuration(project.duration || 1);
    this.clock.setFps(project.fps || 60);
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

  /**
   * Advances runtime clock by dt seconds
   */
  public advance(dt: number): void {
    this.clock.advance(dt);
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
}
