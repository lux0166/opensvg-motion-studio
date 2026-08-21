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

### 15. Task B1: Vector Motion Path & Auto-Orientation (`feat/motion-path`)
- **Engine**: Implemented `evaluateMotionPath` and `evaluateCubicSegment` in `src/engine/motionPath.ts` calculating arc-length positions and tangent derivative vectors \(B'(u)\) with angle \(\theta = \text{atan2}(dy, dx)\).
- **Evaluator**: Updated `evaluateNode` to link with target vector path layers and auto-rotate when `autoOrient: true`.
- **UI**: Added "Motion Path & Trajectory" section in `src/components/PropertiesPanel.tsx`.
- **Tests**: `src/engine/__tests__/motionPath.test.ts` (4/4 passing).

### 16. Task B2: Color Palette Generator & Eyedropper Tool (`feat/palette-eyedropper`)
- **Engine**: Created `src/engine/colorHarmony.ts` implementing pure mathematical color transformations (Complementary, Analogous, Triadic, Tetradic, Monochromatic).
- **Eyedropper**: Integrated screen color sampling with native `EyeDropper` API.
- **UI**: Added "Color Harmonies" palette section in `src/components/PropertiesPanel.tsx`.
- **Tests**: `src/engine/__tests__/colorHarmony.test.ts` (3/3 passing).

### 17. Task B3: Timeline Markers & Audio Beat Detection (`feat/timeline-markers-beat`)
- **Engine**: Built `detectAudioBeats` in `src/engine/audioEngine.ts` using sliding-window RMS energy spike thresholding.
- **Timeline**: Rendered interactive marker flags on the Timeline Ruler, added "Add Marker (M)" toolbar button, and "Beats" auto-generation in the audio track header.
- **Tests**: `src/engine/__tests__/markers.test.ts` (3/3 passing).

### 18. Task: Rive-Style Multi-Document Browser Tab System (`feat/browser-tabs-system`)
- **Data Model**: Added `DocumentTab` in `src/engine/types.ts` encapsulating Scene Graph (`rootFrame`, `nodes`, `nodeOrder`), History Stacks (`past`, `future`), Viewport State (`zoom`, `panX`, `panY`, `currentTime`, `selectedId`), and Extras (`audioTrack`, `markers`).
- **Store Core**: Implemented `openNewTab`, `closeTab`, `switchTab`, `renameTab`, `duplicateTab`, `reorderTabs`, `closeOtherTabs`, `closeTabsToRight` in `src/store/useStudioStore.ts` with automatic state freezing & hydrating on tab transitions.
- **UI Component**: Created `src/components/TabBar.tsx` featuring macOS window dots, OpenSVG branding, scrollable tabs with active state elevation, inline double-click rename, duplicate, close, and `+` new tab button.
- **Keyboard Shortcuts**: Added `Ctrl+T` (New Tab), `Ctrl+W` (Close Tab), `Ctrl+Tab` / `Ctrl+Shift+Tab` (Switch Tabs), `Ctrl+1..9` (Direct Tab Jump) in `src/hooks/useStudioShortcuts.ts`.
- **Tests**: `src/engine/__tests__/tabs.test.ts` (9/9 passing, total 72/72 tests passing).

### 19. Task: Tab-Browser UI Harmonization & Rive-Style Context Menu (`feat/tab-bar-light-harmonization`)
- **Design Alignment**: Completely removed the dark `#121316` bar; harmonized `TabBar.tsx` with OpenSVG Studio's light design system (`bg-slate-100/90`, elevated white active cards, blue indicator dot `bg-blue-500`, subtle borders).
- **Rive Feature Parity**:
  - Double-click inline renaming (`<input>` with blue focus ring).
  - Right-click Context Menu (`onContextMenu`) with Rename, Duplicate, Close Tab, Close Other Tabs, Close Tabs to Right.
  - Quick-action buttons (Duplicate & Close) with keyboard `group-focus-within` and accessible ARIA attributes (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-label`).
  - Active artboard resolution & FPS indicator (`rootFrame.width × rootFrame.height • fps FPS`).
- **Store Engine**: Added `closeOtherTabs` and `closeTabsToRight` methods in `src/store/useStudioStore.ts`.
- **Tests & Verification**: `src/engine/__tests__/tabs.test.ts` (11/11 passing, 100% test matrix passing across 21 test files, 74 tests). Production build (`npm run build`) succeeded in 8.13s.

### 20. Task: UI Decluttering & Red-Circle Elements Removal (`refactor/ui-declutter`)
- **macOS Window Dots**: Removed decorative traffic dots from `TabBar.tsx` for a clean, minimalist tab-strip header.
- **Desktop Studio Badge**: Removed the redundant badge next to the `OpenSVG` logo in `Header.tsx`.
- **Toast Notifications**: Removed automatic spammy toast notifications on tab actions (`openNewTab`, `closeTab`, `duplicateTab`, etc.) and the startup toast in `App.tsx`; modernized toast styling to sleek light glassmorphism (`bg-white/95 text-slate-800 border-slate-200`).
- **Build Verification**: `npm test` passed (74/74 unit tests), `npm run build` succeeded in 7.78s with 0 errors.

### 21. Task: Drag-and-Drop Tab Reordering & Tab Visual Sizing / Contrast Upgrade (`feat/tab-dnd-and-contrast`)
- **Drag & Drop Engine**: Implemented native HTML5 Drag and Drop (`draggable={!isEditing}`, `handleDragStart`, `handleDragOver`, `handleDrop`, `handleDragEnd`) with live blue vertical insertion marker (`w-1 bg-blue-600 rounded-full animate-pulse`) appearing dynamically on left or right edge based on cursor midpoint calculation.
- **Tab Size & Geometry Alignment**: Increased Tab height from `30px` (`h-7.5`) to `36px` (`h-9`) matching the OpenSVG brand button and center tools pill for a uniform visual baseline.
- **High-Contrast Surface Colors**:
  - **Active Tab**: Elevated solid white card (`bg-white border-slate-300 shadow-xs ring-1 ring-black/5`), bold text (`text-slate-900 font-semibold text-xs`), and pulsating blue dot (`w-2 h-2 rounded-full bg-blue-600 shadow-xs ring-2 ring-blue-100`).
  - **Inactive Tabs**: Defined container pills (`bg-slate-100/80 hover:bg-slate-200/70 border-slate-200/90 hover:border-slate-300`), crisp text (`text-slate-600 hover:text-slate-900 font-medium text-xs`), and soft gray indicator dots.
  - **New Tab Button (`+`)**: Upgraded to 36px pill (`h-9 px-3 rounded-2xl bg-white/80 border-slate-200 hover:border-blue-300 hover:bg-white text-slate-600 hover:text-blue-600 shadow-2xs`).
- **Build & Verification**: 74/74 unit tests passing in Vitest across 21 test suites; production build (`tsc && vite build`) passing cleanly.

### 23. Task: Animated Dark Mode with Circular Reveal Sweep & Dynamic Glow Hover Effects (`feat/animated-dark-mode`)
- **Obsidian Knowledge Graph Retrieval**: Retrieved knowledge entities (`[[Circular Reveal Theme Switcher]]`, `[[380ms Corner Sweep]]`, `[[Zero-Flicker View Transitions]]`, `[[Synchronous Dark Mode]]`, `[[Color System]]`) from Obsidian vault.
- **View Transitions Circular Reveal Architecture**:
  - Implemented `toggleThemeWithAnimation(event)` in `src/hooks/useThemeSwitcher.ts` using `document.startViewTransition`.
  - Calculates radial sweep geometry `Math.hypot(...) + 150` with `380ms cubic-bezier(0.4, 0, 0.2, 1)` easing.
  - Added zero-flicker CSS pseudo-element rules in `src/theme/theme.css` (`::view-transition-old(root)`, `::view-transition-new(root)` with z-index ordering and `mix-blend-mode: normal`).
- **Dynamic Theme Switcher Micro-Interactions & Hover Effects**:
  - Added interactive Theme Toggle button in `Header.tsx` with smooth scale elevation (`hover:scale-105 active:scale-95`).
  - **Dark Mode Hover State**: Sun icon smoothly rotates `+90deg`, scales to `1.15x` with warm amber glow drop-shadow (`drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]`) and amber accent border halo.
  - **Light Mode Hover State**: Moon icon smoothly tilts `-20deg`, scales to `1.15x` with indigo glow drop-shadow (`drop-shadow-[0_0_6px_rgba(99,102,241,0.4)]`) and blue accent border.
- **100% Studio Surface Theming (Zero Bright Spots)**:
  - Configured `darkMode: 'class'` and CSS variable design tokens (`--app-bg: #090a0f`, `--app-surface: #12131a`, `--app-border: #232634`, `--app-card-bg: #161822`) in `tailwind.config.js`, `theme.css`, and `theme-config.ts`.
  - Applied dark mode classes across all panels and components: `Header.tsx` (brand, tabs, search, context menu), `LayersPanel.tsx` (accessible button semantics, high contrast icons), `Canvas.tsx` (artboard viewport, zoom widget), `PropertiesPanel.tsx` (transforms, typography, gradients, color harmonies, effects, state machine), `Timeline.tsx` (controls bar, time scrubber, track rows, keyframe diamonds, waveform box, Graph Editor Bézier canvas), `ExportModal.tsx`, and `App.tsx`.
- **Empirical Runtime Evidence & Verification**:
  - `npm test`: 74/74 unit tests passed across 21 test suites.
  - `npm run build`: Production build succeeded in 8.13s with 0 errors.
  - Automated CDP visual capture: Verified both Light Mode and Dark Mode rendering (`studio_dark_mode.png`, `studio_light_mode.png`, `studio_hover_dark.png`, `studio_hover_light.png`) confirming 100% surface coverage and zero bright spots.


