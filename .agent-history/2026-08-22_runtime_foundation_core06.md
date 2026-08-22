# Technical Changelog — Runtime Foundation (CORE-06 State Machine Runtime v2)

**Timestamp:** 2026-08-22  
**Specification Reference:** `CORE_ENGINE_DEPTH.md` (Section 8) & `RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md` (CORE-06)  
**Target Milestone:** Core Engine Depth & Runtime Foundation v1 (CORE-06)

---

## 1. Triển Khai Kỹ Thuật (Engineering Implementations)

### A. CORE-06: State Machine Runtime v2
- **File mới:** `src/engine/stateMachine/runtimeStateMachine.ts`
- **Kiến trúc:**
  - Định nghĩa mô hình Runtime hoàn chỉnh:
    - **Inputs:** `BooleanInput`, `NumberInput` (kèm min/max bounds clamp), `TriggerInput` (auto-reset sau frame đánh giá).
    - **States:** `entry`, `exit`, `animation`, `blend`, `any`.
    - **Transitions & Conditions:** Đánh giá các toán tử so sánh (`==`, `!=`, `>`, `<`, `>=`, `<=`, `fired`) và hòa trộn thời gian chuyển trạng thái (`transitionProgress` $0.0 	o 1.0$).
    - **Layers:** Độc lập nhiều layer hoạt ảnh đồng thời.
    - **Replay Determinism:** Ghi nhận chuỗi sự kiện (`ReplayEvent[]`) và phát lại chính xác 100% không suy hao.

---

## 2. Kiểm Chứng & Test Coverage (Empirical Evidence)
- Bổ sung Test Suite mới:
  - `src/engine/stateMachine/__tests__/runtimeStateMachine.test.ts` (5 tests)
- Kết quả kiểm thử: **42/42 Test Suites Passed (145/145 Unit Tests Passed - 100% Green)**
- Kết quả Build: `tsc && vite build` **Success (0 errors, 7.01s)**.
