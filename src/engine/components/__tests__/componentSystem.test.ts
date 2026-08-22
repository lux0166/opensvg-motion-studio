import { describe, it, expect } from 'vitest';
import { ComponentRegistry, ComponentDefinition } from '../componentSystem';

describe('Component / Instance System (CORE-08 & Section 10)', () => {
  const buttonDef: ComponentDefinition = {
    id: 'def-btn-primary',
    name: 'Primary Button',
    rootNode: {
      id: 'btn-root', name: 'Button Root', type: 'rect', visible: true, locked: false,
      x: 0, y: 0, width: 140, height: 48, rotation: 0, scaleX: 1, scaleY: 1,
      opacity: 1, borderRadius: 8, fill: '#3b82f6', tracks: []
    }
  };

  it('creates definition and instantiates multiple instances', () => {
    const registry = new ComponentRegistry();
    registry.register(buttonDef);

    const inst1 = registry.instantiate('def-btn-primary', 'btn-inst-1', 'Button 1', { x: 50, y: 100 });
    const inst2 = registry.instantiate('def-btn-primary', 'btn-inst-2', 'Button 2', { x: 50, y: 200 }, { fill: '#10b981' });

    expect(inst1.id).toBe('btn-inst-1');
    expect(inst2.id).toBe('btn-inst-2');

    const node1 = registry.resolveInstance(inst1);
    const node2 = registry.resolveInstance(inst2);

    expect(node1.fill).toBe('#3b82f6'); // default from master
    expect(node2.fill).toBe('#10b981'); // overridden
  });

  it('propagates master definition updates to instances without overrides', () => {
    const registry = new ComponentRegistry();
    registry.register(buttonDef);

    const inst1 = registry.instantiate('def-btn-primary', 'btn-1', 'Button 1', { x: 0, y: 0 });
    const inst2 = registry.instantiate('def-btn-primary', 'btn-2', 'Button 2', { x: 0, y: 0 }, { borderRadius: 24 });

    // Modify master component definition (e.g. change borderRadius from 8 to 16, and width to 160)
    registry.updateDefinition('def-btn-primary', (def) => {
      def.rootNode.borderRadius = 16;
      def.rootNode.width = 160;
    });

    const resolved1 = registry.resolveInstance(inst1);
    const resolved2 = registry.resolveInstance(inst2);

    // inst1 reflects both updates
    expect(resolved1.width).toBe(160);
    expect(resolved1.borderRadius).toBe(16);

    // inst2 reflects width update, but preserves its local override of borderRadius = 24
    expect(resolved2.width).toBe(160);
    expect(resolved2.borderRadius).toBe(24);
  });
});
