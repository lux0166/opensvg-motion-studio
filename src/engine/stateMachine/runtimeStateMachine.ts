import { SceneNode } from '../types';

/**
 * OpenSVG State Machine Runtime v2
 * Adheres strictly to CORE_ENGINE_DEPTH.md (Section 8) & RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md (CORE-06)
 * INVARIANT: Deterministic evaluation and replay without UI/React dependencies.
 */

export type StateMachineInputType = 'boolean' | 'number' | 'trigger';

export interface StateMachineInput {
  id: string;
  name: string;
  type: StateMachineInputType;
  value: boolean | number;
  fired?: boolean; // For trigger inputs
  min?: number;
  max?: number;
}

export type StateType = 'entry' | 'exit' | 'animation' | 'blend' | 'any';

export interface MachineState {
  id: string;
  name: string;
  type: StateType;
  timelineId?: string;
  duration?: number;
  propertyOverrides?: Record<string, Partial<SceneNode>>;
}

export type ConditionOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'fired';

export interface TransitionCondition {
  inputId: string;
  operator: ConditionOperator;
  value?: any;
}

export interface StateTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  duration: number; // Transition blend duration in seconds
  conditions: TransitionCondition[];
}

export interface StateMachineLayer {
  id: string;
  name: string;
  states: MachineState[];
  transitions: StateTransition[];
  defaultStateId: string;
}

export interface StateMachineDefinition {
  id: string;
  name: string;
  inputs: StateMachineInput[];
  layers: StateMachineLayer[];
}

export interface LayerRuntimeState {
  layerId: string;
  currentStateId: string;
  previousStateId?: string;
  transitionProgress: number; // 0.0 (just started) to 1.0 (completed)
  isTransitioning: boolean;
  timeInState: number;
}

export interface ReplayEvent {
  timestamp: number;
  action: 'setInput' | 'fireTrigger';
  inputId: string;
  value?: any;
}

export class StateMachineRuntime {
  private definition: StateMachineDefinition;
  private inputs: Map<string, StateMachineInput> = new Map();
  private layerStates: Map<string, LayerRuntimeState> = new Map();
  private recordedEvents: ReplayEvent[] = [];
  private currentTime: number = 0;

  constructor(definition: StateMachineDefinition) {
    this.definition = JSON.parse(JSON.stringify(definition));
    this.reset();
  }

  /**
   * Resets state machine to initial states and inputs
   */
  public reset(): void {
    this.inputs.clear();
    this.layerStates.clear();
    this.recordedEvents = [];
    this.currentTime = 0;

    for (const inp of this.definition.inputs) {
      const cloned = { ...inp };
      this.inputs.set(inp.id, cloned);
      this.inputs.set(inp.name, cloned);
    }

    for (const layer of this.definition.layers) {
      this.layerStates.set(layer.id, {
        layerId: layer.id,
        currentStateId: layer.defaultStateId,
        transitionProgress: 1.0,
        isTransitioning: false,
        timeInState: 0
      });
    }
  }

  /**
   * Sets input value by ID or Name
   */
  public setInput(nameOrId: string, value: boolean | number): void {
    const input = this.inputs.get(nameOrId);
    if (!input) return;

    if (input.type === 'number' && typeof value === 'number') {
      let clamped = value;
      if (input.min !== undefined) clamped = Math.max(input.min, clamped);
      if (input.max !== undefined) clamped = Math.min(input.max, clamped);
      input.value = clamped;
    } else if (input.type === 'boolean' && typeof value === 'boolean') {
      input.value = value;
    }

    this.recordedEvents.push({
      timestamp: this.currentTime,
      action: 'setInput',
      inputId: input.id,
      value
    });
  }

  /**
   * Fires a trigger input
   */
  public fireTrigger(nameOrId: string): void {
    const input = this.inputs.get(nameOrId);
    if (!input || input.type !== 'trigger') return;

    input.fired = true;
    this.recordedEvents.push({
      timestamp: this.currentTime,
      action: 'fireTrigger',
      inputId: input.id
    });
  }

