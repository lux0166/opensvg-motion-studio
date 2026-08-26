# Technical Changelog — StateMachine Smooth Transition Blending & Pipeline Evaluation Engine

**Date:** 2026-08-26  
**Author:** AI Agent (Antigravity)  
**Milestone:** Complete State-Driven Evaluated Output with Smooth Transition Cross-Fading  
**Reference:** Architecture Review & P0 Pipeline Directive

---

## 1. Các Cải Tiến Kỹ Thuật Đã Triển Khai

### 1.1 State Machine Smooth Transition Blending Engine
- **Module mới: `src/engine/stateMachine/stateEvaluator.ts`:**
  - `applyStateMachineToScene()`: Nhận `evaluatedMap` và `StateMachineRuntime`.
  - Hỗ trợ 2 chế độ đánh giá:
    1. **Direct State Application:** Khi không chuyển tiếp (`isTransitioning: false`), áp dụng 100% `propertyOverrides` của `currentState` vào các node tương ứng.
    2. **Smooth Transition Blending:** Khi đang chuyển tiếp (`isTransitioning: true`), tính toán trọng số nội suy $t = \text{transitionProgress} \in [0, 1]$ và hòa trộn mượt mà giữa `previousState` và `currentState`:
       - **Số thực (numbers):** Nội suy tuyến tính $\text{val} = \text{val}_{\text{prev}} + (\text{val}_{\text{curr}} - \text{val}_{\text{prev}}) \cdot t$.
       - **Màu Hex (colors):** Giải mã RGB `parseHexColor` và nội suy từng kênh màu đỏ, xanh lục, xanh lam $R, G, B$.
       - **Giá trị rời rạc:** Chuyển đổi tại điểm giữa ($t \ge 0.5$).

### 1.2 Tích Hợp Vào Phase 4 Của Canonical Evaluation Pipeline
- **`evaluateScenePipeline()` trong `src/engine/runtime/evaluationPipeline.ts`:**
  - Tiêu thụ trực tiếp `applyStateMachineToScene(evaluatedMap, options.stateMachineRuntime)` trước khi giải quyết Constraints và World Transforms.
  - Kết quả: `EvaluatedSceneState.evaluatedNodes` và `RenderScene` mang đầy đủ trạng thái động (state-driven properties) kể cả ở các mốc thời gian chuyển tiếp trung gian.

### 1.3 Cải Tiến Thứ Tự Kích Hoạt Transition Trong `StateMachineRuntime.advance()`
- Cập nhật thứ tự: Kiểm tra điều kiện kích hoạt chuyển tiếp $\rightarrow$ Cập nhật tiến độ `transitionProgress` trong cùng một frame $dt$, đảm bảo animation bắt đầu dịch chuyển ngay từ tick đầu tiên.

---

## 2. Kết Quả Kiểm Thử (Empirical Runtime Evidence)
- **Unit & Integration Tests:** `vitest run` $\rightarrow$ **64 Test Suites (207 Unit Tests) 100% GREEN**.
  - `pipelineStateMachineIntegration.test.ts`:
    - `smoothly blends properties between previous and next state during transition`: Kiểm chứng nội suy `scaleX` (từ 1.0 $\rightarrow$ 1.5 $\rightarrow$ 2.0) và màu sắc (từ `#000000` $\rightarrow$ `#808080` $\rightarrow$ `#ffffff`) chính xác từng frame.
- **Production Build:** `tsc && vite build` $\rightarrow$ **Clean build 0 errors** (8.08s).
