import { BezierPoint } from './types';

/**
 * Geometric Vector Vertex Manipulation Engine
 * Adheres strictly to OpenSVG Feature Engineering Rules G4 & G5
 */

/**
 * Calculates Euclidean distance between two 2D points
 */
export function pointDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates angle from (x1, y1) to (x2, y2) in radians
 */
export function pointAngle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Updates a tangent handle position on a Bezier vertex point while enforcing
 * geometric continuity invariants for Corner, Smooth, and Asymmetric types (Rule G4 & G5).
 */
export function updateVertexTangent(
  point: BezierPoint,
  handle: 'cp1' | 'cp2',
  newX: number,
  newY: number
): BezierPoint {
  const updated: BezierPoint = { ...point };
  const mode = point.pointType || 'smooth';

  if (handle === 'cp1') {
    updated.cp1x = newX;
    updated.cp1y = newY;

    // Enforce opposite handle continuity (Rule G5)
    if (mode === 'smooth' || mode === 'asymmetric') {
      const angle = pointAngle(point.x, point.y, newX, newY);
      const oppositeAngle = angle + Math.PI;

      let oppositeDist = 40;
      if (point.cp2x !== undefined && point.cp2y !== undefined) {
        oppositeDist = mode === 'smooth'
          ? pointDistance(point.x, point.y, newX, newY) // Symmetric equal magnitude
          : pointDistance(point.x, point.y, point.cp2x, point.cp2y); // Asymmetric independent magnitude
      } else {
        oppositeDist = pointDistance(point.x, point.y, newX, newY);
      }

      updated.cp2x = parseFloat((point.x + Math.cos(oppositeAngle) * oppositeDist).toFixed(4));
      updated.cp2y = parseFloat((point.y + Math.sin(oppositeAngle) * oppositeDist).toFixed(4));
    }
  } else if (handle === 'cp2') {
    updated.cp2x = newX;
    updated.cp2y = newY;

    // Enforce opposite handle continuity (Rule G5)
    if (mode === 'smooth' || mode === 'asymmetric') {
      const angle = pointAngle(point.x, point.y, newX, newY);
      const oppositeAngle = angle + Math.PI;

      let oppositeDist = 40;
      if (point.cp1x !== undefined && point.cp1y !== undefined) {
        oppositeDist = mode === 'smooth'
          ? pointDistance(point.x, point.y, newX, newY) // Symmetric equal magnitude
          : pointDistance(point.x, point.y, point.cp1x, point.cp1y); // Asymmetric independent magnitude
      } else {
        oppositeDist = pointDistance(point.x, point.y, newX, newY);
      }

      updated.cp1x = parseFloat((point.x + Math.cos(oppositeAngle) * oppositeDist).toFixed(4));
      updated.cp1y = parseFloat((point.y + Math.sin(oppositeAngle) * oppositeDist).toFixed(4));
    }
  }

  return updated;
}

/**
 * Converts a vertex point to a specific type (Corner, Smooth, Asymmetric)
 */
export function setVertexPointType(
  point: BezierPoint,
  targetType: 'corner' | 'smooth' | 'asymmetric',
  defaultHandleDistance: number = 30
): BezierPoint {
  const result: BezierPoint = { ...point, pointType: targetType };

  if (targetType === 'corner') {
    // Corner points have no tangent handles by default unless explicitly pulled
    delete result.cp1x;
    delete result.cp1y;
    delete result.cp2x;
    delete result.cp2y;
  } else if (targetType === 'smooth' || targetType === 'asymmetric') {
    // Generate collinear symmetric handles if none existed
    if (result.cp1x === undefined || result.cp1y === undefined) {
      result.cp1x = result.x - defaultHandleDistance;
      result.cp1y = result.y;
    }
    if (result.cp2x === undefined || result.cp2y === undefined) {
      result.cp2x = result.x + defaultHandleDistance;
      result.cp2y = result.y;
    }
    if (targetType === 'smooth') {
      // Symmetrize
      const dist = pointDistance(result.x, result.y, result.cp1x, result.cp1y);
      const angle = pointAngle(result.x, result.y, result.cp1x, result.cp1y);
      result.cp2x = result.x - Math.cos(angle) * dist;
      result.cp2y = result.y - Math.sin(angle) * dist;
    }
  }

  return result;
}
