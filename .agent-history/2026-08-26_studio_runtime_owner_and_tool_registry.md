# Technical Changelog — Studio Runtime Owner, Full Semantics Live Preview & Tool Registry

**Date:** 2026-08-26  
**Author:** AI Agent (Antigravity)  
**Milestone:** Studio Runtime Owner, Document-to-Runtime Semantics Synchronization, Shared Clock, Dynamic Ruler & Canonical Scene Hierarchy  
**Reference:** User Studio Architectural Hardening Review (P0 & P1s)

---

## 1. Các Vấn Đề Kỹ Thuật Đã Được Khắc Phục Hoàn Toàn

### 1.1 🔴 P0: Studio Runtime Owner & Đầy Đủ Semantics Cho Live Preview
- **StudioRuntimeOwner (`src/engine/studio/studioRuntimeOwner.ts`):**
  - Đóng vai trò là Runtime Owner duy nhất của Studio Session.
  - Đồng bộ toàn diện tài liệu OpenSVG (`nodes`, `nodeOrder`, `rootFrame`, `duration`, `fps`, `stateMachines`, `interactions`, `constraints`, `bindings`, `components`, `componentInstances`, `assets`) vào canonical `OpenSVGRuntime`.
- **Canvas.tsx:**
  - Nhận `evaluatedScene` trực tiếp từ `studioRuntimeOwner.getEvaluatedSceneState()`.
  - Bắt các sự kiện tương tác (`click`, `pointerdown`, `pointerup`, `pointerenter`, `pointerleave`) và dispatch sang `studioRuntimeOwner.dispatchInteraction(nodeId, eventType)`.
  - Trực tiếp render live state machine transition overrides và dynamic data bindings ngay trên Studio Canvas khi tương tác chuột.

### 1.2 🟠 P1-1: Timeline Sử Dụng Duy Nhất Shared RuntimeClock của StudioRuntimeOwner
- **Timeline.tsx:** Loại bỏ hoàn toàn việc khởi tạo `new RuntimeClock` trong `useEffect`.
- Kết nối trực tiếp với `studioRuntimeOwner`:
  - `play()`, `pause()`, `seek(time)`, `advance(dt)`.
  - Cập nhật `currentTime` từ `studioRuntimeOwner.getCurrentTime()` theo chu trình duy nhất, triệt tiêu dual ownership.

### 1.3 🟠 P1-2: Dynamic Time Ruler & Phân Bố Scale Động
- **Timeline.tsx:** Thay thế mảng cứng `[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]` bằng `generateRulerTicks(duration)` tự động tính bước nhảy (0.1s, 0.5s, 1.0s, 2.0s, 5.0s) dựa theo `duration` thực tế của project.

### 1.4 🟠 P1-3: Canonical Scene Graph Hierarchy Selector Cho Layers
- **SceneGraph (`src/engine/hierarchy/sceneGraph.ts`):**
  - Cung cấp `getNodeChildren(nodeId, nodes, nodeOrder)` và `getTopLevelNodes(nodes, nodeOrder)`.
  - Triệt tiêu hoàn toàn nguy cơ trùng lặp con (duplicate traversal) giữa `childrenIds` và `parentId`.
- **LayersPanel.tsx:** Sử dụng `getNodeChildren` làm nguồn chân lý duy nhất cho cây phân cấp.

### 1.5 🟠 P1-4: Canonical Tool Registry
- **ToolRegistry (`src/engine/tools/toolRegistry.ts`):**
  - Định nghĩa tường minh toàn bộ các công cụ Studio (`select`, `direct-select`, `frame`, `rect`, `circle`, `star`, `pen`, `text`, `hand`, `zoom`, `pivot`) với đầy đủ `id`, `label`, `shortcut`, `cursor`, `category`, `capabilities`.
  - Header toolbar, Canvas và phím tắt sử dụng chung một registry duy nhất.

---

## 2. Test Proof Mới: GATE UI-2

- **Test Suite:** [`src/engine/studio/__tests__/studioRuntimeOwnerProof.test.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/engine/studio/__tests__/studioRuntimeOwnerProof.test.ts)
- Chứng minh:
  1. `StudioRuntimeOwner` nạp và đồng bộ đầy đủ document semantics (StateMachines, Interactions, Constraints, Bindings, Components).
  2. Sự kiện tương tác trên Studio Canvas (`pointerenter`) trực tiếp kích hoạt chuyển trạng thái State Machine và cập nhật live property overrides (`fill: #ef4444`) ngay trên Canvas preview.
  3. Shared `RuntimeClock` điều khiển playback chuẩn xác và nhất quán.
  4. Hierarchy selector loại bỏ trùng lặp và hỗ trợ lồng nhau sâu tùy ý.
  5. `ToolRegistry` hợp lệ và đầy đủ cho toàn bộ tool modes.

---

## 3. Bằng Chứng Thực Tế Kiểm Thử Local
- **TypeScript Typecheck:** `tsc --noEmit` $\rightarrow$ **0 errors**.
- **Test Suites:** `vitest run` $\rightarrow$ **71 Test Suites (237 Unit & Integration Tests) 100% GREEN**.
- **Production Build:** `tsc && vite build` $\rightarrow$ **Clean build (7.87s)**.
