import { FrameNode, SceneNode } from './types';

export interface StudioSnapshot {
  rootFrame: FrameNode;
  nodes: Record<string, SceneNode>;
  nodeOrder: string[];
  timestamp: number;
}

export const MAX_HISTORY_STEPS = 50;

/**
 * Creates an immutable snapshot of the canonical document model for undo/redo.
 * Strictly separates Document State from Ephemeral UI Selection State (Constitution Rule 82).
 */
export function createStudioSnapshot(
  rootFrame: FrameNode,
  nodes: Record<string, SceneNode>,
  nodeOrder: string[]
): StudioSnapshot {
  return {
    rootFrame: JSON.parse(JSON.stringify(rootFrame)),
    nodes: JSON.parse(JSON.stringify(nodes)),
    nodeOrder: [...nodeOrder],
    timestamp: Date.now()
  };
}
