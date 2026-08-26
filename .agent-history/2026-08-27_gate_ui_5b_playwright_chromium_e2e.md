# Technical Changelog — GATE UI-5B Real Browser E2E Certification via Playwright & Chromium

**Date:** 2026-08-27  
**Author:** AI Agent (Antigravity)  
**Milestone:** GATE UI-5B Real Browser Chromium E2E Certification  
**Reference:** User Approval to install `@playwright/test` & CI Pipeline Integration

---

## 1. Các Vấn Đề Kỹ Thuật Đã Triển Khai & Kiểm Chứng

### 1.1 🌐 Playwright & Chromium Real Browser Automation Suite
- Đã cấu hình Playwright ([`playwright.config.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/playwright.config.ts)) với timeout, worker, viewport chuẩn (1280x800) và tự khởi động Vite dev server trên `http://127.0.0.1:5173`.
- Suite kiểm thử trình duyệt thực tế ([`e2e/studio.spec.ts`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/e2e/studio.spec.ts)) bao gồm 4 kịch bản E2E quan trọng nhất:
  1. **Studio Launch & Canvas Drawing:** Khởi chạy Chromium thật $\rightarrow$ bấm phím `r` $\rightarrow$ kéo chuột vẽ hình trên `<canvas>` $\rightarrow$ nhận thông báo toast $\rightarrow$ phím `Control+z` (Undo) $\rightarrow$ phím `Control+y` (Redo).
  2. **Timeline Transport Controls:** Bấm nút Play/Pause $\rightarrow$ Step Forward 0.1s $\rightarrow$ Step Back 0.1s $\rightarrow$ Toggle Loop.
  3. **Multi-Tab & Unsaved Changes Confirmation Modal:** Bấm nút `+` tạo tab mới $\rightarrow$ vẽ hình trên tab mới (kích hoạt dirty state) $\rightarrow$ bấm đóng tab $\rightarrow$ modal **Unsaved Changes** xuất hiện $\rightarrow$ bấm Cancel (giữ nguyên tab) $\rightarrow$ bấm đóng lại và chọn Discard (đóng tab sạch sẽ).
  4. **Properties Panel Interaction & Native .osvg Export:** Chọn node trên Canvas $\rightarrow$ bấm "Add Interaction" trong Properties panel $\rightarrow$ mở Export Modal $\rightarrow$ bấm `OpenSVG Native (.osvg)` $\rightarrow$ bắt sự kiện `download` và kiểm tra file `.osvg` được tải về chuẩn xác.

### 1.2 🛠️ Header Layout Collision Prevention
- Sửa layout Header ([`src/components/Header.tsx`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/src/components/Header.tsx)) để ngăn chặn việc Center Tool Floating Pill đè lên Tabbar và nút `+` trên các màn hình kích thước chuẩn 1280px.

### 1.3 🔄 GitHub Actions CI Pipeline Upgrade
- Tích hợp thêm bước `npx playwright install --with-deps chromium` và `npm run test:e2e` vào workflow CI ([`.github/workflows/ci.yml`](file:///c:/Users/Tran%20Huy/Downloads/opensvg-motion-studio/.github/workflows/ci.yml)).

---

## 2. Kết Quả Kiểm Thử Toàn Cục

- **Playwright Chromium E2E:** **4/4 Tests passed (15.7s)**
- **Vitest Unit & Integration:** **74 Test Suites / 255 Tests passed (100% GREEN)**
- **Runtime Certification Suite:** **8 Proof Gates passed**
- **Production Build:** **0 errors (tsc && vite build)**
