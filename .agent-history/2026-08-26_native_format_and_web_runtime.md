# Technical Changelog — Native OpenSVG Document Format (.osvg), Web Runtime & Killer Workflow

**Date:** 2026-08-26  
**Author:** AI Agent (Antigravity)  
**Milestone:** Native Format + Portable Interactive Web Runtime (P1 Strategic Pillars 1, 2 & 3)  
**Reference:** `OPENSVG_CURRENT_STRATEGIC_ROADMAP.md`

---

## 1. Các Cải Tiến Kỹ Thuật Đã Triển Khai

### 1.1 Định Dạng Tài Liệu Thuần OpenSVG (`.osvg`) (P1 Pillar 1)
- **Module `src/engine/format/`:**
  - `nativeDocument.ts`: Định nghĩa canonical schema cho tài liệu `.osvg` chuẩn (format `opensvg`, `schemaVersion: 2.0.0`, metadata, scene config, nodes, state machines, components, data bindings, constraints, asset manifest).
  - `documentParser.ts`: Hỗ trợ đầy đủ `validateDocument()`, `serializeDocument()`, `parseDocument()`, `convertProjectToNativeDocument()`, `convertNativeDocumentToProject()`.
  - Tách biệt 100% tài liệu persisted khỏi editor UI states (zoom, selected keys, dock layout).

### 1.2 Interactive SVG Web Runtime (`src/engine/webRuntime/`) (P1 Pillar 2)
- **Module `src/engine/webRuntime/openSVGWebRuntime.ts`:**
  - Runtime nhúng độc lập DOM/React, mount trực tiếp vào canvas HTML5.
  - Tích hợp requestAnimationFrame loop, tự động điều khiển `RuntimeClock` và State Machine.
  - Hỗ trợ đầy đủ Event Interaction: pointerdown, pointerup, pointermove, pointerleave, click với hit test theo tọa độ scene.
  - Cung cấp API trực quan cho developers:
    - `setBoolean(name, val)`
    - `setNumber(name, val)`
    - `fireTrigger(name)`
    - `setState(layer, state)`
    - `setProperty(nodeId, prop, val)`
    - `play()`, `pause()`, `togglePlay()`, `seek(t)`, `reset()`.

### 1.3 Developer Consumption Adapters (P1 & P2)
- **React Adapter (`src/engine/adapters/react/OpenSVGPlayer.tsx`):**
  - Component `<OpenSVGPlayer src={doc} state={...} inputs={...} />` cho phép nhúng animation theo mô hình declarative props.
- **Web Component Adapter (`src/engine/adapters/webComponent/openSVGElement.ts`):**
  - Custom Element `<opensvg-animation src="button.osvg"></opensvg-animation>` tự động đăng ký trong môi trường trình duyệt.

### 1.4 Killer Workflow Interactive Button Template (P1 Pillar 3)
- **Module `src/engine/templates/interactiveButtonTemplate.ts`:**
  - Cung cấp mẫu tài liệu chuẩn cho Smart Interactive Button với 5 trạng thái: `idle` $\rightarrow$ `hover` $\rightarrow$ `pressed` $\rightarrow$ `loading` $\rightarrow$ `success`.
  - Tích hợp spring physics, transition condition rules và layer evaluation.

---

## 2. Kết Quả Kiểm Thử (Empirical Runtime Evidence)
- **Unit & Integration Tests:** `vitest run` $\rightarrow$ **56 Test Suites (191 Unit Tests) 100% GREEN**.
  - Kiểm thử validation, serialize/parse round-trip của `.osvg`.
  - Kiểm thử Web Runtime headless playback và state input updates.
  - Kiểm thử Killer Workflow Button Template trong Web Runtime.
- **Production Build:** `tsc && vite build` $\rightarrow$ **Clean build 0 errors** (8.49s).
