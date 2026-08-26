import { FrameNode, SceneNode } from './types';
import { StateMachineDefinition } from './stateMachine/runtimeStateMachine';
import { DocumentInteraction } from './interaction/interactionModel';
import { Constraint } from './constraints/constraintSolver';
import { DataBinding } from './binding/dataBinding';
import { ComponentDefinition, ComponentInstance } from './components/componentSystem';
import { AssetManifestEntry } from './format/nativeDocument';

export interface StudioSnapshot {
  rootFrame: FrameNode;
  nodes: Record<string, SceneNode>;
  nodeOrder: string[];
  stateMachines?: StateMachineDefinition[];
  interactions?: DocumentInteraction[];
  constraints?: Constraint[];
  bindings?: DataBinding[];
  components?: ComponentDefinition[];
  componentInstances?: ComponentInstance[];
  assets?: Record<string, AssetManifestEntry>;
  timestamp: number;
}

export const MAX_HISTORY_STEPS = 50;

/**
 * Creates an immutable snapshot of the canonical document model for undo/redo.
 * Strictly separates Document State from Ephemeral UI Selection State (Constitution Rule 82).
 */
export function createStudioSnapshot(
  rootFrame: FrameNode,
  nodes: Record<string, SceneNode>,
  nodeOrder: string[],
  extra?: {
    stateMachines?: StateMachineDefinition[];
    interactions?: DocumentInteraction[];
    constraints?: Constraint[];
    bindings?: DataBinding[];
    components?: ComponentDefinition[];
    componentInstances?: ComponentInstance[];
    assets?: Record<string, AssetManifestEntry>;
  }
): StudioSnapshot {
  return {
    rootFrame: JSON.parse(JSON.stringify(rootFrame)),
    nodes: JSON.parse(JSON.stringify(nodes)),
    nodeOrder: [...nodeOrder],
    stateMachines: extra?.stateMachines ? JSON.parse(JSON.stringify(extra.stateMachines)) : undefined,
    interactions: extra?.interactions ? JSON.parse(JSON.stringify(extra.interactions)) : undefined,
    constraints: extra?.constraints ? JSON.parse(JSON.stringify(extra.constraints)) : undefined,
    bindings: extra?.bindings ? JSON.parse(JSON.stringify(extra.bindings)) : undefined,
    components: extra?.components ? JSON.parse(JSON.stringify(extra.components)) : undefined,
    componentInstances: extra?.componentInstances ? JSON.parse(JSON.stringify(extra.componentInstances)) : undefined,
    assets: extra?.assets ? JSON.parse(JSON.stringify(extra.assets)) : undefined,
    timestamp: Date.now()
  };
}
