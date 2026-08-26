# Technical Changelog — Studio UI/Product Hardening & Canonical Runtime Integration

**Date:** 2026-08-26  
**Author:** AI Agent (Antigravity)  
**Milestone:** Studio UI Product Hardening, Canonical Runtime Pipeline Integration, Document Interaction Authoring UI, OpenSVG (.osvg) Workflow  
**Reference:** User Studio / UI Product Architecture Directive

---

## 1. Các Vấn Đề Kỹ Thuật Đã Khắc Phục Triệt Để

### 1.1 🔴 P0-1: Studio Preview Đồng Bộ 100% với Canonical Evaluation Pipeline
- **Canvas.tsx:** Loại bỏ hoàn toàn legacy `evaluateNode(node, currentTime, nodes)`.
- Kết nối `Canvas.tsx` trực tiếp với `evaluateScenePipeline()` để mọi tính toán biến đổi, opacity, constraint, data binding, state machine và transforms đều tuân theo duy nhất một pipeline chuẩn.
- Đảm bảo tính nhất quán tuyệt đối giữa Studio Canvas preview và Standalone WebRuntime output.

### 1.2 🔴 P0-2: Timeline Sử Dụng Duy Nhất Canonical RuntimeClock
- **Timeline.tsx:** Loại bỏ duplicate `requestAnimationFrame` clock logic.
- Sử dụng trực tiếp `RuntimeClock` từ `src/engine/runtime/runtimeClock.ts` cho toàn bộ các thao tác play, pause, seek, loop và advance.

### 1.3 🔴 P0-3: Chuẩn Hóa Primary Authoring Format Sang .osvg
- **Header.tsx & useStudioShortcuts.ts:**
  - Chuyển đổi tên menu và nhãn UI sang **Open (.osvg)** và **Save (.osvg)**.
  - Phím tắt `Ctrl+S` và nút Save xuất chuẩn native `.osvg` JSON định dạng `application/vnd.opensvg+json`.
  - Giữ tương thích mở file cũ `.kinetic` qua `parseDocument()`.

### 1.4 🔴 P0-4: Giao Diện Tạo Document Interaction Thực Thụ Trong PropertiesPanel
- **PropertiesPanel.tsx:** Xóa bỏ hoàn toàn abstraction cũ `NodeTrigger` (`addTrigger`/`removeTrigger`).
- Xây dựng giao diện **Document Interactions Section**:
  - Chọn sự kiện tương tác (`pointerenter`, `pointerleave`, `pointerdown`, `pointerup`, `click`, `dblclick`).
  - Chọn loại hành động (`setInput`, `fireTrigger`, `setState`, `seek`, `play`, `pause`, `togglePlay`).
  - Tùy chỉnh tham số đầu vào động (Input Name, Boolean/Number Value, Trigger Name, State ID, Target Time).
  - Tích hợp trực tiếp với store qua `addInteraction`, `updateInteraction`, `removeInteraction`.

### 1.5 🔴 P0-5 & P1: Làm Sạch Starter State & Static Shape Additions
- **useStudioStore.ts:**
  - `createDefaultTab()` và initial store state tạo canvas hoàn toàn rỗng (`nodes: {}`, `nodeOrder: []`, `markers: []`).
  - Tách biệt hoàn toàn starter blank canvas khỏi các example/demo scene.
- **Header.tsx:** `handleAddShape` tạo shape hoàn toàn **STATIC** (`tracks: []`), không tự ý chèn animation xoay giả tạo 360 độ.

### 1.6 🟠 P1: Hierarchy Đệ Quy & Loại Bỏ Giả Định frame-1
- **LayersPanel.tsx:** Nâng cấp hàm render `renderLayerRow(id, depth)` đệ quy hỗ trợ cây phân cấp sâu bất kỳ.
- Thay thế toàn bộ hardcode `'frame-1'` trong Canvas, LayersPanel, và PropertiesPanel bằng `rootFrame.id`.

---

## 2. Test Suite & Proof Gate Mới: GATE UI-1

- **Module Test:** [`src/engine/studio/__tests__/studioUIAuthoringProof.test.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/engine/studio/__tests__/studioUIAuthoringProof.test.ts)
- Kiểm chứng toàn diện chu trình tác nghiệp của người dùng:
  $$\text{New Clean Project} \rightarrow \text{Add Shapes (Static)} \rightarrow \text{Explicit Keyframes} \rightarrow \text{Author Interactions} \rightarrow \text{State Machines} \rightarrow \text{Export .osvg} \rightarrow \text{Reload} \rightarrow \text{Execute on Runtime}$$

---

## 3. Kết Quả Kiểm Thử Thực Tế (Empirical Runtime Evidence)
- **TypeScript Typecheck:** `tsc --noEmit` $\rightarrow$ **0 errors**.
- **Test Suite:** `vitest run` $\rightarrow$ **70 Test Suites (233 Unit & Integration Tests) 100% GREEN**.
- **Production Build:** `tsc && vite build` $\rightarrow$ **Clean build (8.53s)**.
