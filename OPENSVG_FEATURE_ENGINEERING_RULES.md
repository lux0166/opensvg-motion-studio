# OpenSVG Motion Studio — Feature Engineering Rules

## Mục đích

Tài liệu này là lớp **domain-specific engineering rules** áp dụng lên trên `CONSTITUTION.md` của OpenSVG Motion Studio.

Nó quy định các invariant bắt buộc cho 7 Epic:

1. Vector Geometry & Transform Engine
2. Advanced Timeline & Motion Graph
3. Layer Hierarchy, Masking & Rigging
4. Kinetic Typography & Path Effects
5. Audio Synchronization & Media Bus
6. Multi-Format Exporter & Code Generation
7. Desktop Native Shell

> **Nguyên tắc:** Constitution quy định kiến trúc tổng quát; tài liệu này quy định những semantics/invariants bắt buộc khi triển khai từng domain.

---

# I. GLOBAL RULES — Áp dụng cho tất cả Epic

## Rule A1 — Canonical Source of Truth

Mọi feature phải thao tác trên **canonical document model**.

Không tạo:

- `PivotModel`
- `TimelineModel2`
- `MaskModel2`
- `TextAnimationModel`
- `AudioTimelineModel`
- `ExportSceneModel`

chỉ vì feature mới dễ triển khai hơn.

---

## Rule A2 — Engine First, UI Second

Flow bắt buộc:

```text
UI
 ↓
Domain Command / Operation
 ↓
Core Engine
 ↓
Document / Runtime
 ↓
Derived State
 ↓
UI
```

Không để UI component chứa business/engine semantics.

---

## Rule A3 — No UI-Owned Semantics

React component không được quyết định:

- geometry mathematics
- interpolation
- path topology
- transform semantics
- masking semantics
- audio analysis
- export semantics
- persistence/recovery semantics

---

## Rule A4 — No Hidden Mutation

Không sửa canonical document từ:

- renderer
- evaluator
- preview
- exporter
- audio analyzer
- GPU backend

Derived evaluation phải pure/deterministic khi có thể.

---

## Rule A5 — Stable Identity

Mọi object persistent phải có identity ổn định:

```text
node
path
subpath
vertex
track
keyframe
mask
audio track
marker
asset
component
```

Không dùng array index làm persistent identity.

---

## Rule A6 — Determinism

Cùng:

```text
Document
+
Runtime Inputs
+
Time
+
Configuration
```

phải tạo cùng logical result.

---

## Rule A7 — No Hardcoded Behavior

Không hardcode logic nghiệp vụ kiểu:

```ts
if (node.id === "card") ...
if (track.id === "tr-rot") ...
if (property === "special-case") ...
```

Ngoại lệ hợp lệ:

- protocol constants
- mathematical constants
- format-specification constants
- intentional product defaults
- test fixtures

---

## Rule A8 — Versioned Data

Bất cứ feature nào thay đổi persistent document phải có:

```text
schema
validation
migration
round-trip test
```

---

## Rule A9 — Existing Contracts First

Agent phải inspect trước:

```text
src/engine/types.ts
src/engine/evaluator.ts
src/engine/renderer.ts
src/engine/history.ts
src/engine/projectManager.ts
src/store/
existing tests
```

trước khi tạo implementation mới.

---

## Rule A10 — Feature ≠ Production Ready

Không được claim:

```text
complete
production-ready
industry-grade
full-fidelity
```

chỉ vì build pass.

Phải có evidence tương ứng.

---

# II. EPIC 1 — Vector Geometry & Transform Engine

Đây là domain có yêu cầu **mathematical correctness** cao.

## Rule G1 — Pivot / Anchor là Domain Data

Pivot là một phần của transform semantics.

Không:

```text
drag pivot
→ sửa trực tiếp x/y
```

Phải:

```text
pivot change
→ transform composition changes
```

Thay pivot không được tự ý thay đổi local geometry.

---

## Rule G2 — Compound Path là First-Class

Không giả định:

```text
Path = one point array
```

Phải hỗ trợ concept:

