# Technical Changelog: Milestone 3 & 5 Vector Pen & Graph Editor Implementation

## Date: 2026-08-21
## Author: lux0166 / Antigravity AI Assistant

### 1. Vector Pen Tool & Direct Selection Tool (Milestone 3)
- Implemented interactive Pen Tool (`P`): Click to place anchor vertices, drag to pull symmetric Bézier control tangents `(cp1x, cp1y)` and `(cp2x, cp2y)`.
- Implemented Direct Select Tool (`A` / `direct-select`): Real-time hit testing of anchor vertices and tangent handles with interactive mouse dragging.
- Added path point editing and rendering in `src/engine/renderer.ts` with custom vertex boxes and light blue tangent lines.

### 2. Interactive Bézier Curve Velocity Graph Editor (Milestone 5)
- Implemented SVG-based Curve Visualizer for active tracks.
- Added interactive `P1` and `P2` cubic Bézier tangent handles draggable on the canvas viewport.
- Added 1-click preset bar: Linear, Ease, Ease In, Ease Out, Ease In-Out, Bounce.
- Added keyframe horizontal drag on the Dopesheet timeline to re-time animations dynamically.

### 3. Direct Manipulation Bounding Box (Milestone 2)
- Added 8-point interactive resize handles (NW, NE, SW, SE, N, S, E, W).
- Added lollipop rotation handle with continuous angle calculation.

### 4. Empirical Build Verification
- `npm run build`: 0 errors, 5.78s build time.
- `cargo check`: 0 errors, 2.83s check time.
- Git Push: Synchronized to `main` at `lux0166/opensvg-motion-studio`.
