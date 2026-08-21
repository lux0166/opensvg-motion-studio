import { FrameNode, SceneNode } from './types';
import { evaluateTrack } from './evaluator';

/**
 * Multi-Format Full-Fidelity Exporter for OpenSVG Motion Studio
 * (Constitution Rule 95 & 96 - No Fake Export)
 */

export function exportToAnimatedSVG(rootFrame: FrameNode, nodes: SceneNode[], duration: number): string {
  let defs = '';
  let cssRules = '';

  for (const node of nodes) {
    // Gradient definitions
    if (node.fillType === 'linear' && node.linearGradient && node.linearGradient.stops.length > 0) {
      const gradId = `grad-${node.id}`;
      defs += `    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">\n`;
      for (const s of node.linearGradient.stops) {
        defs += `      <stop offset="${Math.round(s.offset * 100)}%" stop-color="${s.color}" />\n`;
      }
      defs += `    </linearGradient>\n`;
    }

    // Shadow & Blur Filters
    const hasShadow = node.shadowBlur || node.shadowOffsetX || node.shadowOffsetY;
    const hasBlur = node.filterBlur && node.filterBlur > 0;
    if (hasShadow || hasBlur) {
      const filterId = `filter-${node.id}`;
      defs += `    <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">\n`;
      if (hasShadow) {
        defs += `      <feDropShadow dx="${node.shadowOffsetX || 0}" dy="${node.shadowOffsetY || 0}" stdDeviation="${((node.shadowBlur || 0) / 2).toFixed(1)}" flood-color="${node.shadowColor || 'rgba(0,0,0,0.25)'}" />\n`;
      }
      if (hasBlur) {
        defs += `      <feGaussianBlur stdDeviation="${node.filterBlur}" />\n`;
      }
      defs += `    </filter>\n`;
    }

    // Full-Fidelity Dynamic CSS @keyframes Generation
    if (node.tracks && node.tracks.length > 0) {
      const timeSet = new Set<number>([0, duration]);
      for (const track of node.tracks) {
        if (track.keyframes) {
          for (const kf of track.keyframes) {
            if (kf.time >= 0 && kf.time <= duration) {
              timeSet.add(kf.time);
            }
          }
        }
      }

      const sortedTimes = Array.from(timeSet).sort((a, b) => a - b);
      let keyframeSteps = '';

      for (const t of sortedTimes) {
        const pct = duration > 0 ? ((t / duration) * 100).toFixed(1) : '0';
        
        // Evaluate animated properties at timestamp t
        let x = node.x;
        let y = node.y;
        let rotation = node.rotation || 0;
        let scaleX = node.scaleX ?? 1;
        let scaleY = node.scaleY ?? 1;
        let opacity = node.opacity ?? 1;
        let fill = node.fill;

        for (const tr of node.tracks) {
          if (tr.property === 'x') x = evaluateTrack(tr, t, x);
          if (tr.property === 'y') y = evaluateTrack(tr, t, y);
          if (tr.property === 'rotation') rotation = evaluateTrack(tr, t, rotation);
          if (tr.property === 'scaleX') scaleX = evaluateTrack(tr, t, scaleX);
          if (tr.property === 'scaleY') scaleY = evaluateTrack(tr, t, scaleY);
          if (tr.property === 'opacity') opacity = evaluateTrack(tr, t, opacity);
          if (tr.property === 'fill') fill = evaluateTrack(tr, t, fill);
        }

        keyframeSteps += `      ${pct}% {
        transform: translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rotation.toFixed(1)}deg) scale(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)});
        opacity: ${opacity.toFixed(2)};
        fill: ${fill};
      }\n`;
      }

      const animName = `anim_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      cssRules += `    @keyframes ${animName} {\n${keyframeSteps}    }\n`;
      cssRules += `    .node-anim-${node.id} {\n      animation: ${animName} ${duration}s infinite linear;\n      transform-box: fill-box;\n      transform-origin: center;\n    }\n`;
    }
  }

  let svg = `<?xml version="1.0" encoding="utf-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rootFrame.width} ${rootFrame.height}" width="${rootFrame.width}" height="${rootFrame.height}">\n`;
  
  if (cssRules) {
    svg += `  <style>\n${cssRules}  </style>\n`;
  }

  if (defs) {
    svg += `  <defs>\n${defs}  </defs>\n`;
  }

  // Root canvas frame
  svg += `  <rect width="100%" height="100%" fill="${rootFrame.fill}" />\n`;

  for (const node of nodes) {
    if (!node.visible) continue;
    const isAnimated = node.tracks && node.tracks.length > 0;
    const animClass = isAnimated ? ` class="node-anim-${node.id}"` : '';
    
    // When animated with CSS transform translate(x,y), base position in tag is 0 for smooth matrix application
    const baseX = isAnimated ? 0 : node.x;
    const baseY = isAnimated ? 0 : node.y;

    const rx = node.borderRadius ? ` rx="${node.borderRadius}"` : '';
    const stroke = node.stroke ? ` stroke="${node.stroke}" stroke-width="${node.strokeWidth || 1}"` : '';
    const dash = node.strokeDash && node.strokeDash.length > 0 ? ` stroke-dasharray="${node.strokeDash.join(',')}"` : '';
    const fillAttr = node.fillType === 'linear' ? `url(#grad-${node.id})` : node.fill;
    const filterAttr = (node.shadowBlur || node.shadowOffsetX || node.shadowOffsetY || (node.filterBlur && node.filterBlur > 0))
      ? ` filter="url(#filter-${node.id})"`
      : '';

    if (node.type === 'circle') {
      const r = node.width / 2;
      svg += `  <circle cx="${baseX + r}" cy="${baseY + r}" r="${r}" fill="${fillAttr}"${stroke}${dash}${filterAttr}${animClass} />\n`;
    } else if (node.type === 'text') {
      const anchor = node.textAlign === 'center' ? 'middle' : node.textAlign === 'right' ? 'end' : 'start';
      const textX = node.textAlign === 'center' ? baseX + node.width / 2 : node.textAlign === 'right' ? baseX + node.width : baseX;
      const size = node.fontSize || 28;
      const weight = node.fontWeight || 600;
      const font = node.fontFamily || 'Inter, sans-serif';
      svg += `  <text x="${textX}" y="${baseY + size}" font-family="${font}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fillAttr}"${stroke}${filterAttr}${animClass}>${node.textContent || ''}</text>\n`;
    } else if (node.type === 'path' && node.pathPoints && node.pathPoints.length > 0) {
      let d = `M ${node.pathPoints[0].x} ${node.pathPoints[0].y}`;
      for (let i = 1; i < node.pathPoints.length; i++) {
        const pt = node.pathPoints[i];
        if (pt.cp1x !== undefined && pt.cp1y !== undefined && pt.cp2x !== undefined && pt.cp2y !== undefined) {
          d += ` C ${pt.cp1x} ${pt.cp1y}, ${pt.cp2x} ${pt.cp2y}, ${pt.x} ${pt.y}`;
        } else {
          d += ` L ${pt.x} ${pt.y}`;
        }
      }
      if ((node as any).closed) d += ' Z';
      svg += `  <path d="${d}" fill="${fillAttr}"${stroke}${dash}${filterAttr}${animClass} />\n`;
    } else {
      svg += `  <rect x="${baseX}" y="${baseY}" width="${node.width}" height="${node.height}" fill="${fillAttr}"${rx}${stroke}${dash}${filterAttr}${animClass} />\n`;
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
    layers: nodes.map((node, idx) => {
      // Find tracks
      const rotTrack = node.tracks?.find(t => t.property === 'rotation');
      const xTrack = node.tracks?.find(t => t.property === 'x');
      const yTrack = node.tracks?.find(t => t.property === 'y');
      const opTrack = node.tracks?.find(t => t.property === 'opacity');
      const scaleTrack = node.tracks?.find(t => t.property === 'scaleX' || t.property === 'scaleY');

      // Animated or static Rotation
      const rProp = rotTrack && rotTrack.keyframes.length > 1
        ? {
            a: 1,
            k: rotTrack.keyframes.map((kf, i, arr) => ({
              t: Math.round(kf.time * fps),
              s: [kf.value],
              e: arr[i + 1] ? [arr[i + 1].value] : [kf.value]
            }))
          }
        : { a: 0, k: node.rotation || 0 };

      // Animated or static Position
      const isPosAnimated = (xTrack && xTrack.keyframes.length > 1) || (yTrack && yTrack.keyframes.length > 1);
      const pProp = isPosAnimated
        ? {
            a: 1,
            k: (xTrack?.keyframes || yTrack?.keyframes || []).map((kf, i, arr) => {
              const currentX = xTrack ? evaluateTrack(xTrack, kf.time, node.x) : node.x;
              const currentY = yTrack ? evaluateTrack(yTrack, kf.time, node.y) : node.y;
              const nextTime = arr[i + 1]?.time ?? kf.time;
              const nextX = xTrack ? evaluateTrack(xTrack, nextTime, node.x) : node.x;
              const nextY = yTrack ? evaluateTrack(yTrack, nextTime, node.y) : node.y;

              return {
                t: Math.round(kf.time * fps),
                s: [currentX + node.width / 2, currentY + node.height / 2, 0],
                e: [nextX + node.width / 2, nextY + node.height / 2, 0]
              };
            })
          }
        : { a: 0, k: [node.x + node.width / 2, node.y + node.height / 2, 0] };

      // Animated or static Opacity
      const oProp = opTrack && opTrack.keyframes.length > 1
        ? {
            a: 1,
            k: opTrack.keyframes.map((kf, i, arr) => ({
              t: Math.round(kf.time * fps),
              s: [kf.value * 100],
              e: arr[i + 1] ? [arr[i + 1].value * 100] : [kf.value * 100]
            }))
          }
        : { a: 0, k: (node.opacity ?? 1) * 100 };

      // Animated or static Scale
      const sProp = scaleTrack && scaleTrack.keyframes.length > 1
        ? {
            a: 1,
            k: scaleTrack.keyframes.map((kf, i, arr) => ({
              t: Math.round(kf.time * fps),
              s: [kf.value * 100, kf.value * 100, 100],
              e: arr[i + 1] ? [arr[i + 1].value * 100, arr[i + 1].value * 100, 100] : [kf.value * 100, kf.value * 100, 100]
            }))
          }
        : { a: 0, k: [(node.scaleX || 1) * 100, (node.scaleY || 1) * 100, 100] };

      return {
        ddd: 0,
        ind: idx + 1,
        ty: 4, // Shape layer
        nm: node.name,
        sr: 1,
        ks: {
          o: oProp,
          r: rProp,
          p: pProp,
          a: { a: 0, k: [0, 0, 0] },
          s: sProp
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
      };
    })
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
