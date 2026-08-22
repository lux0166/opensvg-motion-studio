import { SceneProject, SceneNode } from '../types';
import { RenderScene } from './coreContracts';
import { deriveRenderScene } from './renderState';
import { evaluateNode } from '../evaluator';

/**
 * Headless Runtime Evaluation Kernel
 * Adheres strictly to CORE_ENGINE_DEPTH.md (Section 1.1 & 7) & CORE-04
 * Invariant: Evaluation produces derived state. Playback/evaluation must not mutate the canonical authoring document.
 */

export class OpenSVGRuntime {
  private project: SceneProject | null = null;
  private currentTime: number = 0;
  private isPlaying: boolean = false;

  /**
   * Loads a canonical SceneProject into the runtime
   */
  public load(project: SceneProject): void {
    // Deep clone to ensure runtime separation from authoring state
    this.project = JSON.parse(JSON.stringify(project));
    this.currentTime = 0;
    this.isPlaying = false;
  }

  /**
   * Advances runtime clock by dt seconds (Looping within duration)
   */
  public advance(dt: number): void {
    if (!this.project || this.project.duration <= 0) return;
    this.currentTime = (this.currentTime + dt) % this.project.duration;
    if (this.currentTime < 0) {
      this.currentTime += this.project.duration;
    }
  }

  /**
   * Seeks deterministically to exact time t
   */
  public seek(time: number): void {
    if (!this.project) return;
    const dur = this.project.duration || 1;
    this.currentTime = Math.max(0, Math.min(dur, time));
  }

  /**
   * Resets runtime clock to t = 0
   */
  public reset(): void {
    this.currentTime = 0;
    this.isPlaying = false;
  }

  /**
   * Returns current evaluated RenderScene without mutating authoring document
   */
  public getRenderState(): RenderScene {
    if (!this.project) {
      return {
        id: 'empty',
        viewport: { width: 800, height: 600, dpr: 1, background: '#ffffff' },
        nodes: [],
        drawOrder: []
      };
    }

    const evaluatedNodes: SceneNode[] = [];
    for (const id of this.project.nodeOrder) {
      const originalNode = this.project.nodes[id];
      if (originalNode) {
        evaluatedNodes.push(evaluateNode(originalNode, this.currentTime, this.project.nodes));
      }
    }

    return deriveRenderScene(this.project, evaluatedNodes);
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.project?.duration || 0;
  }

  public getFps(): number {
    return this.project?.fps || 60;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
