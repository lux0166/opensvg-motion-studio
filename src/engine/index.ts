/**
 * OpenSVG Motion Engine — Public API & Core Foundation
 * Standardized according to CORE_ENGINE_DEPTH.md & RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md (CORE-01 to CORE-15)
 */

// 1. Data Contracts & Interfaces
export * from './types';
export * from './runtime/coreContracts';

// 2. Transform & Matrix Engine (CORE-02)
export * from './transform/matrix2D';

// 3. Render State Derivation (CORE-03)
export * from './runtime/renderState';

// 4. Headless Runtime Kernel (CORE-04)
export * from './runtime/runtimeKernel';

// 5. Constraint Engine (CORE-05)
export * from './constraints/constraintSolver';

// 6. State Machine Runtime (CORE-06)
export * from './stateMachine/runtimeStateMachine';

// 7. Render Backends (CORE-07, CORE-13)
export * from './backend/canvas2DBackend';
export * from './backend/webgpuBackend';

// 8. Component & Instance System (CORE-08)
export * from './components/componentSystem';

// 9. Data Binding Engine (CORE-09)
export * from './binding/dataBinding';

// 10. Geometry Hardening Core (CORE-10)
export * from './geometry/geometryCore';

// 11. Persistence & Schema Migration (CORE-11)
export * from './persistence/schemaMigration';

// 12. Performance Lab (CORE-12)
export * from './perf/performanceLab';

// 13. Authoring & Animation Engine Utilities
export * from './evaluator';
export * from './exporter';
export * from './svgImporter';
export * from './geometry';
export * from './motionPresets';
export * from './codeGenerator';
export * from './audioReactive';
export { evaluateSpring, SPRING_PRESETS, DEFAULT_SPRING } from './physics';
export * from './crashRecovery';
export * from './snapping';
export * from './colorHarmony';
export * from './hierarchy';
export * from './textOnPath';
export * from './velocityGraph';
export * from './maskRenderer';
export * from './waveformRenderer';
