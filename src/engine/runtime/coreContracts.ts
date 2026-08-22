/**
 * OpenSVG Core Runtime & Headless Foundation Contracts
 * Adheres strictly to CORE_ENGINE_DEPTH.md & RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md (CORE-01)
 * INVARIANT: Zero React/Zustand imports. Pure domain models.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Matrix2D {
  a: number; // Scale X
  b: number; // Shear Y
  c: number; // Shear X
  d: number; // Scale Y
  e: number; // Translation X
  f: number; // Translation Y
}

export interface Transform {
  translation: Vec2;
  rotation: number; // in degrees
  scale: Vec2;
  pivot: Vec2; // normalized (0..1) or local px
}

export type CoordinateSpace = 'local' | 'parent' | 'world' | 'viewport' | 'screen';

export interface RenderPaint {
  type: 'solid' | 'linear-gradient' | 'radial-gradient';
  color?: string;
  gradient?: any;
}

export interface RenderStroke {
  color: string;
  width: number;
  cap?: 'butt' | 'round' | 'square';
  join?: 'miter' | 'round' | 'bevel';
  dash?: number[];
  trimStart?: number;
  trimEnd?: number;
  trimOffset?: number;
}

export interface RenderClipDescriptor {
  type: 'rect' | 'path';
  bounds?: Rect2D;
  pathPoints?: any[];
}

export interface RenderFilterDescriptor {
  blur?: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface RenderNodeState {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  opacity: number;
  worldTransform: Matrix2D;
  bounds: Rect2D;
  fill?: RenderPaint;
  stroke?: RenderStroke;
  clip?: RenderClipDescriptor;
  filter?: RenderFilterDescriptor;
  geometryData?: any;
}

export interface RenderScene {
  id: string;
  viewport: { width: number; height: number; dpr: number; background: string };
  nodes: RenderNodeState[];
  drawOrder: string[];
}

export interface BackendFrameContext {
  currentTime: number;
  width: number;
  height: number;
  dpr: number;
}

export interface RenderCapabilities {
  webgpu: boolean;
  compute: boolean;
  msaa: boolean;
  maxTextureSize: number;
}

export interface RenderBackend {
  readonly name: string;
  readonly capabilities: RenderCapabilities;
  initialize(canvas: HTMLCanvasElement): Promise<void>;
  beginFrame(ctx: BackendFrameContext): void;
  submit(scene: RenderScene): void;
  endFrame(): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
}
