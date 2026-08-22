# Technical Changelog: Toolbar Interactive Tools & Project Settings Modal

**Date:** 2026-08-22
**Author:** Antigravity AI Agent
**Scope:** Top Floating Toolbar, Interactive Canvas Tools, Keyboard Hotkeys, Project Settings Modal

---

## 1. Summary of Changes

1. **New Component - Project Settings Modal (`src/components/ProjectSettingsModal.tsx`):**
   - Implemented dedicated Settings modal accessible via toolbar gear button and store state `isSettingsOpen`.
   - Resolution presets (800x600, 1920x1080 FHD, 1080x1080 Square, 1080x1920 Story, 1200x630 Banner).
   - Custom canvas width / height numeric pixel inputs.
   - Framerate selector (24, 30, 60, 120 FPS) and duration timer (seconds).
   - Stage background color picker and composition naming.

2. **Interactive Canvas Tools Integration (`src/components/Canvas.tsx`):**
   - **Shape & Frame Drag-to-Draw (`initShapeDraw`):** Real-time bounding marquee preview on drag for Rectangle (R), Circle/Oval (O), Star (S), and Frame (F). On release, instantiates layer with precise dimensions and default animation tracks.
   - **Pivot Point Tool (`initPivotDrag`):** Direct visual repositioning of normalized `(pivotX, pivotY)` crosshair on selected layer.
   - **Zoom Tool (Z):** Click to zoom in, Alt+Click to zoom out.
   - **Hand Tool (H):** Direct viewport panning.
   - **Pen Tool (P):** Enhanced anchor point placement, bezier handle dragging, and auto-closing path when clicking close to origin vertex.
   - **Text Tool (T):** Instant creation at click coordinate with live in-place input editing.

3. **Top Floating Toolbar (`src/components/Header.tsx`):**
   - Active tool highlight pills with clear keyboard shortcut indicators.
   - Enhanced Shapes dropdown supporting tool selection for canvas drag-drawing or 1-click center insertion.
   - Added Hand and Pivot tool buttons to floating bar.

4. **Global Shortcut Management (`src/hooks/useStudioShortcuts.ts`):**
   - Mapped V (Select), A (Direct Select), F (Frame), P (Pen), R (Rect), O (Circle), S (Star), T (Text), Y (Pivot), H (Hand), Z (Zoom).

5. **Store Support (`src/store/useStudioStore.ts`):**
   - Added `setFps` action and wired up `isSettingsOpen` state.

---

## 2. Verification & Test Metrics

- **Vitest Unit Test Suite:** 49/49 test files passed (162/162 unit tests green).
- **TypeScript & Vite Production Build:** `tsc && vite build` clean in 10.51s (0 errors).
- **Obsidian Graph Sync:** Synced to `00-SYSTEMS/Architecture/Toolbar Features and Interactive Canvas Tools.md` (Status 204).
