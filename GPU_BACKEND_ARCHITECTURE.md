# OpenSVG Motion Studio — GPU Backend Architecture

**Status:** Research-backed architecture proposal  
**Repository baseline verified:** `64e637ad37a1b04186f9d023a151dfa76949fde4`  
**Primary target:** WebGPU backend with Canvas2D fallback

---

# 0. Evidence policy

- **FACT — REPO:** directly verified in OpenSVG.
- **FACT — EXTERNAL:** verified in W3C, Figma or other first-party sources.
- **PROPOSAL:** architecture recommended for OpenSVG.

The current repository should not be described as having a production WebGPU backend unless that is later verified in source.

---

# 1. Executive summary

**FACT — REPO:** `src/engine/renderer.ts` is currently Canvas2D-oriented and uses `CanvasRenderingContext2D` to render scene nodes.

The correct next step is not a direct Canvas2D→WebGPU rewrite.

Instead:

```text
High-level Render Engine
        ↓
Render Backend API
        ↓
┌───────────────┬───────────────┐
│ Canvas2D      │ WebGPU        │
│ backend       │ backend       │
└───────────────┴───────────────┘
```

---

# 2. Why the backend abstraction comes first

**FACT — EXTERNAL:** Figma's public WebGPU migration article states that its renderer already had an interface layer between high-level rendering code and low-level graphics APIs. Figma then changed that interface to make draw-call resources explicit and used the abstraction to implement both WebGL and WebGPU backends.

Source:
https://www.figma.com/blog/figma-rendering-powered-by-webgpu/

This supports the architectural direction, but does **not** mean OpenSVG should copy Figma's implementation details.

---

# 3. Canonical render pipeline

**PROPOSAL**

```text
Document
  ↓
Runtime Evaluation
  ↓
RenderNodeState
  ↓
RenderScene
  ↓
Render Graph / Pass Planning
  ↓
RenderBackend
```

The backend must not own animation semantics.

---

# 4. Render state contract

**PROPOSAL**

```ts
interface RenderNodeState {
  id: string;
  visible: boolean;
  worldTransform: Matrix2D;
  geometry: RenderGeometry;
  fill?: RenderPaint;
  stroke?: RenderStroke;
  opacity: number;
  clip?: RenderClip;
  filter?: RenderFilter;
  bounds: Rect;
}
```

The precise TypeScript structure is an implementation task; the important property is that renderer input is derived state, not the complete authoring document.

---

# 5. Render scene

**PROPOSAL**

```text
RenderScene
├── nodes
├── draw order
├── clips
├── masks
├── resources
├── effects
└── viewport
```

The same `RenderScene` must be valid for Canvas2D and WebGPU.

---

# 6. RenderBackend contract

**PROPOSAL**

```ts
interface RenderBackend {
  initialize(options: BackendOptions): Promise<void>;
  beginFrame(frame: FrameContext): void;
  submit(scene: RenderScene): void;
  endFrame(): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
}
```

Optional capability description:

```ts
interface RenderCapabilities {
  webgpu: boolean;
  compute: boolean;
  msaa: boolean;
  maxTextureSize: number;
}
```

These interfaces are proposed contracts, not existing OpenSVG APIs.

---

# 7. Canvas2D backend first

Before WebGPU, adapt the current renderer to the proposed backend contract.

Goal:

```text
Document semantics
→ RenderState
→ Canvas2D backend
```

This proves the boundary without changing graphics technology.

---

# 8. WebGPU facts

**FACT — EXTERNAL:** WebGPU is currently a W3C Candidate Recommendation Draft. The specification defines GPU devices, render pipelines, buffers, textures, command encoding and device-loss behavior.

Source:
https://www.w3.org/TR/webgpu/

The specification explicitly describes device loss and the need to handle resource recreation.

---

# 9. Device lifecycle

**PROPOSAL**

```text
detect
→ request adapter
→ request device
→ query capabilities
→ create resources
→ ready
```

Device health should be modeled separately from capability:

