# Gripix Product Roadmap

The Gripix roadmap reflects the natural evolution of the product from a standalone canvas editor into a full-scale creator platform for digital products.

Statuses:
- ✅ **Complete**: Fully implemented, verified, and active in the repository.
- 🚧 **In Progress**: Currently active focus area.
- 📋 **Planned**: Near-term roadmap priorities based on core product vision.
- 💡 **Future**: Long-term strategic vision for creator growth.

---

## Phase 1: Dedicated Workspace & Canvas Foundation (✅ Complete)

- ✅ **Dedicated Editor Route**: Full-screen design workspace hosted at `/create` separate from the public landing page (`/`).
- ✅ **Canva-Style Interactive Canvas**: Render and manipulate text blocks, image uploads, and vector SVG shape elements.
- ✅ **Item Selection & Transforms**: Canvas drag-and-drop movement, corner resizing handles, rotation controls, and item deletion.
- ✅ **Responsive Viewport Layout**: Desktop top header, left sidebar navigation, contextual toolbars, right inspector panel, and mobile bottom bar layout.

---

## Phase 2: Viewport Navigation & Touch Gestures (✅ Complete)

- ✅ **Canvas Viewport Engine**: Smooth canvas zooming with zoom preset buttons (`Fit`, `Fill`, `50%`, `100%`, `200%`), HUD display, and custom zoom percentage input.
- ✅ **Desktop Hand-Panning**: Desktop canvas pan support using space+drag, middle-mouse drag, or dedicated viewport pan tool with customized grab/grabbing cursor feedback (`DesktopPanCursor.tsx`).
- ✅ **Mobile Viewport Ownership**: Touch-based two-finger canvas panning and pinch-to-zoom gestures without interfering with browser page scrolling.
- ✅ **Alignment Guides & Snapping**: Geometry-aware alignment guides (`AlignmentGuides.tsx`) providing visual snap indicators for canvas center and element alignment.

---

## Phase 3: Layer Management & Element Library (✅ Complete)

- ✅ **Layers Panel & Inspector**: Complete desktop and mobile `LayersPanel.tsx` supporting layer selection, visual order listing, and index position updates.
- ✅ **Layer Lock & Visibility**: Ability to lock/unlock items (`isLocked`) to prevent accidental edits, complete with lock badges, and toggle item visibility (`hidden`).
- ✅ **Item Duplication**: One-click duplication (`duplicateItem`) preserving position offsets and styling properties.
- ✅ **Vector Elements Catalog**: Curated SVG element library (`elements.catalog.ts`) including rectangles, circles, stars, hearts, triangles, badges, and custom stroke/fill styling controls (`ShapeSvg.tsx`).

---

## Phase 4: Typography & Dimension Presets (✅ Complete)

- ✅ **Searchable Font Catalog**: Integrated `FontPicker.tsx` featuring real-time font search, font preview rendering, text styling (bold, italic, uppercase, alignment), line height, and letter spacing steppers.
- ✅ **Text Auto-Fit & Caret Placement**: Auto-height calculation for text blocks with native caret focus when adding new text elements.
- ✅ **Canvas Size Presets**: Standard canvas presets (`Instagram Post`, `Instagram Story`, `Logo`, `Flyer`, `Presentation`) and custom pixel dimensions in `CanvasSizePanel.tsx`.

---

## Phase 5: Multi-Format Export & Draft Persistence (✅ Complete)

- ✅ **High-Resolution Export Pipeline**: Client-side PNG, JPG, and PDF output using html2canvas/canvas rendering (`lib/export/renderDesignToCanvas.ts`, `lib/export/exportDesign.ts`).
- ✅ **Background Transparency**: Toggle transparent background for PNG assets.
- ✅ **Mobile Safari Export Fallbacks**: Dedicated HTML5 canvas fallback pipeline (`isMobileSafari.ts`) supporting seamless mobile exports on iPhone.
- ✅ **Automatic Draft Persistence**: Local storage state persistence (`lib/drafts/editorDraft.ts`) with automatic draft recovery and reset capabilities.

---

## Phase 6: Living Documentation & Development Standards (🚧 In Progress)

- 🚧 **Repository Living Documentation**: Establishing `/docs/` as the single source of truth (`MASTER_PLAN.md`, `ROADMAP.md`, `PLAYBOOK.md`, `ENGINEERING.md`, `UX_PRINCIPLES.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `POLISH_BACKLOG.md`).
- 🚧 **README Modernization**: Comprehensive landing documentation with tech stack overview, quick start commands, and doc links.
- 🚧 **Standardized QA Workflow**: Strict playbook rules combining linting, type checks, build checks, and Chrome/Safari runtime testing.

---

## Phase 7: Multi-Page Canvas & Template Engine (📋 Planned)

- 📋 **Multi-Page Design Documents**: Support adding, reordering, duplicating, and deleting multiple pages within a single design project.
- 📋 **Preset Template Starter Library**: Pre-designed digital product templates (ebook covers, social packs, worksheets, planners).
- 📋 **Multi-Item Grouping**: Group multiple canvas elements to move, scale, and rotate simultaneously.
- 📋 **Advanced Alignment Tools**: Distribute horizontally/vertically, align to canvas edges, and multi-selection properties.

---

## Phase 8: Brand Kits & Creator Asset Management (📋 Planned)

- 📋 **Brand Kit Engine**: Save and apply custom brand color palettes, font pairings, and brand logo sets across designs.
- 📋 **Uploaded Assets Library**: Persistent media manager storing user-uploaded imagery across sessions.
- 📋 **Custom Color Swatches & Gradients**: Palette presets, eye-dropper color sampling, and linear/radial gradient fills.

---

## Phase 9: AI Creator Assistant & Digital Storefront (💡 Future)

- 💡 **AI Content & Layout Assistant**: Generative text copywriting, auto-layout formatting, and smart background removal for product photos.
- 💡 **Digital Product Packaging Suite**: Automated bundling of design exports into sellable digital packages (PDF lead magnets, PNG social kits).
- 💡 **Creator Storefront Integration**: Direct publishing to digital product marketplaces and creator storefronts.
