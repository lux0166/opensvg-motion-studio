import { TriggerEvent } from '../types';

export type RuntimeCommandType =
  | 'jumpToTime'
  | 'togglePlay'
  | 'play'
  | 'pause'
  | 'setProperties'
  | 'showToast';

export interface BaseRuntimeCommand {
  type: RuntimeCommandType;
  message?: string;
}

export interface JumpToTimeCommand extends BaseRuntimeCommand {
  type: 'jumpToTime';
  targetTime: number;
}

export interface TogglePlayCommand extends BaseRuntimeCommand {
  type: 'togglePlay';
}

export interface PlayCommand extends BaseRuntimeCommand {
  type: 'play';
}

export interface PauseCommand extends BaseRuntimeCommand {
  type: 'pause';
}

export interface SetPropertiesCommand extends BaseRuntimeCommand {
  type: 'setProperties';
  nodeId: string;
  propertyUpdates: Record<string, any>;
}

export interface ShowToastCommand extends BaseRuntimeCommand {
  type: 'showToast';
  message: string;
}

export type RuntimeCommand =
  | JumpToTimeCommand
  | TogglePlayCommand
  | PlayCommand
  | PauseCommand
  | SetPropertiesCommand
  | ShowToastCommand;

export interface RuntimeEvent {
  type: TriggerEvent;
  nodeId?: string;
  timestamp?: number;
  data?: Record<string, any>;
}
