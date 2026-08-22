# Technical Changelog — Epic 3 & Epic 4 Hardening (Hierarchy, Masking, Text on Path & Stagger)

**Timestamp:** 2026-08-22  
**Task:** Triển khai Task 3.1 & 3.2 (Hierarchy & Transform Matrix Inheritance) và Task 4.1 & 4.2 (Text on Path & Kinetic Typography Stagger) theo đúng quy chuẩn `OPENSVG_FEATURE_ENGINEERING_RULES.md`.

---

## 1. Triển Khai Kỹ Thuật (Engineering Implementations)

### A. Task 3.2: Layer Hierarchy & Transform Matrix Inheritance (Rules L4 & L5)
- **File mới:** `src/engine/hierarchy.ts`
- **Kiến trúc:**
  - `computeWorldTransform`: Tính ma trận biến đổi thế giới tích lũy ($T_{world} = T_{parent} \times T_{local}$) khi duyệt cây phân cấp `parentId`.
  - Tự động nhân dồn `opacity` qua các cấp cha con và phát hiện chu trình lặp vô tận (Cycle detection guard).
  - `getDescendantNodeIds`: Thu thập danh sách ID con cháu để quản lý vùng chọn nhóm.

### B. Task 4.1: Text on Path Metric Engine (Rules K1, K2, K3)
- **File mới:** `src/engine/textOnPath.ts`, cập nhật `src/engine/renderer.ts`
- **Kiến trúc:**
  - `samplePathMetrics`: Lấy mẫu độ dài cung (arc length) chính xác trên các đường cong Bezier và đoạn thẳng.
  - `computeTextOnPath`: Bố trí từng ký tự dọc theo đường dẫn vector với góc xoay tiếp tuyến (tangent orientation) chuẩn toán học.
  - Tích hợp trực tiếp vào `renderCanvasScene` khi `node.type === 'text'` và có `textPathNodeId`.

### C. Task 4.2: Kinetic Typography Stagger Engine (Rules K4 & K5)
- **File mới:** `src/engine/textOnPath.ts`, cập nhật `src/engine/renderer.ts`
- **Kiến trúc:**
  - `computeKineticTextStagger`: Xử lý các kiểu hoạt ảnh chữ động (`typewriter`, `wave`, `cascade`) theo độ trễ `staggerDelay` trên từng ký tự.
  - Render tức thời trên Canvas 2D mà không làm thay đổi hay phân mảnh Canonical Document Model (Rule K2 & Rule A4).

---

## 2. Kiểm Chứng & Test Coverage (Empirical Evidence)
- Bổ sung Test Suites:
  - `src/engine/__tests__/hierarchy.test.ts` (4 tests)
  - `src/engine/__tests__/textOnPath.test.ts` (4 tests)
- Kết quả kiểm thử: **28/28 Test Suites Passed (109/109 Unit Tests Passed - 100% Green)**
- Kết quả Build: `tsc && vite build` **Success (0 errors, 8.47s)**.
