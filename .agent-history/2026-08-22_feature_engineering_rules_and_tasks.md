# Technical Changelog — Feature Engineering Rules Ingestion & Timeline/Geometry Hardening

**Timestamp:** 2026-08-22  
**Task:** Bổ sung `OPENSVG_FEATURE_ENGINEERING_RULES.md` vào Constitution & Obsidian, triển khai Task 1.3 (Vertex Point Types & Tangents), Task 2.2 (Time Transformation: Scale & Reverse) và Task 2.5 (Copy/Paste Keyframes).

---

## 1. Đồng Bộ Tri Thức & Rules (Obsidian Ingestion)
- **Tài liệu nạp:** `OPENSVG_FEATURE_ENGINEERING_RULES.md` (Quy chuẩn kỹ thuật chuyên biệt cho 7 Epics).
- **Obsidian Sync:**
  - Đồng bộ thành công note: `00-SYSTEMS/Architecture/OpenSVG Feature Engineering Rules.md` qua Local REST API (Port 27124).
  - Cập nhật liên kết trong `04-MOC/Master_Knowledge_Graph_MOC.md`.

---

## 2. Triển Khai Kỹ Thuật (Engineering Implementations)

### A. Task 1.3: Geometric Vector Vertex Engine (Rules G4 & G5)
- **File mới:** `src/engine/geometry.ts`
- **Kiến trúc:**
  - Xử lý ba trạng thái đỉnh `Corner`, `Smooth`, `Asymmetric` tuân theo chuẩn W3C SVG và Rule G4.
  - `updateVertexTangent`: Đảm bảo tính liên tục của góc tiếp tuyến ($180^\circ$ collinearity) khi kéo control point ở chế độ Smooth (đối xứng độ dài) và Asymmetric (độ dài độc lập).
  - `setVertexPointType`: Chuyển đổi trạng thái đỉnh an toàn, xóa hoặc khởi tạo control handles chuẩn xác.

### B. Task 2.2: Timeline Time Transformation Engine (Rules T1, T2, T3, T7)
- **File mới:** `src/engine/timelineOps.ts`
- **Kiến trúc:**
  - `scaleKeyframes`: Thu phóng tốc độ chuyển động quanh timestamp neo (0.5x tăng tốc, 2.0x giảm tốc) trong một transaction duy nhất.
  - `reverseKeyframes`: Đảo ngược thời gian và **nghịch đảo đường cong Bezier cubic** $((1-x_2, 1-y_2, 1-x_1, 1-y_1))$ theo chuẩn toán học (Rule T3).

### C. Task 2.5: Capability-Resolved Keyframe Clipboard (Rules T8 & T9)
- **File:** `src/engine/timelineOps.ts`, `src/store/useStudioStore.ts`, `src/components/workspace/TimelineControls.tsx`
- **Kiến trúc:**
  - `createKeyframeClipboard`: Sao chép keyframe được chọn theo mốc thời gian tương đối.
  - `pasteKeyframesToNode`: Sinh ID mới (Rule T8) và kiểm tra độ tương thích thuộc tính với target node (Rule T9), tránh làm hỏng document.
  - Thêm nút bấm **Reverse**, **0.5x**, **2x**, **Copy**, **Paste** trực tiếp trên Timeline Controls.

---

## 3. Kiểm Chứng & Test Coverage
- Bổ sung Test Suites:
  - `src/engine/__tests__/geometry.test.ts` (5 tests)
  - `src/engine/__tests__/timelineOps.test.ts` (5 tests)
- Kết quả kiểm thử: **26/26 Test Suites Passed (101/101 Tests Passed)**
- Kết quả Build: `tsc && vite build` **Success (0 errors, 6.97s)**.
