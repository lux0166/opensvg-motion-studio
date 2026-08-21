import { NodeTrigger, TriggerEvent, SceneNode } from './types';

/**
 * Interactive State Machine Engine for Canvas & Motion Events
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
  switch (trigger.action) {
    case 'jumpToTime':
      if (typeof trigger.targetTime === 'number') {
        actions.setCurrentTime(trigger.targetTime);
        actions.showToast?.(`Trigger: Jumped to ${trigger.targetTime.toFixed(2)}s`);
      }
      break;

    case 'togglePlay':
      actions.setPlaying(!actions.isPlaying);
      actions.showToast?.(`Trigger: ${actions.isPlaying ? 'Paused' : 'Playing'}`);
      break;

    case 'play':
      actions.setPlaying(true);
      actions.showToast?.('Trigger: Playing animation');
      break;

    case 'setProperties':
      if (trigger.propertyUpdates) {
        actions.updateNode(nodeId, trigger.propertyUpdates);
        actions.showToast?.('Trigger: Updated node properties');
      }
      break;
  }
}

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

  for (const trigger of node.triggers) {
    if (trigger.event === event) {
      executeTriggerAction(trigger, node.id, actions);
    }
  }
}
