# OpenSVG Motion Studio — Core Engine Depth & Runtime Foundation

**Status:** Research-backed engineering report  
**Repository baseline verified:** `lux0166/opensvg-motion-studio`, commit `64e637ad37a1b04186f9d023a151dfa76949fde4`  
**Date:** 2026-08-22

## Evidence policy

- **FACT — REPO:** directly verified from the current GitHub repository.
- **FACT — EXTERNAL:** verified from a first-party/standards source.
- **PROPOSAL:** architecture recommended for OpenSVG. It is not claimed to be an existing implementation.

No proposal below should be interpreted as an existing repository feature unless explicitly marked FACT.

---

# 1. Executive decision

The next stage should be **Core Engine Depth & Runtime Foundation**, not another broad UI-feature wave.

**FACT — REPO:** the current project already has scene graph types, keyframe evaluation, motion path, spring physics, Boolean operations, SVG import, SVG/Lottie export, state-machine triggers, audio, motion presets, multi-document tabs, history, dockable workspace, CI and automated tests.

The next architectural problem is therefore not basic editor breadth. It is creating a stable runtime model that future constraints, components, data binding, animation mixing and GPU rendering can consume without creating competing sources of truth.

## 1.1 Target pipeline

```text
Authoring Document
       |
       v
Scene Graph
       |
       +--> Animation Evaluation
       +--> State Machine Runtime
       +--> Component / Instance Resolution
       +--> Constraint Solver
       |
       v
Evaluated Scene State
       |
       v
Render State
       |
       v
Render Backend
       +--> Canvas2D
       +--> WebGPU
```

Core invariant:

> Evaluation produces derived state. Playback/evaluation must not mutate the canonical authoring document.

---

# 2. Current verified baseline

## 2.1 Repository boundaries

**FACT — REPO:** the repository separates `src/components`, `src/engine`, `src/hooks`, `src/store`, `src/theme`, and `src-tauri`. `CONSTITUTION.md` defines the intended separation between UI, orchestration state and engine logic.

## 2.2 Existing engine modules

**FACT — REPO:** the current `src/engine` tree includes modules such as:

```text
audioEngine.ts
booleanOps.ts
evaluator.ts
exporter.ts
history.ts
motionPath.ts
motionPresets.ts
physics.ts
projectManager.ts
renderer.ts
snapping.ts
stateMachine.ts
svgImporter.ts
types.ts
```

## 2.3 Current model shape

**FACT — REPO:** `BaseNode` currently combines identity, hierarchy, transform, appearance, stroke, filters, path geometry, typography, animation tracks, motion-path information and interaction triggers.

**PROPOSAL:** stop adding arbitrary fields to `BaseNode`. Introduce explicit semantic ownership around the existing representation before performing larger structural migrations.

---

# 3. Core Engine boundaries

## 3.1 Document core

```text
Document
├── SceneGraph
├── Animations
├── StateMachines
├── Components
├── Assets
├── Metadata
└── SchemaVersion
```

The current `SceneProject` can remain the compatibility boundary while the internal contracts evolve.

## 3.2 Node semantic groups

```text
Node
├── Identity
├── Hierarchy
├── Transform
├── Geometry
├── Appearance
├── AnimationBinding
├── Constraint
└── Interaction
```

The implementation may remain structurally compatible with current nodes during migration.

---

# 4. Transform engine

## 4.1 Why this is first

**FACT — REPO:** the current node model uses scalar transform fields such as `x`, `y`, `rotation`, `scaleX`, and `scaleY`.

**PROPOSAL:** make transform computation a canonical core subsystem before implementing a broad constraint solver.

## 4.2 Required spaces

```text
Local
Parent
World
Canvas / Viewport
Screen
```

## 4.3 Core operations

```text
compose(parent, local)
inverse(matrix)
transformPoint(matrix, point)
transformVector(matrix, vector)
toWorld(node, point)
toLocal(node, point)
decompose(matrix)
```

## 4.4 Proposed contracts

```ts
interface Transform {
  translation: Vec2;
  rotation: number;
  scale: Vec2;
  pivot: Vec2;
}

interface Matrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}
```

The exact public representation is an implementation decision; the canonical matrix composition semantics are the important part.

---

# 5. Geometry core

## 5.1 SVG facts

**FACT — EXTERNAL:** SVG path data supports moveto, lineto, cubic/quadratic curve commands, elliptical arcs and closepath. Paths can be used for fill, stroke and clipping.

Source: https://www.w3.org/TR/SVG/paths.html

## 5.2 Proposed geometry contract

