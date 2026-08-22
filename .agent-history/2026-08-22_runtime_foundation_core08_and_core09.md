# Technical Changelog — Runtime Foundation (CORE-08 Component System & CORE-09 Data Binding)

**Timestamp:** 2026-08-22  
**Specification Reference:** `CORE_ENGINE_DEPTH.md` (Section 10 & 11) & `RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md` (CORE-08 & CORE-09)  
**Target Milestone:** Core Engine Depth & Runtime Foundation v1 (CORE-08 & CORE-09)

---

## 1. Triển Khai Kỹ Thuật (Engineering Implementations)

### A. CORE-08: Component / Instance System
- **File mới:** `src/engine/components/componentSystem.ts`
- **Kiến trúc:**
  - `ComponentRegistry`: Quản lý danh mục `ComponentDefinition` định nghĩa cây node gốc, thuộc tính public và giá trị mặc định.
  - `instantiate`: Khởi tạo `ComponentInstance` với vị trí và các giá trị đè (Overrides) riêng biệt.
  - `resolveInstance`: Tự động giải quyết kế thừa — các thay đổi trên master component definition được tự động truyền xuống toàn bộ instances, đồng thời giữ nguyên vẹn các thuộc tính đã bị override cục bộ.

### B. CORE-09: Data Binding Engine v1
- **File mới:** `src/engine/binding/dataBinding.ts`
- **Kiến trúc:**
  - `DataBindingEngine`: Khung đánh giá dữ liệu thuần khiết độc lập với React.
  - Hỗ trợ các kiểu dữ liệu: `boolean`, `number`, `string`, `color`, `enum`, `trigger`.
  - Hỗ trợ hàm chuyển đổi (`converter`) tùy biến khi ánh xạ giá trị nguồn (`sourcePath`) sang thuộc tính node đích (`targetNodeId`, `targetProperty`).

---

## 2. Kiểm Chứng & Test Coverage (Empirical Evidence)
- Bổ sung 2 Test Suites mới:
  - `src/engine/components/__tests__/componentSystem.test.ts` (2 tests)
  - `src/engine/binding/__tests__/dataBinding.test.ts` (2 tests)
- Kết quả kiểm thử: **44/44 Test Suites Passed (149/149 Unit Tests Passed - 100% Green)**
- Kết quả Build: `tsc && vite build` **Success (0 errors, 7.85s)**.
