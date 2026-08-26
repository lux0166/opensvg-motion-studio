import { OpenSVGDocument } from '../format/nativeDocument';
import { parseDocument, convertNativeDocumentToProject } from '../format/documentParser';
import { OpenSVGRuntime } from '../runtime/runtimeKernel';
import { Canvas2DBackend } from '../backend/canvas2DBackend';
import { StateMachineRuntime } from '../stateMachine/runtimeStateMachine';
import { ComponentRegistry } from '../components/componentSystem';
import { DataBindingEngine } from '../binding/dataBinding';
import { LoopMode } from '../runtime/runtimeClock';
import { SceneNode } from '../types';

export interface WebRuntimeOptions {
  autoplay?: boolean;
  loopMode?: LoopMode;
  dpr?: number;
  interactive?: boolean;
}

export type WebRuntimeEventListener = (eventType: string, payload: any) => void;

/**
 * OpenSVG Portable Interactive Web Runtime
 * Standardized per OPENSVG_CURRENT_STRATEGIC_ROADMAP.md (Section 12 & 13)
 * Runs natively in browser without Studio UI or React dependencies.
 */
export class OpenSVGWebRuntime {
  private runtime: OpenSVGRuntime;
  private backend: Canvas2DBackend;
  private document: OpenSVGDocument | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private stateMachine?: StateMachineRuntime;
  private componentRegistry?: ComponentRegistry;
  private dataBindingEngine?: DataBindingEngine;
  private listeners: Set<WebRuntimeEventListener> = new Set();

  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private options: Required<WebRuntimeOptions>;
  private isMounted: boolean = false;

  // Pointer event listeners bound to canvas
  private boundPointerDown?: (e: PointerEvent) => void;
  private boundPointerUp?: (e: PointerEvent) => void;
  private boundPointerMove?: (e: PointerEvent) => void;
  private boundPointerLeave?: (e: PointerEvent) => void;
  private boundClick?: (e: MouseEvent) => void;

  constructor(options: WebRuntimeOptions = {}) {
    this.options = {
      autoplay: options.autoplay ?? true,
      loopMode: options.loopMode ?? 'loop',
      dpr: options.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
      interactive: options.interactive ?? true
    };

    this.runtime = new OpenSVGRuntime(3.0, 60, this.options.loopMode);
    this.backend = new Canvas2DBackend();
  }

  /**
   * Loads an OpenSVG document (Object or raw JSON string)
   */
  public load(docOrJson: OpenSVGDocument | string): void {
    const doc: OpenSVGDocument = typeof docOrJson === 'string' ? parseDocument(docOrJson) : docOrJson;
    this.document = doc;

    const project = convertNativeDocumentToProject(doc);
    this.runtime.load(project);

    // Initialize State Machine if present in document
    if (doc.stateMachines && doc.stateMachines.length > 0) {
      this.stateMachine = new StateMachineRuntime(doc.stateMachines[0]);
      this.runtime.setStateMachineRuntime(this.stateMachine);
    }

    // Initialize Components if present
    if (doc.components && doc.components.length > 0) {
      this.componentRegistry = new ComponentRegistry();
      for (const comp of doc.components) {
        this.componentRegistry.register(comp);
      }
      this.runtime.setComponentSystem(this.componentRegistry, []);
    }

    // Initialize Data Bindings if present
    if (doc.bindings && doc.bindings.length > 0) {
      this.dataBindingEngine = new DataBindingEngine();
      for (const b of doc.bindings) {
        this.dataBindingEngine.registerBinding(b);
      }
      this.runtime.setDataBindingEngine(this.dataBindingEngine);
    }

    // Initialize Constraints if present
    if (doc.constraints && doc.constraints.length > 0) {
      this.runtime.setConstraints(doc.constraints);
    }

    if (this.options.autoplay) {
      this.play();
    }

    this.emitEvent('loaded', { documentId: doc.metadata.id });
  }

  /**
   * Mounts the runtime to an HTML5 Canvas element
   */
  public async mount(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    await this.backend.initialize(canvas);
    this.isMounted = true;

    if (this.options.interactive) {
      this.bindInteractions(canvas);
    }

    this.startRenderLoop();
    this.emitEvent('mounted', { width: canvas.width, height: canvas.height });
  }

  /**
   * Unmounts canvas and stops the animation loop
   */
  public unmount(): void {
    this.stopRenderLoop();
    if (this.canvas && this.options.interactive) {
      this.unbindInteractions(this.canvas);
    }
    this.canvas = null;
    this.isMounted = false;
    this.emitEvent('unmounted', {});
  }

  // Playback Control APIs
  public play(): void {
    this.runtime.play();
  }

  public pause(): void {
    this.runtime.pause();
  }

  public togglePlay(): void {
    this.runtime.togglePlay();
  }

  public seek(time: number): void {
    this.runtime.seek(time);
    this.renderCurrentFrame();
  }

  public reset(): void {
    this.runtime.reset();
    this.renderCurrentFrame();
  }

  public getCurrentTime(): number {
    return this.runtime.getCurrentTime();
  }

  public getDuration(): number {
    return this.runtime.getDuration();
  }

  public getFps(): number {
    return this.runtime.getFps();
  }

  public getIsPlaying(): boolean {
    return this.runtime.getIsPlaying();
  }

