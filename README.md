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

## Phased Task Roadmap

- [x] **Task 0**: Project Specification & Interactive HTML Prototype.
- [ ] **Task 1**: Desktop App Foundation (Tauri v2 + Rust backend + React 19 + TypeScript + Dark Studio theme).
- [ ] **Task 2**: Vector Scene Graph & High-DPI Canvas Renderer (FrameNode, ShapeNode, PathNode, TextNode).
- [ ] **Task 3**: Infinite Canvas Direct Interaction (Pan/Zoom, Multi-select, Transform Box, Snapping Guides).
- [ ] **Task 4**: Vector Pen Tool & Bezier Path Editing (Anchor Points & Tangent Control).
- [ ] **Task 5**: Multi-Track Timeline & Dopesheet Engine (60fps Keyframe Interpolation).
- [ ] **Task 6**: Graph Curve Velocity Editor (Interactive Bezier Tangent Handles).
- [ ] **Task 7**: Precision Properties Inspector & Layers Hierarchy Tree.
- [ ] **Task 8**: Multi-Format Export Engine (Lottie JSON, Animated SVG, 60fps MP4/WebM).
- [ ] **Task 9**: Native Desktop Packaging, Shortcuts & Windows Release Build.

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
