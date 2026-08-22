import {
  RenderBackend,
  RenderCapabilities,
  RenderScene,
  RenderNodeState,
  BackendFrameContext
} from '../runtime/coreContracts';

/**
 * Canvas2D Render Backend Implementation
 * Adheres strictly to GPU_BACKEND_ARCHITECTURE.md (Section 6 & 7) & RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md (CORE-07)
 */

export class Canvas2DBackend implements RenderBackend {
  public readonly name: string = 'canvas2d';
  public readonly capabilities: RenderCapabilities = {
    webgpu: false,
    compute: false,
    msaa: false,
    maxTextureSize: 4096
  };

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private currentDpr: number = 1;

  public async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to acquire 2D canvas rendering context.');
    }
  }

  public beginFrame(frameCtx: BackendFrameContext): void {
    if (!this.ctx || !this.canvas) return;
    this.currentDpr = frameCtx.dpr || 1;
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.currentDpr !== 1) {
      this.ctx.scale(this.currentDpr, this.currentDpr);
    }
  }

  public submit(scene: RenderScene): void {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;

    // Draw background
    if (scene.viewport.background) {
      ctx.fillStyle = scene.viewport.background;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    const nodeMap = new Map<string, RenderNodeState>();
    for (const node of scene.nodes) {
      nodeMap.set(node.id, node);
    }

    // Render nodes according to scene.drawOrder
    for (const id of scene.drawOrder) {
      const node = nodeMap.get(id);
      if (!node || !node.visible) continue;

      ctx.save();

      // Apply world affine transform matrix [a, b, c, d, e, f]
      const m = node.worldTransform;
      ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);

      // Apply opacity
      ctx.globalAlpha = node.opacity;

      // Apply filter shadows
      if (node.filter?.shadow) {
        ctx.shadowColor = node.filter.shadow.color;
        ctx.shadowBlur = node.filter.shadow.blur;
        ctx.shadowOffsetX = node.filter.shadow.offsetX;
        ctx.shadowOffsetY = node.filter.shadow.offsetY;
      }

      // Draw geometry
      this.drawNodeGeometry(ctx, node);

      ctx.restore();
    }
  }

  private drawNodeGeometry(ctx: CanvasRenderingContext2D, node: RenderNodeState): void {
    const { width, height } = node.bounds;

    ctx.beginPath();
    if (node.type === 'circle') {
      ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
    } else if (node.type === 'rect') {
      ctx.rect(0, 0, width, height);
    } else {
      ctx.rect(0, 0, width, height);
    }

    // Fill
    if (node.fill && node.fill.color) {
      ctx.fillStyle = node.fill.color;
      ctx.fill();
    }

    // Stroke
    if (node.stroke && node.stroke.width > 0) {
      ctx.strokeStyle = node.stroke.color;
      ctx.lineWidth = node.stroke.width;
      if (node.stroke.cap) ctx.lineCap = node.stroke.cap;
      if (node.stroke.join) ctx.lineJoin = node.stroke.join;
      if (node.stroke.dash) ctx.setLineDash(node.stroke.dash);
      ctx.stroke();
    }
  }

  public endFrame(): void {
    if (!this.ctx) return;
    this.ctx.restore();
  }

  public resize(width: number, height: number, dpr: number = 1): void {
    if (!this.canvas) return;
    this.currentDpr = dpr;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
  }

  public dispose(): void {
    this.canvas = null;
    this.ctx = null;
  }
}
