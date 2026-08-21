import { describe, it, expect, vi } from 'vitest';
import { executeTriggerAction, handleNodeTriggerEvent } from '../stateMachine';
import { SceneNode, NodeTrigger } from '../types';
import { useStudioStore } from '../../store/useStudioStore';

describe('Interactive State Machine Engine', () => {
  const triggerJump: NodeTrigger = {
    id: 'trig-1',
    event: 'onClick',
    action: 'jumpToTime',
    targetTime: 2.5
  };

  const triggerToggle: NodeTrigger = {
    id: 'trig-2',
    event: 'onClick',
    action: 'togglePlay'
  };

  const interactiveNode: SceneNode = {
    id: 'btn-play',
    name: 'Play Button',
    type: 'rect',
    visible: true,
    locked: false,
    x: 10,
    y: 10,
    width: 80,
    height: 40,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 8,
    fill: '#10b981',
    triggers: [triggerJump, triggerToggle],
    tracks: []
  };

  it('executes jumpToTime trigger action', () => {
    const setCurrentTime = vi.fn();
    const setPlaying = vi.fn();
    const updateNode = vi.fn();

    executeTriggerAction(triggerJump, 'btn-play', {
      setCurrentTime,
      setPlaying,
      updateNode
    });

    expect(setCurrentTime).toHaveBeenCalledWith(2.5);
  });

  it('handles node triggers matching event type', () => {
    const setCurrentTime = vi.fn();
    const setPlaying = vi.fn();
    const updateNode = vi.fn();

    handleNodeTriggerEvent(interactiveNode, 'onClick', {
      setCurrentTime,
      setPlaying,
      updateNode,
      isPlaying: false
    });

    expect(setCurrentTime).toHaveBeenCalledWith(2.5);
    expect(setPlaying).toHaveBeenCalledWith(true);
  });

  it('manages triggers in studio store', () => {
    useStudioStore.setState({
      nodes: { 'btn-play': { ...interactiveNode, triggers: [] } },
      nodeOrder: ['btn-play'],
      selectedId: 'btn-play'
    });

    useStudioStore.getState().addTrigger('btn-play', triggerJump);
    expect(useStudioStore.getState().nodes['btn-play'].triggers?.length).toBe(1);

    useStudioStore.getState().removeTrigger('btn-play', 'trig-1');
    expect(useStudioStore.getState().nodes['btn-play'].triggers?.length).toBe(0);
  });
});
