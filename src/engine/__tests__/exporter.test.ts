import { describe, it, expect } from 'vitest';
import { exportToAnimatedSVG, exportToLottieJSON } from '../exporter';
import { FrameNode, SceneNode } from '../types';

describe('Multi-Format Exporter', () => {
  const rootFrame: FrameNode = {
    id: 'frame-1',
    name: 'Main Artboard',
    type: 'frame',
    visible: true,
    locked: false,
    clipContent: true,
    canvasBg: '#ffffff',
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 0,
    fill: '#ffffff',
    tracks: []
  };

  const sampleNodes: SceneNode[] = [
    {
      id: 'rect-1',
      name: 'Card',
      type: 'rect',
      visible: true,
      locked: false,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 16,
      fill: '#111827',
      tracks: []
    },
    {
      id: 'circle-1',
      name: 'Ball',
      type: 'circle',
      visible: true,
      locked: false,
      x: 200,
      y: 100,
      width: 60,
      height: 60,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 9999,
      fill: '#3b82f6',
      tracks: []
    }
  ];

  it('generates valid standalone Animated SVG markup', () => {
    const svg = exportToAnimatedSVG(rootFrame, sampleNodes, 3.0);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 600 400"');
    expect(svg).toContain('<rect x="50" y="50" width="100" height="100" fill="#111827" rx="16"');
    expect(svg).toContain('<circle cx="230" cy="130" r="30" fill="#3b82f6"');
    expect(svg).toContain('</svg>');
  });

  it('generates schema-compliant Bodymovin / Lottie JSON', () => {
    const lottie = exportToLottieJSON(rootFrame, sampleNodes, 3.0, 60);
    expect(lottie.v).toBe('5.7.4');
    expect(lottie.w).toBe(600);
    expect(lottie.h).toBe(400);
    expect(lottie.op).toBe(180); // 3s * 60fps
    expect(lottie.layers.length).toBe(2);
    expect(lottie.layers[0].nm).toBe('Card');
    expect(lottie.layers[1].nm).toBe('Ball');
  });
});
