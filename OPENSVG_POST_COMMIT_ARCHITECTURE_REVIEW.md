# OpenSVG Motion Studio — Post-Commit Architecture Review

**Repository:** `lux0166/opensvg-motion-studio`

**Reviewed commit:** `221dda68fd11cc17cb5ee7d4adf657269fbee483`

**Commit:** `feat(engine): implement controlled animation refactor, semantic node decomposition and evaluation pipeline`

**Review date:** 2026-08-26

---

## 1. Executive Conclusion

The latest commit is a **significant architectural improvement** over the previous state.

The project is no longer in the situation where the architecture is obviously collapsing under feature growth. The controlled refactor has addressed several of the most important coupling points:

- Animation evaluator has been modularized.
- State-machine trigger evaluation has been separated from direct UI/store mutation.
- Semantic node decomposition has been introduced.
- A unified evaluation-pipeline abstraction now exists.
- The project reports 53 test suites / 178 unit tests and a clean production build in the commit.

However, the architecture is **not finished yet**.

The main remaining issue is that the new architecture currently contains **more than one path for scene evaluation**. The next step should therefore be consolidation, not another broad feature wave.

### Current architectural verdict

```text
Before refactor:

Feature / UI
     ↓
BaseNode
     ↓
Evaluator
     ↓
Renderer
     ↑
State Machine / Store

High coupling risk
```

```text
Current state:

Authoring Document
       ↓
Evaluation Pipeline
       ↓
Evaluated Scene State
       ↓
Render Scene
       ↓
Renderer

Much healthier boundary
```

But there is still:

```text
Evaluation Pipeline
        +
OpenSVGRuntime
        ↓
Two evaluation paths
```

That is the next architectural issue to resolve.

---

# 2. What the Latest Commit Fixed

## 2.1 Animation Core Modularization — DONE

The previous evaluator was split into dedicated modules under:

```text
src/engine/animation/
├── timing.ts
├── numericInterpolation.ts
├── colorInterpolation.ts
├── pathInterpolation.ts
├── spring.ts
├── trackEvaluator.ts
├── transformEvaluator.ts
├── animationEvaluator.ts
└── index.ts
```

The old `evaluator.ts` remains as a compatibility facade.

### Result

This prevents `evaluator.ts` from becoming an increasingly large "god module" while preserving backward compatibility.

### Verdict

**P0/P1: DONE**

Do not rewrite this area again unless concrete defects are discovered.

---

# 3. State Machine Decoupling — GOOD

The previous architecture allowed the state machine layer to directly invoke store/UI actions.

The new design introduces:

```text
Event
  ↓
evaluateNodeTriggerEvents()
  ↓
RuntimeCommand[]
```

Examples include:

```text
JumpToTimeCommand
TogglePlayCommand
PlayCommand
PauseCommand
SetPropertiesCommand
ShowToastCommand
```

The pure evaluation path does not depend on React, Zustand, or the UI.

A backward-compatible adapter remains responsible for executing commands against application callbacks.

## Important distinction

There are now two layers:

```text
Pure Runtime Evaluation
        ↓
RuntimeCommand[]
        ↓
Compatibility / Application Adapter
        ↓
Store / UI
```

This is acceptable during migration.

### Verdict

**P0: DONE**

The compatibility adapter should remain temporary and should not become the permanent runtime architecture.

---

# 4. Semantic Node Decomposition — GOOD, BUT STILL A MIGRATION LAYER

New semantic interfaces have been introduced:

```text
NodeIdentity
NodeHierarchy
NodeTransform
NodeGeometry
NodeAppearance
NodeAnimation
NodeConstraint
NodeInteraction
```

with conversion through an adapter.

Current direction:

```text
BaseNode
   ↓
decomposeSceneNode()
   ↓
SemanticNode
```

This is useful because it creates a boundary without forcing a destructive rewrite.

## Remaining issue

`semanticTypes.ts` still depends on `BaseNode` for parts of its type model. This means the semantic system is currently a **compatibility/decomposition layer**, not yet the canonical domain model.

That is acceptable at this stage.

### Verdict

**P1: PARTIALLY DONE**

Continue migration gradually; do not delete `BaseNode` in one step.

---

# 5. Unified Evaluation Pipeline — GOOD DIRECTION

A new pipeline exists in:

```text
src/engine/runtime/evaluationPipeline.ts
```

The intended sequence is:

```text
Authoring Document
       ↓
Scene Graph
       ↓
Animation Evaluation
       ↓
State / External Overrides
       ↓
Constraint Solver
       ↓
Evaluated Scene State
       ↓
Render State
```

The pipeline exposes `EvaluatedSceneState` and `RenderScene`.

Most importantly, it explicitly states the invariant:

> Evaluation must not mutate the canonical authoring document.

