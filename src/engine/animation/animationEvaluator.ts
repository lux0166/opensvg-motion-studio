import { SceneNode } from '../types';
import { evaluateTrack } from './trackEvaluator';
import { evaluateMotionPath } from '../motionPath';

/**
 * Evaluates animated state of a scene node at timestamp t
 * (Supports Motion Path & Auto-Orientation when linked to a Path node)
 */
export function evaluateNode(
  node: SceneNode,
  time: number,
  allNodes?: Record<string, SceneNode>
): SceneNode {
  const evaluated: SceneNode = { ...node };

  if (node.tracks && node.tracks.length > 0) {
    for (const track of node.tracks) {
      const val = evaluateTrack(track, time, (node as any)[track.property]);
      (evaluated as any)[track.property] = val;
    }
  }

  // Evaluate Motion Path Trajectory & Auto-Orientation
  if (node.motionPath && node.motionPath.pathNodeId && allNodes) {
    const targetPath = allNodes[node.motionPath.pathNodeId];
    if (targetPath && targetPath.pathPoints && targetPath.pathPoints.length > 0) {
      const progress = (evaluated as any).motionPathProgress ?? node.motionPath.progress;
      const motion = evaluateMotionPath(targetPath.pathPoints, progress, (targetPath as any).closed);

      evaluated.x = motion.x - node.width / 2;
      evaluated.y = motion.y - node.height / 2;

      if (node.motionPath.autoOrient) {
        evaluated.rotation = motion.angle + (node.motionPath.offsetAngle || 0);
      }
    }
  }

  return evaluated;
}

/**
 * Evaluates an entire list of scene nodes at timestamp t
 */
export function evaluateSceneNodes(
  nodes: SceneNode[],
  time: number
): SceneNode[] {
  const allNodesMap: Record<string, SceneNode> = {};
  for (const n of nodes) {
    allNodesMap[n.id] = n;
  }

  return nodes.map((node) => evaluateNode(node, time, allNodesMap));
}
