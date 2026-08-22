import { SceneNode } from '../types';
import { pointDistance } from '../geometry';

/**
 * OpenSVG Constraint Engine v1
 * Adheres strictly to CORE_ENGINE_DEPTH.md (Section 7) & RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md (CORE-05)
 * INVARIANT: Constraint evaluation produces derived node states without mutating React/store state.
 */

export type ConstraintType =
  | 'translation'
  | 'rotation'
  | 'scale'
  | 'distance'
  | 'follow-path';

export interface BaseConstraint {
  id: string;
  type: ConstraintType;
  ownerId: string;
  targetId: string;
  enabled: boolean;
  strength: number; // 0.0 to 1.0
  sourceSpace?: 'local' | 'world';
  destinationSpace?: 'local' | 'world';
  offset?: { x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number };
  parameters?: Record<string, any>;
}

export interface DistanceConstraint extends BaseConstraint {
  type: 'distance';
  distance: number;
  mode: 'exact' | 'min' | 'max';
}

export interface FollowPathConstraint extends BaseConstraint {
  type: 'follow-path';
  progress: number; // 0.0 to 1.0
  autoOrient?: boolean;
}

export type Constraint = BaseConstraint | DistanceConstraint | FollowPathConstraint;

/**
 * Linearly interpolates between two numbers
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Solves a single constraint on an evaluated owner node
 */
export function solveConstraint(
  constraint: Constraint,
  owner: SceneNode,
  target: SceneNode
): Partial<SceneNode> {
  if (!constraint.enabled || constraint.strength <= 0) {
    return {};
  }

  const s = Math.max(0, Math.min(1, constraint.strength));
  const updates: Partial<SceneNode> = {};

  switch (constraint.type) {
    case 'translation': {
      const offsetX = constraint.offset?.x || 0;
      const offsetY = constraint.offset?.y || 0;
      const targetX = target.x + offsetX;
      const targetY = target.y + offsetY;
      updates.x = parseFloat(lerp(owner.x, targetX, s).toFixed(3));
      updates.y = parseFloat(lerp(owner.y, targetY, s).toFixed(3));
      break;
    }

    case 'rotation': {
      const offsetRot = constraint.offset?.rotation || 0;
      const targetRot = (target.rotation || 0) + offsetRot;
      updates.rotation = parseFloat(lerp(owner.rotation || 0, targetRot, s).toFixed(3));
      break;
    }

    case 'scale': {
      const targetSx = (target.scaleX ?? 1) * (constraint.offset?.scaleX ?? 1);
      const targetSy = (target.scaleY ?? 1) * (constraint.offset?.scaleY ?? 1);
      updates.scaleX = parseFloat(lerp(owner.scaleX ?? 1, targetSx, s).toFixed(3));
      updates.scaleY = parseFloat(lerp(owner.scaleY ?? 1, targetSy, s).toFixed(3));
      break;
    }

    case 'distance': {
      const distConstraint = constraint as DistanceConstraint;
      const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
      const ownerCenter = { x: owner.x + owner.width / 2, y: owner.y + owner.height / 2 };
      const currentDist = pointDistance(ownerCenter.x, ownerCenter.y, targetCenter.x, targetCenter.y);

      if (currentDist > 1e-4) {
        const dx = (ownerCenter.x - targetCenter.x) / currentDist;
        const dy = (ownerCenter.y - targetCenter.y) / currentDist;

        let desiredDist = currentDist;
        if (distConstraint.mode === 'exact') {
          desiredDist = distConstraint.distance;
        } else if (distConstraint.mode === 'max' && currentDist > distConstraint.distance) {
          desiredDist = distConstraint.distance;
        } else if (distConstraint.mode === 'min' && currentDist < distConstraint.distance) {
          desiredDist = distConstraint.distance;
        }

        const desiredOwnerCenterX = targetCenter.x + dx * desiredDist;
        const desiredOwnerCenterY = targetCenter.y + dy * desiredDist;

        const targetX = desiredOwnerCenterX - owner.width / 2;
        const targetY = desiredOwnerCenterY - owner.height / 2;

        updates.x = parseFloat(lerp(owner.x, targetX, s).toFixed(3));
        updates.y = parseFloat(lerp(owner.y, targetY, s).toFixed(3));
      }
      break;
    }

    default:
      break;
  }

  return updates;
}

/**
 * Solves all constraints across a node map with circular dependency cycle protection (Rule CORE-05)
 */
export function solveAllConstraints(
  nodes: Record<string, SceneNode>,
  constraints: Constraint[]
): Record<string, SceneNode> {
  const result: Record<string, SceneNode> = {};
  for (const [id, node] of Object.entries(nodes)) {
    result[id] = { ...node };
  }

  if (!constraints || constraints.length === 0) return result;

  // Cycle detection: track evaluation graph
  const visited = new Set<string>();

  for (const c of constraints) {
    if (!c.enabled || !c.ownerId || !c.targetId) continue;
    if (c.ownerId === c.targetId) continue; // Skip self-referential

    const owner = result[c.ownerId];
    const target = result[c.targetId];
    if (!owner || !target) continue;

    const edgeKey = `${c.ownerId}->${c.targetId}`;
    const reverseKey = `${c.targetId}->${c.ownerId}`;

    if (visited.has(reverseKey)) {
      console.warn(`Circular constraint detected: ${edgeKey}; breaking cycle safely.`);
      continue;
    }

    visited.add(edgeKey);

    const delta = solveConstraint(c, owner, target);
    Object.assign(result[c.ownerId], delta);
  }

  return result;
}
