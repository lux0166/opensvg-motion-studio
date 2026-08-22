import { SceneNode } from './types';

/**
 * Geometric Alignment & Equal Spacing Distribution Engine
 * Adheres strictly to OpenSVG Feature Engineering Rules G9 & G10
 */

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionDirection = 'horizontal' | 'vertical';

export interface NodePositionUpdate {
  id: string;
  x?: number;
  y?: number;
}

/**
 * Aligns selected nodes along the specified axis (Rule G9)
 */
export function alignNodes(
  nodes: Record<string, SceneNode>,
  selectedIds: string[],
  type: AlignmentType
): NodePositionUpdate[] {
  if (selectedIds.length < 2) return [];

  const targets = selectedIds.map((id) => nodes[id]).filter(Boolean);
  if (targets.length < 2) return [];

  let targetVal = 0;

  if (type === 'left') {
    targetVal = Math.min(...targets.map((n) => n.x));
    return targets.map((n) => ({ id: n.id, x: targetVal }));
  } else if (type === 'right') {
    targetVal = Math.max(...targets.map((n) => n.x + n.width));
    return targets.map((n) => ({ id: n.id, x: targetVal - n.width }));
  } else if (type === 'center') {
    const minX = Math.min(...targets.map((n) => n.x));
    const maxX = Math.max(...targets.map((n) => n.x + n.width));
    const midX = (minX + maxX) / 2;
    return targets.map((n) => ({ id: n.id, x: parseFloat((midX - n.width / 2).toFixed(2)) }));
  } else if (type === 'top') {
    targetVal = Math.min(...targets.map((n) => n.y));
    return targets.map((n) => ({ id: n.id, y: targetVal }));
  } else if (type === 'bottom') {
    targetVal = Math.max(...targets.map((n) => n.y + n.height));
    return targets.map((n) => ({ id: n.id, y: targetVal - n.height }));
  } else if (type === 'middle') {
    const minY = Math.min(...targets.map((n) => n.y));
    const maxY = Math.max(...targets.map((n) => n.y + n.height));
    const midY = (minY + maxY) / 2;
    return targets.map((n) => ({ id: n.id, y: parseFloat((midY - n.height / 2).toFixed(2)) }));
  }

  return [];
}

/**
 * Distributes spacing evenly between adjacent bounding box edges (Rule G10)
 */
export function distributeSpacing(
  nodes: Record<string, SceneNode>,
  selectedIds: string[],
  direction: DistributionDirection
): NodePositionUpdate[] {
  if (selectedIds.length < 3) return [];

  const targets = selectedIds.map((id) => nodes[id]).filter(Boolean);
  if (targets.length < 3) return [];

  if (direction === 'horizontal') {
    // Sort by ascending X coordinate
    const sorted = [...targets].sort((a, b) => a.x - b.x);
    const minX = sorted[0].x;
    const maxX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
    const totalSpan = maxX - minX;

    const totalItemWidths = sorted.reduce((sum, n) => sum + n.width, 0);
    const availableGapSpace = totalSpan - totalItemWidths;
    const gap = availableGapSpace / (sorted.length - 1);

    const updates: NodePositionUpdate[] = [];
    let currentX = minX;

    for (let i = 0; i < sorted.length; i++) {
      const node = sorted[i];
      if (i > 0 && i < sorted.length - 1) {
        updates.push({ id: node.id, x: parseFloat(currentX.toFixed(2)) });
      }
      currentX += node.width + gap;
    }

    return updates;
  } else {
    // Sort by ascending Y coordinate
    const sorted = [...targets].sort((a, b) => a.y - b.y);
    const minY = sorted[0].y;
    const maxY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
    const totalSpan = maxY - minY;

    const totalItemHeights = sorted.reduce((sum, n) => sum + n.height, 0);
    const availableGapSpace = totalSpan - totalItemHeights;
    const gap = availableGapSpace / (sorted.length - 1);

    const updates: NodePositionUpdate[] = [];
    let currentY = minY;

    for (let i = 0; i < sorted.length; i++) {
      const node = sorted[i];
      if (i > 0 && i < sorted.length - 1) {
        updates.push({ id: node.id, y: parseFloat(currentY.toFixed(2)) });
      }
      currentY += node.height + gap;
    }

    return updates;
  }
}
