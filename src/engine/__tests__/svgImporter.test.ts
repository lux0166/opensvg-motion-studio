import { describe, it, expect } from 'vitest';
import { parseSvgPathData, importSvgString } from '../svgImporter';

describe('SVG Asset Importer', () => {
  it('parses SVG path commands (M, L, C, Z) into BezierPoints', () => {
    const d = 'M 10 20 L 50 60 C 70 80 90 100 120 140 Z';
    const points = parseSvgPathData(d);

    expect(points.length).toBe(4);
    expect(points[0]).toEqual({ x: 10, y: 20, type: 'move' });
    expect(points[1]).toEqual({ x: 50, y: 60, type: 'line' });
    expect(points[2]).toEqual({
      x: 120,
      y: 140,
      cp1x: 70,
      cp1y: 80,
      cp2x: 90,
      cp2y: 100,
      type: 'cubic'
    });
    expect(points[3]).toEqual({ x: 10, y: 20, type: 'close' });
  });

  it('imports full SVG XML containing rect, circle, and text', () => {
    const svgXml = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
        <rect x="20" y="30" width="120" height="80" rx="10" fill="#ff5722" stroke="#000000" stroke-width="2" />
        <circle cx="200" cy="150" r="40" fill="#4caf50" />
        <text x="300" y="100" font-size="32" font-family="Inter, sans-serif" fill="#2196f3">Hello Kinetic</text>
      </svg>
    `;

    const { nodes, viewBox } = importSvgString(svgXml);

    expect(viewBox).toEqual({ width: 800, height: 600 });
    expect(nodes.length).toBe(3);

    // Rect
    expect(nodes[0].type).toBe('rect');
    expect(nodes[0].x).toBe(20);
    expect(nodes[0].y).toBe(30);
    expect(nodes[0].width).toBe(120);
    expect(nodes[0].height).toBe(80);
    expect(nodes[0].borderRadius).toBe(10);
    expect(nodes[0].fill).toBe('#ff5722');
    expect(nodes[0].stroke).toBe('#000000');
    expect(nodes[0].strokeWidth).toBe(2);

    // Circle
    expect(nodes[1].type).toBe('circle');
    expect(nodes[1].x).toBe(160);
    expect(nodes[1].y).toBe(110);
    expect(nodes[1].width).toBe(80);
    expect(nodes[1].height).toBe(80);
    expect(nodes[1].fill).toBe('#4caf50');

    // Text
    expect(nodes[2].type).toBe('text');
    expect(nodes[2].textContent).toBe('Hello Kinetic');
    expect(nodes[2].fontSize).toBe(32);
  });
});
