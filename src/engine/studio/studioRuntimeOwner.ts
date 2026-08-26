import { OpenSVGRuntime } from '../runtime/runtimeKernel';
import { EvaluatedSceneState } from '../runtime/evaluationPipeline';
import { InteractionEventType } from '../interaction/interactionModel';
import { OpenSVGDocument } from '../format/nativeDocument';
import { FrameNode, SceneNode } from '../types';

export interface StudioDocumentState {
  rootFrame: FrameNode;
  nodes: Record<string, SceneNode>;
  nodeOrder: string[];
  duration: number;
  fps: number;
  stateMachines?: any[];
  interactions?: any[];
  constraints?: any[];
  bindings?: any[];
  components?: any[];
  componentInstances?: any[];
  assets?: Record<string, any>;
}

/**
 * Studio Runtime Owner
 * Connects Studio Canvas, Timeline, and Panels directly to canonical OpenSVGRuntime.
 * INVARIANT: Single runtime owner of Clock, State Machines, Bindings, Constraints, Components, and Canonical Evaluation.
 */
export class StudioRuntimeOwner {
  private runtime: OpenSVGRuntime;

  constructor() {
    this.runtime = new OpenSVGRuntime(3.0, 60, 'loop');
  }

  /**
   * Synchronizes full studio document state into canonical OpenSVGRuntime
   */
  public syncStudioDocument(state: StudioDocumentState): void {
    const canonicalDoc: OpenSVGDocument = {
      format: 'opensvg',
      schemaVersion: '2.0.0',
      metadata: {
        id: `studio-doc-${state.rootFrame.id}`,
        title: state.rootFrame.name || 'Studio Composition',
        author: 'OpenSVG Motion Studio',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      scene: {
        width: state.rootFrame.width,
        height: state.rootFrame.height,
        fps: state.fps || 60,
        duration: state.duration || 3.0,
        background: state.rootFrame.fill || state.rootFrame.canvasBg || '#18191d'
      },
      nodes: state.nodes,
      nodeOrder: state.nodeOrder,
      stateMachines: state.stateMachines || [],
      interactions: state.interactions || [],
      constraints: state.constraints || [],
      bindings: state.bindings || [],
      components: state.components || [],
      componentInstances: state.componentInstances || [],
      assets: state.assets || {}
    };

    // Load full document into runtime kernel without resetting playback position
    const currentClockTime = this.runtime.getCurrentTime();
    const isPlaying = this.runtime.getIsPlaying();

    this.runtime.load(canonicalDoc);

    // Restore clock position
    this.runtime.seek(currentClockTime);
    if (isPlaying) {
      this.runtime.play();
    }
  }

  /**
   * Retrieves evaluated scene state with full document semantics (state machine, constraints, bindings, components)
   */
  public getEvaluatedSceneState(time?: number): EvaluatedSceneState {
    if (typeof time === 'number') {
      this.runtime.seek(time);
    }
    return this.runtime.getEvaluatedSceneState();
  }

  /**
   * Dispatches interactive event (hover, click, press) to active interactions & state machines
   */
  public dispatchInteraction(nodeId: string, eventType: InteractionEventType): void {
    this.runtime.dispatchInteraction(nodeId, eventType);
  }

  // Playback Control APIs
  public advance(dt: number): void {
    this.runtime.advance(dt);
  }

  public seek(time: number): void {
    this.runtime.seek(time);
  }

  public play(): void {
    this.runtime.play();
  }

  public pause(): void {
    this.runtime.pause();
  }

  public togglePlay(): void {
    this.runtime.togglePlay();
  }

  public getCurrentTime(): number {
    return this.runtime.getCurrentTime();
  }

  public getIsPlaying(): boolean {
    return this.runtime.getIsPlaying();
  }

  public getRuntime(): OpenSVGRuntime {
    return this.runtime;
  }
}

// Global Canonical Studio Runtime Owner Instance
export const studioRuntimeOwner = new StudioRuntimeOwner();
