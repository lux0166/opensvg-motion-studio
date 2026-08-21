

Repo hiện đã có `src/engine`, `src/store`, React/Tauri, scene graph, evaluator, renderer, history, importer/exporter, physics, state machine và test suite riêng.
Đồng thời `useStudioStore.ts` hiện đang giữ cả document state, editor state và mutation actions; `types.ts` đang tập trung khá nhiều responsibility vào `BaseNode`; evaluator hiện sort keyframes lúc runtime; history dùng full snapshots; exporter vẫn chứa một số logic/adaptor assumptions trực tiếp.

# OpenSVG Motion Studio — Architecture Constitution

**Mục tiêu:** cho phép swarm agent tiếp tục phát triển OpenSVG Motion Studio mà không làm vỡ canonical model, animation semantics, rendering correctness, persistence, performance hoặc khả năng mở rộng.

---

# I. Constitutional Principles

### Rule 01 — Canonical Model

**Document Model là nguồn sự thật duy nhất cho project content.**

Không có component, panel, renderer hoặc exporter nào được tự sở hữu một bản document riêng.

---

### Rule 02 — UI Is a Projection

UI chỉ là projection/editor của model.

```text
UI
 ↓
Command / Domain Action
 ↓
Document
```

Không:

```text
UI
 ↓
mutate random object
```

---

### Rule 03 — No Parallel Truth

Không được tạo thêm:

```text
SecondSceneModel
SecondAnimationModel
SecondTimelineModel
```

chỉ vì subsystem mới “dễ làm hơn”.

---

### Rule 04 — Preserve Existing Engine Contracts

Agent không được tự ý thay đổi contract của:

```text
SceneNode
PropertyTrack
Keyframe
SceneProject
Evaluator
Renderer
Importer
Exporter
```

nếu không có migration hoặc ADR tương ứng.

---

### Rule 05 — Extend Before Rebuild

Nếu subsystem hiện tại đáp ứng được requirement, **mở rộng subsystem đó** thay vì tạo subsystem thứ hai.

---

### Rule 06 — Domain Over Framework

Architecture không được phụ thuộc vào React, Zustand, Tailwind hoặc component library ở domain layer.

---

### Rule 07 — Engine Must Be Headless-Capable

Core animation/geometry/evaluation logic phải có khả năng chạy mà không cần React UI.

---

### Rule 08 — Determinism

Cùng:

```text
Document + Time + Configuration
```

phải tạo cùng evaluated result, trong cùng precision policy.

---

### Rule 09 — Explicit Ownership

Mỗi dữ liệu hoặc mutation chỉ có **một owner rõ ràng**.

---

### Rule 10 — No Hidden Mutation

Không mutation document thông qua side effect ẩn, global variable, singleton không kiểm soát hoặc callback magic.

---

# II. Repository Boundaries

### Rule 11 — `src/components` Is UI

`src/components` không chứa:

* geometry algorithms
* interpolation
* serialization
* persistence logic
* path boolean algorithms
* animation evaluation

---

### Rule 12 — `src/engine` Is Domain/Engine

`src/engine` chứa logic:

```text
geometry
animation
evaluation
rendering
import/export
physics
interaction semantics
```

nhưng không được biết React component.

---

### Rule 13 — `src/store` Is Orchestration State

Store có thể điều phối editor state và domain commands, nhưng không được trở thành nơi chứa toàn bộ domain implementation.

---

### Rule 14 — Store Is Not The Engine

Không đưa algorithm lớn vào `useStudioStore.ts`.

Nếu action vượt quá orchestration:

```text
store action
 ↓
engine/domain service
```

---

### Rule 15 — Rust Is Infrastructure Boundary

Tauri/Rust chỉ nên chịu trách nhiệm native/system concerns khi thật sự cần:

```text
filesystem
native dialogs
OS integration
desktop capabilities
heavy native processing
```

Không chuyển animation semantics sang Rust chỉ vì “Rust nhanh hơn”.

---

### Rule 16 — Exporters Are Adapters

`exporter.ts` hoặc exporter modules không định nghĩa semantics mới cho animation.

Exporter phải consume canonical document/evaluated model.

---

### Rule 17 — Importers Are Translators

SVG importer chuyển external representation → canonical model.

Không tạo “SVG-native internal model”.

---

