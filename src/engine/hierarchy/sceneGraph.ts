import { SceneNode } from '../types';

/**
 * Canonical Scene Graph Hierarchy Selector
 * Single source of truth for parent-child relations across Studio UI (Layers, Canvas, Evaluator).
 * Eliminates duplicate traversals and out-of-sync childrenIds vs parentId representations.
 */
export function getNodeChildren(
  nodeId: string,
  nodes: Record<string, SceneNode>,
  nodeOrder: string[]
): string[] {
  const node = nodes[nodeId];
  if (!node) return [];

  // Primary canonical source: parentId matching in ordered scene nodes
  const childrenFromParentId = nodeOrder.filter((id) => nodes[id]?.parentId === nodeId);
  if (childrenFromParentId.length > 0) {
    return childrenFromParentId;
  }

  // Fallback: declared childrenIds if present and valid
  if (node.childrenIds && node.childrenIds.length > 0) {
    return node.childrenIds.filter((cid) => nodes[cid]);
  }

  return [];
}

/**
 * Retrieves all top-level node IDs (nodes without a parentId)
 */
export function getTopLevelNodes(
  nodes: Record<string, SceneNode>,
  nodeOrder: string[]
): string[] {
  return nodeOrder.filter((id) => !nodes[id]?.parentId);
}
