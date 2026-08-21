# OpenSVG Motion Studio

> Professional Desktop Vector Animation & Motion Design Studio (inspired by Rive, Figma Motion, and After Effects).

Built with **Tauri v2 + Rust + React 19 + TypeScript + Vite + Tailwind CSS**.

---

## Core Architecture & Capabilities

- **Infinite Vector Canvas**: Pan & Zoom workspace, Smart Snapping Guides, 8-point Bounding Box Transform.
- **Vector Pen & Shape Engine**: Bezier curve drawing, Anchor Point manipulation, Sub-pixel precision vector rendering.
- **Multi-Track Timeline**: Keyframe timeline with Dopesheet tracking Position, Rotation, Scale, Fill, Stroke, Opacity, Corner Radius.
- **Bezier Graph Curve Editor**: Interactive velocity & easing curves with draggable tangent handles (like Rive / After Effects).
- **Multi-Format Export**:
  - Bodymovin / Lottie JSON format (.json)
  - Standalone Animated SVG (.svg) with embedded CSS @keyframes
  - 60 FPS WebM / MP4 Video recording
  - React Motion component code

---

## Architecture & Constitution

Dự án tuân thủ nghiêm ngặt **[OpenSVG Motion Studio — Architecture Constitution (137 Rules & Swarm Governance)](./CONSTITUTION.md)**.
- `src/engine/`: Pure Domain Layer (Geometry, Evaluator, Physics, Exporter/Importer).
- `src/store/`: Orchestration State Boundary.
- `src/components/`: Pure UI Projection.

---

## Phased Task Roadmap

- [x] **Task 0**: Project Specification & Interactive HTML Prototype.
- [x] **Task 1**: Desktop App Foundation (Tauri v2 + Rust backend + React 19 + TypeScript + Studio Theme).
- [x] **Task 2**: Vector Scene Graph & High-DPI Canvas Renderer (FrameNode, ShapeNode, PathNode, TextNode).
- [x] **Task 3**: Infinite Canvas Direct Interaction (Pan/Zoom, Multi-select, Transform Box, Snapping Guides).
- [x] **Task 4**: Vector Pen Tool & Bezier Path Editing (Anchor Points & Tangent Control).
- [x] **Task 5**: Multi-Track Timeline & Dopesheet Engine (60fps Keyframe Interpolation).
- [x] **Task 6**: Graph Curve Velocity Editor (Interactive Bezier Tangent Handles & Spring Physics).
- [x] **Task 7**: Precision Properties Inspector & Layers Hierarchy Tree.
- [x] **Task 8**: Multi-Format Export Engine (Lottie JSON, Animated SVG, 60fps MP4/WebM Video).
- [x] **Task 9**: Native Desktop Packaging, History Undo/Redo & Shortcuts Matrix.
- [x] **Task 10**: Advanced Visual Effects (Drop Shadow & Gaussian Layer Blur).
- [x] **Task 11**: Vector Path Boolean Operations & Interactive State Machine.

---

## Development Setup

```bash
# Install dependencies
npm install

# Run frontend in web mode
npm run dev

# Run desktop application via Tauri v2
npm run tauri dev
```
