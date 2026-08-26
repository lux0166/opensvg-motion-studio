import { SceneProject, SceneNode, FrameNode, PropertyTrack, Keyframe } from '../types';

/**
 * Creates a clean, high-performance runtime snapshot of a SceneProject,
 * preserving 100% of semantic & animation properties while isolating object references.
 * Standardized per OPENSVG_CURRENT_STRATEGIC_ROADMAP.md (Section 7).
 */
export function clonePropertyTrack(track: PropertyTrack): PropertyTrack {
  return {
    id: track.id,
    property: track.property,
    label: track.label,
    unit: track.unit,
    color: track.color,
    keyframes: track.keyframes.map((k: Keyframe) => ({
      id: k.id,
      time: k.time,
      value: k.value,
      easing: k.easing,
      curve: k.curve ? { ...k.curve } : undefined,
      spring: k.spring ? { ...k.spring } : undefined
    }))
  };
}

export function cloneSceneNode(node: SceneNode): SceneNode {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation,
    scaleX: node.scaleX,
    scaleY: node.scaleY,
    opacity: node.opacity,
    borderRadius: node.borderRadius,
    fill: node.fill,
    fillType: node.fillType,
    stroke: node.stroke,
    strokeWidth: node.strokeWidth,
    strokeCap: node.strokeCap,
    strokeJoin: node.strokeJoin,
    strokeDash: node.strokeDash ? [...node.strokeDash] : undefined,
    trimStart: node.trimStart,
    trimEnd: node.trimEnd,
    trimOffset: node.trimOffset,
    pivotX: node.pivotX,
    pivotY: node.pivotY,
    parentId: node.parentId,
    childrenIds: node.childrenIds ? [...node.childrenIds] : undefined,
    tracks: Array.isArray(node.tracks) ? node.tracks.map(clonePropertyTrack) : [],
    pathPoints: node.pathPoints ? node.pathPoints.map((p) => ({ ...p })) : undefined,
    subPaths: node.subPaths ? node.subPaths.map((sp) => sp.map((p) => ({ ...p }))) : undefined,
    fillRule: node.fillRule,
    maskMode: node.maskMode,
    maskTargetId: node.maskTargetId,
    maskId: node.maskId,
    isMask: node.isMask,
    textContent: node.textContent,
    fontSize: node.fontSize,
    fontFamily: node.fontFamily,
    fontWeight: node.fontWeight,
    textAlign: node.textAlign,
    letterSpacing: node.letterSpacing,
    lineHeight: node.lineHeight,
    filterBlur: node.filterBlur,
    shadowBlur: node.shadowBlur,
    shadowColor: node.shadowColor,
    shadowOffsetX: node.shadowOffsetX,
    shadowOffsetY: node.shadowOffsetY,
    linearGradient: node.linearGradient ? { ...node.linearGradient, stops: node.linearGradient.stops.map((s) => ({ ...s })) } : undefined,
    radialGradient: node.radialGradient ? { ...node.radialGradient, stops: node.radialGradient.stops.map((s) => ({ ...s })) } : undefined,
    triggers: node.triggers ? JSON.parse(JSON.stringify(node.triggers)) : undefined,
    motionPath: node.motionPath ? { ...node.motionPath } : undefined,
    staggerType: node.staggerType,
    staggerDelay: node.staggerDelay,
    textPathNodeId: node.textPathNodeId,
    textPathOffset: node.textPathOffset,
    clipContent: (node as FrameNode).clipContent,
    canvasBg: (node as FrameNode).canvasBg
  };
}

export function createRuntimeSnapshot(project: SceneProject): SceneProject {
  const rootFrame: FrameNode = project.rootFrame
    ? {
        ...project.rootFrame,
        tracks: Array.isArray(project.rootFrame.tracks) ? project.rootFrame.tracks.map(clonePropertyTrack) : []
      }
    : {
        id: 'root-default',
        name: 'Root Frame',
        type: 'frame',
        visible: true,
        locked: false,
        clipContent: true,
        canvasBg: '#ffffff',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#ffffff',
        tracks: []
      };

  const clonedNodes: Record<string, SceneNode> = {};
  if (project.nodes) {
    for (const [id, node] of Object.entries(project.nodes)) {
      if (node) {
        clonedNodes[id] = cloneSceneNode(node);
      }
    }
  }

  return {
    id: project.id,
    name: project.name,
    version: project.version,
    duration: project.duration || 3.0,
    fps: project.fps || 60,
    rootFrame,
    nodes: clonedNodes,
    nodeOrder: Array.isArray(project.nodeOrder) ? [...project.nodeOrder] : Object.keys(clonedNodes)
  };
}
