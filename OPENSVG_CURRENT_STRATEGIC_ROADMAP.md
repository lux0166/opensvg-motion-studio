# OpenSVG Motion Studio — Current Strategic Roadmap

> Cập nhật theo source/commit hiện tại của repository `lux0166/opensvg-motion-studio`.
>
> **Mục tiêu:** không mở rộng feature surface một cách lan man. Hoàn thiện những subsystem đang có, hợp nhất runtime, sau đó dồn lực vào **Native Format + Interactive SVG Runtime + Killer Workflow**.

## 0. Baseline hiện tại

Commit mới nhất được kiểm tra:

```text
221dda68fd11cc17cb5ee7d4adf657269fbee483
feat(engine): implement controlled animation refactor, semantic node decomposition and evaluation pipeline
```

Commit này đã thêm/điều chỉnh:

- Animation core modularization.
- Runtime commands cho state machine.
- Semantic node decomposition.
- Unified evaluation pipeline.
- Báo cáo 53 test suites / 178 unit tests và production build sạch.

Repository cũng đã có các milestone trước đó cho:

- State Machine Runtime v2.
- Component / Instance System.
- Data Binding.
- Geometry hardening.
- Schema migration.
- Performance Lab.
- Canvas2D backend.
- WebGPU backend.
- Golden / parity tests.

---

# 1. Strategic Lock

## Không làm thêm feature chỉ để tăng checklist

```text
Bug fix       -> YES
Refactor      -> YES
Test          -> YES
Performance   -> YES
Reliability   -> YES
Architecture  -> YES

Feature mới không phục vụ Core -> NO
```

## Ba trụ cột phát triển

```text
1. Hoàn thiện runtime hiện tại
2. Native OpenSVG Format
3. Interactive SVG Runtime + Killer Workflow
```

---

# 2. PHASE 1 — FINISH EXISTING RUNTIME

## 2.1 P0 — Một evaluation pipeline duy nhất

### Hiện có

`src/engine/runtime/evaluationPipeline.ts` đã mô hình hóa:

```text
Document
 -> Animation
 -> External/State Overrides
 -> Constraints
 -> EvaluatedSceneState
 -> RenderScene
```

### Vấn đề còn lại

`src/engine/runtime/runtimeKernel.ts` vẫn có evaluation path riêng:

```text
OpenSVGRuntime
 -> evaluateNode()
 -> deriveRenderScene()
```

Điều này tạo nguy cơ có hai runtime path với semantics khác nhau.

### TODO

- [ ] Cho `OpenSVGRuntime` gọi `evaluateScenePipeline()` thay vì tự gọi `evaluateNode()`.
- [ ] Runtime kernel chỉ sở hữu clock, playback lifecycle và runtime inputs.
- [ ] Pipeline là nơi duy nhất thực hiện scene evaluation.
- [ ] Chỉ có một đường `Document -> EvaluatedSceneState -> RenderScene`.
- [ ] Preview/editor/export/runtime dùng chung semantics càng nhiều càng tốt.
- [ ] Viết regression test chứng minh hai API (runtime và direct pipeline) cho cùng kết quả.

### Definition of Done

```text
Không còn evaluation path thứ hai.
```

---

# 3. P0 — Một Runtime Clock

### Hiện trạng cần chuẩn hóa

`runtimeKernel.ts` đã có `currentTime`, `advance()`, `seek()`, `reset()` và `isPlaying`, nhưng playback semantics cần được hợp nhất với pipeline và command layer.

### TODO

- [ ] Một nguồn sự thật cho `currentTime` trong runtime.
- [ ] Xác định `play()`, `pause()`, `togglePlay()` rõ ràng.
- [ ] `advance(dt)` chỉ advance khi runtime đang playing hoặc có API explicit khác được định nghĩa.
- [ ] Define loop behavior.
- [ ] Define seek forward/backward.
- [ ] Define reset.
- [ ] Define fixed-step/delta semantics.
- [ ] Add determinism tests.

---

# 4. P0 — State Machine Integration

## Đã có

State machine đã được chuyển sang pure evaluation + `RuntimeCommand[]`.

```text
Event
 -> evaluateNodeTriggerEvents()
 -> RuntimeCommand[]
```