  /**
   * Advances the state machine clock and evaluates transitions
   */
  public advance(dt: number): void {
    this.currentTime += dt;

    for (const layer of this.definition.layers) {
      const state = this.layerStates.get(layer.id);
      if (!state) continue;

      state.timeInState += dt;

      // 1. If not transitioning, check for new transition triggers
      if (!state.isTransitioning) {
        for (const trans of layer.transitions) {
          if (trans.fromStateId === state.currentStateId || trans.fromStateId === 'any') {
            if (this.evaluateConditions(trans.conditions)) {
              // Trigger transition
              state.previousStateId = state.currentStateId;
              state.currentStateId = trans.toStateId;
              state.timeInState = 0;
              state.transitionProgress = 0;
              state.isTransitioning = trans.duration > 0;
              if (!state.isTransitioning) {
                state.transitionProgress = 1.0;
              }
              break;
            }
          }
        }
      }

      // 2. Advance ongoing transition
      if (state.isTransitioning) {
        const trans = layer.transitions.find(
          (t) => t.fromStateId === state.previousStateId && t.toStateId === state.currentStateId
        );
        const transDuration = trans?.duration || 0;
        if (transDuration > 0) {
          state.transitionProgress = Math.min(1.0, state.transitionProgress + dt / transDuration);
          if (state.transitionProgress >= 1.0) {
            state.isTransitioning = false;
          }
        } else {
          state.isTransitioning = false;
          state.transitionProgress = 1.0;
        }
      }
    }

    // Reset trigger inputs after transition evaluation
    for (const inp of this.inputs.values()) {
      if (inp.type === 'trigger' && inp.fired) {
        inp.fired = false;
      }
    }
  }

  /**
   * Seeks state machine deterministically to time t by replaying recorded events
   */
  public seek(targetTime: number, stepDt: number = 0.016): void {
    const savedEvents = [...this.recordedEvents];
    this.reset();

    let t = 0;
    let eventIdx = 0;

    while (t <= targetTime) {
      while (eventIdx < savedEvents.length && savedEvents[eventIdx].timestamp <= t) {
        const ev = savedEvents[eventIdx];
        if (ev.action === 'setInput' && ev.value !== undefined) {
          const input = this.inputs.get(ev.inputId);
          if (input) input.value = ev.value;
        } else if (ev.action === 'fireTrigger') {
          const input = this.inputs.get(ev.inputId);
          if (input) input.fired = true;
        }
        eventIdx++;
      }

      this.advance(stepDt);
      t += stepDt;
    }

    this.currentTime = targetTime;
    this.recordedEvents = savedEvents;
  }

  private evaluateConditions(conditions: TransitionCondition[]): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const cond of conditions) {
      const input = this.inputs.get(cond.inputId);
      if (!input) return false;

      switch (cond.operator) {
        case '==':
          if (input.value !== cond.value) return false;
          break;
        case '!=':
          if (input.value === cond.value) return false;
          break;
        case '>':
          if (typeof input.value !== 'number' || input.value <= cond.value) return false;
          break;
        case '<':
          if (typeof input.value !== 'number' || input.value >= cond.value) return false;
          break;
        case '>=':
          if (typeof input.value !== 'number' || input.value < cond.value) return false;
          break;
        case '<=':
          if (typeof input.value !== 'number' || input.value > cond.value) return false;
          break;
        case 'fired':
          if (!input.fired) return false;
          break;
        default:
          return false;
      }
    }

    return true;
  }

  /**
   * Retrieves active state for a layer
   */
  public getLayerState(layerId: string): LayerRuntimeState | undefined {
    return this.layerStates.get(layerId);
  }

  public getLayerStates(): Map<string, LayerRuntimeState> {
    return this.layerStates;
  }

  public getDefinition(): StateMachineDefinition {
    return this.definition;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Forces a state transition on a specified layer
   */
  public forceState(layerId: string, stateId: string): void {
    let targetLayer = this.layerStates.get(layerId);
    if (!targetLayer) {
      const firstLayer = Array.from(this.layerStates.values())[0];
      if (firstLayer) {
        targetLayer = firstLayer;
      }
    }

    if (targetLayer) {
      targetLayer.previousStateId = targetLayer.currentStateId;
      targetLayer.currentStateId = stateId;
      targetLayer.timeInState = 0;
      targetLayer.isTransitioning = false;
      targetLayer.transitionProgress = 1.0;
    }
  }

  /**
   * Replays recorded events deterministically
   */
  public static replay(definition: StateMachineDefinition, events: ReplayEvent[], totalDuration: number, stepDt: number = 0.016): StateMachineRuntime {
    const runtime = new StateMachineRuntime(definition);
    let t = 0;
    let eventIdx = 0;

    while (t <= totalDuration) {
      while (eventIdx < events.length && events[eventIdx].timestamp <= t) {
        const ev = events[eventIdx];
        if (ev.action === 'setInput' && ev.value !== undefined) {
          runtime.setInput(ev.inputId, ev.value);
        } else if (ev.action === 'fireTrigger') {
          runtime.fireTrigger(ev.inputId);
        }
        eventIdx++;
      }

      runtime.advance(stepDt);
      t += stepDt;
    }

    return runtime;
  }

  public getRecordedEvents(): ReplayEvent[] {
    return [...this.recordedEvents];
  }
}
