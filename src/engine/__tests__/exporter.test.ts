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

  it('generates valid static SVG and Lottie JSON for un-animated nodes', () => {
    const svg = exportToAnimatedSVG(rootFrame, sampleNodes, 3.0);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 600 400"');
    expect(svg).toContain('<rect x="50" y="50" width="100" height="100" fill="#111827" rx="16"');

    const lottie = exportToLottieJSON(rootFrame, sampleNodes, 3.0, 60);
    expect(lottie.v).toBe('5.7.4');
    expect(lottie.layers.length).toBe(2);
    expect(lottie.layers[0].ks.r.a).toBe(0); // static flag
  });

  it('generates dynamic CSS @keyframes for animated nodes in SVG', () => {
    const animatedNodes: SceneNode[] = [
      {
        id: 'rect-anim',
        name: 'Animated Box',
        type: 'rect',
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 8,
        fill: '#3b82f6',
        tracks: [
          {
            id: 'tr-rot',
            property: 'rotation',
            label: 'Rotation',
            unit: '°',
            keyframes: [
              { id: 'k1', time: 0, value: 0 },
              { id: 'k2', time: 1.5, value: 180 },
              { id: 'k3', time: 3.0, value: 360 }
            ]
          },
          {
            id: 'tr-x',
            property: 'x',
            label: 'X',
            unit: 'px',
            keyframes: [
              { id: 'k4', time: 0, value: 0 },
              { id: 'k5', time: 3.0, value: 400 }
            ]
          }
        ]
      }
    ];

    const svg = exportToAnimatedSVG(rootFrame, animatedNodes, 3.0);
    expect(svg).toContain('@keyframes anim_rect_anim');
    expect(svg).toContain('rotate(0.0deg)');
    expect(svg).toContain('rotate(180.0deg)');
    expect(svg).toContain('rotate(360.0deg)');
    expect(svg).toContain('class="node-anim-rect-anim"');
  });

  it('generates dynamic keyframes in Lottie JSON for animated properties', () => {
    const animatedNodes: SceneNode[] = [
      {
        id: 'spin-box',
        name: 'Spinner',
        type: 'rect',
        visible: true,
        locked: false,
        x: 50,
        y: 50,
        width: 80,
        height: 80,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 4,
        fill: '#10b981',
        tracks: [
          {
            id: 'tr-rot',
            property: 'rotation',
            label: 'Rotation',
            unit: '°',
            keyframes: [
              { id: 'k1', time: 0, value: 0 },
              { id: 'k2', time: 3.0, value: 360 }
            ]
          }
        ]
      }
    ];

    const lottie = exportToLottieJSON(rootFrame, animatedNodes, 3.0, 60);
    expect(lottie.layers[0].ks.r.a).toBe(1); // Animated flag = 1
    expect(Array.isArray(lottie.layers[0].ks.r.k)).toBe(true);
    expect((lottie.layers[0].ks.r.k as any)[0].s).toEqual([0]);
    expect((lottie.layers[0].ks.r.k as any)[0].e).toEqual([360]);
  });
});
