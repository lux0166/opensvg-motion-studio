# Technical Changelog — Single Source of Evaluation Truth & Subsystem Pipeline Consolidation

**Date:** 2026-08-26  
**Author:** AI Agent (Antigravity)  
**Milestone:** Post-Commit Architecture Consolidation (P0 Single Evaluation Path & P1 Subsystem Integration)  
**Reference:** `OPENSVG_POST_COMMIT_ARCHITECTURE_REVIEW.md`

---

## 1. Các Cải Tiến Kỹ Thuật Đã Triển Khai

### 1.1 Hợp Nhất Evaluation Pipeline Thành Nguồn Sự Thật Duy Nhất (P0)
- `OpenSVGRuntime.getRenderState()` và `getEvaluatedSceneState()` trong `src/engine/runtime/runtimeKernel.ts` đã được cấu trúc lại hoàn toàn để gọi trực tiếp `evaluateScenePipeline()`.
- Xóa bỏ 100% logic tính toán scene độc lập trong `runtimeKernel.ts`, loại bỏ triệt để nguy cơ phân nhánh logic giữa runtime headless và editor pipeline.

### 1.2 Tích Hợp Đầy Đủ Các Subsystems Vào Canonical Pipeline (P1)
`evaluateScenePipeline` trong `src/engine/runtime/evaluationPipeline.ts` hiện thực thi pipeline 8 pha chính thức:
1. **Component Instance Resolution:** Khởi tạo và ghi đè thuộc tính từ `ComponentRegistry` qua `resolveInstance`.
2. **Animation Track Evaluation:** Đánh giá keyframes, easing curves, spring physics và motion paths.
3. **Data Binding Resolution:** Đánh giá các biểu thức binding từ `DataBindingEngine`.
4. **State Machine Overrides:** Áp dụng các thay đổi thuộc tính phát sinh từ State Machine Runtime.
5. **Constraint Solver Execution:** Chạy solver với cơ chế phát hiện và ngắt vòng lặp an toàn (`solveAllConstraints`).
6. **Canonical Hierarchy & World Transform Resolution:** Tính toán ma trận Affine 2D tích lũy theo cây phân cấp cha-con với cycle detection (`computeCanonicalWorldTransforms`).
7. **Evaluated Node States Generation:** Đóng gói `EvaluatedNodeState` chứa world transform và total opacity.
8. **Render Scene Derivation:** Chuyển giao trực tiếp sang `RenderScene` cho backend render.

### 1.3 Chuẩn Hóa RuntimeClock & Vòng Đời Playback (P1)
- Tạo module `src/engine/runtime/runtimeClock.ts` quản lý chuẩn mực:
  - Loop modes (`loop`, `once`, `ping-pong`).
  - FPS, duration, playbackRate, isPlaying.
  - Các thao tác điều khiển: `advance(dt)`, `seek(t)`, `play()`, `pause()`, `togglePlay()`, `reset()`.
- Tích hợp `RuntimeClock` vào `OpenSVGRuntime`.

---

## 2. Kết Quả Kiểm Thử (Empirical Runtime Evidence)
- **Unit & Integration Tests:** `vitest run` $\rightarrow$ **53 Test Suites (182 Unit Tests) 100% GREEN**.
  - Đã bổ sung integration tests chứng minh **Parity 100%** giữa `OpenSVGRuntime` và `evaluateScenePipeline`.
  - Kiểm thử đầy đủ các chế độ vòng lặp của `RuntimeClock`.
  - Kiểm thử tích hợp chuỗi Component + Data Binding + Constraint trong pipeline.
- **Production Build:** `tsc && vite build` $\rightarrow$ **Clean compilation 0 errors** trong 7.45s.
