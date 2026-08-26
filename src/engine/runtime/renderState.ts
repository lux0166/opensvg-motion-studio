import { SceneProject, SceneNode } from '../types';
import { RenderScene, RenderNodeState, RenderPaint, RenderStroke, Matrix2D } from './coreContracts';
import { composeTransform, multiplyMatrices } from '../transform/matrix2D';

/**
 * Render State Derivation Kernel
 * Adheres strictly to CORE_ENGINE_DEPTH.md (Section 3 & 4) & STRATEGIC_ROADMAP.md (Section 4 & 8)
 * Invariant: Evaluation produces derived state. Playback/evaluation must not mutate canonical document.
 * Invariant: Renderer layer consumes canonical world transforms without ad-hoc hierarchy traversal.
 */

/**
 * Derives a pure RenderScene representation from evaluated scene nodes
 */
export function deriveRenderScene(
  project: SceneProject,
  evaluatedNodes: SceneNode[],
  precomputedTransforms?: Record<string, { worldTransform: Matrix2D; totalOpacity: number }>,
  customNodeOrder?: string[]
): RenderScene {
  const nodeMap: Record<string, SceneNode> = {};
  for (const n of evaluatedNodes) {
    nodeMap[n.id] = n;
  }

  // If precomputed transforms are not passed, calculate canonical world transforms
  let transforms = precomputedTransforms;
  if (!transforms) {
    transforms = {};
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const resolveNode = (nodeId: string): { worldTransform: Matrix2D; totalOpacity: number } => {
      if (visited.has(nodeId)) return transforms![nodeId];

      const node = nodeMap[nodeId];
      if (!node) {
        return { worldTransform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, totalOpacity: 1 };
      }

      if (visiting.has(nodeId)) {
        // Hierarchy cycle detected; safely break cycle with identity
        return { worldTransform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, totalOpacity: 1 };
      }

      visiting.add(nodeId);

      const localMatrix = composeTransform(
        {
          translation: { x: node.x, y: node.y },
          rotation: node.rotation || 0,
          scale: { x: node.scaleX ?? 1, y: node.scaleY ?? 1 },
          pivot: { x: node.pivotX ?? 0.5, y: node.pivotY ?? 0.5 }
        },
        node.width,
        node.height
      );

      let worldTransform = localMatrix;
      let totalOpacity = node.opacity ?? 1;

      if (node.parentId && nodeMap[node.parentId]) {
        const parentRes = resolveNode(node.parentId);
        worldTransform = multiplyMatrices(parentRes.worldTransform, localMatrix);
        totalOpacity *= parentRes.totalOpacity;
      }

      visiting.delete(nodeId);
      visited.add(nodeId);

      const result = {
        worldTransform,
        totalOpacity: Math.max(0, Math.min(1, totalOpacity))
      };
      transforms![nodeId] = result;
      return result;
    };

    for (const node of evaluatedNodes) {
      if (!visited.has(node.id)) {
        resolveNode(node.id);
      }
    }
  }

  const renderNodes: RenderNodeState[] = [];

  for (const node of evaluatedNodes) {
    if (!node.visible) continue;

    const tf = transforms[node.id] || {
      worldTransform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      totalOpacity: node.opacity ?? 1
    };

    // Extract Paint & Stroke
    let fillPaint: RenderPaint | undefined;
    if (node.fill && node.fill !== 'transparent') {
      fillPaint = {
        type: node.linearGradient ? 'linear-gradient' : node.radialGradient ? 'radial-gradient' : 'solid',
        color: node.fill,
        gradient: node.linearGradient || node.radialGradient
      };
    }

    let strokeData: RenderStroke | undefined;
    if (node.stroke && node.strokeWidth) {
      strokeData = {
        color: node.stroke,
        width: node.strokeWidth,
        cap: node.strokeCap,
        join: node.strokeJoin,
        dash: node.strokeDash,
        trimStart: node.trimStart,
        trimEnd: node.trimEnd,
        trimOffset: node.trimOffset
      };
    }

    renderNodes.push({
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible,
      opacity: tf.totalOpacity,
      worldTransform: tf.worldTransform,
      bounds: {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height
      },
      fill: fillPaint,
      stroke: strokeData,
      clip: (node as any).clipContent
        ? {
            type: 'rect',
            bounds: { x: node.x, y: node.y, width: node.width, height: node.height }
          }
        : undefined,
      filter: {
        blur: node.filterBlur,
        shadow:
          node.shadowBlur && node.shadowColor
            ? {
                color: node.shadowColor,
                blur: node.shadowBlur,
                offsetX: node.shadowOffsetX || 0,
                offsetY: node.shadowOffsetY || 0
              }
            : undefined
      },
      geometryData: node.type === 'path' ? (node.subPaths || node.pathPoints) : undefined
    });
  }

  const rootWidth = project.rootFrame?.width ?? 800;
  const rootHeight = project.rootFrame?.height ?? 600;
  const rootBg = project.rootFrame?.fill || project.rootFrame?.canvasBg || '#ffffff';

  const order = customNodeOrder || project.nodeOrder || [];
  const drawOrder: string[] = order.filter((id) => nodeMap[id]?.visible);
  for (const node of evaluatedNodes) {
    if (node.visible && !drawOrder.includes(node.id)) {
      drawOrder.push(node.id);
    }
  }

  return {
    id: project.id,
    viewport: {
      width: rootWidth,
      height: rootHeight,
      dpr: 1,
      background: rootBg
    },
    nodes: renderNodes,
    drawOrder
  };
}