This is exactly the architectural boundary needed for a serious animation runtime.

### Verdict

**P0: STRUCTURALLY GOOD**

But integration is incomplete, as described below.

---

# 6. P0 REMAINING: There Are Currently Two Evaluation Paths

This is the most important remaining issue.

## Path A — Evaluation Pipeline

```text
SceneProject
   ↓
evaluateScenePipeline()
   ↓
EvaluatedSceneState
   ↓
RenderScene
```

## Path B — Runtime Kernel

`OpenSVGRuntime` currently performs its own evaluation path:

```text
OpenSVGRuntime
   ↓
internal project
   ↓
evaluateNode()
   ↓
deriveRenderScene()
```

The runtime kernel therefore does **not yet use `evaluateScenePipeline()` as the single source of evaluation truth**.

## Why this is dangerous

Over time this can become:

```text
Pipeline A
    ↓
Animation rules A
Constraint rules A
State rules A

Pipeline B
    ↓
Animation rules B
Constraint rules B
State rules B
```

The system may then appear correct in the editor but behave differently in runtime/export/preview.

## Required action

Refactor the architecture to:

```text
OpenSVGRuntime
      ↓
Clock / Playback State
      ↓
evaluateScenePipeline()
      ↓
EvaluatedSceneState
      ↓
RenderScene
```

`OpenSVGRuntime` should own runtime lifecycle and clock state, but **should not implement a second independent scene-evaluation algorithm**.

### Priority

**P0 — Fix before adding another major runtime subsystem.**

---

# 7. P0/P1 REMAINING: Pipeline Documentation and Implementation Do Not Fully Match

The pipeline comments describe phases such as:

```text
Animation
State Machine
Component / Binding
Constraints
Evaluated Scene
Render State
```

but the current implementation still primarily performs:

```text
Animation Evaluation
      ↓
External Property Overrides
      ↓
Constraint Solver
      ↓
Render State
```

The state machine, component resolution, and data-binding systems are not yet visibly integrated as first-class pipeline phases.

## Required action

Choose one of two valid approaches:

### Option A — Integrate them

Make the pipeline actually execute:

```text
Animation
 ↓
State Machine
 ↓
Component Resolution
 ↓
Binding Resolution
 ↓
Constraints
 ↓
Evaluated Scene
```

### Option B — Correct the architecture documentation

If those phases are intentionally deferred, the pipeline documentation must say so explicitly.

Do not keep architectural diagrams claiming capabilities that the implementation does not yet execute.

### Priority

**P1**

---

# 8. P1 REMAINING: World Transform Resolution Should Become Canonical

`renderState.ts` currently walks the parent chain to accumulate world transforms.

Conceptually:

```text
node
 ↓
parent
 ↓
parent
 ↓
parent
```

with a hard traversal guard.

A mature scene graph should instead establish a canonical hierarchy/dependency evaluation order once, then evaluate transforms using that order.

## Current risk

The rendering layer can become responsible for scene-graph semantics that should belong to runtime evaluation.

## Target

```text
Scene Graph
   ↓
Hierarchy Resolution
   ↓
World Transform Evaluation
   ↓
Evaluated Scene State
   ↓
Render State
```

The renderer should consume the already-resolved world transform rather than derive it by walking the graph itself.

## Required action

- [ ] Create canonical hierarchy traversal/order.
- [ ] Validate parent references before rendering.
- [ ] Detect hierarchy cycles explicitly.
- [ ] Compute world transforms in runtime evaluation.
- [ ] Store/render using resolved transform state.
- [ ] Remove hard depth guard from normal hierarchy resolution.

### Priority

**P1**

---

# 9. P1 REMAINING: Runtime Kernel Uses JSON Deep Cloning

`OpenSVGRuntime.load()` currently clones the project using JSON serialization.

This is acceptable as a temporary isolation mechanism, but it is not a desirable long-term runtime-state architecture.

## Problems

- Extra allocations for large documents.
- Serialization-dependent semantics.
- Poor fit for high-frequency runtime lifecycle operations.
- Hides the actual authoring/runtime boundary behind a generic deep clone.

## Better long-term direction

```text
Authoring Document
       ↓
Explicit Runtime Snapshot / Runtime Data Model
       ↓
Runtime Evaluation
```

The runtime should own an explicit representation of what it needs rather than depending on generic JSON cloning.

### Priority

**P1/P2**

Do not block current progress on this, but do not treat the JSON clone as the final design.

---

# 10. P1 REMAINING: Playback State Must Be Unified

The runtime kernel exposes playback state such as:

```text
currentTime
isPlaying
advance()
seek()
reset()
```

The runtime clock, playback lifecycle and state-machine playback commands should eventually share one authoritative runtime lifecycle.

## Target

