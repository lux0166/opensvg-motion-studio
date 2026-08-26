import {
  OpenSVGDocument,
  DocumentValidationResult,
  CURRENT_OPENSVG_SCHEMA_VERSION
} from './nativeDocument';
import { SceneProject, FrameNode } from '../types';
import { migrateProjectToLatest } from '../persistence/schemaMigration';

const VALID_INTERACTION_EVENTS: Set<string> = new Set([
  'pointerenter',
  'pointerleave',
  'pointerdown',
  'pointerup',
  'click',
  'dblclick'
]);

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
 * Validates structural and semantic integrity of an OpenSVG document payload with deep validation
 * Standardized per P0-3, P1-1, P1-2, P1-3 Strict Format Semantics.
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

  // 1. Version compatibility check (P1-3)
  if (!doc.schemaVersion || typeof doc.schemaVersion !== 'string') {
    errors.push('Missing or invalid schemaVersion.');
  } else {
    const major = doc.schemaVersion.split('.')[0];
    if (major !== '2') {
      errors.push(`Unsupported schemaVersion '${doc.schemaVersion}'. Supported major versions: 2.x.x.`);
    }
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

  const nodeMap = doc.nodes && typeof doc.nodes === 'object' ? doc.nodes : {};

  // 2. Hierarchy validation & Cycle Detection (P1-1 & P1-2)
  if (doc.nodes && typeof doc.nodes === 'object') {
    for (const [nodeId, node] of Object.entries(nodeMap)) {
      if (node && typeof node === 'object' && (node as any).parentId) {
        const parentId = (node as any).parentId;
        if (!nodeMap[parentId]) {
          errors.push(`Node '${nodeId}' references non-existent parentId '${parentId}'.`);
        }
      }
    }

    // Depth-First-Search cycle detector
    const visited = new Set<string>();
    const stack = new Set<string>();

    function checkCycle(id: string): boolean {
      visited.add(id);
      stack.add(id);
      const current = nodeMap[id];
      if (current && current.parentId && nodeMap[current.parentId]) {
        if (stack.has(current.parentId)) return true;
        if (!visited.has(current.parentId) && checkCycle(current.parentId)) return true;
      }
      stack.delete(id);
      return false;
    }

    for (const id of Object.keys(nodeMap)) {
      if (!visited.has(id)) {
        if (checkCycle(id)) {
          errors.push(`Cyclic hierarchy detected involving node '${id}'.`);
          break;
        }
      }
    }
  }

  // 3. Deep Interaction Validation (P0-3)
  if (doc.interactions) {
    if (!Array.isArray(doc.interactions)) {
      errors.push('Property "interactions" must be an array.');
    } else {
      doc.interactions.forEach((inter: any, idx: number) => {
        if (!inter || typeof inter !== 'object') {
          errors.push(`Interaction at index ${idx} is not an object.`);
        } else {
          if (!inter.id) errors.push(`Interaction at index ${idx} is missing "id".`);
          if (!inter.targetNodeId) {
            errors.push(`Interaction at index ${idx} is missing "targetNodeId".`);
          } else if (inter.targetNodeId !== '*' && !nodeMap[inter.targetNodeId]) {
            errors.push(`Interaction '${inter.id || idx}' targets non-existent node '${inter.targetNodeId}'.`);
          }

          if (!inter.event) {
            errors.push(`Interaction at index ${idx} is missing "event".`);
          } else if (!VALID_INTERACTION_EVENTS.has(inter.event)) {
            errors.push(`Interaction '${inter.id || idx}' has invalid event '${inter.event}'.`);
          }

          if (!inter.action || typeof inter.action !== 'object') {
            errors.push(`Interaction at index ${idx} is missing valid "action" object.`);
          } else {
            const act = inter.action;
            if (act.type === 'setInput' && (!act.inputName || typeof act.inputName !== 'string')) {
              errors.push(`Interaction '${inter.id || idx}' action 'setInput' requires valid 'inputName'.`);
            } else if (act.type === 'fireTrigger' && (!act.triggerName || typeof act.triggerName !== 'string')) {
              errors.push(`Interaction '${inter.id || idx}' action 'fireTrigger' requires valid 'triggerName'.`);
            } else if (act.type === 'setState' && (!act.stateId || typeof act.stateId !== 'string')) {
              errors.push(`Interaction '${inter.id || idx}' action 'setState' requires valid 'stateId'.`);
            } else if (act.type === 'seek' && (typeof act.time !== 'number' || act.time < 0)) {
              errors.push(`Interaction '${inter.id || idx}' action 'seek' requires non-negative 'time'.`);
            }
          }
        }
      });
    }
  }

  // 4. State Machine Structural Validation (P0-3)
  if (doc.stateMachines) {
    if (!Array.isArray(doc.stateMachines)) {
      errors.push('Property "stateMachines" must be an array.');
    } else {
      doc.stateMachines.forEach((sm: any, smIdx: number) => {
        if (!sm || typeof sm !== 'object') {
          errors.push(`StateMachine at index ${smIdx} is not an object.`);
        } else {
          if (!sm.id) errors.push(`StateMachine at index ${smIdx} is missing "id".`);
          if (sm.layers && Array.isArray(sm.layers)) {
            sm.layers.forEach((layer: any, lIdx: number) => {
              const stateIds = new Set((layer.states || []).map((s: any) => s.id));
              if (layer.defaultStateId && !stateIds.has(layer.defaultStateId)) {
                errors.push(`Layer '${layer.id || lIdx}' in StateMachine '${sm.id}' references unknown defaultStateId '${layer.defaultStateId}'.`);
              }
              if (layer.transitions && Array.isArray(layer.transitions)) {
                layer.transitions.forEach((tr: any, trIdx: number) => {
                  if (tr.fromStateId && !stateIds.has(tr.fromStateId)) {
                    errors.push(`Transition '${tr.id || trIdx}' in layer '${layer.id}' references unknown fromStateId '${tr.fromStateId}'.`);
                  }
                  if (tr.toStateId && !stateIds.has(tr.toStateId)) {
                    errors.push(`Transition '${tr.id || trIdx}' in layer '${layer.id}' references unknown toStateId '${tr.toStateId}'.`);
                  }
                });
              }
            });
          }
        }
      });
    }
  }

  // 5. Component Instance Validation (P0-1)
  if (doc.componentInstances) {
    if (!Array.isArray(doc.componentInstances)) {
      errors.push('Property "componentInstances" must be an array.');
    } else {
      const defIds = new Set((doc.components || []).map((c: any) => c.id));
      doc.componentInstances.forEach((inst: any, idx: number) => {
        if (!inst.componentDefId || !defIds.has(inst.componentDefId)) {
          errors.push(`ComponentInstance '${inst.id || idx}' references unknown componentDefId '${inst.componentDefId}'.`);
        }
      });
    }
  }

  // 6. Asset Manifest Validation (P0-2)
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
 * Parses and validates an OpenSVG document from raw JSON string with strict semantic error reporting
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
    interactions: extras.interactions ? JSON.parse(JSON.stringify(extras.interactions)) : undefined,
    components: extras.components ? JSON.parse(JSON.stringify(extras.components)) : undefined,
    componentInstances: extras.componentInstances ? JSON.parse(JSON.stringify(extras.componentInstances)) : undefined,
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
    nodeOrder: [...(doc.nodeOrder || [])],
    stateMachines: doc.stateMachines ? JSON.parse(JSON.stringify(doc.stateMachines)) : undefined,
    interactions: doc.interactions ? JSON.parse(JSON.stringify(doc.interactions)) : undefined
  };

  return project;
}
