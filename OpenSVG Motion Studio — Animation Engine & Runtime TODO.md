# OpenSVG Motion Studio — Animation Engine & Runtime Master Plan (25 EPICS)

> **Mục tiêu cốt lõi:** Đưa OpenSVG Motion Studio từ một vector motion editor nhiều subsystem thành một **deterministic, extensible animation runtime** chuẩn công nghiệp (kiểu Rive / Figma Motion / After Effects).
>
> ⚠️ **Tuyên ngôn phương pháp:** **KHÔNG REWRITE TOÀN BỘ ENGINE.** Refactor có kiểm soát. Giữ lại toàn bộ các thuật toán và module đang chạy tốt (`evaluator.ts`, `geometry engine`, `interpolation`, `motion path`, `spring physics`, `timeline`, `renderer`); chỉ cấu trúc lại các ranh giới (boundaries) gây coupling chéo.

---

## 0. Nguyên tắc kiến trúc bất khả xâm phạm (Hard Rules)

1. **Không rewrite toàn bộ engine:** Giữ lại nền tảng hiện có và bóc tách từng phần.
2. **Không tiếp tục nhồi nhét responsibility vào `BaseNode`:** Sử dụng Semantic Decomposition (`NodeIdentity`, `NodeHierarchy`, `NodeTransform`, `NodeGeometry`, `NodeAppearance`, `NodeAnimation`, `NodeConstraint`, `NodeInteraction`).
3. **Canonical Document & Evaluated Runtime State phải tách biệt tuyệt đối:** Document tác giả (`SceneProject`) là bất biến trong suốt quá trình evaluation / playback.
4. **Runtime không phụ thuộc React hay Zustand store:** State machine, animation evaluator, constraint solver phải chạy được 100% trong headless test suite.
5. **Renderer không chịu trách nhiệm animation evaluation:** Renderer chỉ tiêu thụ derived `RenderScene` / `EvaluatedSceneState`.
6. **State machine không trực tiếp mutate authoring document:** Evaluation trả về `RuntimeCommand[]` thuần túy.
7. **Playback không tạo history (Undo/Redo) snapshot mỗi frame.**
8. **Mọi subsystem runtime phải 100% deterministic.**
9. **Hot path phải tránh allocation không cần thiết:** Keyframe lookup $\mathcal{O}(\log N)$ zero-allocation.
10. **Luồng dữ liệu chuẩn tắc:**
    $$\text{Canonical Data} \longrightarrow \text{Runtime Evaluation} \longrightarrow \text{Evaluated State} \longrightarrow \text{Renderer / Exporter / Editor}$$

---

# BẢNG TỔNG HỢP 25 EPICS KIẾN TRÚC & RUNTIME

---

### EPIC 1 — Repository & Runtime Baseline (P0)
- [x] Inventory toàn bộ `src/engine/` và dependency graph giữa các module.
- [x] Inventory toàn bộ mutation path tới `SceneProject` và `BaseNode`.
- [x] Xác định animation evaluation được gọi từ đâu (`evaluateNode` trong `runtimeKernel.ts` & `evaluationPipeline.ts`).
- [x] Xác định playback clock hiện nằm ở đâu (`runtimeKernel.ts`, `useStudioStore.ts`).
- [x] Xác định renderer nhận dữ liệu trực tiếp từ đâu (`deriveRenderScene` -> `renderCanvasScene`).
- [x] Tách State Machine khỏi direct store mutation (chuyển sang `RuntimeCommand[]`).
- [x] Xác định constraint solver chạy trong pipeline sau animation evaluation và trước render state.
- [x] Tạo kiến trúc data-flow chuẩn: `Document -> Animation -> State Machine -> Constraints -> EvaluatedState -> Render`.

---

