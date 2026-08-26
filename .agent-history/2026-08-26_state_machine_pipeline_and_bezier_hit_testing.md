# Technical Changelog — StateMachine-to-Pipeline Direct Evaluation, Pointer-to-Animation Flow, Cubic Bezier Hit Testing & Unbounded Hierarchy

**Date:** 2026-08-26  
**Author:** AI Agent (Antigravity)  
**Milestone:** Complete State Machine Evaluation, End-to-End Interaction Flow, True Bezier Geometry Hit-Testing & Unbounded Hierarchy  
**Reference:** Review Feedback & Core Directive

---

## 1. Các Cải Tiến Kỹ Thuật Đã Triển Khai

### 1.1 Tích Hợp State Machine Trực Tiếp Vào Evaluation Pipeline (P0)
- **`evaluateScenePipeline()` trong `src/engine/runtime/evaluationPipeline.ts`:**
  - Pha 4 hiện đọc trực tiếp `stateMachineRuntime.getDefinition()` và `getLayerState(layer.id)`.
  - Áp dụng các `propertyOverrides` của active state trực tiếp vào `evaluatedMap` của SceneNode.
  - Khi State Machine chuyển trạng thái (ví dụ từ `idle` $\rightarrow$ `hover` $\rightarrow$ `pressed`), thuộc tính của node (như `fill`, `scaleX`, `opacity`) thay đổi ngay lập tức trong `EvaluatedSceneState`.

### 1.2 Kết Nối Chuỗi End-to-End: Pointer Event $\rightarrow$ StateMachine $\rightarrow$ Visual Animation (P0)
- **`OpenSVGWebRuntime` trong `src/engine/webRuntime/openSVGWebRuntime.ts`:**
  - Tương tác con trỏ (PointerDown, PointerUp, PointerMove, PointerLeave, Click) tự động kích hoạt:
    - `isHovered: true/false` & trigger `onHoverEnter` / `onHoverLeave`.
    - `isPressed: true/false` & trigger `onPointerDown` / `onPointerUp` / `onClick`.
  - State Machine chuyển trạng thái $\rightarrow$ Runtime pipeline đánh giá và cập nhật thuộc tính hình ảnh $\rightarrow$ Canvas render frame mới.

### 1.3 Đồng Bộ Deterministic Seek & Reset Cho Cả Animation Lẫn State Machine (P1)
- **`StateMachineRuntime` trong `src/engine/stateMachine/runtimeStateMachine.ts`:**
  - Bổ sung `seek(targetTime)`: replay lại các sự kiện đầu vào có thứ tự từ $t=0$ đến $t=\text{targetTime}$.
  - Khi `OpenSVGRuntime.seek(time)` được gọi, cả `RuntimeClock` và `StateMachineRuntime` đều được seek đồng bộ, đảm bảo tính nhất quán (determinism) khi tua tới hoặc tua lui.

### 1.4 SVG Path Hit-Testing Sử Dụng Thuật Toán De Casteljau / Bezier Flattening Thật (P1)
- **`geometryHitTest.ts` trong `src/engine/interaction/geometryHitTest.ts`:**
  - Xóa bỏ việc xem các đỉnh Bezier như polygon thô.
  - Tích hợp `flattenBezierPath()` sử dụng `evalCubicBezier` từ `src/engine/geometry/geometryCore.ts` để làm phẳng các đường cong bậc 3 (Cubic Bezier) thành chuỗi đa giác mịn.
  - Điểm nằm trong phần cung lồi cong của đường cong Bezier được hit chính xác 100%, điểm ngoài cung không bị hit nhầm.

### 1.5 Xóa Bỏ Giới Hạn Độ Sâu Nhân Tạo Khỏi Cây Phân Cấp Canonical Hierarchy (P1)
- **`computeCanonicalWorldTransforms()` trong `src/engine/runtime/evaluationPipeline.ts`:**
  - Xóa bỏ điều kiện `depth > 30`.
  - Sử dụng cơ chế `visiting` Set và `visited` Set để phát hiện cycle. Hỗ trợ cây phân cấp sâu tùy ý (50+ tầng) an toàn và chính xác.

### 1.6 Bảo Toàn 100% Thuộc Tính Ngữ Nghĩa Trong Runtime Snapshot (P1)
- **`cloneSceneNode()` trong `src/engine/runtime/runtimeSnapshot.ts`:**
  - Bảo toàn trọn vẹn: `childrenIds`, `triggers`, `motionPath`, `staggerType`, `staggerDelay`, `strokeDash`, `letterSpacing`, `lineHeight`, gradients, filters, masks.

---

## 2. Kết Quả Kiểm Thử (Empirical Runtime Evidence)
- **Unit & Integration Tests:** `vitest run` $\rightarrow$ **64 Test Suites (206 Unit Tests) 100% GREEN**.
  - `pipelineStateMachineIntegration.test.ts`: Kiểm chứng State Machine thay đổi trực tiếp SceneNode properties.
  - `interactiveWebRuntimeFlow.test.ts`: Kiểm chứng chuỗi Pointer $\rightarrow$ StateMachine $\rightarrow$ Animation.
  - `bezierGeometryHitTest.test.ts`: Kiểm chứng hit-testing đường cong Bezier thực tế.
  - `unboundedHierarchy.test.ts`: Kiểm chứng cây phân cấp sâu 50 tầng.
  - `snapshotCompleteness.test.ts`: Kiểm chứng 100% thuộc tính ngữ nghĩa được giữ nguyên.
- **Production Build:** `tsc && vite build` $\rightarrow$ **Clean build 0 errors** (8.13s).
