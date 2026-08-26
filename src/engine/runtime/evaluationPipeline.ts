import { SceneProject, SceneNode } from '../types';
import { evaluateNode } from '../animation/animationEvaluator';
import { Constraint, solveAllConstraints } from '../constraints/constraintSolver';
import { ComponentRegistry, ComponentInstance } from '../components/componentSystem';
import { DataBindingEngine } from '../binding/dataBinding';
import { StateMachineRuntime } from '../stateMachine/runtimeStateMachine';
import { applyStateMachineToScene } from '../stateMachine/stateEvaluator';
import { composeTransform, multiplyMatrices } from '../transform/matrix2D';
import { deriveRenderScene } from './renderState';
import { RenderScene, RenderNodeState, Matrix2D } from './coreContracts';

export interface EvaluatedNodeState {
  id: string;
  name: string;
  type: string;
  evaluatedNode: SceneNode;
  worldTransform: Matrix2D;
  totalOpacity: number;
  renderState?: RenderNodeState;
}

export interface EvaluatedSceneState {
  projectId: string;
  time: number;
  duration: number;
  fps: number;
  evaluatedNodes: Record<string, SceneNode>;
  nodeStates: Record<string, EvaluatedNodeState>;
  nodeOrder: string[];
  renderScene: RenderScene;
}

export interface EvaluationPipelineOptions {
  time?: number;
  constraints?: Constraint[];
  componentInstances?: ComponentInstance[];
  componentRegistry?: ComponentRegistry;
  dataBindingEngine?: DataBindingEngine;
  stateMachineRuntime?: StateMachineRuntime | StateMachineRuntime[];
  externalPropertyOverrides?: Record<string, Partial<SceneNode>>;
}

/**
 * Resolves world transforms for all nodes in topological hierarchy order with visited-set cycle detection (Rule CORE-02 & P1)
 * Invariant: No artificial depth limit (arbitrarily deep hierarchy is supported safely).
 */
export function computeCanonicalWorldTransforms(
  nodes: Record<string, SceneNode>,
  nodeOrder: string[]
): Record<string, { worldTransform: Matrix2D; totalOpacity: number }> {
  const result: Record<string, { worldTransform: Matrix2D; totalOpacity: number }> = {};
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function resolveNodeTransform(nodeId: string): { worldTransform: Matrix2D; totalOpacity: number } {
    if (visited.has(nodeId)) {
      return result[nodeId];
    }

    if (visiting.has(nodeId)) {
      console.warn(`Hierarchy cycle detected for node: ${nodeId}; breaking cycle.`);
      const identity: Matrix2D = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
      result[nodeId] = { worldTransform: identity, totalOpacity: 1 };
      return result[nodeId];
    }

    visiting.add(nodeId);
    const node = nodes[nodeId];

    if (!node) {
      visiting.delete(nodeId);
      visited.add(nodeId);
      const identity: Matrix2D = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
      result[nodeId] = { worldTransform: identity, totalOpacity: 1 };
      return result[nodeId];
    }

    const localMatrix = composeTransform(
      {
        translation: { x: node.x || 0, y: node.y || 0 },
        rotation: node.rotation || 0,
        scale: { x: node.scaleX ?? 1, y: node.scaleY ?? 1 },
        pivot: { x: node.pivotX ?? 0.5, y: node.pivotY ?? 0.5 }
      },
      node.width,
      node.height
    );

    let worldTransform = localMatrix;
    let totalOpacity = node.opacity ?? 1;

    if (node.parentId && nodes[node.parentId]) {
      const parentResult = resolveNodeTransform(node.parentId);
      worldTransform = multiplyMatrices(parentResult.worldTransform, localMatrix);
      totalOpacity *= parentResult.totalOpacity;
    }

    visiting.delete(nodeId);
    visited.add(nodeId);

    const evaluated = {
      worldTransform,
      totalOpacity: Math.max(0, Math.min(1, totalOpacity))
    };

    result[nodeId] = evaluated;
    return evaluated;
  }

  for (const id of nodeOrder) {
    if (!visited.has(id)) {
      resolveNodeTransform(id);
    }
  }

  return result;
}

/**
 * OpenSVG Unified Evaluation Pipeline (Single Source of Evaluation Truth)
 * 
 * Pipeline Architecture:
 * 1. Authoring Document Input (SceneProject)
 * 2. Component / Instance Resolution (ComponentRegistry)
 * 3. Animation Track Evaluation (Keyframes / Spring / Motion Path)
 * 4. Data Binding Resolution (DataBindingEngine)
 * 5. State Machine Runtime Active State Resolution (StateMachineRuntime)
 * 6. External Property Overrides
 * 7. Constraint Solver Execution (with cycle breaking)
 * 8. Canonical World Transform Resolution (topological hierarchy)
 * 9. Evaluated Scene State & Render Scene Derivation
 * 
 * INVARIANT: Zero mutation of input SceneProject during evaluation.
 */
