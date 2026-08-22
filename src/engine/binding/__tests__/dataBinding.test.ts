import { describe, it, expect } from 'vitest';
import { DataBindingEngine, DataBinding } from '../dataBinding';
import { SceneNode } from '../../types';

describe('Data Binding Engine v1 (CORE-09 & Section 11)', () => {
  const sampleNodes: Record<string, SceneNode> = {
    heroBox: {
      id: 'heroBox', name: 'Hero Box', type: 'rect', visible: true, locked: false,
      x: 0, y: 0, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
      opacity: 1, borderRadius: 0, fill: '#ffffff', tracks: []
    }
  };

  it('evaluates direct data binding against node properties', () => {
    const engine = new DataBindingEngine();
    const binding: DataBinding = {
      id: 'bind-opacity',
      sourcePath: 'ViewModel.progress',
      targetNodeId: 'heroBox',
      targetProperty: 'opacity',
      dataType: 'number'
    };

    engine.registerBinding(binding);
    engine.setSourceValue('ViewModel.progress', 0.65);

    const updates = engine.evaluateBindings(sampleNodes);
    expect(updates.heroBox).toBeDefined();
    expect(updates.heroBox.opacity).toBe(0.65);
  });

  it('applies custom converter functions during binding evaluation', () => {
    const engine = new DataBindingEngine();
    const binding: DataBinding = {
      id: 'bind-color',
      sourcePath: 'status.isActive',
      targetNodeId: 'heroBox',
      targetProperty: 'fill',
      dataType: 'boolean',
      converter: (isActive: boolean) => (isActive ? '#22c55e' : '#ef4444')
    };

    engine.registerBinding(binding);

    engine.setSourceValue('status.isActive', true);
    let updates = engine.evaluateBindings(sampleNodes);
    expect(updates.heroBox.fill).toBe('#22c55e');

    engine.setSourceValue('status.isActive', false);
    updates = engine.evaluateBindings(sampleNodes);
    expect(updates.heroBox.fill).toBe('#ef4444');
  });
});
