import { describe, it, expect } from 'vitest';
import { exportToAnimatedSVG } from '../exporter';
import { FrameNode, SceneNode } from '../types';
import { useStudioStore } from '../../store/useStudioStore';

describe('Typography & Text Engine', () => {
  const rootFrame: FrameNode = {
    id: 'frame-1',
    name: 'Typography Frame',
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

  const textNode: SceneNode = {
    id: 'text-hero',
    name: 'Hero Title',
    type: 'text',
    visible: true,
    locked: false,
    x: 50,
    y: 80,
    width: 300,
    height: 60,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 0,
    fill: '#111827',
    textContent: 'Kinetic Motion Design',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 36,
    fontWeight: 700,
    textAlign: 'center',
    tracks: []
  };

  it('exports valid SVG text with correct font family, size and text-anchor', () => {
    const svg = exportToAnimatedSVG(rootFrame, [textNode], 3.0);
    expect(svg).toContain('<text');
    expect(svg).toContain('font-family="\'Space Grotesk\', sans-serif"');
    expect(svg).toContain('font-size="36"');
    expect(svg).toContain('font-weight="700"');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('>Kinetic Motion Design</text>');
  });

  it('updates text typography properties in the studio store', () => {
    useStudioStore.setState({
      nodes: { 'text-hero': textNode },
      nodeOrder: ['text-hero'],
      selectedId: 'text-hero'
    });

    useStudioStore.getState().updateNode('text-hero', {
      textContent: 'Updated Text Content',
      fontSize: 48,
      textAlign: 'right'
    });

    const updated = useStudioStore.getState().nodes['text-hero'];
    expect(updated.textContent).toBe('Updated Text Content');
    expect(updated.fontSize).toBe(48);
    expect(updated.textAlign).toBe('right');
  });
});
