# Technical Changelog - OpenSVG Motion Studio

## Sprint Roadmap: 11 Feature Enhancements (Empirically Verified & Tested)

### 1. Task 1: Complete History Engine & Global Shortcuts Matrix (`feat/history-undo-redo`)
- **Engine**: Built snapshot-based time travel in `src/engine/history.ts` with deep cloning and bounded stack capacity.
- **Shortcuts**: Implemented keyboard shortcuts matrix in `src/components/Canvas.tsx` (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+G`, `Ctrl+Shift+G`, `V`, `A`, `R`, `O`, `P`, `T`, `Space`, `Delete`).
- **Tests**: `src/engine/__tests__/history.test.ts` (3/3 passing).

### 2. Task 2: Multi-Selection & Hierarchical Grouping (`feat/multi-select-group`)
- **Canvas Selection**: Added AABB marquee bounding box drag selection and `Shift+Click` multi-selection toggle.
- **Group Hierarchy**: Added `groupSelected()` and `ungroupSelected()` with bounding box calculation and parent-child coordinate preservation.
- **Layers Panel**: Added nested group layer indentation and group expansion toggles.
- **Tests**: `src/engine/__tests__/grouping.test.ts` (3/3 passing).

### 3. Task 3: Interactive Text Tool & Dynamic Typography Engine (`feat/typography-engine`)
- **Text Tool**: Added Text Tool (T) creating text layers on click, and double-click in-place live text `<input>` editing.
- **Properties**: Font family picker (`Inter`, `Space Grotesk`, `Outfit`, `Fira Code`, `Playfair Display`, `Roboto`), font size, font weight, and text alignment.
- **SVG Exporter**: Exported `<text>` nodes with matching CSS font styles.
- **Tests**: `src/engine/__tests__/typography.test.ts` (2/2 passing).

### 4. Task 4: Morphing & Path Tweening / Shape Keyframing (`feat/path-morphing`)
- **Evaluator**: Implemented `interpolatePathPoints` and `interpolateColor` with Newton-Raphson cubic Bézier easing.
- **Tests**: `src/engine/__tests__/morphing.test.ts` (3/3 passing).

### 5. Task 5: Drag-and-Drop SVG File Importer (`feat/svg-file-importer`)
- **Importer**: Universal SVG DOM parser in `src/engine/svgImporter.ts` converting SVG paths (`M`, `L`, `C`, `Z`), `<rect>`, `<circle>`, `<text>` into scene graph nodes.
- **Dropzone**: Drag-and-drop animated overlay on Canvas + File Menu import option.
- **Tests**: `src/engine/__tests__/svgImporter.test.ts` (2/2 passing).

### 6. Task 6: Multi-Keyframe Selection & Staggering Engine (`feat/keyframe-stagger`)
- **Timeline**: Multi-keyframe selection with `Shift+Click`, multi-keyframe dragging, and "Stagger Tracks" cascading keyframe offset action.
- **Tests**: `src/engine/__tests__/stagger.test.ts` (2/2 passing).

### 7. Task 7: Visual Filter Effects (Drop Shadow, Layer Blur) (`feat/filters-drop-shadow`)
- **Rendering & Export**: Canvas 2D `ctx.shadowColor`, `ctx.shadowBlur`, `ctx.filter` and SVG `<feDropShadow>`, `<feGaussianBlur>` `<filter>` definitions.
- **Inspector**: Dedicated Shadow & Blur FX controls with offset and blur sliders.
- **Tests**: `src/engine/__tests__/filters.test.ts` (2/2 passing).

### 8. Task 8: Audio Track Sync & Waveform Timeline (`feat/audio-waveform-sync`)
- **Audio Engine**: Web Audio API waveform peak extractor (`src/engine/audioEngine.ts`).
- **Timeline**: Audio waveform visualization track synchronized with playhead time scrubbing and playback loop.
- **Tests**: `src/engine/__tests__/audio.test.ts` (3/3 passing).

### 9. Task 9: Vector Path Boolean Operations (`feat/vector-boolean-ops`)
- **Boolean Engine**: Implemented `union`, `subtract`, `intersect`, and `exclude` using Monotone Chain Convex Hull and Sutherland-Hodgman clipping (`src/engine/booleanOps.ts`).
- **Inspector**: Boolean compound actions bar appearing when 2+ vector shapes are selected.
- **Tests**: `src/engine/__tests__/booleanOps.test.ts` (5/5 passing).

### 10. Task 10: Spring Physics Motion Engine (`feat/spring-physics`)
- **Physics**: Analytical closed-form damped harmonic oscillator (`src/engine/physics.ts`) with presets (`bouncy`, `snappy`, `wobbly`, `gentle`).
- **Evaluator**: `interpolateNumeric` spring physics motion solver.
- **Tests**: `src/engine/__tests__/physics.test.ts` (2/2 passing).

### 11. Task 11: Interactive State Machine & Trigger Events (`feat/state-machine`)
- **State Machine**: Built `executeTriggerAction` and `handleNodeTriggerEvent` supporting `onClick`, `onHoverEnter`, `jumpToTime`, `togglePlay`, `setProperties`.
- **Canvas & Inspector**: Canvas interactive click triggers and Triggers & Events management in the Properties Inspector.
- **Tests**: `src/engine/__tests__/stateMachine.test.ts` (3/3 passing).

---
**Verification Summary**: 17 test suites, 49 tests passing (100%), 0 build errors.

### 12. Task A1: Keyframe Mutation-Time Normalization & O(log N) Evaluator (`perf/evaluator-binary-search`)
- **Engine**: Implemented `findKeyframeSegment` with \(\mathcal{O}(\log N)\) Binary Search in `src/engine/evaluator.ts`.
- **Optimization**: Completely eliminated runtime `[...track.keyframes].sort(...)` and array allocations from the 60fps/120fps hot evaluation path.
- **Store Normalization**: Ensured all keyframes are sorted upon insertion (`addOrUpdateKeyframe`), time update (`updateKeyframeTime`), stagger (`staggerSelectedKeyframes`), and project load (`loadProject`).
- **Tests**: `src/engine/__tests__/evaluator.test.ts` (9/9 passing, including binary search edge cases and 100-keyframe stress tests).

### 13. Task A2: Full-Fidelity Dynamic Animated SVG & Lottie Exporter (`feat/full-fidelity-exporters`)
- **Engine**: Upgraded `src/engine/exporter.ts` from hardcoded template animation to dynamic keyframe serialization (Constitution Rule 95 & 96 - No Fake Export).
- **SVG Animation**: Generated dynamic CSS `@keyframes` per animated node calculating exact timestamp percentage steps (`(t / duration) * 100%`) for `translate`, `rotate`, `scale`, `opacity`, `fill`.
- **Lottie JSON**: Serialized Bodymovin animated properties (`ks.r.a = 1`, `ks.p.a = 1`, `ks.o.a = 1`, `ks.s.a = 1`) with keyframe time frames (`t: kf.time * fps`).
- **Tests**: `src/engine/__tests__/exporter.test.ts` (3/3 passing).

### 14. Task A3: Document History vs Ephemeral Selection Separation (`refactor/history-document-separation`)
- **Engine**: Refactored `StudioSnapshot` in `src/engine/history.ts` to only track canonical Document Scene Graph (`rootFrame`, `nodes`, `nodeOrder`), excluding ephemeral UI selection state (Constitution Rule 82).
- **Store**: Updated `undo()` and `redo()` in `src/store/useStudioStore.ts` with graceful selection preservation fallback.
- **Tests**: `src/engine/__tests__/history.test.ts` (3/3 passing).
