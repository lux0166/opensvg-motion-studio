# Technical Changelog — Runtime Foundation (CORE-10 Geometry Hardening & CORE-11 Persistence Hardening)

**Timestamp:** 2026-08-22  
**Specification Reference:** `CORE_ENGINE_DEPTH.md` (Section 5 & 12) & `RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md` (CORE-10 & CORE-11)  
**Target Milestone:** Core Engine Depth & Runtime Foundation v1 (CORE-10 & CORE-11)

---

## 1. Triển Khai Kỹ Thuật (Engineering Implementations)

### A. CORE-10: Geometry Hardening Core
- **File mới:** `src/engine/geometry/geometryCore.ts`
- **Kiến trúc:**
  - `evalCubicBezier`: Tính toán toạ độ đường cong Bezier bậc 3 chính xác theo công thức đại số $B(t)$.
  - `computePathMetrics`: Đo chiều dài cung (`totalLength`), tích lũy phân bố mẫu metric độ phân giải cao và tính toán góc tiếp tuyến (`tangent`, `angle`).
  - `samplePointAtDistance`: Tìm kiếm nhị phân $O(\log N)$ lấy toạ độ và vector tiếp tuyến tại khoảng cách $d$ bất kỳ.
  - `flattenPathToPolygon` & `isPointInsidePolygon`: Làm phẳng đường cong và kiểm tra Hit-testing điểm nằm trong đa giác theo quy tắc Ray-Casting Even-Odd.

### B. CORE-11: Persistence Hardening & Schema Versioning
- **File mới:** `src/engine/persistence/schemaMigration.ts`
- **Kiến trúc:**
  - `migrateProjectToLatest`: Chuẩn hóa dữ liệu dự án lên schema `2.0.0`, tự động điền các trường mặc định tương thích ngược (`pivot`, `tracks`, `fillRule`, `maskMode`).
  - `validateProject`: Kiểm tra tính toàn vẹn cấu trúc tài liệu, quan hệ cha-con và tính tuần tự thời gian của Keyframe tracks.
  - `serializeProject`: Đóng gói dự án kèm mã băm Checksum bảo đảm an toàn dữ liệu khi lưu trữ.

---

## 2. Kiểm Chứng & Test Coverage (Empirical Evidence)
- Bổ sung 2 Test Suites mới:
  - `src/engine/geometry/__tests__/geometryCore.test.ts` (3 tests)
  - `src/engine/persistence/__tests__/schemaMigration.test.ts` (3 tests)
- Kết quả kiểm thử: **46/46 Test Suites Passed (155/155 Unit Tests Passed - 100% Green)**
- Kết quả Build: `tsc && vite build` **Success (0 errors, 8.08s)**.
