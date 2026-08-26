# Technical Changelog — Exact Reconciliation, Pure Evaluation API, Session Eviction, and Full Studio Acceptance Workflow (GATE UI-3)

**Date:** 2026-08-27  
**Author:** AI Agent (Antigravity)  
**Milestone:** Exact State Reconciliation, Pure Evaluation Semantics, Tab Eviction & Full Studio Acceptance Suite  
**Reference:** User P0/P1 Review on Stale Registrations, Pure Evaluation Semantics, Tab Eviction & Acceptance Flow

---

## 1. Các Vấn Đề Kỹ Thuật Đã Khắc Phục Triệt Để

### 1.1 🔴 P0-1: Exact State Reconciliation (Purge Stale Registrations)
- **Vấn đề trước đây:** `reconcile()` chỉ append/update mà không remove các `components`, `bindings`, `assets` đã bị người dùng xóa khỏi document trong revision mới.
- **Giải pháp:**
  - `OpenSVGRuntime.reconcile()` tái tạo sạch sẽ `ComponentRegistry` và `DataBindingEngine` theo đúng định nghĩa của revision mới (loại bỏ 100% stale components / stale bindings).
  - `AssetStore.loadManifest()` thực hiện `this.assets.clear()` và nạp đúng manifest mới.
  - `evaluationPipeline.ts`: Đảm bảo toàn bộ `workingNodes` (kể cả nested/grouped children) luôn được nạp vào `nodeOrder` và được đánh giá trong `evaluatedMap`.

### 1.2 🔴 P0-2: Pure Evaluation API Semantics (`getEvaluatedSceneState` vs `evaluateAt`)
- **Vấn đề trước đây:** `StudioRuntimeOwner.getEvaluatedSceneState(time)` thực hiện `this.runtime.seek(time)`, làm mutate persistent clock và state machine positions trong getter call (nguy cơ gây re-render loops trong React).
- **Giải pháp:**
  - `getEvaluatedSceneState()`: Pure evaluation read của runtime state hiện tại (không nhận tham số `time`, không mutate clock).
  - `evaluateAt(time: number): EvaluatedSceneState`: Pure snapshot evaluation tại thời điểm `time` mà không làm thay đổi clock hay state machine persistent positions.
  - `Canvas.tsx` chuyển sang gọi `runtimeOwner.evaluateAt(currentTime)`.

### 1.3 🟠 P1-1: Metadata `updatedAt` Deterministic
- Loại bỏ việc tự sinh `Date.now()` trong `syncStudioDocument()`. Sử dụng canonical `state.updatedAt || state.createdAt || 1700000000000`.

### 1.4 🟠 P1-2: Session Eviction Policy trên StudioSessionManager
- Khi đóng tab trong `useStudioStore.ts` (`closeTab(tabId)`, `closeOtherTabs(tabId)`, `closeTabsToRight(tabId)`), tự động gọi `studioSessionManager.destroySession(id)` để giải phóng bộ nhớ của các tab không còn sử dụng.

---

## 2. Test Verification & Proof Suite (GATE UI-3)

- Đã tạo và vượt qua toàn diện test suite [`src/engine/studio/__tests__/studioFullLifecycleProof.test.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/engine/studio/__tests__/studioFullLifecycleProof.test.ts):
  1. **Exact State Reconciliation:** Xóa component B, binding B, asset 1 $\rightarrow$ runtime registry và asset store loại bỏ triệt để các phần tử cũ.
  2. **Pure Evaluation Semantics:** `getEvaluatedSceneState()` và `evaluateAt(2.0)` không làm thay đổi clock position hiện tại ($t = 0.5s$).
  3. **Tab Eviction:** Đóng tab giải phóng session tương ứng khỏi `StudioSessionManager`.
  4. **Complete Studio Real Acceptance Flow:**
     - Draw Rectangle $\rightarrow$ Transform (Move, Resize, Rotate) $\rightarrow$ Duplicate $\rightarrow$ Group $\rightarrow$ Hide/Lock $\rightarrow$ Keyframe Animation $\rightarrow$ State Machine & Interaction $\rightarrow$ Live Hover Transition $\rightarrow$ Undo $\rightarrow$ Redo $\rightarrow$ Export `.osvg` $\rightarrow$ Reopen in Fresh Runtime $\rightarrow$ Playback & Interaction work 100% identically!
- Toàn bộ **72 Test Suites (243 tests)** đạt **100% GREEN**.
- Production Build: **0 errors**.
