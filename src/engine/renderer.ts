import { SceneNode, FrameNode, ToolMode, BezierPoint } from './types';
import { SnapLine } from './snapping';

export interface DragHandleInfo {
  type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | 'rotate' | 'anchor' | 'cp1' | 'cp2';
  pointIndex?: number;
}

/**
 * High-DPI Vector Canvas Renderer with Sub-pixel Precision
 */
export function renderCanvasScene(
  ctx: CanvasRenderingContext2D,
  rootFrame: FrameNode,
  evaluatedNodes: SceneNode[],
  selectedId: string | null,
  selectedTool: ToolMode,
  selectedPointIndex: number | null,
  dpr: number,
  snapLines: SnapLine[] = []
) {
  const width = rootFrame.width;
  const height = rootFrame.height;

  // Clear canvas with device pixel ratio
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Draw Frame Background
  ctx.fillStyle = rootFrame.fill || '#ffffff';
  ctx.fillRect(0, 0, width, height);

  if (rootFrame.clipContent) {
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();
  }

  // Render all nodes in Z-order
  for (const node of evaluatedNodes) {
    if (!node.visible) continue;

    ctx.save();
    // Transform matrix
    const centerX = node.x + node.width / 2;
    const centerY = node.y + node.height / 2;

    ctx.translate(centerX, centerY);
    if (node.rotation) {
      ctx.rotate((node.rotation * Math.PI) / 180);
    }
    if (node.scaleX !== 1 || node.scaleY !== 1) {
      ctx.scale(node.scaleX, node.scaleY);
    }
    ctx.translate(-centerX, -centerY);

    // Apply Opacity
    ctx.globalAlpha = Math.max(0, Math.min(1, node.opacity ?? 1));

    // Shadow
    if (node.shadowBlur && node.shadowColor) {
      ctx.shadowColor = node.shadowColor;
      ctx.shadowBlur = node.shadowBlur;
      ctx.shadowOffsetX = node.shadowOffsetX || 0;
      ctx.shadowOffsetY = node.shadowOffsetY || 0;
    }

    // Apply Fill (Solid, Linear Gradient, Radial Gradient)
    ctx.fillStyle = getShapeFill(ctx, node);

    // Apply Stroke & Dash/Cap/Join
    if (node.stroke && node.strokeWidth) {
      ctx.strokeStyle = node.stroke;
      ctx.lineWidth = node.strokeWidth;
      ctx.setLineDash(node.strokeDash || []);
      ctx.lineCap = node.strokeCap || 'round';
      ctx.lineJoin = node.strokeJoin || 'round';
    }

    if (node.type === 'circle') {
      ctx.beginPath();
      ctx.ellipse(
        node.x + node.width / 2,
        node.y + node.height / 2,
        node.width / 2,
        node.height / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      if (node.stroke && node.strokeWidth) ctx.stroke();
    } else if (node.type === 'rect' || node.type === 'frame') {
      ctx.beginPath();
      if (node.borderRadius && node.borderRadius > 0) {
        ctx.roundRect(node.x, node.y, node.width, node.height, node.borderRadius);
      } else {
        ctx.rect(node.x, node.y, node.width, node.height);
      }
      ctx.fill();
      if (node.stroke && node.strokeWidth) ctx.stroke();
    } else if (node.type === 'star') {
      drawStar(ctx, node.x + node.width / 2, node.y + node.height / 2, 5, node.width / 2, node.width / 4);
      ctx.fill();
      if (node.stroke && node.strokeWidth) ctx.stroke();
    } else if (node.type === 'path' && node.pathPoints && node.pathPoints.length > 0) {
      drawBezierPath(ctx, node.pathPoints, node.x, node.y);
      if (node.fill && node.fill !== 'transparent') ctx.fill();
      if (node.stroke && node.strokeWidth) {
        ctx.stroke();
      } else if (!node.stroke) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else if (node.type === 'text') {
      ctx.font = `${node.fontSize || 16}px Inter, sans-serif`;
      ctx.fillText(node.textContent || 'Text', node.x, node.y + (node.fontSize || 16));
    }

    ctx.restore();
  }

  // Draw Selection Bounding Box & Handles
  if (selectedId && selectedId !== rootFrame.id) {
    const selectedNode = evaluatedNodes.find((n) => n.id === selectedId);
    if (selectedNode && selectedNode.visible) {
      if ((selectedTool === 'pen' || selectedTool === 'direct-select') && selectedNode.type === 'path' && selectedNode.pathPoints) {
        drawPathEditingOverlay(ctx, selectedNode, selectedPointIndex);
      } else {
        drawSelectionOverlay(ctx, selectedNode);
      }
    }
  }

  // Draw Magnetic Snap Alignment Guides
  if (snapLines && snapLines.length > 0) {
    ctx.save();
    ctx.strokeStyle = '#ef4444'; // Precision red alignment guide
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);

    for (const line of snapLines) {
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

export function drawBezierPath(ctx: CanvasRenderingContext2D, points: BezierPoint[], offsetX: number, offsetY: number) {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x + offsetX, points[0].y + offsetY);

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (
      p.cp1x !== undefined &&
      p.cp1y !== undefined &&
      p.cp2x !== undefined &&
      p.cp2y !== undefined
    ) {
      ctx.bezierCurveTo(
        p.cp1x + offsetX,
        p.cp1y + offsetY,
        p.cp2x + offsetX,
        p.cp2y + offsetY,
        p.x + offsetX,
        p.y + offsetY
      );
    } else {
      ctx.lineTo(p.x + offsetX, p.y + offsetY);
    }
  }
}

/**
 * 8-Point Bounding Box with Corner, Edge, and Rotation Handles
 */
function drawSelectionOverlay(ctx: CanvasRenderingContext2D, node: SceneNode) {
  ctx.save();
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;

  ctx.translate(centerX, centerY);
  if (node.rotation) {
    ctx.rotate((node.rotation * Math.PI) / 180);
  }
  if (node.scaleX !== 1 || node.scaleY !== 1) {
    ctx.scale(node.scaleX, node.scaleY);
  }
  ctx.translate(-centerX, -centerY);

  // Blue selection ring
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(node.x, node.y, node.width, node.height);

  // 8 handles (Corners + Edges)
  const handleSize = 6;
  const handles = [
    // Corners
    [node.x, node.y], // NW
    [node.x + node.width, node.y], // NE
    [node.x, node.y + node.height], // SW
    [node.x + node.width, node.y + node.height], // SE
    // Edges
    [node.x + node.width / 2, node.y], // N
    [node.x + node.width / 2, node.y + node.height], // S
    [node.x, node.y + node.height / 2], // W
    [node.x + node.width, node.y + node.height / 2], // E
  ];

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;

  for (const [hx, hy] of handles) {
    ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
  }

  // Rotation top handle with lollipop line
  ctx.beginPath();
  ctx.moveTo(centerX, node.y);
  ctx.lineTo(centerX, node.y - 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, node.y - 20, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Path Vector Overlay (Anchor points & Tangent handles)
 */
function drawPathEditingOverlay(ctx: CanvasRenderingContext2D, node: SceneNode, selectedPointIndex: number | null) {
  if (!node.pathPoints || node.pathPoints.length === 0) return;

  const points = node.pathPoints;
  const offsetX = node.x;
  const offsetY = node.y;

  ctx.save();

  // Draw connecting tangent lines
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 1;
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (pt.cp1x !== undefined && pt.cp1y !== undefined) {
      ctx.beginPath();
      ctx.moveTo(pt.x + offsetX, pt.y + offsetY);
      ctx.lineTo(pt.cp1x + offsetX, pt.cp1y + offsetY);
      ctx.stroke();

      // Tangent point 1 handle
      ctx.beginPath();
      ctx.arc(pt.cp1x + offsetX, pt.cp1y + offsetY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    }
    if (pt.cp2x !== undefined && pt.cp2y !== undefined) {
      ctx.beginPath();
      ctx.moveTo(pt.x + offsetX, pt.y + offsetY);
      ctx.lineTo(pt.cp2x + offsetX, pt.cp2y + offsetY);
      ctx.stroke();

      // Tangent point 2 handle
      ctx.beginPath();
      ctx.arc(pt.cp2x + offsetX, pt.cp2y + offsetY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    }
  }

  // Draw Anchor points (vertices)
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const isSelected = selectedPointIndex === i;
    const size = isSelected ? 8 : 6;

    ctx.fillStyle = isSelected ? '#3b82f6' : '#ffffff';
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 1.5;

    ctx.fillRect(pt.x + offsetX - size / 2, pt.y + offsetY - size / 2, size, size);
    ctx.strokeRect(pt.x + offsetX - size / 2, pt.y + offsetY - size / 2, size, size);
  }

  ctx.restore();
}

/**
 * Creates Canvas gradient or returns solid color
 */
export function getShapeFill(ctx: CanvasRenderingContext2D, node: SceneNode): string | CanvasGradient {
  if (node.fillType === 'linear' && node.linearGradient && node.linearGradient.stops.length > 0) {
    const angleRad = ((node.linearGradient.angle || 0) * Math.PI) / 180;
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const r = Math.max(node.width, node.height) / 2;

    const x1 = cx - Math.cos(angleRad) * r;
    const y1 = cy - Math.sin(angleRad) * r;
    const x2 = cx + Math.cos(angleRad) * r;
    const y2 = cy + Math.sin(angleRad) * r;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    for (const stop of node.linearGradient.stops) {
      grad.addColorStop(Math.max(0, Math.min(1, stop.offset)), stop.color);
    }
    return grad;
  }

  if (node.fillType === 'radial' && node.radialGradient && node.radialGradient.stops.length > 0) {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const r = Math.max(node.width, node.height) / 2;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    for (const stop of node.radialGradient.stops) {
      grad.addColorStop(Math.max(0, Math.min(1, stop.offset)), stop.color);
    }
    return grad;
  }

  return node.fill || '#111827';
}
