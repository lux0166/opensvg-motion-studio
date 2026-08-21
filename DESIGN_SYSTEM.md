# OpenSVG Studio - Design System & Component Anatomy Specification

> **Guiding Principle**: Tất cả các màn hình, popup, drawer, và component trong ứng dụng BẮT BUỘC phải tuân thủ nghiêm ngặt 100% DNA thiết kế từ bản chuẩn ban đầu (`code.html`).

---

## 1. Bảng màu chuẩn (Color Palette)

| Token | Giá trị Hex | Ứng dụng |
| :--- | :--- | :--- |
| `app-bg` | `#f1f2f5` | Nền ứng dụng chính, vùng bao ngoài |
| `app-surface` | `#ffffff` | Nền Sidebar, Toolbar, Window, Modal, Card |
| `app-card-bg` | `#fafafa` | Nền track timeline, preview, placeholder |
| `app-border` | `#e5e7eb` | Viền chính (Border-gray-200) |
| `app-border-subtle` | `#f3f4f6` | Viền phân chia danh sách phụ (Border-gray-100) |
| `app-text` | `#111827` | Màu chữ chính (Tiêu đề, thông số) |
| `app-text-muted` | `#6b7280` | Màu chữ phụ, nhãn thông số (Gray-500) |
| `app-text-placeholder`| `#9ca3af` | Chữ gợi ý, icon vô hiệu hóa (Gray-400) |
| `app-primary` | `#3b82f6` | Màu xanh thương hiệu, nút kích hoạt, thanh Playhead |
| `app-primary-hover` | `#2563eb` | Hover nút chính, trạng thái active |
| `app-primary-light` | `#eff6ff` | Nền item đang chọn (`bg-blue-50 text-blue-600`) |

---

## 2. Quy chuẩn Bo góc (Border Radius) & Độ nổi (Elevation)

- **Vỏ ứng dụng chính**: `rounded-3xl (24px)` với viền mềm `border border-gray-200` và đổ bóng `shadow-soft`.
- **Cụm Toolbar & Thanh điều khiển**: Dạng **Pill bo tròn hoàn toàn (`rounded-full`)**, nền trắng hoặc kính mờ (`bg-white/80 backdrop-blur-md`).
- **Nút công cụ (Tool Button)**: Kích thước cố định `w-9 h-9 rounded-full`, icon cỡ `text-xs (12px)`.
- **Thanh trượt & Input thuộc tính**: `rounded-xl (12px)`, nền `bg-gray-50`, viền `border border-gray-200`.
- **Hàng Layer (Layer Row)**: Bo góc `rounded-lg (8px)` hoặc `rounded-xl (12px)`.

---

## 3. Quy chuẩn Typography

- **Chữ giao diện**: Font `'Inter', sans-serif`, `font-semibold` cho tiêu đề, `font-medium` cho nhãn.
- **Dữ liệu số & Timestamp**: Font `'JetBrains Mono', monospace` cho tọa độ X/Y, góc quay °, kích thước W/H, thời gian `0.00 / 3.00 s`.

---

## 4. Quy chuẩn Tương tác & Phản hồi UI

1. **Active Tool**: Nền `bg-blue-500 text-white shadow-sm`.
2. **Hover Tool**: Nền `hover:bg-white hover:text-gray-900` trên nền xám `bg-gray-100/90`.
3. **Selected Item**: Viền xanh bao quanh (`ring-2 ring-blue-500 ring-offset-2`).
4. **Keyframe Diamond**: Hình vuông xoay 45° (`rotate-45`), chuyển xanh đậm khi được chọn hoặc khi playhead đi qua.
5. **Toast Thông báo**: Nền đen bóng `bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg` góc trên bên phải.