```text
Path
├── Contour 1
├── Contour 2
└── Contour N
```

Mỗi contour có semantics riêng:

- open/closed
- direction
- winding
- fill participation

---

## Rule G3 — Hole Semantics là Explicit

Compound path phải xác định rõ:

```text
fill rule
winding rule
hole/sub-path relationship
```

Không suy luận hole chỉ bằng UI ordering.

Nguồn chuẩn SVG path:

https://www.w3.org/TR/SVG/paths.html

---

## Rule G4 — Vertex Type là Semantic State

Vertex phải có trạng thái rõ ràng:

```text
Corner
Smooth
Asymmetric
```

Không encode vertex type bằng heuristic UI.

Conceptually:

```text
Vertex
├── position
├── incoming tangent
├── outgoing tangent
└── tangentMode
```

---

## Rule G5 — Smooth Guarantees Tangent Continuity

`Smooth` phải có invariant hình học xác định.

`Corner` và `Asymmetric` phải cho phép tangent độc lập theo contract.

---

## Rule G6 — Pen Preview là Ephemeral

Trong realtime pointer interaction:

```text
PointerMove
→ Preview Geometry
→ Render
```

Không commit document trên mỗi pointer move.

Commit khi operation hoàn tất.

---

## Rule G7 — Pen Operation là Transaction

Một thao tác pen phải có một transaction rõ ràng:

```text
Begin
→ Preview
→ Commit
```

hoặc:

```text
Begin
→ Preview
→ Cancel
```

Undo chỉ ghi nhận operation đã commit.

---

## Rule G8 — Tangent Snapping dùng Canonical Geometry

Không viết một snapping algorithm riêng trong UI.

Snapping phải consume geometry/constraint APIs chung.

---

## Rule G9 — Distance Semantics phải Explicit

Phải phân biệt:

```text
Euclidean Distance
Path Distance
Center-to-Center
Edge-to-Edge
```

Không để từng panel tự định nghĩa "distance".

---

## Rule G10 — Equal Spacing là Geometry Operation

Distribution phải operate trên canonical geometric measurements, không dựa trên pixel positions riêng của UI.

---

# III. EPIC 2 — Advanced Timeline & Motion Graph

## Rule T1 — Batch Edit là Transaction

Ví dụ:

```text
100 keyframes selected
→ drag once
```

phải tạo:

```text
ONE logical operation
ONE undo unit
```

không phải 100 history entries.

---

## Rule T2 — Time Transformation là Domain Operation

Các operation:

```text
Scale
Slide
Reverse
```

phải hoạt động trên timeline semantics, không phải thao tác DOM/UI coordinates.

---

## Rule T3 — Reverse phải có công thức canonical

Ví dụ:

```text
t' = duration - t
```

Nhưng implementation phải xác định rõ behavior cho:

- easing
- spring
- markers
- audio alignment
- duration
- loop boundaries

Không chỉ:

```ts
keyframes.reverse()
```

---

## Rule T4 — Auto-Keyframing có một Engine duy nhất

Không để mỗi Inspector field tự triển khai Auto-Keying.

Flow:

```text
Edit Transaction
 ↓
Detect animatable property
 ↓
Resolve current time
 ↓
Find/create track
 ↓
Insert/update keyframe
 ↓
Normalize track
 ↓
Commit history
```

---

## Rule T5 — Keyframe Normalization tại Mutation Boundary

Keyframes phải được normalize khi:

- insert
- delete
- move
- paste
- batch transform

Evaluator không nên chịu trách nhiệm sửa dữ liệu authoring.

---

## Rule T6 — Timeline và Graph dùng cùng Evaluation Semantics

Không được có:

```text
Timeline interpolation = A
Graph interpolation = B
Exporter interpolation = C
```

Tất cả phải dùng cùng canonical interpolation model.

---

## Rule T7 — Time Transformation bảo toàn Track Integrity

Scale/slide/reverse phải giữ:

```text
track identity
keyframe identity
property identity
easing metadata
spring metadata
```

trừ khi operation có chủ ý transform những dữ liệu đó.

---