  // State Machine Control APIs (Developer-friendly)
  public setBoolean(inputName: string, value: boolean): void {
    if (!this.stateMachine) return;
    this.stateMachine.setInput(inputName, value);
    this.emitEvent('inputChange', { name: inputName, value });
  }

  public setNumber(inputName: string, value: number): void {
    if (!this.stateMachine) return;
    this.stateMachine.setInput(inputName, value);
    this.emitEvent('inputChange', { name: inputName, value });
  }

  public fireTrigger(inputName: string): void {
    if (!this.stateMachine) return;
    this.stateMachine.fireTrigger(inputName);
    this.emitEvent('triggerFired', { name: inputName });
  }

  public setState(stateNameOrLayerId: string, stateName?: string): void {
    if (!this.stateMachine) return;
    if (stateName) {
      this.stateMachine.forceState(stateNameOrLayerId, stateName);
    } else {
      this.stateMachine.forceState('layer_main', stateNameOrLayerId);
    }
    this.emitEvent('stateChange', { state: stateName || stateNameOrLayerId });
  }

  // Data Binding Control APIs
  public setBindingValue(sourcePath: string, value: any): void {
    if (!this.dataBindingEngine) return;
    this.dataBindingEngine.setSourceValue(sourcePath, value);
  }

  // Dynamic Property Overrides
  public setProperty(nodeId: string, property: keyof SceneNode, value: any): void {
    const overrides: Record<string, any> = {};
    overrides[property] = value;
    this.runtime.setPropertyOverrides({
      [nodeId]: overrides
    });
  }

  // Event Subscription
  public addEventListener(listener: WebRuntimeEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitEvent(type: string, payload: any): void {
    for (const listener of this.listeners) {
      try {
        listener(type, payload);
      } catch (err) {
        console.error('Error in OpenSVGWebRuntime event listener:', err);
      }
    }
  }

  private startRenderLoop(): void {
    if (typeof window === 'undefined') return;

    this.lastTimestamp = performance.now();
    const loop = (timestamp: number) => {
      const dt = Math.max(0.001, Math.min(0.1, (timestamp - this.lastTimestamp) / 1000));
      this.lastTimestamp = timestamp;

      if (this.runtime.getIsPlaying()) {
        this.runtime.advance(dt);
        if (this.stateMachine) {
          this.stateMachine.advance(dt);
        }
      }

      this.renderCurrentFrame();
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopRenderLoop(): void {
    if (this.animationFrameId !== null && typeof window !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public renderCurrentFrame(): void {
    if (!this.isMounted || !this.canvas) return;

    const renderScene = this.runtime.getRenderState();
    this.backend.beginFrame({
      currentTime: this.runtime.getCurrentTime(),
      width: this.canvas.width,
      height: this.canvas.height,
      dpr: this.options.dpr
    });
    this.backend.submit(renderScene);
  }

  private bindInteractions(canvas: HTMLCanvasElement): void {
    this.boundPointerDown = (e) => this.handlePointerEvent('onHoverEnter', e);
    this.boundPointerUp = (e) => this.handlePointerEvent('onHoverLeave', e);
    this.boundPointerMove = (e) => this.handlePointerEvent('onHoverEnter', e);
    this.boundPointerLeave = (e) => this.handlePointerEvent('onHoverLeave', e);
    this.boundClick = (e) => this.handlePointerEvent('onClick', e);

    canvas.addEventListener('pointerdown', this.boundPointerDown);
    canvas.addEventListener('pointerup', this.boundPointerUp);
    canvas.addEventListener('pointermove', this.boundPointerMove);
    canvas.addEventListener('pointerleave', this.boundPointerLeave);
    canvas.addEventListener('click', this.boundClick);
  }

  private unbindInteractions(canvas: HTMLCanvasElement): void {
    if (this.boundPointerDown) canvas.removeEventListener('pointerdown', this.boundPointerDown);
    if (this.boundPointerUp) canvas.removeEventListener('pointerup', this.boundPointerUp);
    if (this.boundPointerMove) canvas.removeEventListener('pointermove', this.boundPointerMove);
    if (this.boundPointerLeave) canvas.removeEventListener('pointerleave', this.boundPointerLeave);
    if (this.boundClick) canvas.removeEventListener('click', this.boundClick);
  }

  private handlePointerEvent(eventType: 'onClick' | 'onHoverEnter' | 'onHoverLeave', event: MouseEvent | PointerEvent): void {
    if (!this.canvas || !this.document) return;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = (this.document.scene.width || 800) / rect.width;
    const scaleY = (this.document.scene.height || 600) / rect.height;

    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;

    // Check hit on nodes from top to bottom
    const nodes = this.document.nodes;
    const order = [...(this.document.nodeOrder || [])].reverse();

    for (const id of order) {
      const node = nodes[id];
      if (!node || !node.visible) continue;

      if (
        canvasX >= node.x &&
        canvasX <= node.x + node.width &&
        canvasY >= node.y &&
        canvasY <= node.y + node.height
      ) {
        this.emitEvent('nodeInteraction', { nodeId: id, eventType, x: canvasX, y: canvasY });
        break;
      }
    }
  }

  public getRuntime(): OpenSVGRuntime {
    return this.runtime;
  }
}
