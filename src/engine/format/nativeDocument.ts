import { SceneNode, FrameNode } from '../types';
import { StateMachineDefinition } from '../stateMachine/runtimeStateMachine';
import { ComponentDefinition } from '../components/componentSystem';
import { DataBinding } from '../binding/dataBinding';
import { Constraint } from '../constraints/constraintSolver';

export const OPENSVG_FILE_EXTENSION = '.osvg';
export const OPENSVG_MIME_TYPE = 'application/vnd.opensvg+json';
export const CURRENT_OPENSVG_SCHEMA_VERSION = '2.0.0';

export interface DocumentMetadata {
  id: string;
  title: string;
  description?: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
  generator?: string;
  tags?: string[];
}

export interface SceneConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
  background: string;
  clipContent?: boolean;
}

export interface AssetManifestEntry {
  id: string;
  name: string;
  type: 'image' | 'font' | 'audio' | 'vector';
  mimeType: string;
  dataUrl?: string;
  url?: string;
  sizeBytes?: number;
}

/**
 * OpenSVG Native Document Canonical Schema (.osvg)
 * Standardized per OPENSVG_CURRENT_STRATEGIC_ROADMAP.md (Section 9 & 10)
 * Invariant: Completely isolated from editor-only states (zoom, selected nodes, dock layout).
 */
export interface OpenSVGDocument {
  format: 'opensvg';
  schemaVersion: '2.0.0';
  metadata: DocumentMetadata;
  scene: SceneConfig;
  rootFrame?: FrameNode;
  nodes: Record<string, SceneNode>;
  nodeOrder: string[];
  stateMachines?: StateMachineDefinition[];
  components?: ComponentDefinition[];
  bindings?: DataBinding[];
  constraints?: Constraint[];
  assets?: Record<string, AssetManifestEntry>;
}

export interface DocumentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