### EPIC 2 — Canonical Document Model (P0)
- [x] Xác định canonical `Document` contract (`SceneProject`, `DocumentTab`).
- [x] Tách `Document` khỏi UI viewport state (`zoom`, `panX`, `panY`, `currentTime`).
- [x] Tách playback state (`isPlaying`, `currentTime`) khỏi authoring document.
- [x] Tách selection state (`selectedId`, `selectedIds`) khỏi document.
- [x] Tách editor history (`past`, `future` snapshots) khỏi runtime evaluation.
- [x] Xác định `SchemaVersion` (`v2.0.0` trong `schemaMigration.ts`).
- [x] Xác định migration strategy cho document version (`migrateProjectSchema`).
- [x] Tách Semantic Ownership: Identity, Hierarchy, Transform, Geometry, Appearance, Animation, Constraint, Interaction.
- [x] Adapter hai chiều `decomposeSceneNode` $\leftrightarrow$ `recomposeSceneNode` (`src/engine/semantic/nodeAdapter.ts`).

---

### EPIC 3 — Transform System (P0)
- [x] Tạo canonical `Transform` interface (`src/engine/runtime/coreContracts.ts`).
- [x] Tạo canonical `Matrix2D` affine math (`src/engine/transform/matrix2D.ts`).
- [x] Implement local $\rightarrow$ parent transform (`composeTransform`).
- [x] Implement parent $\rightarrow$ world transform (`multiplyMatrices` tích lũy cây phân cấp).
- [x] Implement world $\rightarrow$ local transform (`invertMatrix`).
- [x] Implement inverse transform (`invertMatrix`).
- [x] Implement point & vector transform (`transformPoint`, `transformVector`).
- [x] Chuẩn hóa pivot semantics (normalized $0.0 \dots 1.0$ hoặc local px).
- [x] Chuẩn hóa rotation convention (degrees sang radians chuẩn).
- [x] Unit test nested transforms, hierarchy cycle breaking, negative scale, non-centered pivot.

---

### EPIC 4 — Geometry Core (P1 / P2)
- [x] Chuẩn hóa internal path representation (`BezierPoint[]`, `subPaths` cho compound paths).
- [x] Thuật toán tính độ dài đường cong Bézier bậc 3 (`geometryCore.ts`).
- [x] Thuật toán lấy tọa độ và tiếp tuyến tại độ dài bất kỳ (`pointAtLength`, `tangentAtLength`).
- [x] Thuật toán Path Flattening & Binary-search sampling.
- [x] Ray-casting polygon & path hit testing.
- [x] Boolean operations (Union, Subtract, Intersect, Exclude trong `booleanOps.ts`).
- [x] Path morphing interpolation (`interpolatePathPoints` trong `pathInterpolation.ts`).
- [ ] Contour / Segment decomposition model nâng cao cho font vector phức tạp.

---

### EPIC 5 — Animation Data Model (P0)
- [x] Tách `AnimationClip` / `PropertyTrack` khỏi cấu trúc lưu trữ node cố định.
- [x] Định nghĩa animatable property path (`AnimatableProperty`).
- [x] Định nghĩa keyframe identity (`Keyframe<T>`).
- [x] Định nghĩa easing representation (Cubic Bézier handles $P_1, P_2$).
- [x] Định nghĩa spring dynamics config (`SpringConfig`: mass, stiffness, damping).
- [x] Hỗ trợ numeric interpolation (`interpolateNumeric`).
- [x] Hỗ trợ color interpolation trong không gian RGB (`interpolateColor`).
- [x] Hỗ trợ path morphing interpolation (`interpolatePathPoints`).
- [x] Hỗ trợ transform property interpolation (`transformEvaluator.ts`).

---

### EPIC 6 — Animation Evaluation Runtime (P0)
- [x] Tạo headless `OpenSVGRuntime` kernel (`src/engine/runtime/runtimeKernel.ts`).
- [x] FPS semantics, frame $\leftrightarrow$ time conversion (`timing.ts`).
- [x] Playback range, loop, seek, advance(dt), reset.
- [x] `AnimationEvaluator` module hoá (`src/engine/animation/animationEvaluator.ts`).
- [x] Output derived `EvaluatedSceneState` mà không mutate authoring document.
- [x] Keyframe lookup $\mathcal{O}(\log N)$ binary search (`findKeyframeSegment`).
- [x] Performance Lab benchmark suite đo SLA $< 2\text{ ms}$/frame trên 500-1000 nodes.

---

