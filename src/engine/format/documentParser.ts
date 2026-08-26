import {
  OpenSVGDocument,
  DocumentValidationResult,
  CURRENT_OPENSVG_SCHEMA_VERSION
} from './nativeDocument';
import { SceneProject, FrameNode } from '../types';

/**
 * Validates structural integrity of an OpenSVG document payload
 */
export function validateDocument(doc: any): DocumentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!doc || typeof doc !== 'object') {
    return {
      valid: false,
      errors: ['Payload is not a valid JSON object.'],
      warnings: []
    };
  }

  if (doc.format !== 'opensvg') {
    errors.push(`Invalid format identifier: Expected 'opensvg', received '${doc.format}'.`);
  }

  if (!doc.schemaVersion || typeof doc.schemaVersion !== 'string') {
    errors.push('Missing or invalid schemaVersion.');
  }

  if (!doc.metadata || typeof doc.metadata !== 'object') {
    errors.push('Missing metadata object.');
  } else {
    if (!doc.metadata.id) errors.push('Metadata missing unique document id.');
    if (!doc.metadata.title) warnings.push('Metadata missing title; using fallback.');
  }

  if (!doc.scene || typeof doc.scene !== 'object') {
    errors.push('Missing scene configuration object.');
  } else {
    if (typeof doc.scene.width !== 'number' || doc.scene.width <= 0) {
      errors.push('Scene width must be a positive number.');
    }
    if (typeof doc.scene.height !== 'number' || doc.scene.height <= 0) {
      errors.push('Scene height must be a positive number.');
    }
    if (typeof doc.scene.duration !== 'number' || doc.scene.duration <= 0) {
      errors.push('Scene duration must be a positive number.');
    }
  }

  if (!doc.nodes || typeof doc.nodes !== 'object') {
    errors.push('Missing or invalid nodes dictionary.');
  }

  if (!Array.isArray(doc.nodeOrder)) {
    errors.push('Missing or invalid nodeOrder array.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Canonicalizes and serializes an OpenSVG document into JSON string
 */
export function serializeDocument(doc: OpenSVGDocument, pretty: boolean = false): string {
  const validation = validateDocument(doc);
  if (!validation.valid) {
    throw new Error(`Cannot serialize invalid OpenSVG document:\n${validation.errors.join('\n')}`);
  }

  return JSON.stringify(doc, null, pretty ? 2 : undefined);
}

/**
 * Parses and validates an OpenSVG document from raw JSON string
 */
export function parseDocument(rawJson: string): OpenSVGDocument {
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: any) {
    throw new Error(`JSON Syntax Error while parsing OpenSVG Document: ${err.message}`);
  }

  const validation = validateDocument(parsed);
  if (!validation.valid) {
    throw new Error(`Invalid OpenSVG document format:\n${validation.errors.join('\n')}`);
  }

  return parsed as OpenSVGDocument;
}

/**
 * Converts internal SceneProject to native OpenSVGDocument
 */
export function convertProjectToNativeDocument(
  project: SceneProject,
  extras: Partial<OpenSVGDocument> = {}
): OpenSVGDocument {
  const rootFrame = project.rootFrame;

  const doc: OpenSVGDocument = {
    format: 'opensvg',
    schemaVersion: CURRENT_OPENSVG_SCHEMA_VERSION,
    metadata: {
      id: project.id,
      title: project.name || 'Untitled Motion',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      generator: 'OpenSVG Motion Studio 2.0',
      ...extras.metadata
    },
    scene: {
      width: rootFrame?.width || 800,
      height: rootFrame?.height || 600,
      fps: project.fps || 60,
      duration: project.duration || 3.0,
      background: rootFrame?.fill || rootFrame?.canvasBg || '#ffffff',
      clipContent: rootFrame?.clipContent ?? true
    },
    rootFrame,
    nodes: JSON.parse(JSON.stringify(project.nodes || {})),
    nodeOrder: [...(project.nodeOrder || [])],
    stateMachines: extras.stateMachines ? JSON.parse(JSON.stringify(extras.stateMachines)) : undefined,
    components: extras.components ? JSON.parse(JSON.stringify(extras.components)) : undefined,
    bindings: extras.bindings ? JSON.parse(JSON.stringify(extras.bindings)) : undefined,
    constraints: extras.constraints ? JSON.parse(JSON.stringify(extras.constraints)) : undefined,
    assets: extras.assets ? JSON.parse(JSON.stringify(extras.assets)) : undefined
  };

  return doc;
}

/**
 * Converts native OpenSVGDocument back to internal SceneProject
 */
export function convertNativeDocumentToProject(doc: OpenSVGDocument): SceneProject {
  const validation = validateDocument(doc);
  if (!validation.valid) {
    throw new Error(`Cannot load invalid OpenSVG document:\n${validation.errors.join('\n')}`);
  }

  const rootFrame: FrameNode = doc.rootFrame || {
    id: `root-${doc.metadata.id}`,
    name: 'Root Frame',
    type: 'frame',
    visible: true,
    locked: false,
    clipContent: doc.scene.clipContent ?? true,
    canvasBg: doc.scene.background || '#ffffff',
    x: 0,
    y: 0,
    width: doc.scene.width,
    height: doc.scene.height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 0,
    fill: doc.scene.background || '#ffffff',
    tracks: []
  };

  const project: SceneProject = {
    id: doc.metadata.id,
    name: doc.metadata.title,
    version: doc.schemaVersion,
    duration: doc.scene.duration,
    fps: doc.scene.fps,
    rootFrame,
    nodes: JSON.parse(JSON.stringify(doc.nodes || {})),
    nodeOrder: [...(doc.nodeOrder || [])]
  };

  return project;
}
