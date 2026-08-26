import { SceneProject, SceneNode } from '../types';
import { RenderScene, RenderNodeState, RenderPaint, RenderStroke } from './coreContracts';
import { composeTransform, multiplyMatrices } from '../transform/matrix2D';

/**
 * Render State Derivation Kernel
 * Adheres strictly to CORE_ENGINE_DEPTH.md (Section 3 & 4) & CORE-03
 * Invariant: Evaluation produces derived state. Playback/evaluation must not mutate canonical document.
 */

/**
 * Derives a pure RenderScene representation from evaluated scene nodes
 */
export function deriveRenderScene(
  project: SceneProject,
  evaluatedNodes: SceneNode[]
): RenderScene {
  const nodeMap: Record<string, SceneNode> = {};
  for (const n of evaluatedNodes) {
    nodeMap[n.id] = n;
  }

  const renderNodes: RenderNodeState[] = [];

  for (const node of evaluatedNodes) {
    if (!node.visible) continue;

    // 1. Calculate local transform
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

    // 2. Accumulate parent transforms up hierarchy chain
    let worldTransform = localMatrix;
    let curParentId = node.parentId;
    let totalOpacity = node.opacity ?? 1;
    let depth = 0;

    while (curParentId && depth < 20) {
      const parent = nodeMap[curParentId];
      if (!parent) break;

      totalOpacity *= parent.opacity ?? 1;

      const parentMatrix = composeTransform(
        {
          translation: { x: parent.x, y: parent.y },
          rotation: parent.rotation || 0,
          scale: { x: parent.scaleX ?? 1, y: parent.scaleY ?? 1 },
          pivot: { x: parent.pivotX ?? 0.5, y: parent.pivotY ?? 0.5 }
        },
        parent.width,
        parent.height
      );

      worldTransform = multiplyMatrices(parentMatrix, worldTransform);
      curParentId = parent.parentId;
      depth++;
    }

    // 3. Extract Paint & Stroke
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
      opacity: Math.max(0, Math.min(1, totalOpacity)),
      worldTransform,
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

  return {
    id: project.id,
    viewport: {
      width: rootWidth,
      height: rootHeight,
      dpr: 1,
      background: rootBg
    },
    nodes: renderNodes,
    drawOrder: project.nodeOrder.filter((id) => nodeMap[id]?.visible)
  };
}