### Rule 18 — Tests Follow Ownership

Test của engine phải nằm gần engine responsibility hoặc test boundary rõ ràng; không phụ thuộc UI để verify mathematical correctness.

---

# III. Scene Graph Constitution

Repo hiện đã có `id`, `parentId`, `childrenIds`, `nodes`, `nodeOrder`; đây phải trở thành nền tảng identity architecture.

### Rule 19 — Stable Identity

Node identity luôn dựa trên stable ID.

Không dùng array index làm identity.

---

### Rule 20 — IDs Are Referential

Track, keyframe, node, component, asset... phải được tham chiếu bằng stable identity.

---

### Rule 21 — Node Order Is Not Identity

`nodeOrder` chỉ mô tả ordering/z-order, không phải identity.

---

### Rule 22 — Parent/Child Relationship Is Explicit

Hierarchy phải được biểu diễn bằng relationship rõ ràng.

Không suy ra parent chỉ từ array position.

---

### Rule 23 — No Accidental Cycles

Scene graph không được cho phép:

```text
A → B → C → A
```

Mutation phải validate.

---

### Rule 24 — Root Has Explicit Semantics

Root frame/document root phải có invariant rõ ràng và không bị coi như một node bình thường.

---

### Rule 25 — Hierarchy Changes Are Transactions

Move/reparent/ungroup/group phải là một operation atomic.

---

### Rule 26 — Z-order Is Separate From Parentage

Parent-child relationship và sibling ordering là hai concepts khác nhau.

---

### Rule 27 — Deletion Cascades Are Explicit

Xóa node phải xác định rõ:

```text
children
tracks
constraints
triggers
assets
references
```

có bị xóa, reparent hay detach.

---

### Rule 28 — No Orphaned References

Không cho document tồn tại track hoặc reference trỏ đến node không tồn tại.

---

# IV. Node/Data Model

`BaseNode` hiện đang chứa transform, appearance, geometry, typography, animation, triggers; đây là vùng cần kiểm soát để không tiếp tục phình.

### Rule 29 — BaseNode Must Stay Lightweight

Không tiếp tục nhồi mọi feature mới vào `BaseNode`.

---

### Rule 30 — Separate Concerns Conceptually

Ngay cả khi vẫn giữ object shape hiện tại, architecture phải phân biệt:

```text
Transform
Geometry
Appearance
Animation
Interaction
Constraints
Metadata
```

---

### Rule 31 — New Capability Needs Ownership

Feature mới phải xác định trước nó thuộc:

```text
Geometry
Appearance
Animation
Interaction
Constraint
Document
```

---

### Rule 32 — Generic Properties Over Property Explosion

Ưu tiên property abstraction có thể mở rộng thay vì tạo hàng chục loại track riêng.

---

### Rule 33 — Property Paths Must Be Stable

Animation target nên có semantics ổn định.

Ví dụ:

```text
nodeId + propertyPath
```

không phụ thuộc UI structure.

---

### Rule 34 — No UI Labels As IDs

`label`, `name`, text hiển thị không được làm identity.

---

### Rule 35 — Defaults Must Be Explicit

Mỗi property phải có default semantics xác định.

Không để:

```text
undefined
```

có hành vi khác nhau ở từng subsystem.

---

### Rule 36 — Nullability Is Contract

`null`, `undefined`, omitted field và default value phải có semantics rõ ràng.

---

# V. Transform & Coordinate System

### Rule 37 — Coordinate Spaces Must Be Named

Ít nhất phải phân biệt:

```text
Local
Parent
World
Viewport/Canvas
Screen
```

---

### Rule 38 — Transform Composition Is Canonical

Phải có một phương pháp canonical để compose transform.

Không để mỗi subsystem tự tính transform.

---

### Rule 39 — No Ad-Hoc Transform Math in UI

Không viết transformation mathematics riêng trong Timeline/Inspector/Canvas component.

---

### Rule 40 — World Transform Is Derived

World transform nên được derive từ hierarchy, không trở thành source-of-truth thứ hai.

---

### Rule 41 — Pivot Is First-Class

Pivot/origin phải có semantics rõ ràng nếu rotation/scale phụ thuộc nó.

---

### Rule 42 — Selection Geometry Is Not Render Geometry

