import { NodeTrigger, TriggerEvent, SceneNode } from './types';
import { RuntimeCommand } from './stateMachine/runtimeCommands';

export * from './stateMachine/runtimeCommands';
export * from './stateMachine/runtimeStateMachine';

/**
 * Pure Evaluation: Transforms a NodeTrigger into deterministic RuntimeCommands.
 * ZERO mutation, ZERO React/Zustand/UI dependency.
 */
export function evaluateTriggerAction(
  trigger: NodeTrigger,
  nodeId: string
): RuntimeCommand[] {
  const commands: RuntimeCommand[] = [];

  switch (trigger.action) {
    case 'jumpToTime':
      if (typeof trigger.targetTime === 'number') {
        commands.push({
          type: 'jumpToTime',
          targetTime: trigger.targetTime,
          message: `Trigger: Jumped to ${trigger.targetTime.toFixed(2)}s`
        });
      }
      break;

    case 'togglePlay':
      commands.push({
        type: 'togglePlay',
        message: 'Trigger: Toggled playback'
      });
      break;

    case 'play':
      commands.push({
        type: 'play',
        message: 'Trigger: Playing animation'
      });
      break;

    case 'setProperties':
      if (trigger.propertyUpdates) {
        commands.push({
          type: 'setProperties',
          nodeId,
          propertyUpdates: trigger.propertyUpdates,
          message: 'Trigger: Updated node properties'
        });
      }
      break;
  }

  return commands;
}

/**
 * Pure Evaluation: Evaluates matching node triggers for an event and produces RuntimeCommands.
 */
export function evaluateNodeTriggerEvents(
  node: SceneNode,
  event: TriggerEvent
): RuntimeCommand[] {
  if (!node.triggers || node.triggers.length === 0) return [];

  const commands: RuntimeCommand[] = [];
  for (const trigger of node.triggers) {
    if (trigger.event === event) {
      commands.push(...evaluateTriggerAction(trigger, node.id));
    }
  }

  return commands;
}

/**
 * Backward-compatible execution adapter: Executes runtime commands against store/action callbacks.
 */
export function executeTriggerAction(
  trigger: NodeTrigger,
  nodeId: string,
  actions: {
    setCurrentTime: (t: number) => void;
    setPlaying: (p: boolean) => void;
    updateNode: (id: string, updates: Partial<SceneNode>) => void;
    showToast?: (msg: string) => void;
    isPlaying?: boolean;
  }
) {
  const commands = evaluateTriggerAction(trigger, nodeId);
  for (const cmd of commands) {
    switch (cmd.type) {
      case 'jumpToTime':
        actions.setCurrentTime(cmd.targetTime);
        if (cmd.message) actions.showToast?.(cmd.message);
        break;

      case 'togglePlay':
        actions.setPlaying(!actions.isPlaying);
        actions.showToast?.(`Trigger: ${actions.isPlaying ? 'Paused' : 'Playing'}`);
        break;

      case 'play':
        actions.setPlaying(true);
        if (cmd.message) actions.showToast?.(cmd.message);
        break;

      case 'setProperties':
        actions.updateNode(cmd.nodeId, cmd.propertyUpdates);
        if (cmd.message) actions.showToast?.(cmd.message);
        break;
    }
  }
}

/**
 * Backward-compatible event handler adapter.
 */
export function handleNodeTriggerEvent(
  node: SceneNode,
  event: TriggerEvent,
  actions: {
    setCurrentTime: (t: number) => void;
    setPlaying: (p: boolean) => void;
    updateNode: (id: string, updates: Partial<SceneNode>) => void;
    showToast?: (msg: string) => void;
    isPlaying?: boolean;
  }
) {
  if (!node.triggers || node.triggers.length === 0) return;

  const commands = evaluateNodeTriggerEvents(node, event);
  for (const cmd of commands) {
    switch (cmd.type) {
      case 'jumpToTime':
        actions.setCurrentTime(cmd.targetTime);
        if (cmd.message) actions.showToast?.(cmd.message);
        break;

      case 'togglePlay':
        actions.setPlaying(!actions.isPlaying);
        actions.showToast?.(`Trigger: ${actions.isPlaying ? 'Paused' : 'Playing'}`);
        break;

      case 'play':
        actions.setPlaying(true);
        if (cmd.message) actions.showToast?.(cmd.message);
        break;

      case 'setProperties':
        actions.updateNode(cmd.nodeId, cmd.propertyUpdates);
        if (cmd.message) actions.showToast?.(cmd.message);
        break;
    }
  }
}
