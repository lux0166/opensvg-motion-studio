import { SceneNode } from '../types';
import {
  SemanticNode,
  NodeIdentity,
  NodeHierarchy,
  NodeTransform,
  NodeGeometry,
  NodeAppearance,
  NodeAnimation,
  NodeConstraint,
  NodeInteraction
} from './semanticTypes';

/**
 * Decomposes a legacy SceneNode into clear semantic components.
 */
export function decomposeSceneNode(node: SceneNode): SemanticNode {
  const identity: NodeIdentity = {
    id: node.id,
    name: node.name,
    type: node.type
  };

  const hierarchy: NodeHierarchy = {
    parentId: node.parentId ?? undefined,
    childrenIds: node.childrenIds ? [...node.childrenIds] : undefined
  };

  const transform: NodeTransform = {
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation || 0,
    scaleX: node.scaleX ?? 1,
    scaleY: node.scaleY ?? 1,
    pivotX: node.pivotX ?? 0.5,
    pivotY: node.pivotY ?? 0.5
  };

  const geometry: NodeGeometry = {
    pathPoints: node.pathPoints ? JSON.parse(JSON.stringify(node.pathPoints)) : undefined,
    subPaths: node.subPaths ? JSON.parse(JSON.stringify(node.subPaths)) : undefined,
    borderRadius: node.borderRadius ?? 0,
    textContent: node.textContent,
    fontSize: node.fontSize,
    fontFamily: node.fontFamily,
    fontWeight: node.fontWeight,
    letterSpacing: node.letterSpacing,
    lineHeight: node.lineHeight,
    textAlign: node.textAlign
  };

  const appearance: NodeAppearance = {
    fill: node.fill ?? '#000000',
    fillType: node.fillType,
    fillRule: node.fillRule,
    stroke: node.stroke,
    strokeWidth: node.strokeWidth,
    opacity: node.opacity ?? 1,
    visible: node.visible !== false,
    locked: node.locked === true,
    strokeCap: node.strokeCap,
    strokeJoin: node.strokeJoin,
    strokeDash: node.strokeDash ? [...node.strokeDash] : undefined,
    trimStart: node.trimStart,
    trimEnd: node.trimEnd,
    trimOffset: node.trimOffset,
    linearGradient: node.linearGradient ? JSON.parse(JSON.stringify(node.linearGradient)) : undefined,
    radialGradient: node.radialGradient ? JSON.parse(JSON.stringify(node.radialGradient)) : undefined,
    shadowBlur: node.shadowBlur,
    shadowColor: node.shadowColor,
    shadowOffsetX: node.shadowOffsetX,
    shadowOffsetY: node.shadowOffsetY,
    filterBlur: node.filterBlur
  };

  const animation: NodeAnimation = {
    tracks: node.tracks ? JSON.parse(JSON.stringify(node.tracks)) : []
  };

  const constraint: NodeConstraint = {
    constraints: (node as any).constraints ? JSON.parse(JSON.stringify((node as any).constraints)) : undefined
  };

  const interaction: NodeInteraction = {
    triggers: node.triggers ? JSON.parse(JSON.stringify(node.triggers)) : undefined,
    motionPath: node.motionPath ? JSON.parse(JSON.stringify(node.motionPath)) : undefined
  };

  return {
    identity,
    hierarchy,
    transform,
    geometry,
    appearance,
    animation,
    constraint,
    interaction
  };
}

/**
 * Re-composes a SemanticNode back into a compatible SceneNode.
 */
export function recomposeSceneNode(semantic: SemanticNode): SceneNode {
  const { identity, hierarchy, transform, geometry, appearance, animation, constraint, interaction } = semantic;

  const node: SceneNode = {
    id: identity.id,
    name: identity.name,
    type: identity.type as any,
    x: transform.x,
    y: transform.y,
    width: transform.width,
    height: transform.height,
    rotation: transform.rotation,
    scaleX: transform.scaleX,
    scaleY: transform.scaleY,
    pivotX: transform.pivotX,
    pivotY: transform.pivotY,
    visible: appearance.visible,
    locked: appearance.locked,
    opacity: appearance.opacity,
    fill: appearance.fill,
    fillType: appearance.fillType,
    fillRule: appearance.fillRule,
    stroke: appearance.stroke,
    strokeWidth: appearance.strokeWidth,
    strokeCap: appearance.strokeCap,
    strokeJoin: appearance.strokeJoin,
    strokeDash: appearance.strokeDash,
    trimStart: appearance.trimStart,
    trimEnd: appearance.trimEnd,
    trimOffset: appearance.trimOffset,
    linearGradient: appearance.linearGradient,
    radialGradient: appearance.radialGradient,
    shadowBlur: appearance.shadowBlur,
    shadowColor: appearance.shadowColor,
    shadowOffsetX: appearance.shadowOffsetX,
    shadowOffsetY: appearance.shadowOffsetY,
    filterBlur: appearance.filterBlur,
    borderRadius: geometry.borderRadius,
    pathPoints: geometry.pathPoints,
    subPaths: geometry.subPaths,
    textContent: geometry.textContent,
    fontSize: geometry.fontSize,
    fontFamily: geometry.fontFamily,
    fontWeight: geometry.fontWeight,
    letterSpacing: geometry.letterSpacing,
    lineHeight: geometry.lineHeight,
    textAlign: geometry.textAlign,
    parentId: hierarchy.parentId,
    childrenIds: hierarchy.childrenIds,
    tracks: animation.tracks,
    triggers: interaction.triggers,
    motionPath: interaction.motionPath
  };

  if (constraint.constraints) {
    (node as any).constraints = constraint.constraints;
  }

  return node;
}