Bounding boxes/handles/selection overlays không được làm thay đổi actual node geometry.

---

# VI. Geometry & Path System

### Rule 43 — Path Is Structured Data

Path không được coi là SVG `d` string làm canonical representation.

---

### Rule 44 — Segment Types Are Explicit

Path segments phải phân biệt:

```text
move
line
cubic
close
```

hoặc abstraction tương đương.

---

### Rule 45 — Geometry Algorithms Are Pure Where Possible

Các operation như:

```text
boolean
morphing
bounds
interpolation
path normalization
```

nên ưu tiên pure functions.

---

### Rule 46 — Geometry Must Not Depend on React

Geometry engine không biết component nào đang hiển thị nó.

---

### Rule 47 — Path Morphing Requires Compatibility

Không được mặc định:

```text
points[i] ↔ points[i]
```

là correspondence hợp lệ cho mọi morph.

---

### Rule 48 — Morphing Must Define Topology Semantics

Morphing system phải có strategy cho:

```text
segment count
contour count
direction
correspondence
```

---

### Rule 49 — Precision Policy Is Explicit

Không được tùy tiện `toFixed()` trong engine nếu nó làm mất precision cần thiết.

Repo hiện tại đang round path interpolation về 2 decimals; đây phải là policy có chủ đích, không phải accidental behavior.

---

### Rule 50 — Boolean Operations Must Declare Guarantees

Boolean geometry phải ghi rõ limitation:

```text
supported geometry
winding rules
self-intersection behavior
precision limitations
```

Không tuyên bố generic nếu implementation chỉ hỗ trợ subset.

---

# VII. Animation Architecture

### Rule 51 — Keyframes Are Data

Keyframe không thuộc Timeline UI.

---

### Rule 52 — Frame Is Evaluation, Not Storage

Không chuyển animation thành frame-by-frame state chỉ vì preview.

---

### Rule 53 — Timeline Is Not Evaluation

Timeline UI hiển thị animation data; evaluator mới xác định giá trị tại thời gian `t`.

---

### Rule 54 — Evaluation Must Not Mutate Authoring State

Playback không được sửa canonical document.

---

### Rule 55 — Track Identity Is Stable

Track phải có stable ID và target semantics rõ ràng.

---

### Rule 56 — Keyframe Ordering Is an Invariant

Keyframes phải có deterministic ordering.

Không sort lại toàn bộ array trong mọi frame evaluation nếu có thể chuẩn hóa tại mutation time.

Repo hiện tại đang clone/sort keyframes trong `evaluateTrack()`; đây là technical debt performance cần loại bỏ dần.

---

### Rule 57 — Interpolation Is a Separate Concern

Interpolation không nằm trong Timeline UI.

---

### Rule 58 — Easing Is Data-Driven

Không rải `if/else` easing logic khắp code.

---

### Rule 59 — Spring Is Not Cubic-Bezier

Spring physics phải có semantics riêng; không giả lập spring bằng một cubic-bezier preset.

---

### Rule 60 — Evaluator Must Be Type-Aware

Evaluator phải hiểu semantics của:

```text
number
color
vector
path
boolean/discrete
```

thay vì generic `any` càng nhiều càng tốt.

---

### Rule 61 — No `any` in Core Animation Contracts

`PropertyTrack<any>` chỉ được xem là transitional debt.

Domain-critical APIs phải typed.

---

### Rule 62 — Time Model Is Canonical

Project phải xác định rõ:

```text
time unit
fps
duration
frame conversion
rounding
loop behavior
```

---

### Rule 63 — Deterministic Seek

Seek trực tiếp tới `t` phải cho cùng evaluated result như playback tới `t`.

---

### Rule 64 — Playback Does Not Own Data

Playback state:

```text
currentTime
isPlaying
loop
fps
```

không được trở thành animation source-of-truth.

---

# VIII. State Machine & Interaction

### Rule 65 — State Machines Are Domain Data

State machine không được là vài callback `onClick` trong component.

---

### Rule 66 — Event ≠ Action

Phải phân biệt:

```text
Event
Trigger
Condition
Action
State Transition
```

---

### Rule 67 — UI Events Must Be Translated

Canvas pointer events phải được translate thành semantic domain events trước khi state machine xử lý.

---

### Rule 68 — No Direct UI-to-Node Mutation

