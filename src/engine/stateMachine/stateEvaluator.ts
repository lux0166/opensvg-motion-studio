import { SceneNode } from '../types';
import { StateMachineRuntime } from './runtimeStateMachine';
import { parseHexColor } from '../animation/colorInterpolation';

/**
 * Blends two property values (numbers, hex colors, booleans, strings) with interpolation progress t in [0, 1]
 */
export function blendValues(valPrev: any, valCurr: any, t: number): any {
  if (valPrev === undefined) return valCurr;
  if (valCurr === undefined) return valPrev;

  // Number interpolation
  if (typeof valPrev === 'number' && typeof valCurr === 'number') {
    return parseFloat((valPrev + (valCurr - valPrev) * t).toFixed(4));
  }

  // Hex color interpolation
  if (
    typeof valPrev === 'string' &&
    typeof valCurr === 'string' &&
    valPrev.startsWith('#') &&
    valCurr.startsWith('#')
  ) {
    const [r0, g0, b0] = parseHexColor(valPrev);
    const [r1, g1, b1] = parseHexColor(valCurr);
    const r = Math.round(r0 + (r1 - r0) * t);
    const g = Math.round(g0 + (g1 - g0) * t);
    const b = Math.round(b0 + (b1 - b0) * t);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  // Discrete value switch at midpoint
  return t >= 0.5 ? valCurr : valPrev;
}

/**
 * Evaluates active State Machine layers and blends state-driven property overrides directly into evaluated scene nodes.
 * Standardized per OPENSVG_CURRENT_STRATEGIC_ROADMAP.md (Section 3 & P0 Direct State Machine Pipeline).
 */
export function applyStateMachineToScene(
  evaluatedMap: Record<string, SceneNode>,
  stateMachine: StateMachineRuntime
): void {
  const def = stateMachine.getDefinition();
  if (!def || !def.layers) return;

  for (const layer of def.layers) {
    const layerState = stateMachine.getLayerState(layer.id);
    if (!layerState) continue;

    const currState = layer.states.find((s) => s.id === layerState.currentStateId);
    if (!currState) continue;

    const isTransitioning = layerState.isTransitioning && !!layerState.previousStateId;
    const prevState = isTransitioning
      ? layer.states.find((s) => s.id === layerState.previousStateId)
      : undefined;

    if (!isTransitioning || !prevState) {
      // 1. Direct State Application (Non-transitioning)
      if (currState.propertyOverrides) {
        for (const [nodeId, overrides] of Object.entries(currState.propertyOverrides)) {
          if (evaluatedMap[nodeId] && overrides) {
            evaluatedMap[nodeId] = {
              ...evaluatedMap[nodeId],
              ...overrides
            };
          }
        }
      }
    } else {
      // 2. Smooth State Transition Blending (Cross-fading between previous and current state)
      const t = Math.max(0, Math.min(1, layerState.transitionProgress));
      const prevOverrides = prevState.propertyOverrides || {};
      const currOverrides = currState.propertyOverrides || {};

      const nodeIds = new Set([...Object.keys(prevOverrides), ...Object.keys(currOverrides)]);

      for (const nodeId of nodeIds) {
        const targetNode = evaluatedMap[nodeId];
        if (!targetNode) continue;

        const nodePrev = prevOverrides[nodeId] || {};
        const nodeCurr = currOverrides[nodeId] || {};
        const propKeys = new Set([...Object.keys(nodePrev), ...Object.keys(nodeCurr)]);

        const blendedOverrides: Record<string, any> = {};

        for (const key of propKeys) {
          const valPrev = (nodePrev as any)[key] ?? (targetNode as any)[key];
          const valCurr = (nodeCurr as any)[key] ?? (targetNode as any)[key];
          blendedOverrides[key] = blendValues(valPrev, valCurr, t);
        }

        evaluatedMap[nodeId] = {
          ...targetNode,
          ...blendedOverrides
        };
      }
    }
  }
}
