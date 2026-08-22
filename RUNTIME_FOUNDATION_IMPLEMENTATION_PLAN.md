# OpenSVG Motion Studio — Runtime Foundation Implementation Plan

**Purpose:** concrete swarm-agent execution plan for the Core Engine Depth & Runtime Foundation stage.

**Repository baseline:** `lux0166/opensvg-motion-studio` at verified commit `64e637ad37a1b04186f9d023a151dfa76949fde4`.

---

# 0. Operating rule

Every task must distinguish:

```text
Existing capability
Required refactor
New capability
```

Do not rewrite an existing subsystem merely because a different architecture looks cleaner.

---

# 1. Target milestone

## Core Engine Depth & Runtime Foundation v1

A headless runtime can:

```text
load document
→ evaluate time/state
→ solve constraints
→ produce RenderState
→ submit to backend
```

with deterministic semantics and tests.

Production WebGPU is **not** a prerequisite for this milestone.

---

# 2. Dependency graph

```text
CORE-01 Contracts
       |
       +--> CORE-02 Transform
       |        |
       |        +--> CORE-05 Constraints
       |
       +--> CORE-03 RenderState
       |        |
       |        +--> CORE-07 Backend abstraction
       |
       +--> CORE-04 Runtime Evaluation
                |
                +--> CORE-05 Constraints
                +--> CORE-06 State Machine Runtime
                         |
                         +--> CORE-08 Components
                                  |
                                  +--> CORE-09 Data Binding

Parallel:
CORE-10 Geometry hardening
CORE-11 Persistence hardening
CORE-12 Performance Lab

After backend contract:
CORE-13 WebGPU prototype
```

---

# 3. CORE-01 — Core Contracts

## Objective

Create the minimum contracts needed to prevent UI, animation and backend concerns from leaking into each other.

## Preconditions

Inspect before editing:

```text
src/engine/types.ts
src/engine/evaluator.ts
src/engine/renderer.ts
src/store/useStudioStore.ts
CONSTITUTION.md
```

## Proposed contracts

```text
Transform
Matrix2D
CoordinateSpace
RenderNodeState
RenderScene
Runtime
RenderBackend
```

## Invariants

```text
No React imports in core contracts.
No Zustand imports in core contracts.
No GPU-specific types in SceneNode.
```

## Acceptance

```text
npm test
npm run build
```

must remain clean.

---

# 4. CORE-02 — Transform Engine

## Objective

Create canonical transform math.

## Required

```text
Matrix2D
multiply
compose
invert
transformPoint
transformVector
decompose
local/world conversion
pivot
```

## Tests

```text
identity
translation
rotation
scale
multiplication order
inverse
nested hierarchy
local→world
world→local
pivot rotation
```

## Prohibited

```text
No Canvas2D transformation logic inside the core transform module.
No React dependency.
No second matrix implementation in renderer/UI.
```

---

# 5. CORE-03 — RenderNodeState

## Objective

Separate authoring state from derived render state.

## Migration

```text
SceneNode
   ↓
Evaluation
   ↓
RenderNodeState
   ↓
Renderer
```

## Minimum fields

```text
id
visible
worldTransform
geometry
fill
stroke
opacity
bounds
clip/filter descriptors
```

## Acceptance

Current Canvas2D rendering remains behaviorally equivalent for covered fixtures.

---

# 6. CORE-04 — Runtime Evaluation Kernel

## Proposed API

```ts
interface Runtime {
  load(document: Document): void;
  advance(dt: number): void;
  seek(time: number): void;
  reset(): void;
  getRenderState(): RenderState;
}
```

## Invariants

```text
advance() does not mutate authoring state.
seek(t) is deterministic.
reset() restores runtime state without rewriting document content.
```

## Tests

```text
advance(0)
advance(fixed dt)
seek forward
seek backward
reset
repeatability
```

---

# 7. CORE-05 — Constraint Engine v1

## Preconditions

CORE-02 must exist.

## Initial scope

```text
Translation
Rotation
Scale
Transform
Distance
FollowPath
```

## Contract

```text
ownerId
targetId
enabled
strength
sourceSpace
destinationSpace
parameters
```

