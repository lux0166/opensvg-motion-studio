import { SceneNode } from './types';

/**
 * Layer Masking and Ephemeral Solo/Focus Render Isolation Engine
 * Adheres strictly to OpenSVG Feature Engineering Rules L1, L2, L3, L6
 */

/**
 * Filters nodes for viewport rendering based on ephemeral Solo / Isolation state (Rule L6).
 * Crucial invariant: Does NOT mutate node.visible inside the Canonical Document!
 */
export function getRenderableNodes(
  nodes: Record<string, SceneNode>,
  nodeOrder: string[],
  soloNodeId: string | null = null,
  isolationParentId: string | null = null
): SceneNode[] {
  const result: SceneNode[] = [];

  for (const id of nodeOrder) {
    const node = nodes[id];
    if (!node || !node.visible) continue;

    // Solo Mode: only render the soloed node and its children (Rule L6)
    if (soloNodeId) {
      if (node.id !== soloNodeId && node.parentId !== soloNodeId) {
        continue;
      }
    }

    // Isolation / Focus Mode: only render nodes within the isolated parent group
    if (isolationParentId) {
      if (node.id !== isolationParentId && node.parentId !== isolationParentId) {
        continue;
      }
    }

    result.push(node);
  }

  return result;
}

/**
 * Resolves mask pairings between mask source and target nodes (Rule L3)
 */
export function resolveMaskPairs(
  nodes: SceneNode[]
): { normalNodes: SceneNode[]; maskPairs: Array<{ mask: SceneNode; target: SceneNode; mode: 'alpha' | 'clip' }> } {
  const maskPairs: Array<{ mask: SceneNode; target: SceneNode; mode: 'alpha' | 'clip' }> = [];
  const maskNodeIds = new Set<string>();

  for (const node of nodes) {
    if (node.isMask && node.maskTargetId) {
      const target = nodes.find((n) => n.id === node.maskTargetId);
      if (target) {
        maskPairs.push({
          mask: node,
          target,
          mode: (node.maskMode === 'alpha' ? 'alpha' : 'clip') as 'alpha' | 'clip'
        });
        maskNodeIds.add(node.id);
        maskNodeIds.add(target.id);
      }
    }
  }

  const normalNodes = nodes.filter((n) => !maskNodeIds.has(n.id));
  return { normalNodes, maskPairs };
}