```text
supported
initialized
healthy
lost
fallback
```

---

# 10. Device loss and fallback

**FACT — EXTERNAL:** Figma documents real-world WebGPU device failures and a dynamic fallback approach from WebGPU to WebGL, including mid-session failures.

Source:
https://www.figma.com/blog/figma-rendering-powered-by-webgpu/

**PROPOSAL for OpenSVG:**

```text
WebGPU
  ↓
device lost
  ↓
invalidate GPU resources
  ↓
try recovery
  ↓
if recovery fails
  ↓
Canvas2D backend
```

The canonical document must survive backend failure.

---

# 11. GPU resource layer

**PROPOSAL**

Wrap backend resources:

```text
GpuBuffer
GpuTexture
GpuSampler
GpuShader
GpuPipeline
GpuBindGroup
GpuRenderTarget
```

Do not expose raw WebGPU objects throughout the engine.

Every resource needs an explicit lifecycle:

```text
Create
→ Upload
→ Use
→ Invalidate
→ Recreate
→ Destroy
```

---

# 12. Geometry → GPU

```text
PathGeometry
     ↓
Tessellation
     ↓
GpuGeometry
     ↓
Vertex / Index Buffers
```

A proposed cache key is:

```text
geometryId + geometryVersion
```

Geometry invalidation must be explicit.

---

# 13. Path tessellation

**FACT — EXTERNAL:** W3C SVG path data supports cubic/quadratic curves and arcs.

Source:
https://www.w3.org/TR/SVG/paths.html

**PROPOSAL:** keep tessellation separate from document geometry and from rendering API-specific code.

```text
Path
 ↓
Curve processing
 ↓
Fill mesh / stroke mesh
```

---

# 14. Paint model

**FACT — REPO:** the current project already models solid/linear/radial fills and stroke settings.

**PROPOSAL:** create backend-neutral representations:

```text
RenderPaint
├── Solid
├── LinearGradient
├── RadialGradient
└── Image

RenderStroke
├── width
├── cap
├── join
├── dash
└── paint
```

---

# 15. Clipping and masking

The render contract must distinguish:

```text
Clip
Mask
Opacity Group
Filter
```

A GPU pass planner may map these to different mechanisms such as stencil state, intermediate targets or textures.

Do not collapse all four into one generic effect object.

---

# 16. Filters

**FACT — REPO:** current code has blur/drop-shadow behavior.

**PROPOSAL:** represent filters backend-neutrally:

```text
RenderFilter
├── Blur
├── DropShadow
├── ColorMatrix
└── Custom
```

Do not require WebGPU-specific semantics in the document model.

---

# 17. Render graph / pass planning

**PROPOSAL**

```text
RenderScene
    ↓
Pass planning
    ↓
Opaque / Alpha / Clip / Effect dependencies
    ↓
Render passes
    ↓
Command encoding
```

Simple scenes may produce one pass; masks and filters can produce multiple dependent passes.

---

# 18. Explicit draw dependencies

**FACT — EXTERNAL:** Figma reports moving from implicit global-style bindings to explicit draw-call resource arguments during its WebGPU migration.

Source:
https://www.figma.com/blog/figma-rendering-powered-by-webgpu/

**PROPOSAL**

Use explicit render submission semantics:

```ts
draw(
  geometry,
  material,
  textures,
  transform,
  target
)
```

The backend may internally optimize state changes, but draw dependencies should be explicit in the contract.

---

# 19. Shader architecture

WebGPU uses WGSL in the WebGPU ecosystem.

**FACT — EXTERNAL:** W3C WebGPU defines the API and its shader integration model.

Source:
https://www.w3.org/TR/webgpu/

**PROPOSAL**

```text
shaders/
├── solid.wgsl
├── gradient.wgsl
├── texture.wgsl
├── mask.wgsl
├── blur.wgsl
└── utility.wgsl
```

Avoid creating one shader per scene node.

---

# 20. Pipeline cache

**PROPOSAL**

A pipeline cache key may include:

```text
shader variant
blend mode
sample count
target format
feature flags
```

Then:

```text
PipelineKey → GPURenderPipeline
```

Every cache must define its invalidation/lifecycle policy.

---

# 21. Texture cache

Potential cache dimensions:

```text
assetId
assetVersion
colorSpace
size
usage
```

Do not recreate immutable texture resources every frame.

---

# 22. Uniform / instance data

**FACT — EXTERNAL:** Figma's article describes moving uniform data into buffers and grouping multiple uniform values into GPU buffer updates for WebGPU.

Source:
https://www.figma.com/blog/figma-rendering-powered-by-webgpu/

**PROPOSAL**

Separate:

```text
FrameUniforms
MaterialUniforms
InstanceData
```

Use per-instance data where properties differ across otherwise compatible draws.

---

# 23. Batching

**PROPOSAL**

A first practical batching key can consider:

```text
pipeline
material
texture set
clip state
```

Do not build a complicated batching system before measurements show a submission bottleneck.

---

# 24. Performance instrumentation

Measure:

```text
CPU frame time
GPU frame time
command submission time
buffer upload time
texture upload time
pipeline creation time
draw count
batch count
cache hit rate
memory
```

Do not claim a universal FPS target without device measurements.

---

# 25. Canvas2D/WebGPU parity

One of the most valuable development tests is:

```text
same RenderScene
      ↓
Canvas2D
      ↓
WebGPU
```

Then compare results.

This prevents GPU-specific semantics from silently diverging from the editor model.

---

# 26. Golden image fixtures

Suggested structure:

```text
golden/
├── transforms/
├── gradients/
├── paths/
├── strokes/
├── clips/
├── filters/
├── text/
├── animation/
└── constraints/
```

Each fixture includes:

```text
scene
+ time
+ viewport
+ DPR
→ expected image
```

Keep accepted comparison tolerance explicit.

---

# 27. Device compatibility matrix

Do not claim “WebGPU works” based on one development machine.

Track:

```text
OS
Browser
GPU vendor
GPU model
Driver
WebGPU availability
Initialization result
Device-loss events
Fallback events
```

Figma's own migration describes device compatibility testing and dynamic fallback.

---

# 28. GPU implementation waves

## GPU-0 — Backend contract

```text
RenderBackend
RenderScene
RenderNodeState
RenderPaint
RenderGeometry
```

Adapt Canvas2D.

## GPU-1 — WebGPU bootstrap

```text
adapter
 device
 surface/context
 resize
 clear
 one primitive
```

## GPU-2 — Basic primitives

```text
rect
circle
transform
opacity
```

## GPU-3 — Vector rendering

```text
path tessellation
fill
stroke
gradients
```

## GPU-4 — Advanced passes

```text
clip
mask
blur
shadow
offscreen targets
```

## GPU-5 — Optimization

```text
resource caches
pipeline cache
batching
upload optimization
```

## GPU-6 — Reliability

```text
device loss
recovery
Canvas2D fallback
```

## GPU-7 — Parity verification

Golden-image comparison and runtime regression.

---

# 29. What not to do

Do not:

```text
make the GPU backend the document owner
move animation semantics into WGSL
rewrite everything at once
assume WebGPU is always available
remove Canvas2D before parity exists
create caches without invalidation rules
optimize before benchmarks
```

---

# 30. Core architectural rule

```text
DOCUMENT
  ↓
RUNTIME
  ↓
RENDER STATE
  ↓
RENDER GRAPH
  ↓
BACKEND
  ├── Canvas2D
  └── WebGPU
```

GPU is a rendering implementation detail, not the owner of animation semantics.

---

# 31. Primary sources

## W3C WebGPU
https://www.w3.org/TR/webgpu/

## Figma — WebGPU renderer
https://www.figma.com/blog/figma-rendering-powered-by-webgpu/

## W3C SVG Paths
https://www.w3.org/TR/SVG/paths.html

## OpenSVG repository
https://github.com/lux0166/opensvg-motion-studio