## Tests

```text
strength 0
strength 0.5
strength 1
local space
world space
nested hierarchy
missing target
cycle detection
```

## Prohibited

Do not implement constraint behavior by directly mutating React state.

---

# 8. CORE-06 — State Machine Runtime v2

## Objective

Replace trigger-only semantics with an explicit runtime model while retaining compatibility adapters.

## Proposed model

```text
Inputs
States
Transitions
Conditions
Layers
Listeners
```

## Migration rule

Do not delete current trigger behavior until equivalent runtime tests exist.

## Tests

```text
initial state
valid transition
invalid transition
multiple transitions
boolean input
number input
trigger input
replay determinism
```

---

# 9. CORE-07 — Render Backend Contract

## Objective

Make rendering backend-neutral.

## Proposed interfaces

```text
RenderBackend
RenderScene
RenderCommand / explicit draw dependencies
RenderResource
```

## First backend

```text
Canvas2DBackend
```

## Acceptance

Current rendering behavior remains intact.

---

# 10. CORE-08 — Component / Instance System

## Objective

Support reusable visual + behavioral components without duplicating definitions.

## Model

```text
ComponentDefinition
ComponentInstance
Overrides
RuntimeState
```

## Tests

```text
create definition
instantiate twice
apply override
modify definition
instances reflect definition update
instance runtime states remain isolated
```

---

# 11. CORE-09 — Data Binding v1

## Initial types

```text
Boolean
Number
String
Color
Enum
Trigger
```

## Model

```text
source
 target
 converter?
```

## Example

```text
ViewModel.progress → node.opacity
```

## Prohibited

Binding cannot be implemented as a React-only callback convention.

---

# 12. CORE-10 — Geometry hardening

## Objective

Strengthen the existing path foundation before advanced runtime behavior depends on it.

## Required areas

```text
multiple contours
arc support
length
point-at-distance
tangent
bounds
flatten
hit testing
morph compatibility
```

## Evidence basis

W3C SVG Paths defines moveto, lineto, cubic/quadratic curves, arcs and closepath.

Source:
https://www.w3.org/TR/SVG/paths.html

## Acceptance

Use deterministic fixtures for imported SVG geometry and path metrics.

---

# 13. CORE-11 — Persistence hardening

## Objective

Turn existing project versioning into actual migration infrastructure.

## Pipeline

```text
Schema
→ Validate
→ Migrate
→ Canonicalize
→ Runtime
```

## Tests

```text
current version round-trip
old version migration
invalid schema rejection
missing required data
unknown fields policy
```

---

# 14. CORE-12 — Performance Lab

## Benchmark fixtures

```text
100 nodes
1,000 nodes
5,000 nodes
10,000 nodes
100,000 keyframes
1,000 active tracks
large paths
many constraints
many component instances
```

## Metrics

```text
load
seek
evaluation
render
memory
serialize
export
```

Do not invent absolute performance claims before measurements exist.

---

# 15. CORE-13 — WebGPU prototype

## Preconditions

Must have:

```text
CORE-03 RenderNodeState
CORE-07 RenderBackend
CORE-12 benchmark baseline
```

## Scope

```text
adapter
 device
 surface/context
 resize
 clear
 one primitive
 transform
 opacity
```

No production filter/text stack in the first prototype.

---

# 16. GPU-01 — Resource layer

Implement wrappers for:

```text
GpuBuffer
GpuTexture
GpuSampler
GpuPipeline
GpuBindGroup
GpuRenderTarget
```

Test creation, reuse, invalidation and recreation.

---

# 17. GPU-02 — Geometry upload

```text
Geometry
→ tessellation
→ GPU representation
→ buffer cache
```

Use explicit geometry versioning for invalidation.

---

# 18. GPU-03 — Materials and paint

Implement backend-neutral semantics for:

```text
solid
linear gradient
radial gradient
stroke
```

---

# 19. GPU-04 — Advanced render passes

```text
clip
mask
blur
shadow
offscreen target
```

A feature should create an additional pass only when its semantics require one.

---

# 20. GPU-05 — Batching and caching

Only after benchmarks:

