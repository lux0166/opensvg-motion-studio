import { FrameNode, SceneNode } from './types';

export interface SnapLine {
  type: 'x' | 'y';
  value: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SnapResult {
  x: number;
  y: number;
  snapLines: SnapLine[];
}

const SNAP_THRESHOLD = 6; // px threshold

export function computeSnapping(
  draggingNodeId: string,
  targetX: number,
  targetY: number,
  width: number,
  height: number,
  rootFrame: FrameNode,
  otherNodes: SceneNode[]
): SnapResult {
  let snappedX = targetX;
  let snappedY = targetY;
  const snapLines: SnapLine[] = [];

  const dragCenterX = targetX + width / 2;
  const dragRightX = targetX + width;

  const dragCenterY = targetY + height / 2;
  const dragBottomY = targetY + height;

  // Potential X Targets (Canvas left, center, right + Other nodes)
  const xTargets: number[] = [0, rootFrame.width / 2, rootFrame.width];
  // Potential Y Targets (Canvas top, center, bottom + Other nodes)
  const yTargets: number[] = [0, rootFrame.height / 2, rootFrame.height];

  for (const node of otherNodes) {
    if (node.id === draggingNodeId || !node.visible) continue;
    xTargets.push(node.x, node.x + node.width / 2, node.x + node.width);
    yTargets.push(node.y, node.y + node.height / 2, node.y + node.height);
  }

  // Check X Snapping
  for (const target of xTargets) {
    // 1. Left to target
    if (Math.abs(targetX - target) < SNAP_THRESHOLD) {
      snappedX = target;
      snapLines.push({
        type: 'x',
        value: target,
        x1: target,
        y1: 0,
        x2: target,
        y2: rootFrame.height
      });
      break;
    }
    // 2. Center to target
    if (Math.abs(dragCenterX - target) < SNAP_THRESHOLD) {
      snappedX = target - width / 2;
      snapLines.push({
        type: 'x',
        value: target,
        x1: target,
        y1: 0,
        x2: target,
        y2: rootFrame.height
      });
      break;
    }
    // 3. Right to target
    if (Math.abs(dragRightX - target) < SNAP_THRESHOLD) {
      snappedX = target - width;
      snapLines.push({
        type: 'x',
        value: target,
        x1: target,
        y1: 0,
        x2: target,
        y2: rootFrame.height
      });
      break;
    }
  }

  // Check Y Snapping
  for (const target of yTargets) {
    // 1. Top to target
    if (Math.abs(targetY - target) < SNAP_THRESHOLD) {
      snappedY = target;
      snapLines.push({
        type: 'y',
        value: target,
        x1: 0,
        y1: target,
        x2: rootFrame.width,
        y2: target
      });
      break;
    }
    // 2. Center to target
    if (Math.abs(dragCenterY - target) < SNAP_THRESHOLD) {
      snappedY = target - height / 2;
      snapLines.push({
        type: 'y',
        value: target,
        x1: 0,
        y1: target,
        x2: rootFrame.width,
        y2: target
      });
      break;
    }
    // 3. Bottom to target
    if (Math.abs(dragBottomY - target) < SNAP_THRESHOLD) {
      snappedY = target - height;
      snapLines.push({
        type: 'y',
        value: target,
        x1: 0,
        y1: target,
        x2: rootFrame.width,
        y2: target
      });
      break;
    }
  }

  return {
    x: Math.round(snappedX),
    y: Math.round(snappedY),
    snapLines
  };
}
