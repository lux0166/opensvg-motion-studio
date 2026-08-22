# Technical Changelog — Runtime Foundation (CORE-14 Parity Golden Tests & CORE-15 Public API Barrel Export)

**Timestamp:** 2026-08-22  
**Specification Reference:** `CORE_ENGINE_DEPTH.md` & `RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md` (CORE-14 & CORE-15)  
**Target Milestone:** Core Engine Depth & Runtime Foundation v1 (CORE-14 & CORE-15) — **100% COMPLETE**

---

## 1. Triển Khai Kỹ Thuật (Engineering Implementations)

### A. CORE-14: Parity Golden Tests
- **File mới:** `src/engine/parity/__tests__/parityGolden.test.ts`
- **Kiến trúc:**
  - Kiểm tra tính tương đồng (Parity) chính xác 100% giữa kết quả đánh giá của Evaluator và cấu trúc `RenderScene` suy xuất độc lập.
  - Kiểm tra khả năng tương thích của scene submission qua cả 2 Backend: `Canvas2DBackend` và `WebGpuBackend` (Fallback mode).
  - Kiểm tra tính toán phân bố mẫu toạ độ và vector tiếp tuyến dọc theo đường dẫn chuyển động (Motion Paths).

### B. CORE-15: Release & Public API Barrel Export
- **File mới:** `src/engine/index.ts`
- **Kiến trúc:**
  - Hợp nhất và export toàn bộ các hệ thống con của OpenSVG Motion Engine:
    - Data Contracts & Interfaces (`types.ts`, `coreContracts.ts`)
    - Transform Engine (`matrix2D.ts`)
    - Render State Kernel (`renderState.ts`)
    - Headless Runtime Kernel (`runtimeKernel.ts`)
    - Constraint Engine (`constraintSolver.ts`)
    - State Machine Runtime v2 (`runtimeStateMachine.ts`)
    - Render Backends (`canvas2DBackend.ts`, `webgpuBackend.ts`)
    - Component / Instance System (`componentSystem.ts`)
    - Data Binding Engine (`dataBinding.ts`)
    - Geometry Core (`geometryCore.ts`)
    - Persistence & Schema Migration (`schemaMigration.ts`)
    - Performance Lab (`performanceLab.ts`)
    - Các bộ công cụ hoạt ảnh: Evaluator, Exporter, Importer, Presets, Physics, MaskRenderer, Waveform, TextOnPath, Hierarchy, Snapping, ColorHarmony, CrashRecovery.

---

## 2. Kiểm Chứng & Test Coverage (Empirical Evidence)
- Bổ sung Test Suite mới:
  - `src/engine/parity/__tests__/parityGolden.test.ts` (3 tests)
- Kết quả kiểm thử: **49/49 Test Suites Passed (162/162 Unit Tests Passed - 100% Green)**
- Kết quả Build: `tsc && vite build` **Success (0 errors, 6.92s)**.
