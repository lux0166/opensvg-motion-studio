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
  pointType?: 'corner' | 'smooth' | 'asymmetric';
}

export interface CubicBezierCurve {
  x1: number; // 0 to 1
  y1: number; // typically 0 to 1
  x2: number; // 0 to 1
  y2: number; // typically 0 to 1
}

export interface SpringConfig {
  mass: number;
  stiffness: number;
  damping: number;
  velocity?: number;
}

export type EasingType = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier' | 'spring';

export interface Keyframe<T = number | string> {
  id: string;
  time: number; // in seconds, e.g. 1.25
  value: T;
  easing?: EasingType;
  curve?: CubicBezierCurve; // Custom Bézier handles for graph editor
  spring?: SpringConfig; // Spring dynamics configuration
}

export type AnimatableProperty =
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'rotation'
  | 'scaleX'
  | 'scaleY'
  | 'pivotX'
  | 'pivotY'
  | 'opacity'
  | 'borderRadius'
  | 'fill'
  | 'stroke'
  | 'strokeWidth'
  | 'trimStart'
  | 'trimEnd'
  | 'trimOffset'
  | 'textPathOffset'
  | 'staggerDelay'
  | 'pathPoints'
  | 'fontSize'
  | 'shadowBlur'
  | 'shadowOffsetX'
  | 'shadowOffsetY'
  | 'filterBlur'
  | 'motionPathProgress';

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
  angle: number; // 0 to 360 degrees
  stops: GradientStop[];
}

export interface RadialGradientConfig {
  cx?: number; // 0 to 1
  cy?: number; // 0 to 1
  r?: number; // 0 to 1
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

  // Spatial Transforms
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  scaleX: number;
  scaleY: number;
  pivotX?: number; // 0.0 to 1.0 (default 0.5 center)
  pivotY?: number; // 0.0 to 1.0 (default 0.5 center)
  opacity: number; // 0 to 1
  borderRadius: number;

  // Appearance & Gradient Fills
  fillType?: FillType;
  fill: string;
  fillRule?: 'nonzero' | 'evenodd';
  linearGradient?: LinearGradientConfig;
  radialGradient?: RadialGradientConfig;

  // Stroke Styling & Path Trimming
  stroke?: string;
  strokeWidth?: number;
  strokeDash?: number[];
  strokeCap?: 'butt' | 'round' | 'square';
  strokeJoin?: 'miter' | 'round' | 'bevel';
  trimStart?: number; // 0.0 to 1.0
  trimEnd?: number; // 0.0 to 1.0
  trimOffset?: number; // 0.0 to 1.0

  // Filters & Shadows
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  filterBlur?: number;

  // Path data (if type === 'path')
  pathPoints?: BezierPoint[];
  subPaths?: BezierPoint[][]; // For compound paths & holes

  // Masking & Clipping (Rules L1, L2, L3)
  isMask?: boolean;
  maskMode?: 'alpha' | 'clip' | 'none';
  maskTargetId?: string | null;
  maskId?: string | null;

  // Text & Typography (if type === 'text') (Rules K1, K2, K3, K4, K5)
  textContent?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  textPathNodeId?: string | null;
  textPathOffset?: number; // 0.0 to 1.0 progress along path
  staggerType?: 'none' | 'typewriter' | 'wave' | 'cascade';
  staggerDelay?: number; // Delay per glyph/character in seconds

  // Animation tracks
  tracks: PropertyTrack<any>[];

  // Motion Path & Orbit
  motionPath?: {
    pathNodeId: string;
    progress: number; // 0.0 to 1.0
    autoOrient: boolean;
    offsetAngle?: number;
  };

  // Interactive State Machine Triggers
  triggers?: NodeTrigger[];
}

export type TriggerEvent = 'onClick' | 'onHoverEnter' | 'onHoverLeave';
export type TriggerActionType = 'jumpToTime' | 'togglePlay' | 'setProperties' | 'play';

export interface NodeTrigger {
  id: string;
  event: TriggerEvent;
  action: TriggerActionType;
  targetTime?: number; // for jumpToTime
  propertyUpdates?: Partial<BaseNode>; // for setProperties
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
  | 'pivot'
  | 'frame'
  | 'rect'
  | 'circle'
  | 'star'
  | 'pen'
  | 'text'
  | 'hand'
  | 'zoom';

export type TimelineMode = 'dopesheet' | 'graph';

export interface AudioTrackConfig {
  id: string;
  name: string;
  src: string; // Base64 data URL or URL
  volume: number; // 0 to 1
  muted: boolean;
  duration: number; // in seconds
  waveformData?: number[]; // Normalized peaks (0..1)
}

export interface TimelineMarker {
  id: string;
  time: number; // seconds
  label: string;
  color?: string;
}

export interface DocumentTab {
  id: string;
  title: string;
  isDirty?: boolean;
  createdAt: number;
  project: SceneProject;
  history: {
    past: any[];
    future: any[];
  };
  viewport: {
    zoom: number;
    panX: number;
    panY: number;
    currentTime: number;
    selectedId: string | null;
    selectedIds: string[];
  };
  audioTrack: AudioTrackConfig | null;
  markers: TimelineMarker[];
}