## Rule T8 — Copy/Paste Keyframes không copy Identity nguyên xi

Khi paste:

```text
new keyframe IDs
```

và nếu cần:

```text
new track IDs
```

phải được cấp đúng theo context.

Không tạo duplicate IDs.

---

## Rule T9 — Cross-Node Paste phải Resolve Capability

Nếu source track là:

```text
rotation
```

và destination không hỗ trợ property tương ứng, operation phải:

```text
reject
or
explicitly convert
```

Không silently corrupt document.

---

## Rule T10 — Graph Overlay là View

Graph Editor không sở hữu animation data.

Nó chỉ project canonical tracks thành graph representation.

---

# IV. EPIC 3 — Layer Hierarchy, Masking & Rigging

## Rule L1 — Masking là Render/Scene Semantics

Mask không phải CSS trick.

Phải model explicit:

```text
Alpha Mask
Clipping Mask
Group Opacity
```

---

## Rule L2 — Alpha Mask và Clip Mask khác nhau

Không dùng một boolean:

```text
mask: true
```

để đại diện cho mọi masking semantics.

---

## Rule L3 — Mask Ownership phải Rõ

Phải biết:

```text
mask owner
mask source
masked content
stack/order
```

Không suy ra bằng UI layout.

---

## Rule L4 — Local Transform Inheritance dùng Canonical Transform

Không phép cộng:

```text
parent.x + child.x
```

rải rác trong UI.

Phải:

```text
Local Transform
→ Parent Transform
→ World Transform
```

---

## Rule L5 — World Transform là Derived State

Không tạo nhiều source of truth:

```text
node.worldX
node.worldY
```

trừ khi có explicit cache/invalidation contract.

---

## Rule L6 — Solo/Focus là Ephemeral Editor State

Không biến:

```text
Solo
Focus
Isolation
```

thành:

```text
node.visible = false
```

và làm thay đổi document.

---

## Rule L7 — Rigging phụ thuộc Transform Engine

Không xây rig/IK độc lập với canonical transform contract.

---

# V. EPIC 4 — Kinetic Typography & Path Effects

## Rule K1 — Text on Path dùng Path Metric Engine

Flow:

```text
Text
→ Glyph Layout
→ Path Length
→ Point-at-Distance
→ Tangent
→ Glyph Transform
```

Không giả lập bằng cách cộng x/y thủ công.

---

## Rule K2 — Glyph Placement là Derived State

Vị trí từng glyph không trở thành persistent document property trừ khi explicitly converted/baked.

---

## Rule K3 — Text-on-Path phải deterministic

Cùng:

```text
font
text
path
font metrics
offset
```

phải tạo cùng glyph layout trong cùng runtime configuration.

---

## Rule K4 — Kinetic Stagger là Temporal Transform

Phải có model:

```text
Base Animation
+
Stagger Function
+
Delay
+
Direction
+
Range
```

Không rải:

```ts
delay += 0.05;
```

trong component.

---

## Rule K5 — Stagger không duplicate animation logic

Stagger phải consume canonical animation tracks/evaluation.

---

## Rule K6 — Trim Path là First-Class Path Effect

Model nên có semantics:

```text
start
end
offset
```

Không coi Trim Path đơn giản chỉ là:

```text
strokeDashOffset
```

vì Trim Path liên quan tới:

- path length
- contour
- direction
- open/closed state
- animation

---

# VI. EPIC 5 — Audio Synchronization & Media Bus

## Rule A1 — Audio Asset ≠ Analysis Data

Phân biệt:

```text
AudioAsset
AudioAnalysis
WaveformCache
BeatMap
```

---

## Rule A2 — Audio Analysis là Derived Cache

Không lưu toàn bộ waveform/FFT/raw analysis như canonical document data nếu không cần.

---

## Rule A3 — Time Domains Explicit

Phải phân biệt:

```text
Audio Time
Project Time
Frame Time
```

Conversion phải canonical.

---

## Rule A4 — Beat Marker có Provenance

Beat/peak event nên có metadata:

```text
time
confidence
source
analysisVersion
```