```text
pipeline reuse
texture reuse
geometry reuse
batching
upload minimization
```

Track cache hit/miss and allocation counts.

---

# 21. GPU-06 — Device loss / fallback

**FACT — EXTERNAL:** W3C WebGPU defines device-loss semantics, and Figma documents dynamic fallback because real devices can fail mid-session.

Sources:

https://www.w3.org/TR/webgpu/
https://www.figma.com/blog/figma-rendering-powered-by-webgpu/

## OpenSVG proposal

```text
WebGPU
 ↓
device lost
 ↓
recreate resources
 ↓
recover
 ↓
if failure → Canvas2D
```

The document/runtime must remain valid throughout.

---

# 22. CORE-14 — Golden renderer tests

For major features:

```text
same RenderScene
→ Canvas2D
→ WebGPU
→ image comparison
```

Fixtures:

```text
transforms
gradients
paths
strokes
clips
filters
text
animation
constraints
components
```

Keep image comparison thresholds explicit.

---

# 23. CORE-15 — Runtime determinism

Use engine-state hashes rather than relying only on GPU pixel equality.

Suggested inputs to the hash:

```text
world transforms
animated values
constraint outputs
visibility
geometry versions
state-machine state
```

---

# 24. Swarm task protocol

Every engine task begins:

```text
INSPECT
DESIGN
IMPLEMENT
TEST
BENCHMARK (when relevant)
VERIFY
```

The agent must first inspect existing contracts and tests before adding files.

---

# 25. Required task report

Every completed task must report:

```text
## Changed
files + responsibilities

## Existing behavior preserved
test/regression evidence

## New invariants
what is now guaranteed

## Tests
commands/results

## Benchmarks
results when relevant

## Known limitations
explicitly stated

## Follow-up
only technically required items
```

Do not report “production-ready” merely because build/test passes.

---

# 26. Prohibited shortcuts

```text
No parallel scene model
No GPU-specific document model
No engine logic in React
No engine state in UI-only hooks
No authoring mutation during evaluation
No `any` used solely to avoid typing core contracts
No backend switch without parity tests
No schema change without migration
No cache without invalidation policy
No GPU support claim from one device
```

---

# 27. Architecture review gate

Before merge:

```text
[ ] No second source of truth
[ ] No React dependency in core
[ ] Existing rendering preserved
[ ] Existing project format preserved or migrated
[ ] Existing tests pass
[ ] New invariants have tests
[ ] Performance impact measured when relevant
[ ] ADR added for structural changes
[ ] Claims match evidence
```

---

# 28. Swarm parallelization rules

Parallel-safe tasks:

```text
Transform
Geometry metrics
Runtime tests
Performance benchmark harness
```

Dependent tasks:

```text
Transform → Constraints
RenderState → RenderBackend
Runtime → StateMachine
Components → DataBinding
Backend abstraction → WebGPU
```

Do not allow multiple agents to change the same canonical contract without an integration owner.

---

# 29. Definition of Done — Phase

The phase is complete when:

```text
Core contracts exist
Transform semantics are canonical
Geometry contract is explicit
Animation evaluation is headless
Runtime seek/advance is deterministic
Constraint pipeline is explicit
RenderNodeState exists
Canvas2D consumes RenderNodeState
Persistence has a migration path
Benchmarks exist
Golden fixtures exist
Existing features still pass regression tests
```

WebGPU is not required to declare Core Engine v1 complete.

---

# 30. External research basis

## Rive
https://rive.app/features
https://rive.app/docs/editor/constraints/constraints-overview
https://rive.app/docs/editor/constraints/transform-constraint
https://rive.app/docs/editor/constraints/ik-constraint
https://rive.app/blog/how-state-machines-work-in-rive
https://rive.app/blog/getting-started-with-data-binding
https://rive.app/blog/components-are-here-nested-artboards-done-right

## Figma
https://www.figma.com/blog/figma-rendering-powered-by-webgpu/
https://www.figma.com/blog/engineering/

## W3C
https://www.w3.org/TR/SVG/paths.html
https://www.w3.org/TR/webgpu/

## OpenSVG
https://github.com/lux0166/opensvg-motion-studio
