import { SceneNode } from './types';

/**
 * Layer Hierarchy and Transform Matrix Inheritance Engine
 * Adheres strictly to OpenSVG Feature Engineering Rules L4 & L5
 */

export interface WorldTransform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
}

/**
 * Computes the derived world transform of a node by walking up its parent chain.
 * Multiplies opacity and concatenates positions, rotations, and scales (Rule L4 & L5).
 * Includes cycle detection to prevent infinite recursion.
 */
export function computeWorldTransform(
  node: SceneNode,
  nodes: Record<string, SceneNode>,
  maxDepth: number = 20
): WorldTransform {
  let cur: SceneNode | undefined = node;
  let totalX = node.x;
  let totalY = node.y;
  let totalRot = node.rotation || 0;
  let totalScaleX = node.scaleX !== undefined ? node.scaleX : 1;
  let totalScaleY = node.scaleY !== undefined ? node.scaleY : 1;
  let totalOpacity = node.opacity !== undefined ? node.opacity : 1;

  const visited = new Set<string>();
  let depth = 0;

  while (cur && cur.parentId && depth < maxDepth) {
    if (visited.has(cur.id)) {
      console.warn(`Cycle detected in node hierarchy for node ${cur.id}`);
      break;
    }
    visited.add(cur.id);

    const parent: SceneNode | undefined = nodes[cur.parentId];
    if (!parent) break;

    // Accumulate parent transformations
    totalOpacity *= parent.opacity !== undefined ? parent.opacity : 1;
    totalRot += parent.rotation || 0;
    totalScaleX *= parent.scaleX !== undefined ? parent.scaleX : 1;
    totalScaleY *= parent.scaleY !== undefined ? parent.scaleY : 1;

    // Rotate local position around parent origin if parent is rotated
    const rad = ((parent.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rotatedLocalX = totalX * (parent.scaleX ?? 1) * cos - totalY * (parent.scaleY ?? 1) * sin;
    const rotatedLocalY = totalX * (parent.scaleX ?? 1) * sin + totalY * (parent.scaleY ?? 1) * cos;

    totalX = parent.x + rotatedLocalX;
    totalY = parent.y + rotatedLocalY;

    cur = parent;
    depth++;
  }

  return {
    x: parseFloat(totalX.toFixed(3)),
    y: parseFloat(totalY.toFixed(3)),
    rotation: parseFloat((totalRot % 360).toFixed(3)),
    scaleX: parseFloat(totalScaleX.toFixed(3)),
    scaleY: parseFloat(totalScaleY.toFixed(3)),
    opacity: parseFloat(Math.max(0, Math.min(1, totalOpacity)).toFixed(3))
  };
}

/**
 * Returns all direct and indirect children IDs of a parent node
 */
export function getDescendantNodeIds(
  parentId: string,
  nodes: Record<string, SceneNode>
): string[] {
  const result: string[] = [];
  const queue = [parentId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const id in nodes) {
      if (nodes[id].parentId === currentId && !result.includes(id)) {
        result.push(id);
        queue.push(id);
      }
    }
  }

  return result;
}
