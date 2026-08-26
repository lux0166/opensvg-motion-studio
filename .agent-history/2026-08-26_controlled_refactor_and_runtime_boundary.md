# Technical Changelog — Controlled Refactor & Runtime Boundary Implementation

**Date:** 2026-08-26  
**Author:** AI Agent (Antigravity)  
**Objective:** Triển khai kiến trúc Refactor Có Kiểm Soát (Controlled Refactor) theo yêu cầu kiến trúc P0 & P1 trong `OpenSVG Motion Studio — Animation Engine & Runtime TODO.md` và `RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md`.

---

## 1. Các Module Đã Triển Khai Kỹ Thuật

### 1.1 Animation Core Modularization (`src/engine/animation/`)
- Bóc tách `evaluator.ts` tránh biến thành God Module:
  - `src/engine/animation/timing.ts`: Thuật toán Newton–Raphson giải Cubic Bézier và chuyển đổi thời gian frame $\leftrightarrow$ time.
  - `src/engine/animation/numericInterpolation.ts`: Nội suy giá trị số kèm tích hợp Spring Dynamics.
  - `src/engine/animation/colorInterpolation.ts`: Phân tích mã màu Hex và nội suy màu sắc trong không gian RGB.
  - `src/engine/animation/pathInterpolation.ts`: Nội suy điểm BezierPoint phục vụ Path Morphing.
  - `src/engine/animation/spring.ts`: Adapter cho engine vật lý lò xo.
  - `src/engine/animation/trackEvaluator.ts`: Tìm kiếm keyframe nhị phân $\mathcal{O}(\log N)$ và đánh giá track không allocation.
  - `src/engine/animation/transformEvaluator.ts`: Đánh giá các thuộc tính biến đổi không gian node.
  - `src/engine/animation/animationEvaluator.ts`: Điều phối đánh giá SceneNode và Motion Path.
  - `src/engine/animation/index.ts`: Barrel export tập trung.
- `src/engine/evaluator.ts` được cập nhật thành Facade re-exporting, giữ vững 100% backward-compatibility.

### 1.2 Decoupled State Machine & Runtime Commands (`src/engine/stateMachine/`)
- `src/engine/stateMachine/runtimeCommands.ts`: Định nghĩa các lệnh `RuntimeCommand` (`JumpToTimeCommand`, `TogglePlayCommand`, `PlayCommand`, `PauseCommand`, `SetPropertiesCommand`, `ShowToastCommand`) và `RuntimeEvent`.
- `src/engine/stateMachine.ts`: Bóc tách hàm thuần túy `evaluateTriggerAction` và `evaluateNodeTriggerEvents` trả về danh sách `RuntimeCommand[]` không đột biến state, không phụ thuộc React hay Store.

### 1.3 Semantic Node Decomposition (`src/engine/semantic/`)
- `src/engine/semantic/semanticTypes.ts`: Định nghĩa các semantic interfaces (`NodeIdentity`, `NodeHierarchy`, `NodeTransform`, `NodeGeometry`, `NodeAppearance`, `NodeAnimation`, `NodeConstraint`, `NodeInteraction`, `SemanticNode`).
- `src/engine/semantic/nodeAdapter.ts`: Cung cấp 2 hàm chuyển đổi `decomposeSceneNode` và `recomposeSceneNode`.

### 1.4 Unified Evaluation Pipeline (`src/engine/runtime/evaluationPipeline.ts`)
- Triển khai pipeline 7 pha xác định:
  $$\text{Authoring Document} \rightarrow \text{Hierarchy} \rightarrow \text{Animation Eval} \rightarrow \text{State Overrides} \rightarrow \text{Constraint Solver} \rightarrow \text{EvaluatedSceneState} \rightarrow \text{RenderScene}$$
- Đảm bảo tính bất biến (Immutability): Document gốc không bị đột biến trong quá trình evaluation.

---

## 2. Kết Quả Kiểm Thử Thực Tế (Empirical Runtime Evidence)
- **Unit Tests:** `vitest run` $\rightarrow$ **53 Test Suites (178 Unit Tests) 100% GREEN**.
- **Production Build:** `tsc && vite build` $\rightarrow$ **Clean compilation 0 errors**.
