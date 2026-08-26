# Technical Changelog — Non-Destructive Runtime Reconciliation, Multi-Tab StudioSessionManager, Canonical Geometry Hit-Testing

**Date:** 2026-08-26  
**Author:** AI Agent (Antigravity)  
**Milestone:** Non-Destructive Reconciliation, Multi-Tab Runtime Isolation, Strict Type Boundaries & Geometry Hit-Testing  
**Reference:** User Runtime State Reset P0 & Multi-Tab Isolation Review

---

## 1. Các Vấn Đề Kỹ Thuật Đã Khắc Phục Triệt Để

### 1.1 🔴 P0-1: Non-Destructive Runtime Reconciliation (reconcile vs load)
- **Vấn đề trước đây:** `syncStudioDocument()` gọi `runtime.load()`, làm reset toàn bộ `StateMachineRuntime` layer states, input values, transition progress, bindings và assets mỗi khi React state render lại.
- **Giải pháp:**
  - Thêm `reconcileDefinition()` vào `StateMachineRuntime` (`src/engine/stateMachine/runtimeStateMachine.ts`): bảo toàn các inputs đã gán và active states của các layers nếu layer còn tồn tại.
  - Thêm `reconcile(docOrProject)` vào `OpenSVGRuntime` (`src/engine/runtime/runtimeKernel.ts`): cập nhật cấu trúc project, metadata, component registry, assets, bindings và constraints mà không reset runtime clock, state machines, hoặc input states.
  - `StudioRuntimeOwner.syncStudioDocument()` chuyển sang dùng `this.runtime.reconcile(canonicalDoc)`.

### 1.2 🔴 P0-2: Multi-Tab Runtime Isolation (`StudioSessionManager`)
- **Vấn đề trước đây:** Singleton `studioRuntimeOwner` dùng chung cho toàn bộ app dẫn đến việc switch tab gây overwrite trạng thái giữa các tab khác nhau.
- **Giải pháp:**
  - Tạo `StudioSessionManager` (`src/engine/studio/studioRuntimeOwner.ts`) ánh xạ `tabId` tới từng thực thể `StudioRuntimeOwner` riêng biệt.
  - Các tab tài liệu A, B, C có runtime owner độc lập, duy trì clock và state machine riêng mà không bị ảnh hưởng khi chuyển tab.

### 1.3 🔴 P0-3 & P0-4: Loại Bỏ `any[]` & Bảo Toàn Metadata Document Identity
- **Strict Typing:** `StudioDocumentState` sử dụng 100% kiểu canonical (`StateMachineDefinition[]`, `DocumentInteraction[]`, `Constraint[]`, `DataBinding[]`, `ComponentDefinition[]`, `ComponentInstance[]`, `Record<string, AssetManifestEntry>`).
- **Metadata Identity:** Bảo toàn `id`, `createdAt`, `updatedAt` từ document tab gốc, loại bỏ việc tự sinh `Date.now()` nondeterministic mỗi frame.

### 1.4 🟠 P1-1: Canonical Geometry Hit-Testing Trên Studio Canvas
- **Canvas.tsx:** Thay thế bounding-box hit test thủ công bằng `hitTestScene(evaluatedScene, point, { ignoreInvisible, ignoreLocked })` từ `src/engine/interaction/geometryHitTest.ts`.
- Đảm bảo hit testing chuẩn xác với ma trận nghịch đảo, góc xoay, đường cong Bezier, và Z-order trên Canvas.

### 1.5 🟠 P1-2: Loại Bỏ Hoàn Toàn Legacy `NodeTrigger`
- Xóa `NodeTrigger`, `addTrigger`, `removeTrigger` khỏi `useStudioStore.ts` và chuyển đổi 100% sang `DocumentInteraction`.

---

## 2. Test Verification & Proof Suite

- Cập nhật test suite [`src/engine/studio/__tests__/studioRuntimeOwnerProof.test.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/engine/studio/__tests__/studioRuntimeOwnerProof.test.ts):
  - Kiểm chứng `syncStudioDocument` thực hiện reconciliation không phá hủy state machine interactive state (giữ nguyên state `st-hover` / màu đỏ khi node được rename).
  - Kiểm chứng `StudioSessionManager` cô lập độc lập clock và runtime state giữa các tab khác nhau.
- Toàn bộ **71 Test Suites (239 tests)** đạt **100% GREEN**.
- Build production bundle: **0 errors**.
