# Technical Changelog — Comprehensive Engine Hardening Across All 7 Epics

**Timestamp:** 2026-08-22  
**Task:** Hoàn thiện toàn diện các engine cốt lõi cho OpenSVG Motion Studio theo đúng chuẩn `OPENSVG_FEATURE_ENGINEERING_RULES.md`.

---

## 1. Triển Khai Kỹ Thuật (Engineering Implementations)

### A. Epic 1: Pen Ephemeral Preview & Tangent Snapping (Rules G6, G7, G8)
- **File mới:** `src/engine/penPreview.ts`
- **Kiến trúc:**
  - `computePenPreview`: Tính toán hình học xem trước tạm thời khi rê chuột (Ephemeral PointerMove), không làm thay đổi Canonical Document cho đến khi user nhấn click/commit.
  - `snapAngleToCardinal`: Tự động hít góc tiếp tuyến vào các góc chuẩn $0^circ, 45^circ, 90^circ, 135^circ, 180^circ$ khi giữ Shift.
  - Tự động phát hiện đóng đường cong khép kín (path closing) khi hover gần điểm đầu tiên.

### B. Epic 2: Velocity Graph Derivative & Speed Curve Overlay (Rules T6 & T10)
- **File mới:** `src/engine/velocityGraph.ts`
- **Kiến trúc:**
  - `computeVelocityCurve`: Tính toán đạo hàm vận tốc $v(t) = \frac{d}{dt} p(t)$ bằng công thức sai phân trung tâm (Central Difference) qua animation tracks cho Graph Editor.

### C. Epic 3: Layer Masking & Ephemeral Solo Mode (Rules L1, L2, L3, L6)
- **File mới:** `src/engine/maskRenderer.ts`
- **Kiến trúc:**
  - `getRenderableNodes`: Lọc các node hiển thị trong chế độ Solo / Isolation trên Viewport mà **tuyệt đối không mutate** `node.visible` trong Document.
  - `resolveMaskPairs`: Ghép cặp tường minh giữa Mask Layer và Mask Target với hai chế độ `alpha` (destination-in) và `clip` (vector path clipping).

### D. Epic 5: Waveform Visualizer & Beat Marker Snapping (Rules A1, A2, A3, A4)
- **File mới:** `src/engine/waveformRenderer.ts`
- **Kiến trúc:**
  - `renderWaveform`: Vẽ sóng âm thanh độ phân giải cao trên Canvas theo tiến trình Playhead.
  - `snapTimeToBeatMarker`: Tự động hít Playhead vào điểm Beat Marker gần nhất trong ngưỡng $\pm 0.05s$.

### E. Epic 7: Atomic Crash Recovery & Auto-Save (Rules D3, D4, D5)
- **File mới:** `src/engine/crashRecovery.ts`
- **Kiến trúc:**
  - `computeProjectChecksum`: Tính toán mã băm kiểm tra tính toàn vẹn (Integrity Checksum).
  - `createRecoverySnapshot`, `validateRecoverySnapshot`, `loadRecoverySnapshot`: Lưu và khôi phục snapshot dự án an toàn, tự động loại bỏ snapshot bị lỗi/corrupt mà không ghi đè dữ liệu bộ nhớ.

---

## 2. Kiểm Chứng & Test Coverage (Empirical Evidence)
- Bổ sung 5 Test Suites mới:
  - `src/engine/__tests__/penPreview.test.ts` (3 tests)
  - `src/engine/__tests__/velocityGraph.test.ts` (1 test)
  - `src/engine/__tests__/waveformRenderer.test.ts` (1 test)
  - `src/engine/__tests__/crashRecovery.test.ts` (2 tests)
  - `src/engine/__tests__/maskRenderer.test.ts` (2 tests)
- Kết quả kiểm thử: **36/36 Test Suites Passed (125/125 Unit Tests Passed - 100% Green)**
- Kết quả Build: `tsc && vite build` **Success (0 errors, 7.62s)**.