### EPIC 7 — Interpolation Engine (P0 / P1)
- [x] Bóc tách `evaluator.ts` thành modular folder `src/engine/animation/`.
- [x] `timing.ts`: Newton-Raphson cubic Bézier solver với fallback monotonic bounds.
- [x] `numericInterpolation.ts`: Nội suy số thực + Spring physics.
- [x] `colorInterpolation.ts`: Parse Hex và nội suy RGB.
- [x] `pathInterpolation.ts`: Morphing vector Bezier points.
- [x] `spring.ts`: Spring physics integration.
- [x] `trackEvaluator.ts`: Đánh giá track zero-allocation.
- [x] `transformEvaluator.ts`: Đánh giá transform properties.
- [x] `evaluator.ts` làm Facade re-export tương thích 100%.

---

### EPIC 8 — Motion Path System (P1)
- [x] Canonicalize motion path trajectory (`evaluateMotionPath` trong `motionPath.ts`).
- [x] Normalized progress ($0.0 \dots 1.0$) dọc theo đường path tham chiếu.
- [x] Tính toán góc tiếp tuyến (tangent angle) và auto-orientation (`rotation = angle + offsetAngle`).
- [x] Hỗ trợ closed-loop path và open path.
- [x] Animation progress keyframe binding trên timeline.
- [x] Unit test đầy đủ cho motion path.

---

### EPIC 9 — State Machine Runtime (P0 / P1)
- [x] `StateMachineRuntime` v2 độc lập React / UI (`runtimeStateMachine.ts`).
- [x] Định nghĩa `StateMachineInput`: `BooleanInput`, `NumberInput`, `TriggerInput`.
- [x] Định nghĩa `MachineState`, `StateTransition`, `TransitionCondition`.
- [x] Multi-layer state machine execution với layer default states.
- [x] Deterministic transition condition evaluation (`==`, `!=`, `>`, `<`, `>=`, `<=`, `fired`).
- [x] Bóc tách `stateMachine.ts` sang `RuntimeCommand[]` (`runtimeCommands.ts`).
- [x] Replay event recorder & determinism verification tests.

---

### EPIC 10 — Animation Blending (P2)
- [x] Blend transition giữa các State trong State Machine (`transitionProgress` $0.0 \rightarrow 1.0$).
- [ ] Multi-track Additive Animation Blending.
- [ ] Layer weights & Layer priority overrides.
- [ ] Per-property blending (Transform, Color, Path morph).
- [ ] Interruption & Cross-fading semantics giữa nhiều Animation Clips.

---

### EPIC 11 — Constraint Runtime (P1 / P2)
- [x] Định nghĩa `Constraint` interfaces (`constraintSolver.ts`).
- [x] Implement Translation Constraint.
- [x] Implement Rotation Constraint.
- [x] Implement Scale Constraint.
- [x] Implement Distance Constraint (min, max, exact).
- [x] Implement Follow-Path Constraint.
- [x] Thuật toán phát hiện và ngắt vòng lặp vô hạn (Cycle detection & breaking).
- [x] Tích hợp Constraint Solver vào `evaluationPipeline.ts`.

---

### EPIC 12 — Component / Instance Runtime (P1 / P2)
- [x] Định nghĩa Master Component Definition (`componentSystem.ts`).
- [x] Định nghĩa Component Instance & Local Overrides.
- [x] Kế thừa thuộc tính master và bảo toàn bộ override cục bộ (`resolveInstanceProperties`).
- [x] Component dependency graph & cycle detection (`detectComponentCycle`).
- [ ] Nested master component instance overrides nâng cao.

---

### EPIC 13 — Binding System (P1 / P2)
- [x] Định nghĩa Data Binding Engine (`dataBinding.ts`).
- [x] Data sources & target property paths.
- [x] Custom Value Converters (number-to-string, boolean-toggle, custom transforms).
- [x] Two-way binding resolver độc lập React.
- [x] Deterministic binding evaluation.

---

### EPIC 14 — Evaluated Scene State (P0)
- [x] `EvaluatedSceneState` & `EvaluatedNodeState` contract (`coreContracts.ts`, `evaluationPipeline.ts`).
- [x] Derived world transform ma trận.
- [x] Derived visual bounds, opacity tích lũy cây cha-con.
- [x] Derived paint, stroke, clips, filter descriptors.
- [x] Invariant: Evaluation sinh ra derived state, không mutate canonical document.

