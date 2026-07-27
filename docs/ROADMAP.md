# Gripix Product Roadmap

The Gripix roadmap reflects the natural evolution of the product from a standalone canvas editor into a full-scale creator platform for digital products.

Legend:
- ✅ **Complete**: Fully implemented, verified, and active in the codebase.
- 🚧 **In Progress**: Active focus area.
- 📋 **Planned**: Explicitly supported by repository code, `app/page.tsx`, or `AGENTS.md`.
- 💡 **Future Vision**: Strategic long-term direction documented in `AGENTS.md`.
- 🔹 **Recommendation**: Proposed extension not yet explicitly declared in source code.

---

## Phase 1: Dedicated Workspace & Canvas Foundation (✅ Complete)
*[Source: `app/create/page.tsx`, `components/EditorPreview.tsx`]*

- ✅ **Dedicated Editor Route**: Full-screen design workspace hosted at `/create` separate from the public landing page (`/`).
- ✅ **Canva-Style Interactive Canvas**: Render and manipulate text blocks, image uploads, and vector SVG shape elements.
- ✅ **Item Selection & Transforms**: Canvas drag-and-drop movement, corner resizing handles, rotation controls, and item deletion.
- ✅ **Responsive Viewport Layout**: Desktop top header, left sidebar navigation, contextual toolbars, right inspector panel, and mobile bottom bar layout.

---

## Phase 2: Viewport Navigation & Touch Gestures (✅ Complete)
*[Source: `components/editor/editor.viewport.ts`, `DesktopPanCursor.tsx`, `MobileCanvasZoomHud.tsx`]*

- ✅ **Canvas Viewport Engine**: Smooth canvas zooming with zoom preset buttons (`Fit`, `Fill`, `50%`, `100%`, `200%`), HUD display, and custom zoom percentage input.
- ✅ **Desktop Hand-Panning**: Desktop canvas pan support using space+drag, middle-mouse drag, or dedicated viewport pan tool with customized grab/grabbing cursor feedback.
- ✅ **Mobile Viewport Ownership**: Touch-based two-finger canvas panning and pinch-to-zoom gestures without interfering with browser page scrolling.
- ✅ **Alignment Guides & Snapping**: Geometry-aware alignment guides (`AlignmentGuides.tsx`) providing visual snap indicators for canvas center and element alignment.

---

## Phase 3: Layer Management & Element Catalog Foundation (✅ Complete)
*[Source: `components/editor/LayersPanel.tsx`, `components/editor/elements/elements.catalog.ts`]*

- ✅ **Layers Panel & Inspector**: Complete desktop and mobile `LayersPanel.tsx` supporting layer selection, visual order listing, and index position updates.
- ✅ **Layer Lock & Visibility**: Ability to lock/unlock items (`isLocked`) to prevent accidental edits, complete with lock badges, and toggle item visibility (`hidden`).
- ✅ **Item Duplication**: One-click duplication (`duplicateItem`) preserving position offsets and styling properties.
- ✅ **Vector Elements Catalog Foundation**: Initial SVG element library (`elements.catalog.ts`) including rectangles, circles, stars, hearts, triangles, badges, and stroke/fill styling controls (`ShapeSvg.tsx`).

---

## Phase 4: Typography & Dimension Presets (✅ Complete)
*[Source: `components/editor/FontPicker.tsx`, `CanvasSizePanel.tsx`]*

- ✅ **Searchable Font Catalog**: Integrated `FontPicker.tsx` featuring real-time font search, font preview rendering, text styling (bold, italic, uppercase, alignment), line height, and letter spacing steppers.
- ✅ **Text Auto-Fit & Caret Placement**: Auto-height calculation for text blocks with native caret focus when adding new text elements.
- ✅ **Canvas Size Presets**: Standard canvas presets (`Instagram Post`, `Instagram Story`, `Logo`, `Flyer`, `Presentation`) and custom pixel dimensions in `CanvasSizePanel.tsx`.

---

## Phase 5: Multi-Format Export & Draft Persistence (✅ Complete)
*[Source: `lib/export/exportDesign.ts`, `lib/drafts/editorDraft.ts`]*

