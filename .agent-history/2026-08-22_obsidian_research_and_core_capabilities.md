# Technical Changelog — Obsidian Research & Core Engine Hardening

**Timestamp:** 2026-08-22  
**Task:** Research theo Obsidian, Lên Master Functional Task List và hoàn thiện các chức năng cơ bản cốt lõi cho OpenSVG Motion Studio.

---

## 1. Nghiên Cứu Tri Thức (Obsidian Knowledge Ingestion)
- Đã truy vấn Obsidian Local REST API (Port 27124) để nạp các quy chuẩn:
  - BABOK Core Concepts & Agile Requirements Engineering (INVEST & Gherkin Given-When-Then).
  - Architecture Constitution (137 Rules & Swarm Governance).
  - Strict Monochrome Black & White UI Standards & 18 Forbidden Anti-Patterns.
- Đã tạo và đồng bộ Entity Note vào Obsidian Vault:
  - Note: `02-ENTITIES/OpenSVG Motion Studio Functional Task List.md`
  - Index link: `04-MOC/Master_Knowledge_Graph_MOC.md`

---

## 2. Triển Khai Kỹ Thuật (Engineering Implementations)

### A. Task 1.1: Interactive Pivot / Anchor Point Engine
- **Files:** `src/engine/types.ts`, `src/engine/renderer.ts`, `src/components/PropertiesPanel.tsx`
- Bổ sung `pivotX`, `pivotY` (normalized 0.0 - 1.0) vào `BaseNode` và `AnimatableProperty`.
- Cập nhật ma trận biến đổi Canvas 2D xoay/thu phóng quanh điểm neo Pivot.
- Bổ sung điểm neo Pivot trực quan (Target Crosshair) trên overlay Bounding Box và bảng chọn nhanh 9 vị trí Pivot (TL, TC, TR, CL, Center, CR, BL, BC, BR) trong `PropertiesPanel.tsx`.

### B. Task 1.2: Compound Paths & Fill Rule
- **Files:** `src/engine/types.ts`, `src/engine/renderer.ts`
- Bổ sung `subPaths?: BezierPoint[][]` và `fillRule?: 'nonzero' | 'evenodd'` cho `PathNode` hỗ trợ các hình dạng phức tạp có khoét lỗ (chữ O, bánh xe, vòng tròn đồng tâm).

### C. Task 2.3: Auto-Keyframing Record Mode
- **Files:** `src/store/useStudioStore.ts`, `src/components/workspace/TimelineControls.tsx`
- Bổ sung cờ `isAutoKeyframe: boolean` và action `toggleAutoKeyframe()`.
- Tích hợp logic tự động phát hiện và chèn Keyframe mới tại `currentTime` khi chỉnh sửa bất kỳ thuộc tính chuyển động nào tại $t > 0$.
- Bổ sung nút bấm trực quan **Auto-Key** trên thanh điều khiển Timeline.

### D. Task 4.3: Trim Path Stroke Animation
- **Files:** `src/engine/types.ts`, `src/engine/renderer.ts`, `src/components/PropertiesPanel.tsx`
- Bổ sung `trimStart`, `trimEnd`, `trimOffset` vào `BaseNode` và `AnimatableProperty`.
- Tích hợp thuật toán tính chu vi và `setLineDash` / `lineDashOffset` trên Canvas 2D để vẽ nét viền tự động (Line drawing animation).
- Bổ sung thanh trượt điều chỉnh Start / End % trực quan trong mục Stroke của `PropertiesPanel.tsx`.

---

## 3. Kiểm Chứng & Test Coverage
- Bổ sung Test Suite: `src/engine/__tests__/pivotAndTrim.test.ts`
- Cập nhật Test Suite: `src/store/__tests__/store.test.ts`
- Kết quả kiểm thử: **24/24 Test Files Passed (91/91 Tests Passed)**
- Kết quả Build: `tsc && vite build` **Success (0 errors)**.
