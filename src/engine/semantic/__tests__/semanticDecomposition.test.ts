import { describe, it, expect } from 'vitest';
import { decomposeSceneNode, recomposeSceneNode } from '../index';
import { SceneNode } from '../../types';

describe('Semantic Node Decomposition & Recomposition', () => {
  const sampleNode: SceneNode = {
    id: 'node-card',
    name: 'Card Container',
    type: 'rect',
    visible: true,
    locked: false,
    x: 100,
    y: 150,
    width: 250,
    height: 180,
    rotation: 45,
    scaleX: 1.2,
    scaleY: 1.2,
    pivotX: 0.5,
    pivotY: 0.5,
    opacity: 0.9,
    fill: '#8b5cf6',
    stroke: '#ffffff',
    strokeWidth: 2,
    strokeCap: 'round',
    strokeJoin: 'round',
    borderRadius: 16,
    shadowBlur: 10,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    tracks: [
      {
        id: 'tr-1',
        property: 'x',
        label: 'Position X',
        unit: 'px',
        color: '#8b5cf6',
        keyframes: [{ id: 'k1', time: 0, value: 100 }]
      }
    ],
    triggers: [
      {
        id: 'trg-1',
        event: 'onClick',
        action: 'togglePlay'
      }
    ]
  };

  it('decomposes SceneNode into isolated semantic components', () => {
    const semantic = decomposeSceneNode(sampleNode);

    expect(semantic.identity.id).toBe('node-card');
    expect(semantic.identity.name).toBe('Card Container');
    expect(semantic.identity.type).toBe('rect');

    expect(semantic.transform.x).toBe(100);
    expect(semantic.transform.rotation).toBe(45);
    expect(semantic.transform.scaleX).toBe(1.2);

    expect(semantic.geometry.borderRadius).toBe(16);

    expect(semantic.appearance.fill).toBe('#8b5cf6');
    expect(semantic.appearance.strokeWidth).toBe(2);
    expect(semantic.appearance.opacity).toBe(0.9);

    expect(semantic.animation.tracks).toHaveLength(1);
    expect(semantic.interaction.triggers).toHaveLength(1);
  });

  it('faithfully recomposes SemanticNode back to compatible SceneNode', () => {
    const semantic = decomposeSceneNode(sampleNode);
    const recomposed = recomposeSceneNode(semantic);

    expect(recomposed.id).toBe(sampleNode.id);
    expect(recomposed.name).toBe(sampleNode.name);
    expect(recomposed.type).toBe(sampleNode.type);
    expect(recomposed.x).toBe(sampleNode.x);
    expect(recomposed.y).toBe(sampleNode.y);
    expect(recomposed.width).toBe(sampleNode.width);
    expect(recomposed.height).toBe(sampleNode.height);
    expect(recomposed.rotation).toBe(sampleNode.rotation);
    expect(recomposed.fill).toBe(sampleNode.fill);
    expect(recomposed.tracks).toEqual(sampleNode.tracks);
    expect(recomposed.triggers).toEqual(sampleNode.triggers);
  });
});
