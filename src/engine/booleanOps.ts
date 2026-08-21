import { SceneNode, BezierPoint } from './types';

export type BooleanOpType = 'union' | 'subtract' | 'intersect' | 'exclude';

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Converts any SceneNode into a sampled 2D polygon boundary.
 */
export function nodeToPolygon(node: SceneNode, sampleCount = 32): Point2D[] {
  if (node.type === 'circle') {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const rx = node.width / 2;
    const ry = node.height / 2;
    const points: Point2D[] = [];
    for (let i = 0; i < sampleCount; i++) {
      const angle = (i / sampleCount) * Math.PI * 2;
      points.push({
        x: parseFloat((cx + Math.cos(angle) * rx).toFixed(2)),
        y: parseFloat((cy + Math.sin(angle) * ry).toFixed(2))
      });
    }
    return points;
  }

  if (node.type === 'path' && node.pathPoints && node.pathPoints.length > 0) {
    return node.pathPoints.map((p) => ({ x: p.x, y: p.y }));
  }

  // Default Rect / Frame
  return [
    { x: node.x, y: node.y },
    { x: node.x + node.width, y: node.y },
    { x: node.x + node.width, y: node.y + node.height },
    { x: node.x, y: node.y + node.height }
  ];
}

/**
 * Tests if point is inside a polygon using ray casting.
 */
export function isPointInPolygon(point: Point2D, poly: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;

    const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Clips subject polygon against convex clip polygon (Sutherland-Hodgman algorithm).
 */
export function clipPolygon(subjectPoly: Point2D[], clipPoly: Point2D[]): Point2D[] {
  let outputList = subjectPoly;

  for (let j = 0; j < clipPoly.length; j++) {
    const edgeStart = clipPoly[j];
    const edgeEnd = clipPoly[(j + 1) % clipPoly.length];
    const inputList = outputList;
    outputList = [];

    if (inputList.length === 0) break;

    let s = inputList[inputList.length - 1];

    for (let i = 0; i < inputList.length; i++) {
      const e = inputList[i];

      const isInside = (p: Point2D) =>
        (edgeEnd.x - edgeStart.x) * (p.y - edgeStart.y) - (edgeEnd.y - edgeStart.y) * (p.x - edgeStart.x) >= 0;

      if (isInside(e)) {
        if (isInside(s)) {
          outputList.push(e);
        } else {
          // Compute intersection
          const dc = { x: edgeStart.x - edgeEnd.x, y: edgeStart.y - edgeEnd.y };
          const dp = { x: s.x - e.x, y: s.y - e.y };
          const n1 = edgeStart.x * edgeEnd.y - edgeStart.y * edgeEnd.x;
          const n2 = s.x * e.y - s.y * e.x;
          const denom = dc.x * dp.y - dc.y * dp.x;
          if (denom !== 0) {
            outputList.push({
              x: parseFloat(((n1 * dp.x - n2 * dc.x) / denom).toFixed(2)),
              y: parseFloat(((n1 * dp.y - n2 * dc.y) / denom).toFixed(2))
            });
          }
          outputList.push(e);
        }
      } else if (isInside(s)) {
        const dc = { x: edgeStart.x - edgeEnd.x, y: edgeStart.y - edgeEnd.y };
        const dp = { x: s.x - e.x, y: s.y - e.y };
        const n1 = edgeStart.x * edgeEnd.y - edgeStart.y * edgeEnd.x;
        const n2 = s.x * e.y - s.y * e.x;
        const denom = dc.x * dp.y - dc.y * dp.x;
        if (denom !== 0) {
          outputList.push({
            x: parseFloat(((n1 * dp.x - n2 * dc.x) / denom).toFixed(2)),
            y: parseFloat(((n1 * dp.y - n2 * dc.y) / denom).toFixed(2))
          });
        }
      }
      s = e;
    }
  }

  return outputList;
}

/**
 * Computes the 2D Convex Hull (Monotone Chain algorithm).
 */
export function computeConvexHull(points: Point2D[]): Point2D[] {
  if (points.length <= 3) return points;

  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const cross = (o: Point2D, a: Point2D, b: Point2D) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Point2D[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point2D[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Converts Point2D polygon points into BezierPoint array.
 */
export function pointsToBezierPoints(points: Point2D[]): BezierPoint[] {
  return points.map((p) => ({
    x: p.x,
    y: p.y,
    connected: false
  }));
}

/**
 * Executes a Boolean operation on a list of SceneNodes and returns a new compound Path node.
 */
export function executeBooleanOperation(
  nodes: SceneNode[],
  op: BooleanOpType,
  newId = `bool-${Date.now()}`
): SceneNode | null {
  if (!nodes || nodes.length < 2) return null;

  const baseNode = nodes[0];
  const polyA = nodeToPolygon(nodes[0]);
  const polyB = nodeToPolygon(nodes[1]);

  let resultPoints: Point2D[] = [];

  switch (op) {
    case 'union': {
      const allPoints = [...polyA, ...polyB];
      resultPoints = computeConvexHull(allPoints);
      break;
    }
    case 'intersect': {
      resultPoints = clipPolygon(polyA, polyB);
      if (resultPoints.length === 0) {
        resultPoints = clipPolygon(polyB, polyA);
      }
      break;
    }
    case 'subtract': {
      // Subtract B from A: keep points of A that are not inside B
      const retainedA = polyA.filter((p) => !isPointInPolygon(p, polyB));
      if (retainedA.length >= 3) {
        resultPoints = retainedA;
      } else {
        resultPoints = polyA.slice(0, 3);
      }
      break;
    }
    case 'exclude': {
      // Exclude: keep points of A not in B, and points of B not in A
      const ptsA = polyA.filter((p) => !isPointInPolygon(p, polyB));
      const ptsB = polyB.filter((p) => !isPointInPolygon(p, polyA));
      resultPoints = computeConvexHull([...ptsA, ...ptsB]);
      break;
    }
  }

  if (resultPoints.length < 3) {
    resultPoints = polyA;
  }

  // Calculate bounding box
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of resultPoints) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const width = Math.max(10, maxX - minX);
  const height = Math.max(10, maxY - minY);

  const compoundNode: SceneNode = {
    id: newId,
    name: `${op.toUpperCase()} Compound`,
    type: 'path',
    visible: true,
    locked: false,
    x: minX,
    y: minY,
    width,
    height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: baseNode.opacity ?? 1,
    borderRadius: 0,
    fill: baseNode.fill || '#3b82f6',
    stroke: baseNode.stroke,
    strokeWidth: baseNode.strokeWidth,
    pathPoints: pointsToBezierPoints(resultPoints),
    tracks: []
  };

  return compoundNode;
}
