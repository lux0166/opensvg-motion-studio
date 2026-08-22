import {
  RenderBackend,
  RenderCapabilities,
  RenderScene,
  BackendFrameContext
} from '../runtime/coreContracts';
import { Canvas2DBackend } from './canvas2DBackend';

/**
 * OpenSVG WebGPU Render Backend Prototype with Dynamic Canvas2D Fallback
 * Adheres strictly to GPU_BACKEND_ARCHITECTURE.md (Sections 6, 7, 8, 9, 10) & RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md (CORE-13)
 */

export class WebGpuBackend implements RenderBackend {
  public readonly name: string = 'webgpu';
  public readonly capabilities: RenderCapabilities = {
    webgpu: true,
    compute: true,
    msaa: true,
    maxTextureSize: 8192
  };

  private canvas: HTMLCanvasElement | null = null;
  private adapter: any = null;
  private device: any = null;
  private context: any = null;
  private fallbackBackend: Canvas2DBackend | null = null;
  private isFallbackMode: boolean = false;

  /**
   * Initializes WebGPU device and pipelines, falling back to Canvas2D if unavailable (Rule 9 & 10)
   */
  public async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    const gpu = typeof navigator !== 'undefined' ? (navigator as any).gpu : null;

    if (!gpu) {
      this.activateFallback('WebGPU not supported in this environment; falling back to Canvas2D.');
      await this.fallbackBackend!.initialize(canvas);
      return;
    }

    try {
      this.adapter = await gpu.requestAdapter();
      if (!this.adapter) {
        throw new Error('No appropriate GPUAdapter found.');
      }

      this.device = await this.adapter.requestDevice();

      // Setup Device Loss Recovery Handler (Rule 10)
      if (this.device.lost) {
        this.device.lost.then((info: any) => {
          console.warn(`WebGPU device was lost (${info.reason}): ${info.message}`);
          this.activateFallback('WebGPU Device lost mid-session; switching seamlessly to Canvas2D fallback.');
          if (this.canvas) {
            this.fallbackBackend!.initialize(this.canvas);
          }
        });
      }

      this.context = canvas.getContext('webgpu' as any);
      if (this.context && this.device) {
        const presentationFormat = gpu.getPreferredCanvasFormat ? gpu.getPreferredCanvasFormat() : 'bgra8unorm';
        this.context.configure({
          device: this.device,
          format: presentationFormat,
          alphaMode: 'premultiplied'
        });
      }
    } catch (err) {
      this.activateFallback(`WebGPU initialization failed: ${err}; falling back to Canvas2D.`);
      await this.fallbackBackend!.initialize(canvas);
    }
  }

  private activateFallback(reason: string): void {
    console.info(reason);
    this.isFallbackMode = true;
    this.fallbackBackend = new Canvas2DBackend();
  }

  public beginFrame(frameCtx: BackendFrameContext): void {
    if (this.isFallbackMode && this.fallbackBackend) {
      this.fallbackBackend.beginFrame(frameCtx);
      return;
    }
    // WebGPU frame begin lifecycle
  }

  public submit(scene: RenderScene): void {
    if (this.isFallbackMode && this.fallbackBackend) {
      this.fallbackBackend.submit(scene);
      return;
    }

    if (!this.device || !this.context) return;

    try {
      const commandEncoder = this.device.createCommandEncoder();
      const textureView = this.context.getCurrentTexture().createView();

      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0.1, g: 0.1, b: 0.15, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store'
          }
        ]
      });

      renderPass.end();
      this.device.queue.submit([commandEncoder.finish()]);
    } catch (err) {
      console.error('WebGPU submit error; falling back to Canvas2D:', err);
      this.activateFallback('Switching to Canvas2D due to WebGPU submit failure.');
      if (this.canvas) {
        this.fallbackBackend!.initialize(this.canvas);
        this.fallbackBackend!.submit(scene);
      }
    }
  }

  public endFrame(): void {
    if (this.isFallbackMode && this.fallbackBackend) {
      this.fallbackBackend.endFrame();
    }
  }

  public resize(width: number, height: number, dpr: number = 1): void {
    if (this.isFallbackMode && this.fallbackBackend) {
      this.fallbackBackend.resize(width, height, dpr);
      return;
    }
    if (this.canvas) {
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
    }
  }

  public dispose(): void {
    if (this.fallbackBackend) {
      this.fallbackBackend.dispose();
      this.fallbackBackend = null;
    }
    if (this.device && typeof this.device.destroy === 'function') {
      this.device.destroy();
    }
    this.device = null;
    this.adapter = null;
    this.context = null;
    this.canvas = null;
  }

  public isUsingFallback(): boolean {
    return this.isFallbackMode;
  }
}