Không coi mọi amplitude peak là guaranteed musical beat.

---

## Rule A5 — Audio Reactive Generator là Pure Mapping

Flow:

```text
AudioAnalysis
+
MappingConfig
→
Generated Animation Data
```

Không trực tiếp mutate UI mỗi audio frame.

---

## Rule A6 — Generated Keyframes phải qua Transaction

Audio-reactive keyframe generation phải có:

```text
preview
commit
history
```

giống mọi mutation domain khác.

---

# VII. EPIC 6 — Multi-Format Exporter & Code Generation

## Rule E1 — Exporter là Adapter

Exporter không tạo semantics mới.

```text
Canonical Document / Runtime
→ Export Intermediate Representation
→ Target Adapter
```

---

## Rule E2 — Export Fidelity phải Explicit

Mỗi target phải phân loại:

```text
Supported
Approximated
Unsupported
```

Không gọi “full fidelity” nếu chưa có evidence.

---

## Rule E3 — MP4 Export cần Frame-Deterministic Runtime

Video export phải:

```text
seek(t0)
render
seek(t1)
render
...
```

hoặc equivalent deterministic sampling.

Không dựa vào UI playback timing.

---

## Rule E4 — Codec Capability không hardcode

Hardware acceleration phụ thuộc:

```text
OS
codec
driver
GPU
backend
runtime
```

Phải detect capability thay vì giả định.

---

## Rule E5 — Code Generator là Compiler

React/Framer Motion generator phải:

```text
Document
→ Intermediate Representation
→ Capability Analysis
→ Code Model / AST
→ Generated Source
```

Không nối chuỗi code tùy tiện.

---

## Rule E6 — Generated Code phải được Escape

User-controlled:

```text
text
names
IDs
colors
asset names
```

phải được sanitize/escape trước khi đi vào source code.

---

## Rule E7 — Generated Identifiers phải Stable và Valid

Không dùng raw node names trực tiếp làm identifier.

---

## Rule E8 — Lottie phải có Capability Matrix

Mỗi OpenSVG property/effect phải map rõ:

```text
Native
Approximate
Bake
Unsupported
```

---

## Rule E9 — Zero-Dependency HTML là Runtime Bundle

Phải package:

```text
Document
Runtime
Renderer
Assets
```

thành artifact độc lập.

Không claim zero-dependency nếu vẫn cần:

```text
Vite runtime
React application
local module
npm
development server
```

---

# VIII. EPIC 7 — Desktop Native Shell

## Rule D1 — Tauri is Adapter Layer

Native shell cung cấp:

```text
filesystem
dialog
OS integration
menus
native shortcuts
```

Không sở hữu animation semantics.

---

## Rule D2 — File Dialog không bypass Serializer

Flow:

```text
Native Dialog
→ File bytes
→ Project Serializer
→ Validation
→ Migration
→ Document
```

---

## Rule D3 — Auto-save là Persistence Engine

Không:

```ts
setInterval(save, 5000)
```

mà bỏ qua transaction/recovery semantics.

---

## Rule D4 — Crash Recovery phải Atomic

Phải xử lý:

```text
write interruption
partial write
corrupt snapshot
crash
recovery conflict
```

---

## Rule D5 — Recovery không được phá Current Document

Nếu recovery thất bại:

```text
current in-memory document
```

không được bị overwrite bởi trạng thái không hợp lệ.

---

## Rule D6 — Keybinding là Command Registry

Không định nghĩa shortcut độc lập ở:

```text
Header
Canvas
Timeline
Tauri
```

Phải có:

```text
CommandRegistry
```

và platform/UI adapters consume registry đó.

---

## Rule D7 — One Command, Many Adapters

Ví dụ:

```text
Save
```

có thể được kích hoạt bởi:

```text
Ctrl+S
Menu
Toolbar
Tauri native menu
```

nhưng semantics chỉ có một.

---

# IX. Cross-Epic Architecture Contract

Tất cả 7 Epic phải tuân theo pipeline:

