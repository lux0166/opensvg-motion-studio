import { OpenSVGDocument } from '../format/nativeDocument';
import { parseDocument } from '../format/documentParser';
import { OpenSVGRuntime } from '../runtime/runtimeKernel';
import { Canvas2DBackend } from '../backend/canvas2DBackend';
import { LoopMode } from '../runtime/runtimeClock';
import { SceneNode } from '../types';
import { screenToCanvasPoint, canvasToScenePoint, hitTestScene } from '../interaction/geometryHitTest';

export interface WebRuntimeOptions {
  autoplay?: boolean;
  loopMode?: LoopMode;
  dpr?: number;
  interactive?: boolean;
}

export type WebRuntimeEventListener = (eventType: string, payload: any) => void;

/**
 * OpenSVG Web Runtime Adapter
 * Standardized per OPENSVG_CURRENT_STRATEGIC_ROADMAP.md (Section 1 & 13)
 * INVARIANT: OpenSVGWebRuntime is a thin adapter around OpenSVGRuntime.
 * Pointer interaction drives StateMachine inputs & triggers, producing responsive animations.
 */
export class OpenSVGWebRuntime {
  private runtime: OpenSVGRuntime;
  private backend: Canvas2DBackend;
  private canvas: HTMLCanvasElement | null = null;
  private listeners: Set<WebRuntimeEventListener> = new Set();

  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private options: Required<WebRuntimeOptions>;
  private isMounted: boolean = false;
  private hoveredNodeId: string | null = null;

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
   * Loads an OpenSVG document (Object or raw JSON string) directly into the headless runtime owner
   */
  public load(docOrJson: OpenSVGDocument | string): void {
    const doc: OpenSVGDocument = typeof docOrJson === 'string' ? parseDocument(docOrJson) : docOrJson;
    this.runtime.load(doc);

    if (this.options.autoplay) {
      this.play();
    }

    this.emitEvent('loaded', { documentId: doc.metadata.id });
  }

