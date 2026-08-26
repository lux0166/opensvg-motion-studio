import { describe, it, expect } from 'vitest';
import { evaluateTriggerAction, evaluateNodeTriggerEvents } from '../index';
import { NodeTrigger, SceneNode } from '../../types';

describe('Decoupled State Machine & Runtime Commands (P0)', () => {
  it('evaluates jumpToTime trigger into deterministic JumpToTimeCommand', () => {
    const trigger: NodeTrigger = {
      id: 'trg-jump',
      event: 'onClick',
      action: 'jumpToTime',
      targetTime: 2.5
    };

    const commands = evaluateTriggerAction(trigger, 'node-1');
    expect(commands).toHaveLength(1);
    expect(commands[0].type).toBe('jumpToTime');
    if (commands[0].type === 'jumpToTime') {
      expect(commands[0].targetTime).toBe(2.5);
    }
  });

  it('evaluates togglePlay trigger into deterministic TogglePlayCommand', () => {
    const trigger: NodeTrigger = {
      id: 'trg-toggle',
      event: 'onHoverEnter',
      action: 'togglePlay'
    };

    const commands = evaluateTriggerAction(trigger, 'node-1');
    expect(commands).toHaveLength(1);
    expect(commands[0].type).toBe('togglePlay');
  });

  it('evaluates setProperties trigger into deterministic SetPropertiesCommand', () => {
    const trigger: NodeTrigger = {
      id: 'trg-props',
      event: 'onClick',
      action: 'setProperties',
      propertyUpdates: { fill: '#ff0000', opacity: 0.5 }
    };

    const commands = evaluateTriggerAction(trigger, 'node-btn');
    expect(commands).toHaveLength(1);
    expect(commands[0].type).toBe('setProperties');
    if (commands[0].type === 'setProperties') {
      expect(commands[0].nodeId).toBe('node-btn');
      expect(commands[0].propertyUpdates).toEqual({ fill: '#ff0000', opacity: 0.5 });
    }
  });

  it('evaluates node triggers without modifying node or requiring store/React', () => {
    const node: SceneNode = {
      id: 'interactive-box',
      name: 'Interactive Box',
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
      borderRadius: 0,
      fill: '#ffffff',
      tracks: [],
      triggers: [
        { id: 't1', event: 'onClick', action: 'play' },
        { id: 't2', event: 'onHoverEnter', action: 'setProperties', propertyUpdates: { opacity: 0.8 } }
      ]
    };

    const clickCommands = evaluateNodeTriggerEvents(node, 'onClick');
    expect(clickCommands).toHaveLength(1);
    expect(clickCommands[0].type).toBe('play');

    const hoverCommands = evaluateNodeTriggerEvents(node, 'onHoverEnter');
    expect(hoverCommands).toHaveLength(1);
    expect(hoverCommands[0].type).toBe('setProperties');

    // Invariant: Zero mutation of input node
    expect(node.opacity).toBe(1);
    expect(node.triggers).toHaveLength(2);
  });
});