Interaction system không tự sửa React state tùy tiện.

---

### Rule 69 — State Machine Must Be Extensible

Không thiết kế API chỉ đủ:

```text
play
pause
jumpToTime
setProperties
```

nếu architecture hướng tới state graph.

---

### Rule 70 — Runtime and Editor Semantics Must Match

Interaction preview trong editor phải cố gắng dùng cùng semantics với exported/runtime behavior.

---

# IX. Renderer Constitution

### Rule 71 — Renderer Is Consumer

Renderer đọc evaluated state và render; renderer không sửa canonical document.

---

### Rule 72 — No Editor Semantics Inside Low-Level Renderer

Selection, snapping, timeline state phải nằm ở editor layer hoặc overlay subsystem, không làm renderer domain engine trở thành “god renderer”.

---

### Rule 73 — Render Pipeline Must Be Explicit

Conceptually:

```text
Document
→ Evaluate
→ Render State
→ Render
```

---

### Rule 74 — Dirty State Must Be First-Class

Khi scale lớn, renderer phải có strategy xác định cho:

```text
geometry dirty
transform dirty
style dirty
animation dirty
hierarchy dirty
```

---

### Rule 75 — Do Not Recompute Unchanged Geometry

Không rebuild path/geometry nếu input geometry không thay đổi.

---

### Rule 76 — UI Overlay Is Separate

Selection handles, snapping guides, marquee và editor overlays phải được tách khỏi scene content rendering.

---

### Rule 77 — High-DPI Is Infrastructure

DPR handling phải nằm ở renderer/viewport abstraction, không copy vào từng component.

---

### Rule 78 — Hit Testing Is a Domain Service

Hit testing không được chỉ là:

```text
point inside rectangle
```

nếu engine đã hỗ trợ rotation/path/Bezier.

---

# X. Store & Mutation Constitution

### Rule 79 — Store Actions Are Commands-at-the-Boundary

Store action phải có semantics rõ ràng, không phải random mutation callback.

---

### Rule 80 — Store Must Not Contain Giant Algorithms

Nếu action trở nên dài/algorithmic:

```text
extract to engine/service
```

---

### Rule 81 — History Must Cover Domain Mutations

Mọi mutation ảnh hưởng document phải có history policy.

---

### Rule 82 — History Is Not UI State

Không snapshot những thứ không thuộc document chỉ vì đang nằm trong Zustand.

Repo hiện snapshot cả `selectedId`, `selectedIds`; điều này có thể hữu ích cho UX, nhưng phải phân loại rõ **document history** và **editor history** về lâu dài.

---

### Rule 83 — No Mutation Bypass

Không có đường:

```text
component
→ mutate nodes directly
```

bỏ qua store/domain mutation layer.

---

### Rule 84 — Batch Related Changes

Một user operation tạo nhiều property changes phải có khả năng commit như một transaction/history unit.

---

### Rule 85 — Continuous Drag Is Transactional

Mouse drag:

```text
1000 pointermove events
```

không được biến thành 1000 undo steps.

---

# XI. Persistence & Schema

### Rule 86 — File Format Is Versioned

`version` phải có semantics thực tế.

Repo đã có `version: '1.0.0'`; từ đây trở đi version phải gắn với migration strategy.

---

### Rule 87 — Migration Is Explicit

Không “fallback” kiểu:

```text
missing field → default
```

rồi tuyên bố đó là migration.

---

### Rule 88 — Validate Before Accept

File load:

```text
parse
→ schema validation
→ migration
→ canonicalization
→ accept
```

---

### Rule 89 — Canonicalize Imported Data

External file data phải được normalize thành canonical internal representation.

---

### Rule 90 — Save Must Not Corrupt Source

Save failure không được làm mất current in-memory document.

---

### Rule 91 — Autosave Must Be Safe

Autosave không overwrite valid state bằng corrupted state.

---

### Rule 92 — Serialization Must Be Deterministic

Cùng document phải produce structurally equivalent serialized representation.

---

# XII. Import / Export

### Rule 93 — Import and Export Are Asymmetric

Import không cần giữ nguyên representation external; mục tiêu là giữ **semantics**.

---

### Rule 94 — Export Must Consume Canonical Model

Exporter không được tự “đoán” animation semantics.

---

### Rule 95 — Export Feature Must Declare Fidelity

