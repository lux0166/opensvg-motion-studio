# OpenSVG Motion Studio - Detailed Task Breakdown

## Milestone 1: Core Foundation & Desktop Shell
- [x] **Task 1.1**: Initialize Project Config & Dependencies (React 19, TypeScript, Vite, Tailwind CSS, Tauri v2).
- [x] **Task 1.2**: Tauri v2 Desktop Window Configuration (cross-platform app icons, window controls, state persistence).
- [x] **Task 1.3**: Zustand Central Reactive Store with Immer & History (Undo/Redo snapshots).

## Milestone 2: Infinite Vector Canvas & Scene Graph
- [x] **Task 2.1**: Scene Graph Types & Node Tree (FrameNode, RectNode, EllipseNode, StarNode, PathNode, TextNode).
- [x] **Task 2.2**: High-DPI 2D Vector Canvas Renderer with Transform Matrices and Sub-pixel Precision.
- [x] **Task 2.3**: Infinite Canvas Viewport (Smooth Pan with Space/Middle-Click, Zoom with Mouse Wheel / Z).
- [x] **Task 2.4**: Direct Manipulation Bounding Box (8-point resize handles, rotate handle, anchor point center).
- [x] **Task 2.5**: Smart Alignment Guides & Snapping Engine.

## Milestone 3: Vector Pen Tool & Path Editing
- [x] **Task 3.1**: Interactive Pen Tool (Click anchor point, Drag to pull cubic Bezier tangent handles).
- [x] **Task 3.2**: Sub-selection / Direct Selection Tool (A) for moving individual Bezier anchor vertices and tangents.
- [x] **Task 3.3**: Path Boolean Operations & Shape Conversion.

## Milestone 4: Multi-Track Timeline & Dopesheet Engine
- [x] **Task 4.1**: Multi-track property timeline (Position X/Y, Size W/H, Rotation, Scale, Fill, Stroke, Opacity, Radius).
- [x] **Task 4.2**: 60fps / 120fps Animation Loop with Delta-time & Cubic Bezier Keyframe Interpolation.
- [x] **Task 4.3**: Interactive Scrubber Playhead, Timeline Ruler, Diamond Keyframe Editing (Drag to move, select, delete).
- [x] **Task 4.4**: Playback Toolbar (Play/Pause, Step Frame, Loop, Ping-pong, FPS selector, Duration).

## Milestone 5: Graph Curve Velocity / Easing Editor (Rive / AE standard)
- [x] **Task 5.1**: Dual-Mode Timeline Switcher (Dopesheet Mode <-> Graph / Curve Editor Mode).
- [x] **Task 5.2**: Bezier Curve Graph Visualizer (Value vs Time trajectory curves).
- [x] **Task 5.3**: Interactive Tangent Control Handles (P1 and P2 cubic bezier velocity handles with drag & drop).
- [x] **Task 5.4**: Easing Presets (Linear, Ease In, Ease Out, Ease In Out, Elastic, Back, Bounce).

## Milestone 6: Precision Properties Inspector & Layer Hierarchy
- [x] **Task 6.1**: Hierarchical Layers Tree (Drag-to-reorder, Parent/Child nesting, Rename, Eye Visibility, Lock).
- [x] **Task 6.2**: Inspector Alignments, Transform Matrix, Corner Radius, Opacity, Blend Modes.
- [x] **Task 6.3**: Advanced Fill & Stroke System (Solid, Linear Gradient, Radial Gradient, Stroke Dash/Cap/Join).
- [x] **Task 6.4**: Drop Shadow & Gaussian Blur Effects.

## Milestone 7: Multi-Format Exporter & Production Packaging
- [x] **Task 7.1**: Bodymovin / Lottie JSON format (.json) Exporter.
- [x] **Task 7.2**: Standalone Animated SVG (.svg) Exporter with CSS @keyframes.
- [x] **Task 7.3**: 60 FPS WebM / MP4 Video Recording via Canvas Stream.
- [x] **Task 7.4**: Project File (.kinetic / .json) Save & Load via native file dialogs.
- [x] **Task 7.5**: Windows Desktop .exe Release Build via Tauri CLI.