Điều này đã loại direct mutation khỏi phần pure evaluation.

## Còn phải làm

- [ ] Tích hợp `StateMachineRuntime` trực tiếp vào unified evaluation pipeline.
- [ ] Không chỉ dùng `externalPropertyOverrides` như một generic bypass.
- [ ] State machine phải tạo ra runtime state / commands theo một contract chính thức.
- [ ] Define input semantics: Boolean / Number / Trigger.
- [ ] Define transition semantics.
- [ ] Define blend semantics.
- [ ] Define layer evaluation order.
- [ ] Define event ordering.
- [ ] State machine runtime phải chạy headless.
- [ ] Store/UI chỉ là adapter phía ngoài.

### Definition of Done

```text
StateMachine Runtime
không phụ thuộc React/Zustand/UI
và nằm trong cùng evaluation pipeline.
```

---

# 5. P1 — Component / Binding Integration

Repository đã có Component/Instance System và Data Binding Engine.

### Vấn đề cần tránh

Có module riêng nhưng pipeline không thực sự consume chúng.

### TODO

- [ ] Component resolution trở thành phase chính thức của evaluation pipeline.
- [ ] Instance overrides được resolve deterministic.
- [ ] Binding resolution trở thành phase chính thức.
- [ ] Binding output không bypass runtime semantics.
- [ ] Define source -> target contract.
- [ ] Define update order.
- [ ] Define cycles.
- [ ] Define runtime vs authoring values.
- [ ] Add integration tests.

### Target

```text
Document
 -> Animation
 -> State Machine
 -> Component/Instance Resolution
 -> Binding
 -> Constraints
 -> Evaluated State
```

---

# 6. P1 — Canonical Hierarchy / Transform Evaluation

`renderState.ts` hiện có thể tự đi ngược `parentId` để tích lũy world transforms và có giới hạn depth.

Đây không nên là cách cuối cùng của runtime.

### TODO

- [ ] Tạo canonical hierarchy traversal.
- [ ] Tạo dependency/evaluation order.
- [ ] Resolve world transform trước render derivation.
- [ ] Detect hierarchy cycles ở canonical phase.
- [ ] Bỏ hardcoded depth guard kiểu `depth < 20` khỏi semantics chính.
- [ ] Render state chỉ consume world-space result đã tính.
- [ ] Test deep hierarchy.
- [ ] Test cycle.
- [ ] Test missing parent.
- [ ] Test negative scale.
- [ ] Test pivot.

---

# 7. P1 — Runtime State / Evaluated State Hardening

## Đã có

`EvaluatedSceneState` và `RenderScene` đã xuất hiện.

## Cần hoàn thiện

- [ ] Canonical distinction giữa authoring state và runtime state.
- [ ] Runtime evaluation không mutate authoring document.
- [ ] Runtime output immutable về mặt contract.
- [ ] Renderer consume evaluated/render state.
- [ ] Exporter consume cùng semantic result khi phù hợp.
- [ ] History không ghi snapshot mỗi frame.

### Chưa ưu tiên ngay

`JSON.parse(JSON.stringify(project))` trong runtime kernel có thể giữ như safety boundary tạm thời, nhưng không nên là chiến lược runtime lâu dài.

### TODO sau khi pipeline ổn định

- [ ] Thiết kế runtime snapshot/immutable model chính thức.
- [ ] Đo memory/GC impact.
- [ ] Loại bỏ deep JSON clone nếu không còn cần.

---

# 8. P1 — Renderer Boundary

## Đã có

`RenderScene` / `RenderNodeState` và backend abstractions đã tồn tại.

## TODO

- [ ] Đảm bảo renderer không evaluate animation.
- [ ] Đảm bảo renderer không chạy state machine.
- [ ] Đảm bảo renderer không mutate document.
- [ ] Tách scene rendering khỏi editor overlays.
- [ ] Tách selection overlay khỏi runtime renderer.
- [ ] Tách snapping guide rendering khỏi runtime renderer.
- [ ] Canvas2D và WebGPU consume cùng `RenderScene` semantics.
- [ ] Golden parity tests cho các fixture quan trọng.

---

# 9. P1 — Native OpenSVG Document Format

