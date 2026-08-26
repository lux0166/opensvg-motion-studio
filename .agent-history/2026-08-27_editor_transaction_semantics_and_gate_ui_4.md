# Technical Changelog — Editor Transaction Semantics, Undo/Redo Compatibility, Dirty State Lifecycle, and GATE UI-4 Certification

**Date:** 2026-08-27  
**Author:** AI Agent (Antigravity)  
**Milestone:** Transaction Semantics, Single Undo Entry per Gesture, Dirty State Lifecycle & GATE UI-4 Certification  
**Reference:** User P0/P1 Review on Transaction Boundaries, Dirty State, Selection Separation, and SVG Import Certification

---

## 1. Các Vấn Đề Kỹ Thuật Đã Khắc Phục Triệt Để

### 1.1 🔴 P0-1: Semantic History & Transaction Boundary (1 Gesture = 1 Undo Entry)
- **Vấn đề trước đây:** Lo ngại nhiều mousemove events trong một drag gesture tạo ra hàng chục undo steps rác.
- **Giải pháp:**
  - `pushSnapshot()` chỉ được gọi **1 lần duy nhất** khi bắt đầu gesture (`dragStart` / `initNodeDrag` / `initResizeDrag` / `initRotateDrag`).
  - Trong suốt quá trình kéo (`mousemove`), `updateNode(id, updates, false)` cập nhật vị trí working node trong store với `recordHistory = false`.
  - Kết quả: Thao tác kéo 30 frames liên tục chỉ tạo đúng **1 semantic undo entry** duy nhất. 1 lần Undo trả về chính xác vị trí trước khi kéo.

### 1.2 🔴 P0-2: Undo/Redo $\leftrightarrow$ Runtime State Compatibility
- **Vấn đề trước đây:** Khi người dùng Undo hoặc Redo thay đổi cấu trúc document trong khi State Machine đang ở trạng thái active (ví dụ đang hover), runtime state có nguy cơ bị reset hoặc crash.
- **Giải pháp:**
  - `StudioSnapshot` trong [`src/engine/history.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/engine/history.ts) lưu trữ đầy đủ toàn bộ document semantics (bao gồm `stateMachines`, `interactions`, `constraints`, `bindings`, `components`, `assets`).
  - `undo()` và `redo()` khôi phục toàn bộ semantics và chuyển giao cho `StudioRuntimeOwner.reconcile()`:
    - Bảo toàn active interaction state (`st-hover`, `inputs`) nếu target node và state machine vẫn còn tồn tại.
    - Deterministic repair/cleanup nếu node bị xóa.

### 1.3 🔴 P0-3: Autosave & Dirty State Lifecycle
- **Giải pháp:**
  - Bổ sung `savedSnapshotIndex` vào `DocumentTab` trong [`src/engine/types.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/engine/types.ts).
  - Khi người dùng edit document: `pushDraftSnapshot()` tự động đánh dấu `isDirty = true`.
  - Khi người dùng save/export (`exportOpenSVGDocument()`): đánh dấu `isDirty = false` và lưu `savedSnapshotIndex = past.length`.
  - Khi `undo()` quay về đúng trạng thái lúc save: `isDirty` tự động chuyển về `false`.
  - Khi `redo()` tiến tới trạng thái mới: `isDirty` tự động chuyển thành `true`.

### 1.4 🟠 P1-1: Phân Định Rõ Document State vs Ephemeral Selection State
- `createStudioSnapshot()` chỉ lưu trữ Document State thuần túy, tách biệt hoàn toàn khỏi Ephemeral UI State (`selectedId`, `selectedTool`, `zoom`, `panX`, `panY`, `activeSnapLines`).
- Undo/Redo không ghi đè hay làm sai lệch hành vi selection của người dùng.

---

## 2. Test Verification & Proof Suite (GATE UI-4)

- Đã tạo và vượt qua toàn diện test suite [`src/engine/studio/__tests__/studioTransactionSemanticsProof.test.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/engine/studio/__tests__/studioTransactionSemanticsProof.test.ts):
  1. **Single Semantic Undo Step per Gesture:** 30 frame drag gesture tạo đúng 1 history entry, 1 lần undo rollback chính xác.
  2. **Undo/Redo ↔ Runtime State Compatibility:** Đổi width $\rightarrow$ active hover state `#ef4444` giữ nguyên $\rightarrow$ Undo $\rightarrow$ width phục hồi và active hover state tiếp tục được bảo toàn.
  3. **Dirty State Lifecycle:** New/Saved (`false`) $\rightarrow$ Edit (`true`) $\rightarrow$ Save (`false`) $\rightarrow$ Edit (`true`) $\rightarrow$ Undo (`false`) $\rightarrow$ Redo (`true`).
  4. **Complete SVG Import -> Authoring -> Runtime Roundtrip:**
     - Import SVG phức tạp (Group, Path, Circle, Rect, Text, Transform) $\rightarrow$ Animate keyframe $\rightarrow$ Thêm State Machine \& Interaction $\rightarrow$ Live hover/click transition $\rightarrow$ Save `.osvg` $\rightarrow$ Reload in Fresh Runtime $\rightarrow$ Verify playback và interactions 100% identical.
- Toàn bộ **73 Test Suites (247 tests)** đạt **100% GREEN**.
- Production Build: **0 errors**.
