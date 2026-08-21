import { FrameNode, SceneNode } from './types';

export interface StudioSnapshot {
  rootFrame: FrameNode;
  nodes: Record<string, SceneNode>;
  nodeOrder: string[];
  selectedId: string | null;
  timestamp: number;
}

export const MAX_HISTORY_STEPS = 50;

/**
 * Deep clones scene graph objects to prevent reference leaks in history stack
 */
export function createStudioSnapshot(
  rootFrame: FrameNode,
  nodes: Record<string, SceneNode>,
  nodeOrder: string[],
  selectedId: string | null
): StudioSnapshot {
  return {
    rootFrame: JSON.parse(JSON.stringify(rootFrame)),
    nodes: JSON.parse(JSON.stringify(nodes)),
    nodeOrder: [...nodeOrder],
    selectedId,
    timestamp: Date.now()
  };
}
