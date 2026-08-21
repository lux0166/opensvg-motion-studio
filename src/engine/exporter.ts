import { FrameNode, SceneNode } from './types';

/**
 * Multi-Format Exporter for OpenSVG Motion Studio
 */

export function exportToAnimatedSVG(rootFrame: FrameNode, nodes: SceneNode[], duration: number): string {
  let defs = '';
  for (const node of nodes) {
    if (node.fillType === 'linear' && node.linearGradient && node.linearGradient.stops.length > 0) {
      const gradId = `grad-${node.id}`;
      defs += `    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">\n`;
      for (const s of node.linearGradient.stops) {
        defs += `      <stop offset="${Math.round(s.offset * 100)}%" stop-color="${s.color}" />\n`;
      }
      defs += `    </linearGradient>\n`;
    }
  }

  let svg = `<?xml version="1.0" encoding="utf-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rootFrame.width} ${rootFrame.height}" width="${rootFrame.width}" height="${rootFrame.height}">\n`;
  svg += `  <style>\n`;
  svg += `    @keyframes studioSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }\n`;
  svg += `    .animated-spin { transform-origin: center; animation: studioSpin ${duration}s infinite linear; }\n`;
  svg += `  </style>\n`;

  if (defs) {
    svg += `  <defs>\n${defs}  </defs>\n`;
  }

  // Root background
  svg += `  <rect width="100%" height="100%" fill="${rootFrame.fill}" />\n`;

  for (const node of nodes) {
    if (!node.visible) continue;
    const rx = node.borderRadius ? ` rx="${node.borderRadius}"` : '';
    const stroke = node.stroke ? ` stroke="${node.stroke}" stroke-width="${node.strokeWidth || 1}"` : '';
    const dash = node.strokeDash && node.strokeDash.length > 0 ? ` stroke-dasharray="${node.strokeDash.join(',')}"` : '';
    const fillAttr = node.fillType === 'linear' ? `url(#grad-${node.id})` : node.fill;

    if (node.type === 'circle') {
      const r = node.width / 2;
      svg += `  <circle cx="${node.x + r}" cy="${node.y + r}" r="${r}" fill="${fillAttr}"${stroke}${dash} />\n`;
    } else {
      svg += `  <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="${fillAttr}"${rx}${stroke}${dash} />\n`;
    }
  }

  svg += `</svg>`;
  return svg;
}

export function exportToLottieJSON(rootFrame: FrameNode, nodes: SceneNode[], duration: number, fps = 60) {
  const totalFrames = Math.round(duration * fps);
  
  return {
    v: '5.7.4',
    fr: fps,
    ip: 0,
    op: totalFrames,
    w: rootFrame.width,
    h: rootFrame.height,
    nm: rootFrame.name,
    ddd: 0,
    assets: [],
    layers: nodes.map((node, idx) => ({
      ddd: 0,
      ind: idx + 1,
      ty: 4, // Shape layer
      nm: node.name,
      sr: 1,
      ks: {
        o: { a: 0, k: (node.opacity ?? 1) * 100 },
        r: { a: 0, k: node.rotation || 0 },
        p: { a: 0, k: [node.x + node.width / 2, node.y + node.height / 2, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [(node.scaleX || 1) * 100, (node.scaleY || 1) * 100, 100] }
      },
      shapes: [
        {
          ty: 'rc',
          d: 1,
          s: { a: 0, k: [node.width, node.height] },
          p: { a: 0, k: [0, 0] },
          r: { a: 0, k: node.borderRadius || 0 },
          nm: 'Rectangle'
        },
        {
          ty: 'fl',
          c: { a: 0, k: hexToLottieColor(node.fill) },
          o: { a: 0, k: 100 },
          nm: 'Fill'
        }
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0
    }))
  };
}

function hexToLottieColor(hex: string): [number, number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return [r, g, b, 1];
}
