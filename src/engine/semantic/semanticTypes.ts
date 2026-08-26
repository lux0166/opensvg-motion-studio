import { BezierPoint, PropertyTrack, NodeTrigger, BaseNode } from '../types';

export type MotionPathConfig = NonNullable<BaseNode['motionPath']>;

export interface NodeIdentity {
  id: string;
  name: string;
  type: string;
}

export interface NodeHierarchy {
  parentId?: string;
  childrenIds?: string[];
}

export interface NodeTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  pivotX: number;
  pivotY: number;
}

export interface NodeGeometry {
  pathPoints?: BezierPoint[];
  subPaths?: BezierPoint[][];
  borderRadius: number;
  textContent?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export interface NodeAppearance {
  fill: string;
  fillType?: 'solid' | 'linear' | 'radial';
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: string;
  strokeWidth?: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  strokeCap?: 'butt' | 'round' | 'square';
  strokeJoin?: 'miter' | 'round' | 'bevel';
  strokeDash?: number[];
  trimStart?: number;
  trimEnd?: number;
  trimOffset?: number;
  linearGradient?: any;
  radialGradient?: any;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  filterBlur?: number;
}

export interface NodeAnimation {
  tracks: PropertyTrack<any>[];
}

export interface NodeConstraint {
  constraints?: any[];
}

export interface NodeInteraction {
  triggers?: NodeTrigger[];
  motionPath?: MotionPathConfig;
}

export interface SemanticNode {
  identity: NodeIdentity;
  hierarchy: NodeHierarchy;
  transform: NodeTransform;
  geometry: NodeGeometry;
  appearance: NodeAppearance;
  animation: NodeAnimation;
  constraint: NodeConstraint;
  interaction: NodeInteraction;
}
