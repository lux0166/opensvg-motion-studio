/**
 * Vector Motion Design Engine Types (Rive / Figma Motion standard)
 */

export type NodeType = 'frame' | 'rect' | 'circle' | 'star' | 'polygon' | 'path' | 'text' | 'group';

export interface BezierPoint {
  x: number;
  y: number;
  cp1x?: number; // Control point 1
  cp1y?: number;
  cp2x?: number; // Control point 2
  cp2y?: number;
  type?: 'move' | 'line' | 'cubic' | 'close';
}

export interface CubicBezierCurve {
  x1: number; // 0 to 1
  y1: number; // typically 0 to 1
  x2: number; // 0 to 1
  y2: number; // typically 0 to 1
}

export type EasingType = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';

export interface Keyframe<T = number | string> {
  id: string;
  time: number; // in seconds, e.g. 1.25
  value: T;
  easing?: EasingType;
  curve?: CubicBezierCurve; // Custom Bézier handles for graph editor
}

export type AnimatableProperty =
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'rotation'
  | 'scaleX'
  | 'scaleY'
  | 'opacity'
  | 'borderRadius'
  | 'fill'
  | 'stroke'
  | 'strokeWidth';

export interface PropertyTrack<T = number | string> {
  id: string;
  property: AnimatableProperty;
  label: string;
  unit: string;
  keyframes: Keyframe<T>[];
  color?: string; // Color of the curve in Graph Editor
}

export type FillType = 'solid' | 'linear' | 'radial';

export interface GradientStop {
  offset: number; // 0 to 1
  color: string;
}

export interface LinearGradientConfig {
  angle: number; // 0 to 360 deg
  stops: GradientStop[];
}

export interface RadialGradientConfig {
  stops: GradientStop[];
}

export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  visible: boolean;
  locked: boolean;
  parentId?: string | null;
  childrenIds?: string[];

  // Base Transform
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  scaleX: number;
  scaleY: number;
  opacity: number; // 0 to 1
  borderRadius: number;

  // Appearance & Gradient Fills
  fillType?: FillType;
  fill: string;
  linearGradient?: LinearGradientConfig;
  radialGradient?: RadialGradientConfig;

  // Stroke Styling
  stroke?: string;
  strokeWidth?: number;
  strokeDash?: number[];
  strokeCap?: 'butt' | 'round' | 'square';
  strokeJoin?: 'miter' | 'round' | 'bevel';

  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  // Path data (if type === 'path')
  pathPoints?: BezierPoint[];

  // Text content (if type === 'text')
  textContent?: string;
  fontSize?: number;

  // Animation tracks
  tracks: PropertyTrack<any>[];
}

export interface FrameNode extends BaseNode {
  type: 'frame';
  clipContent: boolean;
  canvasBg: string;
}

export type SceneNode = BaseNode | FrameNode;

export interface SceneProject {
  id: string;
  name: string;
  version: string;
  duration: number; // seconds, e.g. 3.0
  fps: number; // 30, 60, 120
  rootFrame: FrameNode;
  nodes: Record<string, SceneNode>;
  nodeOrder: string[]; // Z-order (bottom to top)
}

export type ToolMode =
  | 'select'
  | 'direct-select'
  | 'frame'
  | 'rect'
  | 'circle'
  | 'star'
  | 'pen'
  | 'text'
  | 'hand'
  | 'zoom';

export type TimelineMode = 'dopesheet' | 'graph';
