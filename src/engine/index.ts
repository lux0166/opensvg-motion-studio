/**
 * OpenSVG Motion Engine — Public API & Core Foundation
 * Standardized according to CORE_ENGINE_DEPTH.md, RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md & STRATEGIC_ROADMAP.md
 */

// 1. Data Contracts & Interfaces
export * from './types';
export * from './runtime/coreContracts';
export * from './semantic';

// 2. Native Document Format (.osvg) (P1 Strategic Pillar 1)
export * from './format';

// 3. Transform & Matrix Engine (CORE-02)
export * from './transform/matrix2D';

// 4. Animation Engine (P1 Modular Core)
export * from './animation';

// 5. Render State Derivation & Evaluation Pipeline (CORE-03, P1 Single Source of Truth)
export * from './runtime/renderState';
export * from './runtime/evaluationPipeline';
export * from './runtime/runtimeClock';

// 6. Headless Runtime Kernel (CORE-04)
export * from './runtime/runtimeKernel';

// 7. Interactive SVG Web Runtime & Adapters (P1 Strategic Pillar 2)
export * from './webRuntime';
export * from './adapters';

// 8. Constraint Engine (CORE-05)
export * from './constraints/constraintSolver';

// 9. State Machine Runtime & Commands (CORE-06, P0 Decoupled State Machine)
export * from './stateMachine/runtimeStateMachine';
export * from './stateMachine/runtimeCommands';

// 10. Render Backends (CORE-07, CORE-13)
export * from './backend/canvas2DBackend';
export * from './backend/webgpuBackend';

// 11. Component & Instance System (CORE-08)
export * from './components/componentSystem';

// 12. Data Binding Engine (CORE-09)
export * from './binding/dataBinding';

// 13. Geometry Hardening Core (CORE-10)
export * from './geometry/geometryCore';

// 14. Persistence & Schema Migration (CORE-11)
export * from './persistence/schemaMigration';

// 15. Performance Lab (CORE-12)
export * from './perf/performanceLab';

// 16. Killer Workflow Templates (Strategic Pillar 3)
export * from './templates/interactiveButtonTemplate';

// 17. Authoring & Animation Engine Utilities
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
