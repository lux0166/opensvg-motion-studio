# Technical Changelog — Runtime Correctness, Single Ownership, SVG Geometry Hit Testing & Snapshot Engine

**Date:** 2026-08-26  
**Author:** AI Agent (Antigravity)  
**Milestone:** P0 Runtime Correctness & P1 SVG Geometry Hit Testing  
**Reference:** Strategic Roadmap & Core Directive

---

## 1. Các Cải Tiến Kỹ Thuật Đã Triển Khai

### 1.1 Chuẩn Hóa Quyền Sở Hữu WebRuntime & Single Runtime Owner (P0)
- **`OpenSVGWebRuntime`** được tái cấu trúc thành Adapter mỏng sở hữu DOM, Canvas, requestAnimationFrame và Pointer event mapping.
- **`OpenSVGRuntime`** là Runtime Owner duy nhất:
  - Sở hữu `RuntimeClock`, `StateMachineRuntime`, `ComponentRegistry`, `DataBindingEngine`, `Constraint[]`.
  - Quản lý đánh giá chuyển động qua `evaluateScenePipeline()` làm nguồn sự thật duy nhất.
  - Loại bỏ hoàn toàn sự trùng lặp state machine hay evaluation logic trong WebRuntime.

### 1.2 SVG Geometry Hit Testing Bằng Ma Trận Nghịch Đảo (P1)
- **Module `src/engine/interaction/geometryHitTest.ts`:**
  - Chuyển đổi tọa độ: Screen $\rightarrow$ Canvas $\rightarrow$ Scene $\rightarrow$ Local qua ma trận biến đổi nghịch đảo $W^{-1} = \text{invertMatrix}(W)$.
  - Hỗ trợ kiểm tra hình học chính xác thay vì chỉ dùng bounding box:
    - `Rect` (kể cả bo góc 4 góc với `borderRadius`).
    - `Circle` / `Ellipse`.
    - `Polygon` / `Star` (Thuật toán Ray casting Jordan Curve Theorem).
    - `Path` / `Compound SubPaths` (fill-rule `nonzero` & `evenodd`).
  - Chọn node theo thứ tự Z-order từ trên xuống dưới (top-down), tự động lọc bỏ các node ẩn (`visible: false`) hoặc khóa (`locked: true`).

### 1.3 Tối Ưu Hóa Bộ Nhớ & Runtime Snapshot (P1)
- **Module `src/engine/runtime/runtimeSnapshot.ts`:**
  - Thay thế cơ chế `JSON.parse(JSON.stringify(project))` bằng `createRuntimeSnapshot()`.
  - Tách lọc dữ liệu cần thiết cho runtime, loại bỏ transient editor metadata, giảm áp lực Garbage Collector (GC).

### 1.4 Loại Bỏ Việc Leo Cây Phân Cấp Trong Render Layer (P1)
- **Module `src/engine/runtime/renderState.ts`:**
  - Xóa bỏ vòng lặp `while (curParentId && depth < 20)` trong renderer.
  - Renderer chuyển sang tiêu thụ trực tiếp ma trận `worldTransform` chuẩn tắc đã được tính toán từ `evaluationPipeline.ts`.

### 1.5 Kiểm Chứng Parity Tuyệt Đối (P0 & P1)
- **Module `src/engine/parity/__tests__/runtimeWebParity.test.ts`:**
  - Kiểm chứng: Cùng tài liệu + Cùng thời gian + Cùng inputs $\rightarrow$ **100% kết quả đánh giá và `RenderScene` giống nhau** giữa Studio Preview, Headless Runtime và Web Runtime.

---

## 2. Kết Quả Kiểm Thử (Empirical Runtime Evidence)
- **Unit & Integration Tests:** `vitest run` $\rightarrow$ **59 Test Suites (199 Unit Tests) 100% GREEN**.
- **Production Build:** `tsc && vite build` $\rightarrow$ **Clean build 0 errors** (7.09s).