> Đây là **trụ cột số 1 của product phase** sau khi runtime pipeline được hợp nhất.

## 9.1 Mục tiêu

Một native document model biểu diễn đầy đủ capability của OpenSVG mà không phụ thuộc vào UI.

## 9.2 Native format phải chứa

```text
Document
├── Metadata
├── Scene Graph
├── Geometry
├── Appearance
├── Animations
├── State Machines
├── Components
├── Bindings
├── Constraints
├── Assets
└── Runtime Metadata
```

## 9.3 Không được chứa

```text
selectedNode
selectedKeyframes
viewportZoom
panX/panY
activeTool
dockLayout
editor-only state
```

## 9.4 Requirements

- [ ] Define native schema.
- [ ] Define file extension.
- [ ] Define root document contract.
- [ ] Define scene graph schema.
- [ ] Define animation schema.
- [ ] Define state machine schema.
- [ ] Define component/instance schema.
- [ ] Define binding schema.
- [ ] Define constraint schema.
- [ ] Define asset references.
- [ ] Define metadata.
- [ ] Define schema version.
- [ ] Define validation.
- [ ] Define canonicalization.
- [ ] Define migration.
- [ ] Define integrity/checksum behavior if needed.
- [ ] Add old->current migration tests.
- [ ] Add current->current round-trip tests.
- [ ] Add invalid document tests.

## 9.5 Native format invariant

```text
Native Document
        ↓
OpenSVG Runtime
```

phải load được mà không cần Studio state.

---

# 10. P1 — Native Format API

### Target

```ts
interface OpenSVGDocument {
  schemaVersion: string;
  metadata: DocumentMetadata;
  scene: SceneDefinition;
  animations: AnimationDefinition[];
  stateMachines: StateMachineDefinition[];
  components: ComponentDefinition[];
  bindings: BindingDefinition[];
  constraints: ConstraintDefinition[];
  assets: AssetManifest;
}
```

Tên type thực tế có thể thay đổi; semantic ownership mới là điều bắt buộc.

### TODO

- [ ] `parse()`.
- [ ] `validate()`.
- [ ] `migrate()`.
- [ ] `canonicalize()`.
- [ ] `serialize()`.
- [ ] `load()` vào headless runtime.
- [ ] `save()` từ Studio.

---

# 11. P1 — SVG as First-Class Input

OpenSVG phải tận dụng chữ "SVG" trong tên sản phẩm.

## Target pipeline

```text
SVG
 ↓
Parse
 ↓
Canonical SVG Geometry / Scene Graph
 ↓
Animation
 ↓
State Machine
 ↓
Runtime
```

## TODO

- [ ] Preserve path semantics.
- [ ] Preserve compound paths.
- [ ] Preserve fill/stroke.
- [ ] Preserve gradients.
- [ ] Preserve masks/clips where supported.
- [ ] Preserve transforms.
- [ ] Preserve text where supported.
- [ ] Define unsupported SVG semantics explicitly.
- [ ] Add import fixtures.
- [ ] Add import -> native -> render regression tests.

---

# 12. P1 — Interactive SVG Runtime

> Đây là **trụ cột số 2 của product phase**.

## Runtime model

```text
Native Document
      ↓
OpenSVG Runtime
      ↓
Inputs
      ↓
State Machine
      ↓
Animation
      ↓
Bindings / Constraints
      ↓
RenderScene
```

## Input model

- [ ] Pointer enter.
- [ ] Pointer leave.
- [ ] Pointer down.
- [ ] Pointer up.
- [ ] Click.
- [ ] Hover state.
- [ ] Keyboard input nếu cần.
- [ ] External Boolean.
- [ ] External Number.
- [ ] External Trigger.
- [ ] External progress/value.

## Runtime API

- [ ] `load(document)`.
- [ ] `setState(name)`.
- [ ] `setBoolean(name, value)`.
- [ ] `setNumber(name, value)`.
- [ ] `fireTrigger(name)`.
- [ ] `advance(dt)`.
- [ ] `seek(t)`.
- [ ] `render()` / `getRenderState()`.
- [ ] `dispose()`.

Runtime API phải headless.

---

# 13. P1 — Web Runtime

## Mục tiêu

Studio không phải runtime.

