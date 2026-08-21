import { describe, it, expect } from 'vitest';
import { exportToAnimatedSVG } from '../exporter';
import { FrameNode, SceneNode } from '../types';

describe('Advanced Gradient & Stroke System', () => {
  const rootFrame: FrameNode = {
    id: 'frame-1',
    name: 'Frame',
    type: 'frame',
    visible: true,
    locked: false,
    clipContent: true,
    canvasBg: '#ffffff',
    x: 0,
    y: 0,
    width: 500,
    height: 300,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 0,
    fill: '#ffffff',
    tracks: []
  };

  const gradientNode: SceneNode = {
    id: 'grad-box',
    name: 'Gradient Box',
    type: 'rect',
    visible: true,
    locked: false,
    x: 40,
    y: 40,
    width: 120,
    height: 120,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 16,
    fill: '#3b82f6',
    fillType: 'linear',
    linearGradient: {
      angle: 45,
      stops: [
        { offset: 0, color: '#3b82f6' },
        { offset: 1, color: '#9333ea' }
      ]
    },
    stroke: '#1d4ed8',
    strokeWidth: 2,
    strokeDash: [6, 6],
    tracks: []
  };

  it('exports SVG with linearGradient defs and stroke-dasharray', () => {
    const svg = exportToAnimatedSVG(rootFrame, [gradientNode], 3.0);
    expect(svg).toContain('<defs>');
    expect(svg).toContain('<linearGradient id="grad-grad-box"');
    expect(svg).toContain('<stop offset="0%" stop-color="#3b82f6"');
    expect(svg).toContain('<stop offset="100%" stop-color="#9333ea"');
    expect(svg).toContain('fill="url(#grad-grad-box)"');
    expect(svg).toContain('stroke-dasharray="6,6"');
  });
});
