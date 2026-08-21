# Technical Changelog: Flexible Dockable Workspace System

**Task**: Xây dựng & Tối ưu hoá toàn diện hệ thống Flexible Workspace, Dockable Panels, Pointer Drag Engine và Responsive Splitter Scaling.
**Timestamp**: 2026-08-22T01:04:00+07:00

---

## 1. Các thay đổi Kiến trúc & Mã nguồn

### A. Pointer-Based Drag & Dock Engine (`useWorkspaceDrag.ts`)
- Thay thế hoàn toàn HTML5 Native Drag bằng **Pointer Event Tracking Loop** trực tiếp trên `window`.
- **Click Threshold Check (4px)**: Nhấn nhả chuột nhẹ sẽ kích hoạt chuyển Tab ngay lập tức. Kéo $>4\text{px}$ mới chuyển sang chế độ Docking.
- **Dynamic Hit-Testing (`document.querySelectorAll('.dock-container')`)**: Tự động tính toán toạ độ tương đối trên container mục tiêu:
  - $22\% \le \text{relY} \le 78\%$ và $22\% \le \text{relX} \le 78\% \implies \text{Tab Stack}$
  - $\text{relY} < 22\% \implies \text{Split Top}$
  - $\text{relY} > 78\% \implies \text{Split Bottom}$
  - $\text{relX} < 22\% \implies \text{Split Left}$
  - $\text{relX} > 78\% \implies \text{Split Right}$
- **Floating Ghost Badge & Glowing Blue Snap Overlay**: Huy hiệu mờ bám theo con trỏ chuột 60fps và khung xem trước vị trí bắt dính bán trong suốt phát sáng với la bàn chỉ hướng 5 điểm.

### B. Splitter Incremental Resizing (`Splitter.tsx`)
- Khắc phục lỗi trừ dồn độ dịch chuyển (`deltaY = moveEv.clientY - startY`) khiến thanh trượt nhảy vọt xuống đáy.
- Chuyển sang **Incremental Step Tracking (`stepDelta = moveEv.clientY - lastY`)**: Chuột dịch chuyển đúng 1px thì thanh trượt co giãn đúng 1px.
- Bổ sung khả năng điều khiển bằng bàn phím (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Shift` để tăng tốc độ) và ARIA separator roles (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`).

### C. Floating Tile Zero-Clipping & Multi-Tier Column Splitting (`WorkspaceLayout.tsx`, `DockContainer.tsx`)
- Khắc phục lỗi mất góc bo tròn ở đáy Sidebar: Loại bỏ `m-2` trên các phần tử có `h-full`, chuyển sang **Flexbox Gap System (`gap-1.5` & `p-2`)**.
- Thêm `min-h-0` xuyên suốt cây layout để khi Timeline mở rộng lên trên, các Sidebar phía trên tự động co ngắn lại nhịp nhàng mà không bị che đè hay mất 4 góc bo tròn `rounded-2xl`.
- Hỗ trợ chia tầng đa container trong cùng một cột với thanh trượt điều chỉnh tỷ lệ phần trăm độc lập (`resizeContainerInColumn`).

---

## 2. Minh chứng Kiểm thử & Độ tin cậy (Empirical Runtime Evidence)

1. **Vitest Unit Tests**: `86/86` tests pass 100% (23 test suites).
2. **Production Build**: `npm run build` biên dịch sạch sẽ không có lỗi TypeScript hay Vite.
3. **CDP Automation Verification**:
   - Ghép tab `Hierarchy & Layers` vào `Inspector & Properties` (`mouse_drag_after_drop.png`).
   - Chia đôi cột trái thành 2 tầng panel trên-dưới (`mouse_drag_split_after.png`).
   - Kéo Timeline lên 150px: Các cột co lại đồng bộ với 4 góc bo tròn `rounded-2xl` nguyên vẹn (`splitter_drag_up_smooth.png`).
   - Kéo thanh trượt hạ Timeline xuống 80px mượt mà (`splitter_drag_smooth.png`).
   - Bố cục 4 góc bo tròn Floating Tile độc lập hoàn hảo (`perfect_rounded_corners.png`).