```text
OpenSVG Studio
     ↓
Native Document
     ↓
OpenSVG Web Runtime
```

## TODO

- [ ] Define browser runtime package.
- [ ] Load native document.
- [ ] Mount runtime to canvas/SVG/Web component.
- [ ] Pointer event adapter.
- [ ] Runtime state API.
- [ ] Runtime animation loop.
- [ ] Runtime disposal.
- [ ] Error handling.
- [ ] Version compatibility.

---

# 14. P1/P2 — React Adapter

React chỉ nên là adapter, không phải runtime core.

### Target

```tsx
<OpenSVG
  src="button.osvg"
  state="loading"
  progress={0.72}
/>
```

### TODO

- [ ] Define React wrapper.
- [ ] Prop -> runtime input mapping.
- [ ] Lifecycle management.
- [ ] Ref/API access.
- [ ] SSR/document loading policy nếu cần.
- [ ] Ensure no React dependency leaks into core.

---

# 15. P2 — Web Component Adapter

Potential API:

```html
<opensvg-animation src="button.osvg"></opensvg-animation>
```

### TODO

- [ ] Custom element.
- [ ] Attribute mapping.
- [ ] Runtime lifecycle.
- [ ] Event forwarding.
- [ ] Public state/input API.
- [ ] Basic browser integration test.

---

# 16. KILLER WORKFLOW — SVG → Interactive Component

> Đây là **trụ cột số 3** và là thước đo product, không phải chỉ là demo UI.

## Target workflow

```text
Import SVG
   ↓
Edit vector
   ↓
Animate
   ↓
Create states
   ↓
Bind interaction/data
   ↓
Preview
   ↓
Save native document
   ↓
Embed runtime
```

## Killer Example — Interactive Button

### Visual states

```text
idle
hover
pressed
disabled
loading
success
error
```

### Animation

```text
idle → hover     scale / easing
hover → pressed  scale / spring
pressed → idle   spring return
loading          spinner / progress
success          morph / color
error            feedback motion
```

### Runtime input

```text
hover
click
pointerdown
pointerup
progress
state
```

## Definition of Done

Có thể tạo một interactive SVG component trong Studio, lưu thành native document và chạy nó bằng headless/browser runtime mà không cần mở Studio.

---

# 17. Killer Workflow — Developer Consumption

Sau khi native runtime ổn định, developer phải có thể dùng animation mà không cần hiểu editor internals.

### Target

```text
button.osvg
   ↓
load runtime
   ↓
setState("loading")
   ↓
setValue("progress", 0.72)
```

## TODO

- [ ] Define ergonomic runtime API.
- [ ] Define state/input naming rules.
- [ ] Define runtime error messages.
- [ ] Define compatibility/version contract.
- [ ] Add minimal example project.
- [ ] Add browser example.
- [ ] Add React example.

---

# 18. P2 — Runtime Embeddability

## Minimum targets

```text
Web
React
Web Component
```

Chưa cần:

```text
Unity
Unreal
iOS
Android
native game engines
```

trong phase này.

---

# 19. Performance Focus

Không benchmark feature không phục vụ product.

## Benchmark fixtures

- [ ] 100 nodes.
- [ ] 500 nodes.
- [ ] 1,000 nodes.
- [ ] Large path scene.
- [ ] 10,000 keyframes.
- [ ] Many active tracks.
- [ ] Multiple state machines.
- [ ] Multiple constraints.
- [ ] Multiple component instances.
- [ ] Multiple bindings.

## Metrics

- [ ] Load time.
- [ ] Seek time.
- [ ] Evaluation time.
- [ ] Render derivation time.
- [ ] Memory.
- [ ] Allocations.
- [ ] Frame stability.

Không claim SLA nếu chưa đo trên fixture cụ thể.

---

# 20. Backend / Rendering Completion

## Existing direction

Canvas2D và WebGPU backend đã tồn tại trong repository history và render-state abstraction đã được đưa vào pipeline.

## TODO

- [ ] Render parity for common shapes.
- [ ] Render parity for transforms.
- [ ] Render parity for fills/strokes.
- [ ] Render parity for gradients.
- [ ] Render parity for path geometry.
- [ ] Render parity for clip/filter cases được hỗ trợ.
- [ ] Golden test fixtures.
- [ ] Explicit tolerance.
- [ ] Device-loss handling tests nếu WebGPU path dùng production.

