import {
  OpenSVGDocument,
  DocumentValidationResult,
  CURRENT_OPENSVG_SCHEMA_VERSION
} from './nativeDocument';
import { SceneProject, FrameNode } from '../types';
import { migrateProjectToLatest } from '../persistence/schemaMigration';

/**
 * Recursively sort keys of an object to ensure deterministic serialization (Rule CORE-11 & Section 6)
 */
function sortObjectKeys<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const sortedKeys = Object.keys(obj as object).sort();
  const result: any = {};
  for (const key of sortedKeys) {
    const val = (obj as any)[key];
    result[key] = typeof val === 'object' && val !== null && !Array.isArray(val) ? sortObjectKeys(val) : val;
  }
  return result as T;
}

/**
 * Validates structural integrity of an OpenSVG document payload with strict error & warning reporting
 */
export function validateDocument(docOrJson: any): DocumentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let doc = docOrJson;
  if (typeof docOrJson === 'string') {
    try {
      doc = JSON.parse(docOrJson);
    } catch (err: any) {
      return {
        valid: false,
        errors: [`JSON Syntax Error while validating document: ${err.message}`],
        warnings: []
      };
    }
  }

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
    if (!doc.metadata.title) warnings.push('Metadata missing title; using default title.');
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
    if (typeof doc.scene.fps !== 'number' || doc.scene.fps <= 0) {
      warnings.push('Scene fps missing or invalid; defaulting to 60.');
    }
  }

  if (!doc.nodes || typeof doc.nodes !== 'object') {
    errors.push('Missing or invalid nodes dictionary.');
  }

  if (!Array.isArray(doc.nodeOrder)) {
    errors.push('Missing or invalid nodeOrder array.');
  }

  // Asset validation
  if (doc.assets && typeof doc.assets === 'object') {
    for (const [id, asset] of Object.entries(doc.assets)) {
      if (!asset || typeof asset !== 'object') {
        warnings.push(`Asset '${id}' is malformed.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Canonicalizes and serializes an OpenSVG document into deterministic JSON string
 */
export function serializeDocument(doc: OpenSVGDocument, pretty: boolean = false): string {
  const validation = validateDocument(doc);
  if (!validation.valid) {
    throw new Error(`Cannot serialize invalid OpenSVG document:\n${validation.errors.join('\n')}`);
  }

  const sortedDoc = sortObjectKeys(doc);
  return JSON.stringify(sortedDoc, null, pretty ? 2 : undefined);
}

/**
 * Parses and validates an OpenSVG document from raw JSON string with graceful error handling
 */
export function parseDocument(rawJson: string): OpenSVGDocument {
  if (!rawJson || typeof rawJson !== 'string') {
    throw new Error('Invalid input: Expected non-empty JSON string.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: any) {
    throw new Error(`JSON Syntax Error while parsing OpenSVG Document: ${err.message}`);
  }

  // Auto-migrate if legacy format detected
  if (parsed && parsed.format !== 'opensvg' && (parsed.rootFrame || parsed.nodes)) {
    return migrateLegacyToNativeDocument(parsed);
  }

  const validation = validateDocument(parsed);
  if (!validation.valid) {
    throw new Error(`Invalid OpenSVG document format:\n${validation.errors.join('\n')}`);
  }

  return parsed as OpenSVGDocument;
}

/**
 * Migrates any legacy project payload into a strict OpenSVGDocument (.osvg)
 */
export function migrateLegacyToNativeDocument(raw: any): OpenSVGDocument {
  const legacyProject = migrateProjectToLatest(raw);
  return convertProjectToNativeDocument(legacyProject);
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
