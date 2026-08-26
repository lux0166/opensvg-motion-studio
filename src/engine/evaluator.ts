/**
 * OpenSVG Animation Evaluator Facade
 * Backward-compatible barrel re-exporting modular animation sub-systems.
 * Modular implementation lives in `src/engine/animation/`.
 */

export * from './animation/timing';
export * from './animation/numericInterpolation';
export * from './animation/colorInterpolation';
export * from './animation/pathInterpolation';
export * from './animation/spring';
export * from './animation/trackEvaluator';
export * from './animation/transformEvaluator';
export * from './animation/animationEvaluator';
