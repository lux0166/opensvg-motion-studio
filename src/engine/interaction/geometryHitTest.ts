import { EvaluatedSceneState, EvaluatedNodeState } from '../runtime/evaluationPipeline';
import { SceneNode } from '../types';
import { Vec2, Matrix2D } from '../runtime/coreContracts';
import { invertMatrix, transformPoint } from '../transform/matrix2D';

export interface HitTestOptions {
  ignoreLocked?: boolean;
  ignoreInvisible?: boolean;
}

/**
 * Transforms screen coordinates from PointerEvent into canvas coordinate space
 */
export function screenToCanvasPoint(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
): Vec2 {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

/**
 * Converts canvas coordinates to internal scene coordinates
 */
export function canvasToScenePoint(
  canvasPoint: Vec2,
  sceneWidth: number,
  sceneHeight: number,
  canvas: HTMLCanvasElement
): Vec2 {
  const rect = canvas.getBoundingClientRect();
  const scaleX = sceneWidth / (rect.width || sceneWidth);
  const scaleY = sceneHeight / (rect.height || sceneHeight);

  return {
    x: canvasPoint.x * scaleX,
    y: canvasPoint.y * scaleY
  };
}

/**
 * Maps a scene-space point into a node's local coordinate system via inverse world matrix
 */
export function worldToLocalPoint(worldMatrix: Matrix2D, scenePoint: Vec2): Vec2 {
  const inv = invertMatrix(worldMatrix);
  return transformPoint(inv, scenePoint);
}

/**
 * Exact hit testing for rectangle geometry (including rounded corners)
 */
export function isPointInRect(
  localPoint: Vec2,
  width: number,
  height: number,
  borderRadius: number = 0
): boolean {
  const { x, y } = localPoint;
  if (x < 0 || x > width || y < 0 || y > height) return false;
  if (borderRadius <= 0) return true;

  const r = Math.min(borderRadius, width / 2, height / 2);

  // Check 4 corner cutouts
  if (x < r && y < r) {
    // Top-left
    return (x - r) * (x - r) + (y - r) * (y - r) <= r * r;
  }
  if (x > width - r && y < r) {
    // Top-right
    return (x - (width - r)) * (x - (width - r)) + (y - r) * (y - r) <= r * r;
  }
  if (x < r && y > height - r) {
    // Bottom-left
    return (x - r) * (x - r) + (y - (height - r)) * (y - (height - r)) <= r * r;
  }
  if (x > width - r && y > height - r) {
    // Bottom-right
    return (x - (width - r)) * (x - (width - r)) + (y - (height - r)) * (y - (height - r)) <= r * r;
  }

  return true;
}

/**
 * Exact hit testing for circle / ellipse geometry
 */
export function isPointInCircle(localPoint: Vec2, width: number, height: number): boolean {
  const rx = width / 2;
  const ry = height / 2;
  if (rx <= 0 || ry <= 0) return false;

  const dx = localPoint.x - rx;
  const dy = localPoint.y - ry;

  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.0;
}

/**
 * Ray-casting algorithm for polygon containment test
 */
export function isPointInPolygon(point: Vec2, polygonPoints: Vec2[]): boolean {
  let inside = false;
  const { x, y } = point;

  for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    const xi = polygonPoints[i].x;
    const yi = polygonPoints[i].y;
    const xj = polygonPoints[j].x;
    const yj = polygonPoints[j].y;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Hit test for bezier path points and compound sub-paths
 */
export function isPointInPathGeometry(
  localPoint: Vec2,
  pathPoints?: any[],
  subPaths?: any[][],
  fillRule: 'nonzero' | 'evenodd' = 'nonzero'
): boolean {
  const pathsToTest: any[][] = subPaths && subPaths.length > 0 ? subPaths : pathPoints ? [pathPoints] : [];
  if (pathsToTest.length === 0) return false;

  let totalCrossings = 0;

  for (const pts of pathsToTest) {
    if (!pts || pts.length < 3) continue;
    const poly: Vec2[] = pts.map((p) => ({ x: p.x, y: p.y }));
    if (isPointInPolygon(localPoint, poly)) {
      totalCrossings++;
    }
  }

  if (fillRule === 'evenodd') {
    return totalCrossings % 2 === 1;
  }

  return totalCrossings > 0;
}

/**
 * Evaluates whether a point in local coordinate space intersects a specific node geometry
 */
export function isPointInNodeGeometry(node: SceneNode, localPoint: Vec2): boolean {
  switch (node.type) {
    case 'circle':
      return isPointInCircle(localPoint, node.width, node.height);
    case 'rect':
    case 'frame':
      return isPointInRect(localPoint, node.width, node.height, node.borderRadius);
    case 'path':
      return isPointInPathGeometry(localPoint, node.pathPoints, node.subPaths, node.fillRule);
    case 'star':
    case 'polygon':
      if (node.pathPoints && node.pathPoints.length > 2) {
        return isPointInPolygon(localPoint, node.pathPoints);
      }
      return isPointInRect(localPoint, node.width, node.height, 0);
    case 'text':
    default:
      return isPointInRect(localPoint, node.width, node.height, 0);
  }
}

/**
 * Performs high-precision SVG geometry hit testing in Top-to-Bottom Z-Order
 * Standardized per OPENSVG_CURRENT_STRATEGIC_ROADMAP.md (Section 5)
 */
export function hitTestScene(
  sceneState: EvaluatedSceneState,
  scenePoint: Vec2,
  options: HitTestOptions = {}
): EvaluatedNodeState | null {
  const ignoreLocked = options.ignoreLocked ?? true;
  const ignoreInvisible = options.ignoreInvisible ?? true;

  // Evaluate top-down (reverse draw order)
  const order = [...sceneState.nodeOrder].reverse();

  for (const nodeId of order) {
    const nodeState = sceneState.nodeStates[nodeId];
    if (!nodeState) continue;

    const node = nodeState.evaluatedNode;
    if (ignoreInvisible && (!node.visible || nodeState.totalOpacity <= 0.001)) {
      continue;
    }
    if (ignoreLocked && node.locked) {
      continue;
    }

    // 1. Transform scene-space point to node's local coordinate space
    const localPoint = worldToLocalPoint(nodeState.worldTransform, scenePoint);

    // 2. Perform exact geometric test
    if (isPointInNodeGeometry(node, localPoint)) {
      return nodeState;
    }
  }

  return null;
}
