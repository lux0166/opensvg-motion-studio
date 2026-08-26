/**
 * OpenSVG Motion Engine — Public API & Core Foundation
 * Standardized according to CORE_ENGINE_DEPTH.md, RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md & TODO.md
 */

// 1. Data Contracts & Interfaces
export * from './types';
export * from './runtime/coreContracts';
export * from './semantic';

// 2. Transform & Matrix Engine (CORE-02)
export * from './transform/matrix2D';

// 3. Animation Engine (P1 Refactored Modular Core)
export * from './animation';

// 4. Render State Derivation & Evaluation Pipeline (CORE-03, P1 Pipeline)
export * from './runtime/renderState';
export * from './runtime/evaluationPipeline';
export * from './runtime/runtimeClock';

// 5. Headless Runtime Kernel (CORE-04)
export * from './runtime/runtimeKernel';

// 6. Constraint Engine (CORE-05)
export * from './constraints/constraintSolver';

// 7. State Machine Runtime & Commands (CORE-06, P0 Decoupled State Machine)
export * from './stateMachine/runtimeStateMachine';
export * from './stateMachine/runtimeCommands';

// 8. Render Backends (CORE-07, CORE-13)
export * from './backend/canvas2DBackend';
export * from './backend/webgpuBackend';

// 9. Component & Instance System (CORE-08)
export * from './components/componentSystem';

// 10. Data Binding Engine (CORE-09)
export * from './binding/dataBinding';

// 11. Geometry Hardening Core (CORE-10)
export * from './geometry/geometryCore';

// 12. Persistence & Schema Migration (CORE-11)
export * from './persistence/schemaMigration';

// 13. Performance Lab (CORE-12)
export * from './perf/performanceLab';

// 14. Authoring & Animation Engine Utilities
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