---

### EPIC 15 — Renderer Architecture (P1 / P2)
- [x] Tách biệt `RenderScene` và `RenderNodeState` khỏi Renderer logic.
- [x] Canvas2D Render Backend chuẩn hoá `RenderBackend` (`canvas2DBackend.ts`).
- [x] WebGPU Render Backend Prototype với Dynamic Canvas2D Fallback (`webgpuBackend.ts`).
- [x] Parity Golden Tests so sánh đồng nhất 100% giữa backends (`parityGolden.test.ts`).
- [x] Renderer chỉ tiêu thụ evaluated state, không chạy animation logic.

---

### EPIC 16 — Timeline Editor (P2 / P3)
*(Tham chiếu Kinetic & Lottie Open Studio)*
- [x] Multi-track hierarchy & property tracks (Position, Size, Rotation, Scale, Fill, Stroke, Opacity, v.v.).
- [x] Keyframe selection, drag to move, create, delete, copy/paste.
- [x] Dual-mode switcher: Dopesheet Mode $\leftrightarrow$ Graph Curve Editor Mode.
- [x] Interactive Tangent Control Handles ($P_1, P_2$ cubic bezier velocity handles).
- [x] Easing Presets & Spring visualization curve.
- [ ] Timeline Virtualization cho scene $> 10,000$ keyframes.
- [ ] Ripple retiming nâng cao.

---

### EPIC 17 — Undo / Redo Model (P1)
- [x] Transaction snapshot history (`src/engine/history.ts`).
- [x] Tách history khỏi runtime evaluation (chỉ ghi nhận authoring mutations).
- [x] Undo / Redo queue với giới hạn `MAX_HISTORY_STEPS`.
- [x] Deterministic state restoration tests.

---

### EPIC 18 — Serialization & Migrations (P1 / P2)
- [x] JSON serialization contract cho `SceneProject`.
- [x] Version tagging (`v1.0.0` $\rightarrow$ `v2.0.0`).
- [x] Schema Migration engine (`src/engine/persistence/schemaMigration.ts`).
- [x] Structural integrity validation & SHA-256 / CRC32 Checksum verification.
- [x] Round-trip serialization tests.

---

### EPIC 19 — Lottie Compatibility Layer (P2 / P3)
- [x] Bodymovin / Lottie JSON format exporter (`src/engine/exporter.ts`).
- [x] Export Shape layers, Keyframe cubic bezier easing, Solid fills, Strokes, Opacity, Transforms.
- [ ] Full Lottie Importer parity mapper.
- [ ] Automated pixel-diff visual comparison suite giữa Lottie player và OpenSVG.

---

### EPIC 20 — SVG Animation Export (P2 / P3)
- [x] Standalone Animated SVG Exporter (`exportAnimatedSVG` trong `exporter.ts`).
- [x] Sinh mã `@keyframes` CSS tự động cho Transform, Opacity, Colors.
- [x] Nhúng CSS styling và SVG paths độc lập.
- [ ] SMIL animation fallback generator nâng cao cho path morphing phức tạp.

---

### EPIC 21 — Runtime Test Matrix (P0 / P1)
- [x] Unit tests cho Timing & Cubic Bézier solver.
- [x] Unit tests cho Numeric, Color & Path interpolation.
- [x] Unit tests cho Transform Matrix2D & hierarchy traversal.
- [x] Unit tests cho Motion Path & Auto-orientation.
- [x] Unit tests cho State Machine inputs & transitions.
- [x] Unit tests cho Constraint solver & cycle breaking.
- [x] Unit tests cho Component system & Data binding.
- [x] Integration tests cho Evaluation Pipeline & Immutability.
- [x] **Hiện trạng: 53 Test Suites (178 Unit Tests) 100% GREEN.**

---

