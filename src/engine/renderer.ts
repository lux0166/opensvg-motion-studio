import { SceneNode, FrameNode } from './types';

/**
 * High-DPI Vector Canvas Renderer
 */
export function renderCanvasScene(
  ctx: CanvasRenderingContext2D,
  rootFrame: FrameNode,
  evaluatedNodes: SceneNode[],
  selectedId: string | null,
  dpr: number
) {
  const width = rootFrame.width;
  const height = rootFrame.height;

  // Clear canvas
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

    // Draw Shape
    ctx.fillStyle = node.fill;
    if (node.stroke && node.strokeWidth) {
      ctx.strokeStyle = node.stroke;
      ctx.lineWidth = node.strokeWidth;
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
      ctx.fill();
      if (node.stroke && node.strokeWidth) ctx.stroke();
    } else if (node.type === 'text') {
      ctx.font = `${node.fontSize || 16}px Inter, sans-serif`;
      ctx.fillText(node.textContent || 'Text', node.x, node.y + (node.fontSize || 16));
    }

    ctx.restore();
  }

  // Draw Selection Bounding Box & Handles
  if (selectedId && selectedId !== rootFrame.id) {
    const selectedNode = evaluatedNodes.find(n => n.id === selectedId);
    if (selectedNode && selectedNode.visible) {
      drawSelectionOverlay(ctx, selectedNode);
    }
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

function drawBezierPath(ctx: CanvasRenderingContext2D, points: any[], offsetX: number, offsetY: number) {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x + offsetX, points[0].y + offsetY);

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.cp1x !== undefined && p.cp2x !== undefined) {
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

  // 4 Corner handles
  const handleSize = 7;
  const corners = [
    [node.x, node.y],
    [node.x + node.width, node.y],
    [node.x, node.y + node.height],
    [node.x + node.width, node.y + node.height]
  ];

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;

  for (const [hx, hy] of corners) {
    ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
  }

  // Rotation top handle
  ctx.beginPath();
  ctx.moveTo(centerX, node.y);
  ctx.lineTo(centerX, node.y - 18);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, node.y - 18, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