```text
RuntimeClock
├── currentTime
├── duration
├── fps
├── isPlaying
├── playbackRate
└── loopMode
```

State machines should issue runtime commands against this lifecycle instead of maintaining separate timing semantics.

### Priority

**P1**

---

# 11. Current Architecture Assessment

| Area | Current State | Verdict |
|---|---|---|
| Animation modularization | Dedicated modules | 🟢 Good |
| Keyframe evaluation | Binary-search + interpolation | 🟢 Good |
| Spring | Dedicated integration | 🟢 Good |
| Path interpolation | Dedicated module | 🟢 Good |
| State machine purity | Runtime commands | 🟢 Good |
| Semantic node decomposition | Adapter-based | 🟡 Migration stage |
| Evaluation pipeline | Exists | 🟢 Good foundation |
| Runtime kernel | Exists | 🟡 Needs consolidation |
| Single evaluation path | Not yet | 🔴 P0 |
| State machine pipeline integration | Partial | 🟡 P1 |
| Component/binding pipeline integration | Partial | 🟡 P1 |
| World transform ownership | Still partly render-side | 🟡 P1 |
| Runtime cloning | JSON clone | 🟡 P1/P2 |
| Playback lifecycle | Needs unification | 🟡 P1 |
| Renderer boundary | Much cleaner via RenderScene | 🟢 Improved |
| Overall architecture | Controlled refactor | 🟢 Healthy direction |

---

# 12. What NOT To Do Now

## Do not rewrite the engine

The latest refactor proves the existing engine can be reorganized without a rewrite.

## Do not delete the existing evaluator

The modularized animation core is valuable and already testable.

## Do not keep adding fields to `BaseNode`

Use semantic decomposition and adapters instead.

## Do not create more parallel evaluation paths

Every new runtime feature must enter the canonical evaluation pipeline.

## Do not add another major feature wave before pipeline consolidation

Especially avoid immediately expanding:

- advanced state machine features
- more component features
- more binding features
- animation blending
- additional constraint types

until the evaluation pipeline is the single runtime truth.

---

# 13. Recommended Next Task Order

## P0 — Must Do First

- [ ] Make `OpenSVGRuntime` call `evaluateScenePipeline()`.
- [ ] Remove independent scene evaluation logic from `runtimeKernel.ts`.
- [ ] Make the evaluation pipeline the single source of truth.
- [ ] Add integration test proving runtime kernel and direct pipeline produce identical `EvaluatedSceneState` / `RenderScene`.

## P1 — Next

- [ ] Integrate `StateMachineRuntime` into the canonical pipeline.
- [ ] Integrate component/instance resolution into the canonical pipeline.
- [ ] Integrate data binding into the canonical pipeline.
- [ ] Create canonical hierarchy evaluation.
- [ ] Move world-transform derivation into runtime evaluation.
- [ ] Unify playback clock/runtime lifecycle.
- [ ] Add deterministic end-to-end pipeline tests.

## P2 — After Architecture Stabilization

- [ ] Replace JSON deep clone with explicit runtime-state representation.
- [ ] Continue semantic migration away from `BaseNode`.
- [ ] Expand animation blending.
- [ ] Expand constraint system.
- [ ] Expand component system.
- [ ] Expand graph editor/timeline.
- [ ] Optimize WebGPU/render backend further.

---

# 14. Required End-State

The target architecture should converge toward exactly one evaluation path:

```text
                    AUTHORING
                        │
                        ▼
                Canonical Document
                        │
                        ▼
                 Runtime Clock
                        │
                        ▼
              ┌─────────────────┐
              │ Evaluation      │
              │ Pipeline        │
              └─────────────────┘
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
   Animation       State Machine    Components/
   Evaluation                        Bindings
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                  Constraints
                        │
                        ▼
             Evaluated Scene State
                        │
                        ▼
                  Render State
                        │
                        ▼
                    Renderer
```

## Core invariant

```text
Canonical Authoring Document
                ≠
Runtime / Evaluated State
```

Evaluation should be deterministic and side-effect controlled.

---

# 15. Final Verdict

The latest commit is **a successful controlled refactor**, not a failed architecture attempt.

The previous concern:

> "If the architecture is wrong, every new feature makes the system more complicated."

is now much less severe because the project has introduced actual runtime boundaries.

The remaining concern is narrower and concrete:

> **There must be exactly one authoritative scene-evaluation pipeline.**

That is the next architectural milestone.

Once the runtime kernel, state machine, component/binding resolution, constraints, evaluated scene state, and renderer all use the same pipeline, the project will have a much stronger foundation for Rive/Figma-Motion-level features.

**Current recommendation:** continue. Do not rewrite. Do not abandon the current architecture. Consolidate the runtime path first, then resume feature development.