- ✅ **High-Resolution Export Pipeline**: Client-side PNG, JPG, and PDF output using html2canvas/canvas rendering (`lib/export/renderDesignToCanvas.ts`).
- ✅ **Background Transparency**: Toggle transparent background for PNG assets.
- ✅ **Mobile Safari Export Fallbacks**: Dedicated HTML5 canvas fallback pipeline (`isMobileSafari.ts`) supporting seamless mobile exports on iPhone.
- ✅ **Automatic Draft Persistence**: Local storage state persistence (`lib/drafts/editorDraft.ts`) with automatic draft recovery and reset capabilities.

---

## Phase 6: Living Documentation & Development Standards (✅ Complete)
*[Source: `/docs/` Directory, `README.md`]*

- ✅ **Repository Living Documentation**: Established `/docs/` as the single source of truth (`MASTER_PLAN.md`, `ROADMAP.md`, `PLAYBOOK.md`, `ENGINEERING.md`, `UX_PRINCIPLES.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `POLISH_BACKLOG.md`).
- ✅ **README Modernization**: Comprehensive landing documentation with tech stack overview, quick start commands, and directory links.
- ✅ **Standardized QA Workflow**: Strict 12-step playbook combining linting, type checks, build checks, and runtime testing.

---

## Phase 7: Near-Term Priorities & Core Polish (📋 Planned)
*[Source: `app/page.tsx` line 86 `comingNext`, `AGENTS.md` line 207 `1% Rule`, `docs/POLISH_BACKLOG.md`]*

- ✅ **Templates Framework & Starter Experience**: Scalable template registry (`lib/templates/templates.catalog.ts`), 12 curated starter designs, searchable & category-filtered `TemplatesPanel.tsx`, vector thumbnail preview renderer (`TemplateThumbnail.tsx`), and instant history-backed Undo/Redo loading.
- 📋 **Editor Quality & Refinement**: Ongoing usability polish, touch responsiveness, layer scroll discoverability, and edge-case bug fixes *[Confirmed in AGENTS.md & POLISH_BACKLOG.md]*.
- 📋 **Universal Search**: Unified search capabilities across editor fonts, element catalog, and presets *[Confirmed in app/page.tsx `comingNext` array]*.
- ✅ **Saved Projects & Multi-Draft Studio Manager**: Persistent multi-project saving, loading, creating, duplicating, renaming, and deleting powered by IndexedDB (`lib/projects/projectsManager.ts`), complete with vector canvas thumbnails (`ProjectThumbnail.tsx`), inline header title editing, and responsive projects sidebar panel (`ProjectsPanel.tsx`).
- 📋 **Expanded Elements Library**: Additional categories of vector shapes, icons, and illustrations *[Confirmed in app/page.tsx & AGENTS.md]*.
- 🔹 **User Accounts & Authentication**: Cloud user accounts for multi-device sync *[Recommendation: natural extension of Saved Projects]*.

---

## Phase 8: Creator Platform & Storefront Infrastructure (💡 Future Vision)
*[Source: `AGENTS.md` lines 182-195 `Future Vision`]*

- 💡 **Brand Kits**: Persistent brand colors, font pairings, and asset kits *[Confirmed in AGENTS.md]*.
- 💡 **AI Assistance**: Generative copywriting, layout formatting, and automated background tools *[Confirmed in AGENTS.md]*.
- 💡 **Project Management**: Asset organization and design workflow tools *[Confirmed in AGENTS.md]*.
- 💡 **Digital Product Preparation**: Multi-page bundling and asset packaging for digital products *[Confirmed in AGENTS.md]*.
- 💡 **Marketplace Integrations & Selling Tools**: Direct storefront integrations and digital product distribution *[Confirmed in AGENTS.md]*.
- 🔹 **Multi-Page Canvas Engine**: Multi-page document editing within a single design session *[Recommendation]*.
- 🔹 **Multi-Item Grouping & Alignment**: Grouping elements and distribution tools *[Recommendation]*.
