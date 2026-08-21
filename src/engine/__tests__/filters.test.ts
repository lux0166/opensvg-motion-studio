import { describe, it, expect } from 'vitest';
import { exportToAnimatedSVG } from '../exporter';
import { FrameNode, SceneNode } from '../types';
import { useStudioStore } from '../../store/useStudioStore';

describe('Visual Filter Effects Engine', () => {
  const rootFrame: FrameNode = {
    id: 'frame-1',
    name: 'Effects Frame',
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

  const shadowNode: SceneNode = {
    id: 'glow-card',
    name: 'Glow Card',
    type: 'rect',
    visible: true,
    locked: false,
    x: 100,
    y: 100,
    width: 150,
    height: 150,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 16,
    fill: '#6366f1',
    shadowColor: 'rgba(99, 102, 241, 0.5)',
    shadowBlur: 24,
    shadowOffsetX: 4,
    shadowOffsetY: 8,
    filterBlur: 4,
    tracks: []
  };

  it('exports SVG with feDropShadow and feGaussianBlur filter elements', () => {
    const svg = exportToAnimatedSVG(rootFrame, [shadowNode], 3.0);
    expect(svg).toContain('<filter id="filter-glow-card"');
    expect(svg).toContain('<feDropShadow');
    expect(svg).toContain('dx="4"');
    expect(svg).toContain('dy="8"');
    expect(svg).toContain('flood-color="rgba(99, 102, 241, 0.5)"');
    expect(svg).toContain('<feGaussianBlur stdDeviation="4"');
    expect(svg).toContain('filter="url(#filter-glow-card)"');
  });

  it('updates shadow and filter properties in store', () => {
    useStudioStore.setState({
      nodes: { 'glow-card': shadowNode },
      nodeOrder: ['glow-card'],
      selectedId: 'glow-card'
    });

    useStudioStore.getState().updateNode('glow-card', {
      shadowBlur: 32,
      filterBlur: 8
    });

    const updated = useStudioStore.getState().nodes['glow-card'];
    expect(updated.shadowBlur).toBe(32);
    expect(updated.filterBlur).toBe(8);
  });
});
