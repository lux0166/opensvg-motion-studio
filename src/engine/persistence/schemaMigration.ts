import { SceneProject, SceneNode } from '../types';
import { computeProjectChecksum } from '../crashRecovery';

/**
 * OpenSVG Schema Migration and Persistence Hardening Engine
 * Adheres strictly to CORE_ENGINE_DEPTH.md (Section 12) & RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md (CORE-11)
 */

export const CURRENT_SCHEMA_VERSION = '2.0.0';

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Migrates any legacy project payload into the canonical v2 schema format (Rule CORE-11)
 */
export function migrateProjectToLatest(raw: any): SceneProject {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid project payload: Expected object.');
  }

  const proj: SceneProject = {
    id: raw.id || `proj-${Date.now()}`,
    name: raw.name || 'Untitled Motion',
    version: CURRENT_SCHEMA_VERSION,
    duration: typeof raw.duration === 'number' && raw.duration > 0 ? raw.duration : 3.0,
    fps: typeof raw.fps === 'number' && raw.fps > 0 ? raw.fps : 60,
    rootFrame: {
      id: raw.rootFrame?.id || 'root-frame',
      name: raw.rootFrame?.name || 'Canvas',
      type: 'frame',
      visible: raw.rootFrame?.visible ?? true,
      locked: raw.rootFrame?.locked ?? false,
      clipContent: raw.rootFrame?.clipContent ?? true,
      canvasBg: raw.rootFrame?.canvasBg || '#ffffff',
      x: raw.rootFrame?.x ?? 0,
      y: raw.rootFrame?.y ?? 0,
      width: raw.rootFrame?.width || 800,
      height: raw.rootFrame?.height || 600,
      rotation: raw.rootFrame?.rotation || 0,
      scaleX: raw.rootFrame?.scaleX ?? 1,
      scaleY: raw.rootFrame?.scaleY ?? 1,
      opacity: raw.rootFrame?.opacity ?? 1,
      borderRadius: raw.rootFrame?.borderRadius || 0,
      fill: raw.rootFrame?.fill || '#ffffff',
      tracks: raw.rootFrame?.tracks || []
    },
    nodes: {},
    nodeOrder: Array.isArray(raw.nodeOrder) ? [...raw.nodeOrder] : []
  };

  if (raw.nodes && typeof raw.nodes === 'object') {
    for (const [id, node] of Object.entries(raw.nodes)) {
      if (!node || typeof node !== 'object') continue;
      const n = node as any;

      const migratedNode: SceneNode = {
        id: n.id || id,
        name: n.name || `Layer ${id}`,
        type: n.type || 'rect',
        visible: n.visible ?? true,
        locked: n.locked ?? false,
        x: typeof n.x === 'number' ? n.x : 0,
        y: typeof n.y === 'number' ? n.y : 0,
        width: typeof n.width === 'number' ? n.width : 100,
        height: typeof n.height === 'number' ? n.height : 100,
        rotation: typeof n.rotation === 'number' ? n.rotation : 0,
        scaleX: typeof n.scaleX === 'number' ? n.scaleX : 1,
        scaleY: typeof n.scaleY === 'number' ? n.scaleY : 1,
        opacity: typeof n.opacity === 'number' ? n.opacity : 1,
        borderRadius: typeof n.borderRadius === 'number' ? n.borderRadius : 0,
        fill: n.fill || '#3b82f6',
        stroke: n.stroke,
        strokeWidth: n.strokeWidth,
        pivotX: typeof n.pivotX === 'number' ? n.pivotX : 0.5,
        pivotY: typeof n.pivotY === 'number' ? n.pivotY : 0.5,
        parentId: n.parentId,
        tracks: Array.isArray(n.tracks) ? n.tracks : [],
        pathPoints: Array.isArray(n.pathPoints) ? n.pathPoints : undefined,
        subPaths: Array.isArray(n.subPaths) ? n.subPaths : undefined,
        fillRule: n.fillRule || 'nonzero',
        maskMode: n.maskMode,
        maskTargetId: n.maskTargetId,
        isMask: n.isMask
      };

      proj.nodes[migratedNode.id] = migratedNode;
    }
  }

  // Ensure nodeOrder matches valid existing nodes
  proj.nodeOrder = proj.nodeOrder.filter((id) => !!proj.nodes[id]);

  return proj;
}

/**
 * Validates document integrity and referential correctness (Rule CORE-11)
 */
export function validateProject(project: SceneProject): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!project.id) errors.push('Project must have an id.');
  if (!project.rootFrame || project.rootFrame.width <= 0 || project.rootFrame.height <= 0) {
    errors.push('Project root frame has invalid dimensions.');
  }

  const nodeKeys = new Set(Object.keys(project.nodes || {}));

  // Validate node order
  for (const id of project.nodeOrder || []) {
    if (!nodeKeys.has(id)) {
      errors.push(`nodeOrder references missing node ID: ${id}`);
    }
  }

  // Validate node parent references
  for (const [id, node] of Object.entries(project.nodes || {})) {
    if (node.parentId && !nodeKeys.has(node.parentId)) {
      warnings.push(`Node ${id} references non-existent parent ${node.parentId}`);
    }

    // Validate keyframes ordering
    if (node.tracks) {
      for (const track of node.tracks) {
        let lastTime = -1;
        for (const kf of track.keyframes) {
          if (kf.time < 0) {
            errors.push(`Node ${id} track ${track.property} has keyframe with negative time ${kf.time}`);
          }
          if (kf.time < lastTime) {
            warnings.push(`Node ${id} track ${track.property} keyframes are not strictly sorted by time`);
          }
          lastTime = kf.time;
        }
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
 * Serializes project with embedded integrity checksum header
 */
export function serializeProject(project: SceneProject): string {
  const checksum = computeProjectChecksum(project);
  const payload = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    checksum,
    project
  };
  return JSON.stringify(payload, null, 2);
}
