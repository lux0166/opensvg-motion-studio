import { SceneNode, BezierPoint } from './types';

/**
 * Parses SVG path `d` attribute into BezierPoint array
 */
export function parseSvgPathData(d: string): BezierPoint[] {
  const points: BezierPoint[] = [];
  if (!d) return points;

  // Normalize path command separators
  const commands = d.match(/[a-df-z]|[\-+]?(?:\d*\.\d+|\d+)(?:[eE][\-+]?\d+)?/gi) || [];
  let i = 0;
  let currentX = 0;
  let currentY = 0;

  while (i < commands.length) {
    const token = commands[i];
    if (/[a-z]/i.test(token)) {
      const cmd = token;
      i++;

      if (cmd === 'M' || cmd === 'm') {
        const x = parseFloat(commands[i++]);
        const y = parseFloat(commands[i++]);
        currentX = cmd === 'm' ? currentX + x : x;
        currentY = cmd === 'm' ? currentY + y : y;
        points.push({ x: currentX, y: currentY, type: 'move' });
      } else if (cmd === 'L' || cmd === 'l') {
        const x = parseFloat(commands[i++]);
        const y = parseFloat(commands[i++]);
        currentX = cmd === 'l' ? currentX + x : x;
        currentY = cmd === 'l' ? currentY + y : y;
        points.push({ x: currentX, y: currentY, type: 'line' });
      } else if (cmd === 'C' || cmd === 'c') {
        const c1x = parseFloat(commands[i++]);
        const c1y = parseFloat(commands[i++]);
        const c2x = parseFloat(commands[i++]);
        const c2y = parseFloat(commands[i++]);
        const x = parseFloat(commands[i++]);
        const y = parseFloat(commands[i++]);

        const absC1x = cmd === 'c' ? currentX + c1x : c1x;
        const absC1y = cmd === 'c' ? currentY + c1y : c1y;
        const absC2x = cmd === 'c' ? currentX + c2x : c2x;
        const absC2y = cmd === 'c' ? currentY + c2y : c2y;
        currentX = cmd === 'c' ? currentX + x : x;
        currentY = cmd === 'c' ? currentY + y : y;

        points.push({
          x: currentX,
          y: currentY,
          cp1x: absC1x,
          cp1y: absC1y,
          cp2x: absC2x,
          cp2y: absC2y,
          type: 'cubic'
        });
      } else if (cmd === 'Z' || cmd === 'z') {
        if (points.length > 0) {
          points.push({ x: points[0].x, y: points[0].y, type: 'close' });
        }
      }
    } else {
      i++;
    }
  }

  return points;
}

export interface SvgImportResult {
  nodes: SceneNode[];
  viewBox?: { width: number; height: number };
}

/**
 * Universal SVG XML Parser to OpenSVG Scene Graph
 */
export function importSvgString(svgText: string): SvgImportResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');

  if (!svgEl) {
    throw new Error('Invalid SVG: No <svg> root element found');
  }

  let vbWidth = 600;
  let vbHeight = 400;
  const viewBoxAttr = svgEl.getAttribute('viewBox');
  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      vbWidth = parts[2];
      vbHeight = parts[3];
    }
  } else {
    vbWidth = parseFloat(svgEl.getAttribute('width') || '600');
    vbHeight = parseFloat(svgEl.getAttribute('height') || '400');
  }

  const nodes: SceneNode[] = [];
  const elements = svgEl.querySelectorAll('rect, circle, path, text, polygon');

  elements.forEach((el, idx) => {
    const tagName = el.tagName.toLowerCase();
    const id = el.getAttribute('id') || `svg-node-${Date.now()}-${idx}`;
    const fill = el.getAttribute('fill') || '#3b82f6';
    const stroke = el.getAttribute('stroke') || undefined;
    const strokeWidth = el.getAttribute('stroke-width') ? parseFloat(el.getAttribute('stroke-width')!) : undefined;
    const opacity = el.getAttribute('opacity') ? parseFloat(el.getAttribute('opacity')!) : 1;

    if (tagName === 'rect') {
      const x = parseFloat(el.getAttribute('x') || '0');
      const y = parseFloat(el.getAttribute('y') || '0');
      const width = parseFloat(el.getAttribute('width') || '100');
      const height = parseFloat(el.getAttribute('height') || '100');
      const rx = parseFloat(el.getAttribute('rx') || '0');

      nodes.push({
        id,
        name: `Rect ${idx + 1}`,
        type: 'rect',
        visible: true,
        locked: false,
        x,
        y,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity,
        borderRadius: rx,
        fill: fill === 'none' ? 'transparent' : fill,
        stroke,
        strokeWidth,
        tracks: []
      });
    } else if (tagName === 'circle') {
      const cx = parseFloat(el.getAttribute('cx') || '50');
      const cy = parseFloat(el.getAttribute('cy') || '50');
      const r = parseFloat(el.getAttribute('r') || '50');

      nodes.push({
        id,
        name: `Circle ${idx + 1}`,
        type: 'circle',
        visible: true,
        locked: false,
        x: cx - r,
        y: cy - r,
        width: r * 2,
        height: r * 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity,
        borderRadius: 9999,
        fill: fill === 'none' ? 'transparent' : fill,
        stroke,
        strokeWidth,
        tracks: []
      });
    } else if (tagName === 'path') {
      const d = el.getAttribute('d') || '';
      const points = parseSvgPathData(d);

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const pt of points) {
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      }

      const w = Math.max(20, (isFinite(maxX) && isFinite(minX)) ? maxX - minX : 100);
      const h = Math.max(20, (isFinite(maxY) && isFinite(minY)) ? maxY - minY : 100);
      const posX = isFinite(minX) ? minX : 0;
      const posY = isFinite(minY) ? minY : 0;

      nodes.push({
        id,
        name: `Vector Path ${idx + 1}`,
        type: 'path',
        visible: true,
        locked: false,
        x: posX,
        y: posY,
        width: w,
        height: h,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity,
        borderRadius: 0,
        fill: fill === 'none' ? 'transparent' : fill,
        stroke,
        strokeWidth,
        pathPoints: points,
        tracks: []
      });
    } else if (tagName === 'text') {
      const x = parseFloat(el.getAttribute('x') || '0');
      const y = parseFloat(el.getAttribute('y') || '0');
      const fontSize = parseFloat(el.getAttribute('font-size') || '24');
      const fontFamily = el.getAttribute('font-family') || 'Inter, sans-serif';
      const textContent = el.textContent?.trim() || 'Text';

      nodes.push({
        id,
        name: `Text ${idx + 1}`,
        type: 'text',
        visible: true,
        locked: false,
        x,
        y,
        width: Math.max(100, textContent.length * (fontSize * 0.6)),
        height: fontSize * 1.5,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity,
        borderRadius: 0,
        fill: fill === 'none' ? '#111827' : fill,
        textContent,
        fontSize,
        fontFamily,
        tracks: []
      });
    }
  });

  return {
    nodes,
    viewBox: { width: vbWidth, height: vbHeight }
  };
}