WebGPU là implementation mechanism, không phải product strategy.

---

# 21. Persistence / Native Format Relationship

Repository đã có migration infrastructure; không tạo persistence system song song chỉ để đổi tên format.

## TODO

- [ ] Xác định schema migration engine là nền của native format.
- [ ] Tách editor/session state khỏi persisted document.
- [ ] Canonicalize trước serialize.
- [ ] Validate trước runtime load.
- [ ] Reject/repair malformed documents theo policy rõ ràng.
- [ ] Version compatibility tests.

---

# 22. Feature Freeze Rules

Trong strategic phase này, **không ưu tiên**:

```text
- Particle system
- 3D
- Massive VFX stack
- Collaboration
- Plugin marketplace
- Dozens of export formats
- Full After Effects clone
- Full Figma clone
```

Chỉ đưa feature mới vào khi nó trực tiếp làm tốt hơn một trong:

```text
Native Format
Interactive Runtime
Killer Workflow
```

---

# 23. Required Architecture Gates

Mỗi task mới phải kiểm tra:

```text
[ ] Có tạo source of truth thứ hai không?
[ ] Có bypass unified evaluation pipeline không?
[ ] Có đưa runtime logic vào React/UI không?
[ ] Có mutate authoring document trong playback/evaluation không?
[ ] Có thêm field lớn vào BaseNode không?
[ ] Có tạo backend-specific logic trong canonical document không?
[ ] Có phá native schema/migration không?
[ ] Có cần test determinism không?
[ ] Có cần benchmark không?
```

Nếu câu trả lời không rõ → chưa merge.

---

# 24. Definition of Done — Runtime Foundation

```text
[ ] Một evaluation pipeline duy nhất
[ ] Một runtime clock
[ ] State Machine tích hợp pipeline
[ ] Components tích hợp pipeline
[ ] Bindings tích hợp pipeline
[ ] Constraints tích hợp pipeline
[ ] Canonical hierarchy evaluation
[ ] EvaluatedSceneState ổn định
[ ] RenderScene ổn định
[ ] Canvas2D parity
[ ] WebGPU parity cho phạm vi hỗ trợ
[ ] Determinism tests
[ ] Performance tests
```

---

# 25. Definition of Done — Native Format

```text
[ ] Canonical schema
[ ] Versioning
[ ] Validation
[ ] Canonicalization
[ ] Migration
[ ] Serialization
[ ] Loading
[ ] Runtime compatibility
[ ] Round-trip tests
[ ] Invalid document tests
```

---

# 26. Definition of Done — Interactive Runtime

```text
[ ] Headless runtime
[ ] State API
[ ] Input API
[ ] Event API
[ ] Animation API
[ ] Browser adapter
[ ] React adapter
[ ] Basic Web Component adapter
[ ] Lifecycle/disposal
[ ] Runtime version contract
```

---

# 27. Definition of Done — Killer Workflow

```text
[ ] Import SVG
[ ] Edit vector
[ ] Animate
[ ] Define states
[ ] Bind interaction
[ ] Preview
[ ] Save native document
[ ] Load native document outside Studio
[ ] Run interactive animation in browser
[ ] Drive it through external state/data
```

---

# 28. Final Product Direction

OpenSVG không cố trở thành:

```text
"Figma clone"
"Rive clone"
"After Effects clone"
```

Định hướng phải là:

> **SVG-native motion authoring + portable interactive animation runtime.**

Kiến trúc sản phẩm:

```text
                OpenSVG
                   │
          ┌────────┴────────┐
          ↓                 ↓
       Studio            Runtime
          │                 │
       Author              │
          │                 │
          └───────┬─────────┘
                  ↓
          Native OpenSVG Format
                  ↓
        Browser / React / Web Component
```

## Product thesis

```text
SVG
 ↓
Motion
 ↓
State
 ↓
Interaction
 ↓
Data
 ↓
Portable Runtime
```

Đây là trục phát triển chính. Mọi thứ ngoài trục này là thứ yếu cho đến khi pipeline trên chạy hoàn chỉnh.
