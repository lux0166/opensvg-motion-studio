import { BezierPoint } from './types';
import { pointDistance, pointAngle } from './geometry';

/**
 * Pen Tool Ephemeral Preview and Tangent Angle Snapping Engine
 * Adheres strictly to OpenSVG Feature Engineering Rules G6, G7, G8
 */

export interface PenPreviewResult {
  previewPoints: BezierPoint[];
  isClosed: boolean;
  snappedCursor: { x: number; y: number };
}

/**
 * Snaps angle to nearest standard increment (0, 45, 90, 135, 180, etc.) in radians
 */
export function snapAngleToCardinal(angleRad: number, stepDeg: number = 45): number {
  const stepRad = (stepDeg * Math.PI) / 180;
  return Math.round(angleRad / stepRad) * stepRad;
}

/**
 * Generates an ephemeral preview path from existing points to current pointer position (Rule G6).
 * Does NOT mutate or commit to canonical document until finalized.
 */
export function computePenPreview(
  points: BezierPoint[],
  cursor: { x: number; y: number },
  snapToAngle: boolean = false,
  closeThreshold: number = 10
): PenPreviewResult {
  if (!points || points.length === 0) {
    return {
      previewPoints: [{ x: cursor.x, y: cursor.y, type: 'move' }],
      isClosed: false,
      snappedCursor: cursor
    };
  }

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  let targetX = cursor.x;
  let targetY = cursor.y;

  // Check if cursor is hovering near the first point to close the path
  const distToFirst = pointDistance(targetX, targetY, firstPoint.x, firstPoint.y);
  if (points.length >= 3 && distToFirst <= closeThreshold) {
    return {
      previewPoints: [...points, { x: firstPoint.x, y: firstPoint.y, type: 'close' }],
      isClosed: true,
      snappedCursor: { x: firstPoint.x, y: firstPoint.y }
    };
  }

  // Apply tangent angle snapping (e.g. holding Shift) (Rule G8)
  if (snapToAngle) {
    const rawAngle = pointAngle(lastPoint.x, lastPoint.y, cursor.x, cursor.y);
    const snappedAngle = snapAngleToCardinal(rawAngle, 45);
    const dist = pointDistance(lastPoint.x, lastPoint.y, cursor.x, cursor.y);
    targetX = lastPoint.x + Math.cos(snappedAngle) * dist;
    targetY = lastPoint.y + Math.sin(snappedAngle) * dist;
  }

  const newSegment: BezierPoint = {
    x: parseFloat(targetX.toFixed(2)),
    y: parseFloat(targetY.toFixed(2)),
    type: 'line'
  };

  return {
    previewPoints: [...points, newSegment],
    isClosed: false,
    snappedCursor: { x: parseFloat(targetX.toFixed(2)), y: parseFloat(targetY.toFixed(2)) }
  };
}