```text
Geometry
├── Rect
├── Ellipse
├── Polygon
├── Star
├── Path
│   ├── Contour
│   └── Segment
├── Bounds
├── Length
├── PointAt
├── TangentAt
├── Flatten
├── HitTest
├── Boolean
└── Morph
```

The canonical geometry should be structured data, not an SVG `d` string.

## 5.3 Morphing

**FACT — REPO:** the current evaluator supports path-point interpolation.

**PROPOSAL:** future morphing must explicitly define:

```text
contour count
segment count
segment types
direction
correspondence
```

Do not silently treat unequal topology as valid interpolation without a defined conversion policy.

---

# 6. Animation engine

## 6.1 Existing optimization

**FACT — REPO:** the current evaluator uses mutation-time keyframe ordering and binary-search segment lookup rather than sorting keyframes on every evaluation.

## 6.2 Target responsibilities

```text
AnimationEngine
├── Timeline
├── Track
├── Keyframe
├── Interpolator
│   ├── Scalar
│   ├── Vector
│   ├── Color
│   ├── Path
│   └── Discrete
├── Easing
├── Spring
├── MotionPath
└── Mixer
```

## 6.3 Typed property direction

The current repository still exposes `PropertyTrack<any>`.

**PROPOSAL:** move toward typed property descriptors so the engine knows whether a property is scalar, vector, color, path, enum or discrete.

---

# 7. Runtime evaluation order

**PROPOSAL:** define and test one explicit runtime pipeline.

```text
1. Load / retain authoring document
2. Resolve runtime document
3. Evaluate animation tracks
4. Evaluate state-machine transitions
5. Evaluate animation mixing
6. Resolve component instances
7. Solve constraints
8. Compute world transforms / bounds
9. Produce RenderNodeState
10. Submit RenderState to backend
```

The exact ordering of components, state machines and constraints must be frozen by an ADR before dependent features are implemented. The important requirement is that the evaluation order is explicit, deterministic and tested.

---

# 8. Constraint engine

## 8.1 External reference

**FACT — EXTERNAL:** Rive documents transform constraints that copy position, rotation and scale from target objects and exposes a broader constraint system including IK.

Sources:

- https://rive.app/docs/editor/constraints/constraints-overview
- https://rive.app/docs/editor/constraints/transform-constraint
- https://rive.app/docs/editor/constraints/ik-constraint

## 8.2 OpenSVG proposal

Start with a generic contract:

```text
Constraint
├── enabled
├── ownerId
├── targetId
├── strength
├── sourceSpace
├── destinationSpace
└── parameters
```

Initial runtime implementations:

```text
Translation
Rotation
Scale
Transform
Distance
FollowPath
```

IK/bones should come after generic dependency/transform machinery is stable.

---

# 9. Dependency / constraint graph

**PROPOSAL**

Constraints must be evaluated through an explicit dependency model.

```text
validate references
        ↓
detect cycles
        ↓
derive evaluation order
        ↓
solve constraints
```

A cycle must be detected and reported deterministically; never rely on accidental recursion behavior.

---

# 10. Runtime / state machine foundation

**FACT — REPO:** the current repository has `stateMachine.ts` and node-trigger events/actions.

**PROPOSAL:** keep those APIs as compatibility adapters while introducing a proper runtime model:

```text
Runtime
├── Inputs
│   ├── Boolean
│   ├── Number
│   ├── Trigger
│   └── Enum
├── StateMachine
│   ├── States
│   ├── Transitions
│   └── Layers
└── Listeners / Events
```

**FACT — EXTERNAL:** Rive describes state machines as the mechanism that connects animation states, transitions, inputs and interaction logic.

Source: https://rive.app/blog/how-state-machines-work-in-rive

---

# 11. Animation mixing

**PROPOSAL**

Do not lock runtime to one active animation. Introduce:

```text
AnimationLayer
AnimationClip
Weight
BlendMode
Mixer
```

The mixer should output a final evaluated property set. UI for blending should only be built after the runtime contract is stable.

---

# 12. Components / instances

**FACT — EXTERNAL:** Rive currently treats Components as reusable design units and documents that components may contain state machines and work with Data Binding.

Sources:

- https://rive.app/features
- https://rive.app/blog/components-are-here-nested-artboards-done-right

**PROPOSAL**

```text
ComponentDefinition
├── Scene
├── Animations
├── StateMachines
├── Constraints
└── Parameters

ComponentInstance
├── definitionId
├── overrides
└── runtimeState
```

An instance should reference a definition rather than creating an independent duplicated definition.

---

# 13. Data binding

**FACT — EXTERNAL:** Rive currently documents View Models, properties, bindings, nested View Models, enums and lists for data-driven runtime behavior.

Sources:

- https://rive.app/blog/getting-started-with-data-binding
- https://rive.app/blog/data-binding-in-rive-a-shared-language-for-designers-and-developers

**PROPOSAL:** start with:

```text
Boolean
Number
String
Color
Enum
Trigger
```

Use explicit descriptors:

```text
source
 target
 converter?
```

Do not couple binding to React state.

---

# 14. Render state boundary

**PROPOSAL**

Introduce a derived representation such as:

```text
RenderNodeState
```

containing only rendering data:

```text
id
visible
worldTransform
geometry
fill
stroke
opacity
clip
filter
bounds
```

Then:

```text
SceneNode != RenderNodeState
```

This is the key boundary that allows future renderer backends without making them understand the entire authoring model.

---

# 15. Dirty / dependency evaluation

**PROPOSAL**

Make invalidation domains explicit:

```text
TransformDirty
GeometryDirty
StyleDirty
AnimationDirty
ConstraintDirty
HierarchyDirty
BoundsDirty
RenderDirty
```

The first objective is not maximum optimization. It is one authoritative place for derived-state invalidation semantics.

---

# 16. Caching policy

**FACT — EXTERNAL:** Figma's engineering publications describe caching and computation restructuring as important performance techniques for large files; a 2026 Layers Panel rearchitecture reported 30–50% faster interactions in some large/complex files.

Source: https://www.figma.com/blog/engineering/

**PROPOSAL:** candidates for derived caches:

```text
worldTransformCache
boundsCache
pathMetricCache
flattenedPathCache
hitTestCache
renderResourceCache
```

Every cache must specify an invalidation rule. A cache without an invalidation contract is rejected from core.

---

# 17. Persistence

**FACT — REPO:** the project already has a version field and validation/parsing infrastructure.

**PROPOSAL:** harden the pipeline to:

```text
Schema
↓
Validate
↓
Migrate
↓
Canonicalize
↓
Runtime
```

Required long-term capabilities:

```text
versioned schema
migration chain
round-trip tests
atomic save
backup/recovery
asset references
```

---

# 18. Headless runtime API

**PROPOSAL**

```ts
interface Runtime {
  load(document: Document): void;
  advance(dt: number): void;
  seek(time: number): void;
  setInput(name: string, value: unknown): void;
  getRenderState(): RenderState;
  reset(): void;
}
```

This is a target contract, not an existing API.

The same runtime should eventually serve:

```text
Editor preview
Video export
SVG export
Lottie export
Headless tests
Future native runtime
```

---

# 19. Performance lab

Do not invent universal FPS promises. Establish measured scenarios:

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

Measure:

```text
load
seek
scrub
evaluation
render
memory
serialization
export
```

Only set hard budgets after collecting results on target machines.

---

# 20. Testing strategy

Required layers:

```text
Unit
Integration
Determinism
Regression
Performance
Golden render
```

Examples:

Transform:
```text
identity
translation
rotation
scale
inverse
nested local/world conversion
pivot
```

Animation:
```text
boundary
binary-search lookup
easing
spring
path interpolation
color interpolation
discrete properties
```

Runtime:
```text
state transition
mixing
constraint order
cycle detection
seek determinism
```

Rendering:
```text
known scene → expected image
```

---

# 21. Migration strategy

Do not rewrite the application wholesale.

Recommended sequence:

```text
1. Add contracts
2. Introduce canonical transform computation
3. Introduce RenderNodeState
4. Adapt existing Canvas2D renderer
5. Add constraint infrastructure
6. Refactor runtime/state-machine semantics
7. Add components/instances
8. Add data binding
9. Add backend abstraction
10. Add WebGPU backend
```

Every step must retain existing behavior via regression tests.

---

# 22. Definition of Done — Core Engine v1

```text
[ ] Canonical transform contract
[ ] Coordinate-space conversions
[ ] Structured geometry contract
[ ] Deterministic animation evaluation
[ ] Headless runtime advance/seek
[ ] Explicit constraint pipeline
[ ] RenderNodeState
[ ] Dirty/invalidation contract
[ ] Versioned persistence contract
[ ] Unit + integration tests
[ ] Performance benchmark suite
[ ] No React dependency in core
[ ] Existing features pass regression tests
```

---

# 23. Non-goals

The following are not blockers for Core Engine v1:

```text
production WebGPU
IK polish
advanced typography
collaboration
cloud backend
plugin marketplace
AI features
new visual panels
```

---

# 24. Sources

## Repository
https://github.com/lux0166/opensvg-motion-studio

## W3C SVG
https://www.w3.org/TR/SVG/paths.html

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

## W3C WebGPU
https://www.w3.org/TR/webgpu/

