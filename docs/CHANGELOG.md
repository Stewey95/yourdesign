# Gripix Changelog

All notable changes to the Gripix project are documented in this file based strictly on repository commit history.

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