export function evaluateScenePipeline(
  project: SceneProject,
  options: EvaluationPipelineOptions = {}
): EvaluatedSceneState {
  const time = options.time ?? 0;
  const originalNodes = project.nodes || {};
  let nodeOrder = [...(project.nodeOrder || Object.keys(originalNodes))];
  const workingNodes: Record<string, SceneNode> = { ...originalNodes };

  // Phase 1: Component Instance Resolution (with full child hierarchy)
  if (options.componentRegistry && options.componentInstances) {
    for (const inst of options.componentInstances) {
      try {
        const resolvedNodes = options.componentRegistry.resolveInstanceHierarchy
          ? options.componentRegistry.resolveInstanceHierarchy(inst)
          : [options.componentRegistry.resolveInstance(inst)];
        for (const resolvedNode of resolvedNodes) {
          workingNodes[resolvedNode.id] = resolvedNode;
          if (!nodeOrder.includes(resolvedNode.id)) {
            nodeOrder.push(resolvedNode.id);
          }
        }
      } catch (err) {
        console.warn(`Failed to resolve component instance ${inst.id}:`, err);
      }
    }
  }

  // Ensure all nodes in workingNodes (including grouped/nested children) are in nodeOrder
  for (const id of Object.keys(workingNodes)) {
    if (!nodeOrder.includes(id)) {
      nodeOrder.push(id);
    }
  }

  // Phase 2: Animation Track Evaluation
  const evaluatedMap: Record<string, SceneNode> = {};
  for (const id of nodeOrder) {
    const node = workingNodes[id];
    if (node) {
      evaluatedMap[id] = evaluateNode(node, time, workingNodes);
    }
  }

  // Phase 3: Data Binding Evaluation
  if (options.dataBindingEngine) {
    const bindingUpdates = options.dataBindingEngine.evaluateBindings(evaluatedMap);
    for (const [nodeId, updates] of Object.entries(bindingUpdates)) {
      if (evaluatedMap[nodeId]) {
        evaluatedMap[nodeId] = {
          ...evaluatedMap[nodeId],
          ...updates
        };
      }
    }
  }

  // Phase 4: State Machine Runtime Evaluation (Consuming active state overrides & transition blending)
  if (options.stateMachineRuntime) {
    const smRuntimes = Array.isArray(options.stateMachineRuntime)
      ? options.stateMachineRuntime
      : [options.stateMachineRuntime];
    for (const smRuntime of smRuntimes) {
      applyStateMachineToScene(evaluatedMap, smRuntime);
    }
  }

  // Phase 5: External Property Overrides
  if (options.externalPropertyOverrides) {
    for (const [nodeId, overrides] of Object.entries(options.externalPropertyOverrides)) {
      if (evaluatedMap[nodeId]) {
        evaluatedMap[nodeId] = {
          ...evaluatedMap[nodeId],
          ...overrides
        };
      }
    }
  }

  // Phase 6: Constraint Solving
  if (options.constraints && options.constraints.length > 0) {
    const solvedMap = solveAllConstraints(evaluatedMap, options.constraints);
    Object.assign(evaluatedMap, solvedMap);
  }

  // Phase 7: Canonical World Transform Resolution
  const transformMap = computeCanonicalWorldTransforms(evaluatedMap, nodeOrder);

  // Phase 8: Build EvaluatedNodeStates and evaluated node list
  const nodeStates: Record<string, EvaluatedNodeState> = {};
  const evaluatedList: SceneNode[] = [];

  for (const id of nodeOrder) {
    const node = evaluatedMap[id];
    if (node) {
      evaluatedList.push(node);
      const tf = transformMap[id] || {
        worldTransform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
        totalOpacity: node.opacity ?? 1
      };

      nodeStates[id] = {
        id: node.id,
        name: node.name,
        type: node.type,
        evaluatedNode: node,
        worldTransform: tf.worldTransform,
        totalOpacity: tf.totalOpacity
      };
    }
  }

  // Phase 9: Derive Render State (pure mapping)
  const renderScene = deriveRenderScene(project, evaluatedList, transformMap, nodeOrder);

  return {
    projectId: project.id,
    time,
    duration: project.duration,
    fps: project.fps,
    evaluatedNodes: evaluatedMap,
    nodeStates,
    nodeOrder,
    renderScene
  };
}
