import { OpenSVGRuntime } from '../runtime/runtimeKernel';
import { EvaluatedSceneState } from '../runtime/evaluationPipeline';
import { InteractionEventType, DocumentInteraction } from '../interaction/interactionModel';
import { StateMachineDefinition } from '../stateMachine/runtimeStateMachine';
import { Constraint } from '../constraints/constraintSolver';
import { DataBinding } from '../binding/dataBinding';
import { ComponentDefinition, ComponentInstance } from '../components/componentSystem';
import { OpenSVGDocument, AssetManifestEntry } from '../format/nativeDocument';
import { FrameNode, SceneNode } from '../types';

export interface StudioDocumentState {
  id?: string;
  createdAt?: number;
  updatedAt?: number;
  rootFrame: FrameNode;
  nodes: Record<string, SceneNode>;
  nodeOrder: string[];
  duration: number;
  fps: number;
  stateMachines?: StateMachineDefinition[];
  interactions?: DocumentInteraction[];
  constraints?: Constraint[];
  bindings?: DataBinding[];
  components?: ComponentDefinition[];
  componentInstances?: ComponentInstance[];
  assets?: Record<string, AssetManifestEntry>;
}

/**
 * Studio Runtime Owner
 * Represents an isolated runtime session associated with a single document/tab.
 * INVARIANT: Single runtime owner of Clock, State Machines, Bindings, Constraints, Components, and Canonical Evaluation.
 */
export class StudioRuntimeOwner {
  private runtime: OpenSVGRuntime;
  private tabId: string;
  private documentId?: string;
  private createdAt?: number;

  constructor(tabId: string = 'default-tab') {
    this.tabId = tabId;
    this.runtime = new OpenSVGRuntime(3.0, 60, 'loop');
  }

  public getTabId(): string {
    return this.tabId;
  }

  /**
   * Reconciles document changes without destroying active runtime interactivity state
   */
  public syncStudioDocument(state: StudioDocumentState): void {
    if (state.id) this.documentId = state.id;
    if (state.createdAt && !this.createdAt) this.createdAt = state.createdAt;

    const canonicalDoc: OpenSVGDocument = {
      format: 'opensvg',
      schemaVersion: '2.0.0',
      metadata: {
        id: this.documentId || `doc-${state.rootFrame.id}`,
        title: state.rootFrame.name || 'Studio Composition',
        author: 'OpenSVG Motion Studio',
        createdAt: this.createdAt || state.createdAt || 1700000000000,
        updatedAt: state.updatedAt || Date.now()
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

    // Non-destructive reconciliation
    this.runtime.reconcile(canonicalDoc);
  }

  /**
   * Retrieves evaluated scene state with full document semantics (state machines, constraints, bindings, components)
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

/**
 * Studio Session Manager (Multi-Document / Multi-Tab Runtime Architecture)
 * Maps tab IDs to dedicated, isolated StudioRuntimeOwner instances.
 * Invariant: Switching tabs preserves each document's independent runtime state.
 */
export class StudioSessionManager {
  private sessions: Map<string, StudioRuntimeOwner> = new Map();
  private activeTabId: string = 'tab-1';

  public getSession(tabId: string): StudioRuntimeOwner {
    let session = this.sessions.get(tabId);
    if (!session) {
      session = new StudioRuntimeOwner(tabId);
      this.sessions.set(tabId, session);
    }
    return session;
  }

  public setActiveTab(tabId: string): StudioRuntimeOwner {
    this.activeTabId = tabId;
    return this.getSession(tabId);
  }

  public getActiveSession(): StudioRuntimeOwner {
    return this.getSession(this.activeTabId);
  }

  public destroySession(tabId: string): void {
    this.sessions.delete(tabId);
  }

  public clear(): void {
    this.sessions.clear();
  }
}

// Global Canonical Session Manager
export const studioSessionManager = new StudioSessionManager();

// Convenience accessor for active tab session
export const getActiveStudioRuntime = (): StudioRuntimeOwner => {
  return studioSessionManager.getActiveSession();
};