Mỗi exporter phải biết:

```text
full support
partial support
unsupported
degraded
```

---

### Rule 96 — No Fake Export

Không được export static output rồi gọi là animated export nếu animation semantics chưa được serialize.

Đây đặc biệt quan trọng với Lottie/SVG export hiện tại. `exportToAnimatedSVG()` đang chứa hardcoded animation như `studioSpin`, còn Lottie exporter đang sinh static layer properties cơ bản.

---

### Rule 97 — Export Does Not Mutate Project

Export phải side-effect-free đối với document.

---

# XIII. Performance Constitution

### Rule 98 — Measure Hot Paths

Animation evaluation, rendering, path operations, hit testing phải có profiling/benchmark khi scale tăng.

---

### Rule 99 — Avoid Per-Frame Allocation

Không clone/sort/create arrays ở hot path nếu tránh được.

---

### Rule 100 — Cache Derived Data

Derived data có thể cache:

```text
sorted keyframes
bounds
world transforms
path tessellation
hit-test structures
```

---

### Rule 101 — Invalidate Precisely

Invalidate càng nhỏ càng tốt.

---

### Rule 102 — Large Timeline Must Be Virtualizable

Timeline không được assume rằng toàn bộ keyframes luôn render cùng lúc.

---

### Rule 103 — Large Scene Must Be Scalable

Architecture phải có đường tiến hóa cho:

```text
1k nodes
10k nodes
100k keyframes
```

---

### Rule 104 — Performance Is a Feature Contract

Không tối ưu bằng cảm giác; phải có measurable target.

---

# XIV. Testing & Reliability

### Rule 105 — Mathematical Engines Need Unit Tests

Ít nhất:

```text
evaluator
interpolation
spring
path
boolean
transform
snapping
```

phải test independent UI.

Repo hiện đã có nền tảng tốt ở điểm này.

---

### Rule 106 — Regression Tests for Every Engine Bug

Bug được fix trong engine phải có regression test.

---

### Rule 107 — Round-Trip Persistence Tests

Phải test:

```text
serialize
→ parse
→ serialize
```

---

### Rule 108 — Import/Export Fidelity Tests

Input/output quan trọng phải có fixture.

---

### Rule 109 — Determinism Tests

Cùng input + same time → same output.

---

### Rule 110 — Stress Tests Are Required Before Major Scaling

Feature lớn phải test trên scene lớn, không chỉ demo scene.

---

# XV. Swarm-Agent Governance

Đây là phần tôi cho rằng repo của bạn **cực kỳ cần**.

### Rule 111 — Inspect Before Implement

Agent phải đọc:

```text
relevant interfaces
existing tests
existing engine
existing store actions
```

trước khi viết code.

---

### Rule 112 — Never Assume Missing Infrastructure

Agent phải kiểm tra repository trước khi tuyên bố:

> “chưa có hệ thống X”.

---

### Rule 113 — Search Before Creating

Trước khi tạo:

```text
service
utility
type
hook
engine
manager
```

phải tìm xem repo đã có implementation tương đương chưa.

---

### Rule 114 — One Canonical Implementation

Không tạo:

```text
newEvaluator.ts
newTimelineEngine.ts
newRenderer.ts
```

nếu implementation cũ đã tồn tại.

---

### Rule 115 — No Silent Architectural Fork

Nếu agent nhận thấy architecture hiện tại không đáp ứng requirement:

```text
STOP
→ document problem
→ propose ADR
→ then implement
```

Không âm thầm xây architecture song song.

---

### Rule 116 — Read Tests Before Changing Engine

Test suite là specification thực tế một phần của engine.

---

### Rule 117 — Preserve Working Behavior

Refactor không được vô tình làm mất feature đang hoạt động.

---

### Rule 118 — New Feature Requires Integration

Feature không được chỉ “compile”.

Phải tích hợp với:

```text
document
store
renderer
history
serialization
tests
```

khi những subsystem đó có liên quan.

---

### Rule 119 — No Fake Completion

Agent không được báo:

> completed / production-ready / industry-grade

chỉ vì:

```text
build passes
```

---

### Rule 120 — Claims Must Match Evidence

Agent phải phân biệt:

```text
implemented
tested
verified
benchmarked
production-ready
```

