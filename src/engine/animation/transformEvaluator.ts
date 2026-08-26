import { SceneNode } from '../types';
import { evaluateTrack } from './trackEvaluator';

export interface EvaluatedTransformProperties {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  borderRadius: number;
  pivotX: number;
  pivotY: number;
}

/**
 * Evaluates all transform & spatial properties of a node at timestamp t.
 */
export function evaluateNodeTransform(node: SceneNode, time: number): EvaluatedTransformProperties {
  const result: EvaluatedTransformProperties = {
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation || 0,
    scaleX: node.scaleX ?? 1,
    scaleY: node.scaleY ?? 1,
    opacity: node.opacity ?? 1,
    borderRadius: node.borderRadius || 0,
    pivotX: node.pivotX ?? 0.5,
    pivotY: node.pivotY ?? 0.5
  };

  if (!node.tracks || node.tracks.length === 0) {
    return result;
  }

  for (const track of node.tracks) {
    const prop = track.property as keyof EvaluatedTransformProperties;
    if (prop in result) {
      result[prop] = evaluateTrack(track, time, result[prop]);
    }
  }

  return result;
}
