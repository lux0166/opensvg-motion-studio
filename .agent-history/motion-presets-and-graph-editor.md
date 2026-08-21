# Technical Changelog: Motion Presets Engine & Redesigned Bezier Graph Editor

**Date**: 2026-08-21  
**Version**: 1.1.0  
**Feature**: Motion Presets & Transitions Engine + Interactive Bezier Graph Editor  

---

## 1. Mục tiêu & Tổng quan
1. Xây dựng **Motion Presets Engine** cung cấp 13+ hoạt ảnh 1-click chất lượng cao (Entrance, Emphasis, Exit) với Spring dynamics và Cubic-Bezier curves.
2. Tái cấu trúc toàn diện **Graph Editor** trên Timeline:
   - Thay thế khung vẽ pixel cứng bằng **Responsive SVG Canvas** co giãn theo chiều rộng Timeline.
   - Docked toolbar chuyên nghiệp với 8 Easing Curve Presets (*Linear, Ease, Ease-In, Ease-Out, Ease-In-Out, Back/Pop, Anticipate, Snappy*).
   - Tay nắm tiếp tuyến $P_1, P_2$ tương tác kéo thả mượt mà kèm hỗ trợ phím mũi tên theo chuẩn tiếp cận WCAG AA (role="slider").
3. Tích hợp **Live Easing Curve Inspector** có thể đóng/mở ngay trong **Motion Presets Modal**, cùng nút chuyển nhanh *"Open in Graph Editor"*.

---

## 2. Các thay đổi kỹ thuật chi tiết

### A. Core Motion Engine
* [`src/engine/motionPresets.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/engine/motionPresets.ts):
  - Catalog 13 Presets: `elastic-pop-in`, `slide-fade-up`, `slide-fade-right`, `spin-in-360`, `drop-bounce`, `heartbeat-pulse`, `floating-levitation`, `neon-glow-pulse`, `wiggle-jitter`, `breathing-opacity`, `fade-shrink-out`, `slide-down-exit`, `spin-out-360`.
  - Hàm `applyMotionPresetToNode` tạo ra `PropertyTrack`s chuẩn xác với keyframes được sắp xếp thời gian nghiêm ngặt.
* [`src/engine/__tests__/motionPresets.test.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/engine/__tests__/motionPresets.test.ts):
  - 4 test cases kiểm tra tính toán thời gian, sort keyframes, tùy biến duration/intensity/delay và gắn preset vào node.
* [`src/engine/__tests__/evaluator.test.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/engine/__tests__/evaluator.test.ts):
  - Bổ sung test kiểm tra các đường cong đặc thù: Overshoot / Back curve ($y > 1$) và Anticipation curve ($y < 0$).

### B. UI Components
* [`src/components/BezierCurveGraph.tsx`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/components/BezierCurveGraph.tsx) [NEW]:
  - Component đồ thị Bezier tái sử dụng, responsive SVG canvas với lưới tọa độ, trục giá trị và thời gian.
  - Tangent Handles P1 & P2 có thể kéo thả bằng chuột hoặc điều khiển bằng phím mũi tên (`ArrowLeft/Right/Up/Down`).
  - Thanh chọn Easing Presets docked gọn gàng và bảng công thức `cubic-bezier(...)` thời gian thực.
* [`src/components/Timeline.tsx`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/components/Timeline.tsx):
  - Tích hợp `BezierCurveGraph` vào chế độ `Graph Editor`, loại bỏ thanh presets lơ lửng và khung vẽ SVG cứng 560px cũ.
* [`src/components/MotionPresetsModal.tsx`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/components/MotionPresetsModal.tsx):
  - Modal dạng lưới duyệt preset theo danh mục (*All, Entrance, Emphasis, Exit*) và ô tìm kiếm tức thì.
  - Tích hợp thanh trượt Duration, Intensity, Delay và nút toggle **"📈 Curve Graph"** mở Live Easing Inspector.
  - Nút **"📐 Open in Graph Editor"** ở footer giúp chuyển nhanh sang Timeline Graph.
* [`src/components/PropertiesPanel.tsx`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/components/PropertiesPanel.tsx):
  - Bổ sung mục **✨ Motion Presets** với 4 chip bấm nhanh (*Elastic Pop, Slide Up, Pulse Loop, Hover Float*) và nút *Browse All*.

### C. State Management
* [`src/store/useStudioStore.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/store/useStudioStore.ts):
  - Bổ sung `isPresetsModalOpen`, `setPresetsModalOpen`.
  - Thêm `applyMotionPreset` và `applyMotionPresetToSelection` với `pushDraftSnapshot` hỗ trợ Undo/Redo hoàn chỉnh.

---

## 3. Kết quả Kiểm thử & Build
* **Vitest Unit Tests**: `22 passed (22 test files), 80 passed (80 tests)`
* **Vite Production Build**: `tsc && vite build` hoàn thành thành công trong 7.75s, không có bất kỳ warning/lỗi TypeScript nào.