Đây là rule đặc biệt quan trọng cho swarm.

---

# XVI. Architectural Change Control

### Rule 121 — ADR for Structural Changes

Thay đổi:

```text
Document schema
Scene graph semantics
Animation model
Store ownership
Renderer pipeline
Persistence
```

phải có Architecture Decision Record.

---

### Rule 122 — Small Feature, Small Change

Không nhân danh feature nhỏ để rewrite architecture toàn bộ.

---

### Rule 123 — Refactor With Invariants

Refactor phải xác định:

```text
what must remain true
```

trước khi sửa.

---

### Rule 124 — Deprecated APIs Need a Plan

Không xóa API/domain structure đang được nhiều subsystem dùng chỉ vì “code sạch hơn”.

---

### Rule 125 — Architecture Debt Must Be Recorded

Technical debt quan trọng phải được ghi thành issue/ADR/debt register, không nằm trong trí nhớ agent.

---

# XVII. Absolute Anti-Patterns

12 điều dưới đây swarm agent nên coi là **red flag ngay lập tức**:

### Rule 126

Không tạo parallel document model.

### Rule 127

Không để React component chứa animation algorithm.

### Rule 128

Không để Zustand trở thành toàn bộ engine.

### Rule 129

Không clone toàn project mỗi frame.

### Rule 130

Không sort keyframes trong hot evaluation path nếu có thể normalize trước.

### Rule 131

Không dùng `any` để né design type.

### Rule 132

Không dùng array index làm persistent identity.

### Rule 133

Không hardcode animation semantics trong exporter.

### Rule 134

Không gọi static export là animated export.

### Rule 135

Không sửa persistence schema mà không migration.

### Rule 136

Không tạo duplicate utility/engine chỉ vì không tìm thấy implementation trong 30 giây.

### Rule 137

Không rewrite subsystem đang hoạt động mà không evidence rằng kiến trúc hiện tại thực sự không đủ.

---

# XVIII. Một nguyên tắc đặc biệt dành cho repo của bạn

Tôi sẽ đặt câu này ở **top của constitution**:

> **OpenSVG Motion Studio is an evolving graphics/animation engine, not merely a React application. React, Zustand and Tauri are implementation infrastructure; the canonical product is the document, scene graph, geometry model, animation semantics, evaluation pipeline and rendering contract.**

Đây là khác biệt lớn nhất.

---

# Thứ tự ưu tiên khi swarm agent gặp conflict

Agent phải ưu tiên:

```text
1. Data correctness
2. Animation semantic correctness
3. Document integrity
4. Determinism
5. Rendering correctness
6. Backward compatibility
7. Performance
8. Maintainability
9. UI convenience
10. Micro-optimization / code elegance
```

Không được hy sinh:

```text
Document integrity
Animation correctness
Persistence compatibility
```

chỉ để giảm vài dòng code.

---

# Và tôi sẽ bổ sung một "Agent Gate"

Mỗi task trước khi merge phải trả lời 10 câu:

```text
[ ] Tôi đã inspect implementation hiện tại chưa?
[ ] Tôi có tạo source of truth thứ hai không?
[ ] Tôi có tạo duplicate subsystem không?
[ ] Document semantics có thay đổi không?
[ ] Existing animation behavior có thay đổi không?
[ ] History/Undo có cần update không?
[ ] Serialization/migration có cần update không?
[ ] Renderer có cần update không?
[ ] Test regression đã có chưa?
[ ] Tôi có bằng chứng cho claim "complete" không?
```

Nếu một câu trả lời là **“không biết”**, task chưa được coi là architecture-safe.

---

## Một nhận xét quan trọng sau khi đối chiếu repo

Tôi **không khuyên bạn reset/rewrite repo**.

Ngược lại, repo hiện tại đã có một nền tảng đáng kể: engine modules tương đối rõ, test coverage domain đã hình thành, CI đã tự động test/build/cargo check, và roadmap feature đã được triển khai rộng.

Việc cần làm tiếp theo là **constitutional refactoring**, tức:

```text
Current OpenSVG
      ↓
preserve working features
      ↓
enforce ownership boundaries
      ↓
remove architectural duplication
      ↓
strengthen evaluator/render pipeline
      ↓
strengthen persistence
      ↓
strengthen swarm governance
      ↓
scale toward production
```

