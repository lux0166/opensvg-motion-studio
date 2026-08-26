# Technical Changelog — Document-Defined Interaction Architecture & Generic Runtime Dispatching

**Date:** 2026-08-26  
**Author:** AI Agent (Antigravity)  
**Milestone:** Document-Defined Interaction Model, Gate 6 Certification & Package Identity Alignment  
**Reference:** User P0 Architectural Directive

---

## 1. Các Thay Đổi Kiến Trúc & Cải Tiến Kỹ Thuật

### 1.1 Document-Defined Interaction Architecture (P0 Đã Hoàn Thành)
- **Module mới: `src/engine/interaction/interactionModel.ts`**:
  - Định nghĩa chuẩn tắc các kiểu sự kiện: `'pointerenter' | 'pointerleave' | 'pointerdown' | 'pointerup' | 'click' | 'dblclick'`.
  - Định nghĩa các hành động tương tác độc lập (InteractionAction): `setInput`, `fireTrigger`, `setState`, `seek`, `play`, `pause`, `togglePlay`.
  - Khế ước `DocumentInteraction`:
    ```ts
    export interface DocumentInteraction {
      id: string;
      name?: string;
      targetNodeId: string;
      event: InteractionEventType;
      action: InteractionAction;
      enabled?: boolean;
    }
    ```
- **Tích hợp vào Native Document Schema (`.osvg` 2.0.0)**:
  - Thêm trường `interactions?: DocumentInteraction[]` vào `OpenSVGDocument`.
  - Cập nhật bộ thẩm định cú pháp `validateDocument` và bộ chuyển đổi `migrateLegacyToNativeDocument` trong `documentParser.ts`.

### 1.2 Triệt Tiêu Hoàn Toàn Hardcoded Input Names trong WebRuntime
- **`OpenSVGRuntime` (`src/engine/runtime/runtimeKernel.ts`)**:
  - Sở hữu danh sách `interactions: DocumentInteraction[]`.
  - Cung cấp phương thức `dispatchInteraction(targetNodeId, event)` và cơ chế `executeInteractionAction()`.
- **`OpenSVGWebRuntime` (`src/engine/webRuntime/openSVGWebRuntime.ts`)**:
  - WebRuntime chỉ đóng vai trò bộ chuyển tiếp sự kiện con trỏ:
    $$\text{Pointer Event} \longrightarrow \text{Geometry Hit Test} \longrightarrow \text{runtime.dispatchInteraction(nodeId, event)}$$
  - Runtime hoàn toàn không cần biết trước tên input (`isHovered`, `isPressed`, `onClick` đã được trừu tượng hóa 100% vào tài liệu `.osvg`).

### 1.3 Certification Gate 6 — Document-Defined Interaction Resolution
- **`src/engine/certification/__tests__/runtimeCertificationSuite.test.ts`**:
  - Gate 6 chứng minh việc tải một tài liệu `.osvg` với các tên biến tùy ý (`shieldArmed`, `triggerHyperdrive`) và các `interactions` được cấu hình động.
  - Runtime tiếp nhận sự kiện con trỏ, tự động tìm và thực thi đúng Action, kích hoạt chuyển đổi trạng thái State Machine mượt mà.

### 1.4 Đồng Bộ Nhận Diện Gói npm & Export Modal Studio
- Đổi tên `package.json` từ `"kinetic-studio"` $\rightarrow$ `"opensvg-motion-studio"`.
- Cập nhật `src/components/ExportModal.tsx` để xuất bản trực tiếp tệp `.osvg` chuẩn tắc bằng `serializeDocument()`.

---

## 2. Kết Quả Kiểm Thử Thực Tế (Empirical Runtime Evidence)
- **TypeScript Static Analysis:** `tsc --noEmit` $\rightarrow$ **0 errors**.
- **Runtime Certification Suite:** `vitest run src/engine/certification/` $\rightarrow$ **7 Proof Gates PASSED (100% GREEN)**.
- **Full Unit & Integration Suites:** `vitest run` $\rightarrow$ **66 Test Suites, 216 Unit Tests PASSED (100% GREEN)**.
- **Production Build:** `tsc && vite build` $\rightarrow$ **Clean build (7.39s)**.
