# Technical Changelog — Runtime Foundation Architecture (CORE-01 to CORE-04)

**Timestamp:** 2026-08-22  
**Specification Reference:** `CORE_ENGINE_DEPTH.md` & `RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md`  
**Target Milestone:** Core Engine Depth & Runtime Foundation v1

---

## 1. Triển Khai Kỹ Thuật (Engineering Implementations)

### A. CORE-01: Core Runtime Contracts
- **File mới:** `src/engine/runtime/coreContracts.ts`
- **Kiến trúc:**
  - Định nghĩa các interface chuẩn: `Transform`, `Matrix2D`, `CoordinateSpace`, `RenderPaint`, `RenderStroke`, `RenderClipDescriptor`, `RenderFilterDescriptor`, `RenderNodeState`, `RenderScene`, `BackendFrameContext`, `RenderBackend`, `RenderCapabilities`.
  - **Bất biến (Invariants):** Không phụ thuộc React, Zustand hay DOM. Các kiểu dữ liệu thuần khiết tách biệt tuyệt đối giữa Authoring Document và Derived Render State.

### B. CORE-02: Transform Engine (Matrix2D)
- **File mới:** `src/engine/transform/matrix2D.ts`
- **Kiến trúc:**
  - Ma trận affine $3 \times 3$ trong không gian 2D ($[a, c, e; b, d, f]$).
  - Triển khai đầy đủ: `multiplyMatrices`, `invertMatrix`, `transformPoint`, `transformVector`, `composeTransform` (với Pivot point offset), `decomposeMatrix`.

### C. CORE-03: RenderNodeState Derivation
- **File mới:** `src/engine/runtime/renderState.ts`
- **Kiến trúc:**
  - Tách biệt rõ ràng giữa Authoring State (`SceneNode`) và Render State phái sinh (`RenderNodeState`).
  - Tích luỹ ma trận phân cấp World Transform và Opacity từ cây phân cấp cha-con, trích xuất Paint, Stroke, Filter, Geometry.

### D. CORE-04: Headless Runtime Evaluation Kernel
- **File mới:** `src/engine/runtime/runtimeKernel.ts`
- **Kiến trúc:**
  - Lớp `OpenSVGRuntime` thực thi độc lập không cần DOM/UI.
  - Cung cấp: `load(project)`, `advance(dt)`, `seek(time)` (xác định và tuần hoàn), `reset()`, `getRenderState(): RenderScene`.

---

## 2. Kiểm Chứng & Test Coverage (Empirical Evidence)
- Bổ sung 3 Test Suites mới:
  - `src/engine/transform/__tests__/matrix2D.test.ts` (6 tests)
  - `src/engine/runtime/__tests__/renderState.test.ts` (1 test)
  - `src/engine/runtime/__tests__/runtimeKernel.test.ts` (3 tests)
- Kết quả kiểm thử: **39/39 Test Suites Passed (135/135 Unit Tests Passed - 100% Green)**
- Kết quả Build: `tsc && vite build` **Success (0 errors, 8.38s)**.
