import { SceneProject, SceneNode } from '../types';
import { evaluateNode } from '../animation/animationEvaluator';
import { Constraint, solveAllConstraints } from '../constraints/constraintSolver';
import { deriveRenderScene } from './renderState';
import { RenderScene, RenderNodeState } from './coreContracts';

export interface EvaluatedNodeState {
  id: string;
  name: string;
  type: string;
  evaluatedNode: SceneNode;
  renderState?: RenderNodeState;
}

export interface EvaluatedSceneState {
  projectId: string;
  time: number;
  duration: number;
  fps: number;
  evaluatedNodes: Record<string, SceneNode>;
  nodeOrder: string[];
  renderScene: RenderScene;
}

export interface EvaluationPipelineOptions {
  time?: number;
  constraints?: Constraint[];
  externalPropertyOverrides?: Record<string, Partial<SceneNode>>;
}

/**
 * OpenSVG Unified Evaluation Pipeline
 * Pipeline Architecture:
 * 1. Authoring Document (SceneProject)
 * 2. Scene Graph Hierarchy Traversal
 * 3. Animation Track Evaluation (Keyframes / Spring / Motion Path)
 * 4. Component / Binding Override Resolution
 * 5. Constraint Solver Execution (with cycle breaking)
 * 6. Evaluated Scene State Generation
 * 7. Render State Derivation (RenderScene)
 * 
 * INVARIANT: Zero mutation of input SceneProject during evaluation.
 */
export function evaluateScenePipeline(
  project: SceneProject,
  options: EvaluationPipelineOptions = {}
): EvaluatedSceneState {
  const time = options.time ?? 0;
  const originalNodes = project.nodes || {};
  const nodeOrder = project.nodeOrder || Object.keys(originalNodes);

  // Phase 1 & 2: Animation Evaluation
  const evaluatedMap: Record<string, SceneNode> = {};
  for (const id of nodeOrder) {
    const node = originalNodes[id];
    if (node) {
      evaluatedMap[id] = evaluateNode(node, time, originalNodes);
    }
  }

  // Phase 3: External / State Machine Property Overrides
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

  // Phase 4: Constraint Solving
  if (options.constraints && options.constraints.length > 0) {
    const solvedMap = solveAllConstraints(evaluatedMap, options.constraints);
    Object.assign(evaluatedMap, solvedMap);
  }

  // Phase 5 & 6: Produce evaluated node list in draw order
  const evaluatedList: SceneNode[] = [];
  for (const id of nodeOrder) {
    if (evaluatedMap[id]) {
      evaluatedList.push(evaluatedMap[id]);
    }
  }

  // Phase 7: Derive Render State
  const renderScene = deriveRenderScene(project, evaluatedList);

  return {
    projectId: project.id,
    time,
    duration: project.duration,
    fps: project.fps,
    evaluatedNodes: evaluatedMap,
    nodeOrder: [...nodeOrder],
    renderScene
  };
}