```text
                    CANONICAL DOCUMENT
                           │
                    DOMAIN OPERATION
                           │
                 ┌─────────▼─────────┐
                 │      RUNTIME      │
                 │                   │
                 │ Animation         │
                 │ Constraints       │
                 │ State Machine     │
                 │ Audio Mapping     │
                 └─────────┬─────────┘
                           │
                    EVALUATED STATE
                           │
                 ┌─────────▼─────────┐
                 │   RENDER ENGINE   │
                 └─────────┬─────────┘
                           │
                 ┌─────────▼─────────┐
                 │ BACKEND           │
                 │ Canvas2D / GPU    │
                 └───────────────────┘
```

Exporter là nhánh riêng:

```text
CANONICAL DOCUMENT / RUNTIME
            │
       EXPORT IR
            │
     ┌──────┼────────┬──────────┐
     │      │        │          │
    SVG   Lottie    React      Video
```

Exporter không trở thành engine thứ hai.

---

# X. Swarm Task Contract

Mỗi task phải ghi:

```text
### DOMAIN
Geometry | Transform | Animation | Runtime | Rendering | Persistence | Export

### SOURCE OF TRUTH
Object/module nào sở hữu dữ liệu?

### INPUT
Dữ liệu đầu vào là gì?

### OUTPUT
Derived state nào được tạo?

### INVARIANTS
Điều gì MUST luôn đúng?

### TRANSACTION
Một user operation gồm những bước nào?

### HISTORY
Đâu là một undo unit?

### SERIALIZATION
Schema có thay đổi không?

### DETERMINISM
Cùng input/time có cùng result không?

### PERFORMANCE
Hot path là gì?

### TEST
Test nào chứng minh correctness?

### FORBIDDEN
Shortcut nào bị cấm?
```

---

# XI. Definition of Done

Một feature thuộc 7 Epic chỉ được coi là hoàn tất khi:

```text
[ ] Domain semantics được định nghĩa
[ ] Canonical source of truth được xác định
[ ] Không tạo parallel model
[ ] UI chỉ là projection
[ ] History/transaction đã được xác định
[ ] Persistence impact đã được xác định
[ ] Determinism đã được xem xét
[ ] Unit tests có
[ ] Regression tests có nếu sửa engine
[ ] Performance impact đã được xem xét
[ ] Export impact đã được xem xét nếu liên quan
[ ] Existing features không bị phá
[ ] Claim hoàn thành có evidence
```

---

# XII. Absolute Anti-Patterns

Không chấp nhận:

```text
UI chứa geometry algorithm
UI chứa interpolation
Renderer mutate document
Exporter tự evaluate bằng algorithm riêng
Timeline có interpolation riêng
Audio component tự tạo keyframes
Mask dùng CSS hack làm canonical implementation
Pivot sửa x/y trực tiếp
Solo mutate visibility
Copy/paste tạo duplicate IDs
Auto-keyframing có nhiều implementation
React code generator bằng string concatenation không sanitize
Tauri command chứa business logic animation
GPU backend truy cập SceneNode trực tiếp
WebGPU implementation trở thành canonical runtime
```

---

# XIII. Architectural Priority

Khi các requirement xung đột:

```text
1. Correctness
2. Document integrity
3. Animation semantics
4. Determinism
5. Backward compatibility
6. Rendering correctness
7. Performance
8. Maintainability
9. UI convenience
10. Micro-optimization
```

Không hy sinh document integrity hoặc animation semantics chỉ để hoàn thành UI nhanh hơn.

---

# XIV. Core Principle

> **Mỗi feature mới phải làm OpenSVG mạnh hơn ở cùng một engine, không được tạo ra một engine mới bên trong feature đó.**

Mục tiêu cuối cùng:

```text
ONE DOCUMENT MODEL
        ↓
ONE TRANSFORM SYSTEM
        ↓
ONE GEOMETRY SYSTEM
        ↓
ONE ANIMATION EVALUATOR
        ↓
ONE RUNTIME
        ↓
ONE RENDER CONTRACT
        ↓
MANY ADAPTERS
```

Đó là kiến trúc cần giữ khi swarm tiếp tục mở rộng OpenSVG Motion Studio.