### EPIC 22 — Performance & Runtime Profiling (P1 / P2)
- [x] SLA budget: evaluation $< 2\text{ ms}$/frame trên 500-1000 nodes (`performanceLab.ts`).
- [x] O(1) space complexity / zero-allocation trên keyframe lookup binary search.
- [x] Benchmark 100 nodes, 500 nodes, 1000 nodes trong Performance Lab.
- [x] Target frame budget: Đạt chuẩn 60 FPS / 120 FPS.
- [ ] CI automated performance regression gate.

---

### EPIC 23 — Reference-Source Research (P1)
- [x] **Rive Runtime:** Tham chiếu kiến trúc State Machine layers, Input types, Dependency cycle breaking, Headless runtime evaluation.
- [x] **Lottie Open Studio:** Tham chiếu cấu trúc Dopesheet, Multi-track properties, Keyframe easing representations.
- [x] **Kinetic:** Tham chiếu Dual-mode Timeline / Graph Curve Editor, Tangent handles, Velocity curves.
- [x] **Synfig:** Tham chiếu Parameterized vector animation và Layer hierarchy logic.

---

### EPIC 24 — Architecture Decision Records (ADRs) (P1)
- [x] ADR-01: Tách biệt Canonical Document & Derived Runtime State.
- [x] ADR-02: Semantic Decomposition cho `BaseNode` thay vì phình to model.
- [x] ADR-03: Modularize Animation Core (`src/engine/animation/`).
- [x] ADR-04: State Machine thuần túy sinh `RuntimeCommand[]` không side-effects.
- [x] ADR-05: Unified 7-Phase Evaluation Pipeline.
- [x] Đã đồng bộ vào Obsidian Knowledge Graph (`00-SYSTEMS/Architecture/` & `00-SYSTEMS/Code Standards/`).

---

### EPIC 25 — Migration Strategy (P0 $\rightarrow$ P3)

#### Phase 1: Nền tảng Runtime & Tách Boundary (P0) — [ĐÃ HOÀN THÀNH ✅]
- Đóng băng mở rộng feature lớn trên `BaseNode`.
- Giới thiệu `RuntimeState`, `EvaluatedSceneState`, `OpenSVGRuntime`.
- Giới thiệu `StateMachineRuntime` và `RuntimeCommand[]`.
- Đảm bảo 100% test suites green.

#### Phase 2: Bóc tách Animation Core & Render State (P1) — [ĐÃ HOÀN THÀNH ✅]
- Tách `evaluator.ts` thành 8 module chuyên biệt trong `src/engine/animation/`.
- Chuẩn hóa `Matrix2D` và `RenderScene`.
- Xây dựng `evaluationPipeline.ts` 7 pha.

#### Phase 3: Semantic Decomposition & Subsystem Integration (P1/P2) — [ĐÃ HOÀN THÀNH ✅]
- Tách `SemanticNode` và adapter hai chiều `nodeAdapter.ts`.
- Tích hợp Constraint Solver, Component System, Data Binding vào pipeline.

#### Phase 4: Subsystem Nâng cao & Blending (P2) — [ĐANG TRIỂN KHAI ⏳]
- Triển khai Multi-track Additive Animation Blending.
- Hoàn thiện mở rộng Nested Component Overrides.

#### Phase 5: Tooling Nâng cao & Production WebGPU (P3) — [KẾ HOẠCH TƯƠNG LAI 🔮]
- Virtualization cho Timeline $> 10,000$ keyframes.
- Custom WGSL shader pipeline cho WebGPU Backend.
- Automated Lottie visual regression suite.

---

## 🎯 Tiêu chí hoàn thành MVP Runtime (MVP Criteria Check)
- [x] Canonical document không bị mutate trong playback/evaluation.
- [x] Scene graph & Transform hierarchy deterministic.
- [x] Animation evaluation deterministic.
- [x] State machine execution deterministic.
- [x] Constraint solver deterministic & ngắt cycle an toàn.
- [x] Component system deterministic.
- [x] Renderer chỉ consume `RenderScene` / `EvaluatedSceneState`.
- [x] Runtime không phụ thuộc React / Zustand store.
- [x] Runtime có test suite độc lập (178 tests green).
- [x] Runtime có Performance Lab benchmark suite.
- [x] Serialization có schema migration & checksum validation.
- [x] Đạt chuẩn 60 FPS trên benchmark.