  /**
   * Mounts the runtime adapter to an HTML5 Canvas element
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

  // Playback Control APIs (Delegated 100% to runtime owner)
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

  // State Machine APIs (Forwarded directly to runtime owner)
  public setBoolean(inputName: string, value: boolean): void {
    this.runtime.setBoolean(inputName, value);
    this.emitEvent('inputChange', { name: inputName, value });
  }

  public setNumber(inputName: string, value: number): void {
    this.runtime.setNumber(inputName, value);
    this.emitEvent('inputChange', { name: inputName, value });
  }

  public fireTrigger(inputName: string): void {
    this.runtime.fireTrigger(inputName);
    this.emitEvent('triggerFired', { name: inputName });
  }

  public setState(stateNameOrLayerId: string, stateName?: string): void {
    this.runtime.setState(stateNameOrLayerId, stateName || stateNameOrLayerId);
    this.emitEvent('stateChange', { state: stateName || stateNameOrLayerId });
  }

  // Data Binding APIs (Forwarded to runtime owner)
  public setBindingValue(sourcePath: string, value: any): void {
    this.runtime.setBindingValue(sourcePath, value);
  }

  // Dynamic Property Overrides (Forwarded to runtime owner)
  public setProperty(nodeId: string, property: keyof SceneNode, value: any): void {
    this.runtime.setProperty(nodeId, property, value);
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
    this.boundPointerDown = (e) => this.handlePointerDown(e);
    this.boundPointerUp = (e) => this.handlePointerUp(e);
    this.boundPointerMove = (e) => this.handlePointerMove(e);
    this.boundPointerLeave = (e) => this.handlePointerLeave(e);
    this.boundClick = (e) => this.handleClick(e);

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

  private getScenePoint(event: MouseEvent | PointerEvent) {
    if (!this.canvas) return null;
    const sceneState = this.runtime.getEvaluatedSceneState();
    const viewport = sceneState.renderScene.viewport;

    const canvasPt = screenToCanvasPoint(event.clientX, event.clientY, this.canvas);
    const scenePt = canvasToScenePoint(canvasPt, viewport.width, viewport.height, this.canvas);

    return { scenePt, sceneState };
  }

  private handlePointerDown(event: PointerEvent): void {
    const data = this.getScenePoint(event);
    if (!data) return;

    const hitNode = hitTestScene(data.sceneState, data.scenePt);
    if (hitNode) {
      // Document-defined interaction dispatching
      this.runtime.dispatchInteraction(hitNode.id, 'pointerdown');

      // Fallback for legacy state machines without explicit document interactions
      if (this.runtime.getInteractions().length === 0) {
        this.runtime.setBoolean('isPressed', true);
        this.runtime.setBoolean('pressed', true);
        this.runtime.fireTrigger('onPointerDown');
        this.runtime.fireTrigger('press');
      }

      this.emitEvent('nodeInteraction', {
        nodeId: hitNode.id,
        nodeName: hitNode.name,
        eventType: 'pointerdown',
        x: data.scenePt.x,
        y: data.scenePt.y
      });
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    const data = this.getScenePoint(event);
    if (!data) return;

    const hitNode = hitTestScene(data.sceneState, data.scenePt);
    if (hitNode) {
      // Document-defined interaction dispatching
      this.runtime.dispatchInteraction(hitNode.id, 'pointerup');

      // Fallback for legacy state machines without explicit document interactions
      if (this.runtime.getInteractions().length === 0) {
        this.runtime.setBoolean('isPressed', false);
        this.runtime.setBoolean('pressed', false);
        this.runtime.fireTrigger('onPointerUp');
      }

      this.emitEvent('nodeInteraction', {
        nodeId: hitNode.id,
        nodeName: hitNode.name,
        eventType: 'pointerup',
        x: data.scenePt.x,
        y: data.scenePt.y
      });
    }
  }

  private handlePointerMove(event: PointerEvent): void {
    const data = this.getScenePoint(event);
    if (!data) return;

    const hitNode = hitTestScene(data.sceneState, data.scenePt);
    const currentHitId = hitNode ? hitNode.id : null;

    if (currentHitId !== this.hoveredNodeId) {
      if (this.hoveredNodeId && !currentHitId) {
        // Hover leave
        this.runtime.dispatchInteraction(this.hoveredNodeId, 'pointerleave');
        if (this.runtime.getInteractions().length === 0) {
          this.runtime.setBoolean('isHovered', false);
          this.runtime.setBoolean('hover', false);
          this.runtime.fireTrigger('onHoverLeave');
        }

        this.emitEvent('nodeInteraction', {
          nodeId: this.hoveredNodeId,
          eventType: 'pointerleave',
          x: data.scenePt.x,
          y: data.scenePt.y
        });
      }

      if (currentHitId) {
        // Hover enter
        this.runtime.dispatchInteraction(currentHitId, 'pointerenter');
        if (this.runtime.getInteractions().length === 0) {
          this.runtime.setBoolean('isHovered', true);
          this.runtime.setBoolean('hover', true);
          this.runtime.fireTrigger('onHoverEnter');
        }

        this.emitEvent('nodeInteraction', {
          nodeId: currentHitId,
          nodeName: hitNode!.name,
          eventType: 'pointerenter',
          x: data.scenePt.x,
          y: data.scenePt.y
        });
      }

      this.hoveredNodeId = currentHitId;
    }
  }

  private handlePointerLeave(_event?: PointerEvent): void {
    if (this.hoveredNodeId) {
      this.runtime.dispatchInteraction(this.hoveredNodeId, 'pointerleave');
      if (this.runtime.getInteractions().length === 0) {
        this.runtime.setBoolean('isHovered', false);
        this.runtime.setBoolean('hover', false);
        this.runtime.setBoolean('isPressed', false);
        this.runtime.fireTrigger('onHoverLeave');
      }

      this.emitEvent('nodeInteraction', {
        nodeId: this.hoveredNodeId,
        eventType: 'pointerleave'
      });
      this.hoveredNodeId = null;
    }
  }

  private handleClick(event: MouseEvent): void {
    const data = this.getScenePoint(event);
    if (!data) return;

    const hitNode = hitTestScene(data.sceneState, data.scenePt);
    if (hitNode) {
      this.runtime.dispatchInteraction(hitNode.id, 'click');
      if (this.runtime.getInteractions().length === 0) {
        this.runtime.fireTrigger('onClick');
        this.runtime.fireTrigger('click');
      }

      this.emitEvent('nodeInteraction', {
        nodeId: hitNode.id,
        nodeName: hitNode.name,
        eventType: 'click',
        x: data.scenePt.x,
        y: data.scenePt.y
      });
    }
  }

  public getRuntime(): OpenSVGRuntime {
    return this.runtime;
  }
}
