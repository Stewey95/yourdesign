# Gripix Changelog

All notable changes to the Gripix project are documented in this file based strictly on repository commit history.

## 2026-08-05

- `founder-qa-dynamic-element-bounds`: **Dynamic Element Bounds Completion**: Fixed three regressions Founder QA found in the previous sprint's static selection-bounds fix. (1) *Dynamic bounds*: the prior fix baked each catalog asset's visible bounds into a static `visibleBounds` field computed once at a fixed reference stroke width, so increasing border/stroke width visually grew the artwork's stroke without the selection ring, resize handles, or drag area growing to match. Root cause fixed properly rather than patched: `ElementAsset.geometryBounds` now stores only the asset's pure, stroke-EXCLUDED path geometry (invariant to stroke width by definition - `getBBox()` never includes stroke), and a new shared function `getElementVisibleBounds(geometryBounds, strokeWidth, hasStroke)` inflates it by the item's *current* stroke half-width at render time inside `getElementSvgMarkup`, reading the actual final stroke state back off the substituted markup so it can never drift from what is actually painted. Because item.size (the wrapper) must stay a fixed zoom multiple of the true bounds for the selection ring/handles/drag/rotation pivot to keep matching, `changeShapeStroke`/`changeShapeStrokeWidth` in `EditorPreview.tsx` now rescale `item.size` by that same multiple whenever stroke width or stroke presence changes. `MAX_SHAPE_STROKE_WIDTH` raised from 20 to 40 so the full requested validation range is reachable. (2) *Line minimum size*: `getBoundedImageSize`'s minimum-size clamp constrains the *shorter* dimension, which is correct for photos but forced a naturally-thin Line's width to balloon (~368 units) just so its ~8-unit-tall stroke could clear an 8-unit floor. Added a dedicated `getBoundedElementSize` (constrains the *longer* dimension instead, floor 20 units) used for all Shape/Element sizing (insertion, pinch-resize, corner-drag resize); `getBoundedImageSize` itself is untouched and still used only for Images. (3) *Shared geometry*: the previous sprint's static bounds used two different stroke references depending on catalog `insertion.kind` (a `DEFAULT_SHAPE_STROKE_WIDTH` special case for 7 entries, each asset's own authored stroke width for the other 17); the new dynamic system has exactly one formula applied uniformly to all 24 catalog entries, with no per-kind branching. Verified with a new Playwright suite: border width swept 1px -> 40px with the selection box confirmed to grow and the rendered SVG confirmed to still exactly fill the wrapper, across **every one of the 24 catalog elements**; Line confirmed to insert near its intended footprint (not the old inflated size) and to shrink substantially via corner-drag without ballooning back out; and for the 10 explicitly named elements (Rectangle, Rounded Rectangle, Circle, Triangle, Diamond, Heart, Arrow, Line, Checkmark, Star) resize-to-minimum, resize-to-maximum, rotation-pivot stability, and undo/redo all confirmed correct. 240 passed, 0 failed (8 intentionally skipped - documented WebKit touch-constructor limitation from an earlier sprint) across Desktop Chrome, Desktop Safari, iPhone Safari, and Android Chrome, plus a second confirmation pass against the production build.
- Verified with `npm run lint` (0 errors, 4 pre-existing `<img>` warnings unchanged), `npx tsc --noEmit` (0 errors), `npm run build` (clean production build).

---

## 2026-08-04

- `founder-qa-accurate-selection-bounds`: **Accurate Selection Bounds for SVG Elements**: Selection rings, drag hit areas, and resize handles for catalog Elements (Line, Arrow, Heart, Rectangle, etc.) were sized to each asset's full authoring viewBox (a fixed "0 0 100 100" canvas every asset is drawn on) rather than the actual painted artwork, so thin/off-centre assets like the horizontal Line carried up to ~90% invisible padding in their interactive bounding box. Root cause: `ElementSvg.tsx` rendered every asset's raw, unmodified viewBox, so `item.size` (which drives the wrapper div that the selection ring, `CornerResizeHandles`, and drag hit-testing are all positioned against) represented the authoring canvas, not the artwork. Root-cause audit also covered Images and Text: both were already correct by construction (image resize is always aspect-locked so `object-contain` never letterboxes; text has no `size` field at all, sizing natively via CSS `max-content`) - neither was modified. Fix, scoped entirely to `components/editor/elements/`: measured each of the 24 catalog assets' true stroke-inclusive bounding box in a real browser (`getBBox` + explicit stroke-width expansion, matching the actual stroke-width each asset renders with post-insertion, including the `DEFAULT_SHAPE_STROKE_WIDTH` override applied to the 7 "shape-kind" entries), stored the result as a new `visibleBounds` field per `ElementAsset`, and crop `getElementSvgMarkup`'s render-time `viewBox` (canvas placement only - catalog thumbnails are unaffected, they render `element.svg` directly) to that tight box with `preserveAspectRatio="none"`, matching the existing Shape rendering convention. `defaultSize` was recalculated per asset to the corrected aspect ratio. Because the wrapper is the single source of truth for the selection ring, resize handles, drag hit area, and rotation pivot, none of that shared gesture code needed to change - it automatically became correct. Verified with a Playwright suite measuring the rendered wrapper against the artwork's true painted extent (sub-1.5px precision) across Line/Arrow/Heart/Circle/Rectangle, resize-handle positions, rotation-pivot stability, drag, undo/redo, and resize-after-fix, run across Desktop Chrome, Desktop Safari, iPhone Safari, and Android Chrome (100 passed, 0 failed, serial run with no parallel resource contention).
- `founder-qa-elements-resize`: **Elements Pinch-Resize Root-Cause Fix**: Traced why Elements pinch-resized in visible stepped increments on mobile Chrome and mobile Safari while Images and Text stayed smooth. Root cause (confirmed against the `react-dom` source): `ElementSvg.tsx` passed a brand-new `{ __html }` object to `dangerouslySetInnerHTML` on every render; React diffs that prop by object identity, not string content, so every pinch-resize frame (item.size changing, not fill/stroke) forced a full `domElement.innerHTML =` re-parse of the SVG subtree even though the markup never changed. Images (`<img>`, CSS-only resize) and Text (plain style writes) never paid this cost. Fix: memoized the `{ __html }` object in `ElementSvg.tsx` on `[asset, item.fill, item.stroke, item.strokeWidth]`, excluding size/position/rotation, so resize/drag/rotate no longer touch the SVG subtree at all. Verified with a Playwright `MutationObserver` regression test that fails on the pre-fix code (24 subtree replacements per gesture) and passes after the fix (0), across Chromium (Desktop Chrome, Android Chrome mobile emulation) and, via an equivalent pointer-drag test on the same render path, WebKit (Desktop Safari, iPhone Safari). Images and Text were not modified.
- `founder-qa-colourpicker-restore`: **Gripix Colour Picker Restoration**: Restored `ColorPicker.tsx` to the last verified-good, hand-built version (portal-rendered into `document.body`, draggable header, Escape-to-close, EyeDropper, HEX/RGB, hue/saturation/value square, opacity slider, preset swatches), after an intermediate "recovery sprint" commit had reimplemented it with subtly different behaviour (e.g. `click` vs `pointerdown` outside-close listener, always-rendered disabled EyeDropper button). No API changes; drop-in replacement for all existing call sites in `EditorInspector.tsx` / `TextToolbar.tsx` / `MobileContextToolbar.tsx`.
- Verified with `npm run lint` (0 errors, 4 pre-existing `<img>` warnings unchanged), `npx tsc --noEmit` (0 errors), `npm run build` (clean production build), and a real, visible Playwright pass across Desktop Chrome, Desktop Safari, iPhone Safari, and Android Chrome.

---

## 2026-07-27

- `projects-sprint`: **Saved Projects & Multi-Draft Studio Manager**: Implemented persistent multi-project management system powered by IndexedDB (`lib/projects/projectsManager.ts` and `lib/projects/projects.types.ts`). Created inline design title editing in `EditorHeader.tsx`, dedicated "Projects" tab in `EditorSidebar.tsx`, searchable & filterable `ProjectsPanel.tsx` with vector canvas thumbnail previews (`ProjectThumbnail.tsx`), project creation, duplication, renaming, deletion, and active project switching. Integrated seamlessly with `EditorPreview.tsx` preserving all gestures, undo/redo history, and auto-save capabilities.
- `templates-sprint`: **Starter Templates Framework & Experience**: Created reusable template registry (`lib/templates/templates.catalog.ts`) with 12 curated starter templates spanning Social, Product, Marketing, and Personal categories. Built searchable & category-filtered `TemplatesPanel.tsx` with live category counts, vector thumbnail previews (`TemplateThumbnail.tsx`), and full template card container clickability (`onClick`). Integrated instant history-backed template loading in `EditorPreview.tsx` ensuring Undo/Redo (`Cmd+Z`) restores previous canvas states cleanly. Added single-tap "Reset Viewport" shortcut to `MobileCanvasZoomHud.tsx`. Verified 100% pass across `npm run lint`, `npx tsc --noEmit`, `npm run build`, and visible Google Chrome runtime verification.
- `elements-sprint`: **Elements Experience Foundation**: Expanded vector elements catalog to 20+ shapes, lines, symbols, and callouts (`elements.catalog.ts`). Added weighted relevance search scoring, search clear button (`X`), scrollable category filter pills with live counts, grouped category browsing view, and interactive Recents/Favorites local storage persistence (`ElementsPanel.tsx`). Automated verification passed with zero lint/type/build errors (`npm run lint`, `npx tsc --noEmit`, `npm run build`).
- `a6cb3e8`: **Documentation Sprint**: Established `/docs/` living project documentation (`MASTER_PLAN.md`, `ROADMAP.md`, `PLAYBOOK.md`, `ENGINEERING.md`, `UX_PRINCIPLES.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `POLISH_BACKLOG.md`) and updated `README.md`.
- `post-sprint`: **Documentation Audit & Refinement**: Verified all relative repository links, reclassified roadmap items with explicit source attribution (`app/page.tsx`, `AGENTS.md`), and updated living documentation sprint status to Complete.

---

## 2026-07-26

- `d1c6921`: **Layers UX**: Improved scroll discoverability inside `LayersPanel`.
- `eae4c94`: **Fixes & Polish**: Resolved audit findings for typography font list scrolling and draft state recovery.
- `c86336d`: **Typography**: Introduced real-time searchable `FontPicker` component with font preview rendering.
- `800d2fa`: **Canvas Engine**: Added canvas dimensions preset selector (`Instagram Post`, `Story`, `Logo`, etc.) and custom dimension controls (`CanvasSizePanel.tsx`).

---

## 2026-07-25

- `413f04c`: **Canvas Interaction**: Made newly added text items immediately editable with native caret placement.
- `81020c8`: **Inspector Layout**: Expanded `LayersPanel` to utilize available vertical inspector workspace.
- `f2862a1`: **Landing Page**: Polished homepage feature accuracy and resolved React client hydration warnings.
- `53efef1`: **Hit Testing**: Added geometry-aware hit testing for editable vector SVG shapes (`shape.geometry.ts`).
- `41ad408`: **Hit Testing**: Implemented smart transparent PNG image hit testing to prevent accidental clicks on empty background padding.

---

## 2026-07-24

- `b15dfd8`: **Gesture System**: Fixed editor drag tracking and corner resize calculation bounds.

---

## 2026-07-23

- `ff4ab2a`: **Sidebar Architecture**: Overhauled desktop sidebar scrolling architecture for smooth panel navigation.
- `76bbf56`: **UI Controls**: Created reusable property steppers (`PropertyStepper.tsx`) and polished lock badge indicators.
- `7eaac5f`: **Canvas Rules**: Refined locked item selection behavior and improved default vector shape parameters.
- `33049cc`: **Mobile UI**: Added responsive mobile shape styling panel (`MobileStylePanel.tsx`).

---

## 2026-07-22

- `254d3b5`: **Vector Elements**: Added editable shape elements and improved `ElementsPanel` browsing experience.
- `9a9a0e0`: **Vector Elements**: Established Gripix vector elements foundation and starter graphic catalog (`elements.catalog.ts`).
- `70d5821`: **Layers Subsystem**: Completed Gripix layers system with desktop and mobile UI polish.
- `13a44f9`: **Layer Controls**: Completed comprehensive layer reordering controls across desktop and mobile.
- `5754357`: **Layer Locking**: Added layer lock and unlock capabilities (`isLocked`).

---

## 2026-07-21

- `f472bbc`: **Layer Visibility**: Added layer visibility toggles (`hidden`).
- `8eea110`: **Desktop Layers**: Implemented dedicated desktop `LayersPanel.tsx`.
- `5febf5d`: **Fixes**: Fixed duplicate keyboard shortcut conflict during active text editing.
- `8e3d568`: **Fixes**: Fixed Safari duplicate keybinding execution.
- `dc1c36a`: **Typography**: Fixed text wrapping constraints and mobile zoom placement.
- `d64d979`: **Canvas Engine**: Added item duplication controls (`duplicateItem`).
- `039be3c`: **Public Site**: Polished Gripix public homepage layout (`app/page.tsx`).
- `7c6fbb4`: **Public Site**: Fixed sticky navigation header on public homepage.
- `5a6b4b5`: **Public Site**: Redesigned public Gripix homepage.
- `f42b8cd`: **Workflow**: Introduced safe new design workflow dialog (`NewDesignDialog.tsx`).
- `9d6cf22`: **Rebranding**: Formally rebranded platform from Genvilo to **Gripix**.
- `a4f3fc8`: **Draft Recovery**: Implemented automatic draft persistence and state recovery (`lib/drafts/editorDraft.ts`).
- `042ef04`: **Export System**: Completed mobile PDF export workflow (`createPdf.ts`).
- `ab511d4`: **Export System**: Completed unified PNG, JPG, and PDF export modal (`ExportDialog.tsx`).
- `068bc18`: **Export System**: Added JPG and PDF export pipeline support.
- `b102d22`: **Export System**: Polished export modal UI and output summary stats.
- `1c1b9bc`: **Canvas Engine**: Added initial canvas presets model.
- `6d96963`: **Mobile UI**: Added responsive portrait canvas layout for mobile devices.
- `904c6b0`: **Mobile UI**: Refined mobile canvas sizing math.
- `b3b5dd0`: **Mobile UI**: Improved mobile workspace padding and touch gesture ownership.
- `c10a335`: **Workspace**: Polished editor workspace and mobile editing experience.
- `afb7f06`: **Navigation**: Polished canvas navigation and mobile zoom editing.
- `a47059e`: **Navigation**: Polished desktop canvas zoom controls (`CanvasViewModeControl.tsx`).
- `e0320b8`: **Navigation**: Improved desktop canvas navigation math.
- `4ac275c`: **Architecture**: Moved editor workspace to dedicated full-screen route `/create`.

---

## 2026-07-20

- `7bb3fe5`: **Public Site**: Improved landing page refresh scroll restoration behavior.
- `aee0de2`: **Public Site**: Fixed scroll restoration issue on page reload.
- `742f1ba`: **Mobile UI**: Reset mobile landing page scroll state on refresh.
- `596578b`: **Touch System**: Improved mobile two-finger gesture ownership to prevent unwanted page scrolls.
- `c960714`: **Touch System**: Fixed mobile two-finger viewport gesture ownership.

---

## 2026-07-19

- `27536f1`: **Mobile UI**: Positioned mobile contextual toolbar above mobile bottom bar.
- `ef1ae56`: **Mobile UI**: Improved mobile canvas scrolling and toolbar placement.
- `38124d3`: **Mobile Typography**: Fixed mobile canvas text zoom calculations.
- `7687625`: **Mobile UI**: Added mobile canvas zoom HUD indicator (`MobileCanvasZoomHud.tsx`).
- `938a50c`: **Viewport Engine**: Fixed canvas drag coordinate calculations and clarified zoom percentage inputs.
- `feb1957`: **Viewport Engine**: Polished viewport controls and interaction feedback.
- `a59f47b`: **Desktop UI**: Synchronized desktop hand-pan cursor during pointer capture (`DesktopPanCursor.tsx`).
- `2890146`: **Desktop UI**: Implemented stable desktop grab/grabbing pan cursor.
- `c44e92e`: **Viewport Engine**: Improved desktop viewport scrolling and cursor stability.
- `a816442`: **Viewport Engine**: Fixed desktop viewport cursor and mouse wheel behavior.
- `5cbbf03`: **Rendering Engine**: Sharpened canvas viewport rendering and stabilized panning.
- `7811cef`: **Rendering Engine**: Completed canvas panning system and improved zoomed image sharpness.
- `9e5449f`: **Viewport Engine**: Polished canvas zoom controls and viewport scrolling.
- `9f68afe`: **Viewport Engine**: Introduced initial canvas zoom and pan viewport architecture.
- `698731c`: **Export System**: Improved PNG export quality and resolution scaling.
- `e82ff64`: **Typography**: Fixed text caret stability during active inline editing.
- `6fc45a1`: **Export System**: Added HTML5 Canvas fallback pipeline for iPhone Safari PNG export (`isMobileSafari.ts`).
- `dd05c03`: **Export System**: Fixed Safari PNG export dimensions.
- `8682da4`: **Export System**: Built reusable PNG export foundation (`lib/export/exportDesign.ts`).

---

## 2026-07-17

- `b5cca7a`: **Export System**: Fixed export dialog status indicators and transparency toggle.
- `a2197e5`: **Export System**: Built responsive export user interface.
- `f0c537f`: **Mobile UI**: Added mobile sidebar auto-scroll capabilities.
- `2539b61`: **Typography**: Restored mobile text selection highlight styling.
- `4b991d7`: **Typography**: Added desktop text corner resizing handles.
- `82eb0d1`: **Viewport Engine**: Added desktop `Fit` and `Fill` canvas modes.
- `cd73d4f`: **Desktop UI**: Redesigned desktop editor workspace layout.
