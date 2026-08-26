/**
 * OpenSVG Document-Defined Interaction Model
 * Standardized per OPENSVG_CURRENT_STRATEGIC_ROADMAP.md (Section 1 & 10)
 * Invariant: Generic, extensible, and completely decoupled from adapter hardcoding.
 */

export type InteractionEventType =
  | 'pointerenter'
  | 'pointerleave'
  | 'pointerdown'
  | 'pointerup'
  | 'click'
  | 'dblclick';

export type InteractionAction =
  | { type: 'setInput'; inputName: string; value: boolean | number }
  | { type: 'fireTrigger'; triggerName: string }
  | { type: 'setState'; layerId?: string; stateId: string }
  | { type: 'seek'; time: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'togglePlay' };

export interface DocumentInteraction {
  id: string;
  name?: string;
  targetNodeId: string; // Target Node ID, or '*' for canvas-level interactions
  event: InteractionEventType;
  action: InteractionAction;
  enabled?: boolean;
}
