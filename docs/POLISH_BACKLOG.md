# Gripix Polish Backlog

This backlog contains structured UX and technical polish items derived from codebase observations, audit findings, and product guidelines.

*Note: All items are strictly evaluated against the 1% Rule and Gripix design philosophy.*

---

## 1. Canvas & Viewport Gestures

- 🟢 **Mobile Pan Reset Shortcut**: Add a single-tap "Reset Viewport" button inside `MobileCanvasZoomHud.tsx` to instantly recenter and fit the canvas when zoomed in deep.
- 🟡 **High-DPI Gesture Smoothness**: Optimize touch event throttling when rapidly alternating between two-finger panning and pinch-to-zoom gestures on high-DPI mobile screens.
- 🟢 **Desktop Scroll Wheel Thresholding**: Fine-tune Ctrl+Wheel zoom sensitivity on high-precision trackpads to avoid zoom jumps.

---

## 2. Layers Panel & Reordering UX

- 🟡 **Drag-and-Drop Layer Reordering**: Implement direct visual drag-and-drop handles inside `LayersPanel.tsx` in addition to the existing up/down arrow reordering buttons.
- 🟢 **Bulk Layer Locking**: Support multi-item layer selection to allow locking or toggling visibility across multiple layers in a single action.
- 🟢 **Empty Layer State Polish**: Enhance the empty state presentation when no canvas elements exist with a friendly quick-add tip.

---

## 3. Typography & Font Picker Experience

- 🟡 **Font Catalog Virtualization**: Implement windowing / virtualization in `FontPicker.tsx` to maintain 60fps scrolling performance when scaling the Google Fonts catalog to hundreds of font families.
- 🟢 **Recent & Favorite Fonts**: Store the user's recently selected font families at the top of `FontPicker.tsx` for quick access.
- 🟢 **Text Selection Bounding Rect Polish**: Further refine text container auto-height recalculation during fast backspacing in mobile web viewports.

---

## 4. Vector Elements & Shapes Catalog

- 🟢 **Custom Stroke Style Options**: Expand `ShapeSvg.tsx` to support dashed and dotted SVG stroke border styles.
- ✅ **Element Tag Search & Filtering**: Search input and category tag filters exist inside `ElementsPanel.tsx` (search box, category pills with live counts, weighted tag-aware relevance scoring in `searchElementCatalog`).
- 🟢 **Shape Ratio Lock Toggle**: Provide an aspect ratio lock toggle in `EditorInspector.tsx` for custom vector shape scaling.
- 🔹 **Multi-Part Editable Elements** *(Future feature - documented only, not implemented)*: Today every element's fill/stroke is a single colour pair applied uniformly across its entire SVG markup (`getElementSvgMarkup`'s substitution rewrites *every* `fill="#hex"`/`stroke="#hex"` occurrence in the asset to the same two values). A multi-region element - e.g. a bar chart where each bar gets its own colour, or an illustration with independently recolourable sections - needs a fundamentally different colour model, not just new UI. Confirmed via inspection that the current architecture does **not** support this trivially: there is no per-sub-shape addressing anywhere in the pipeline (catalog data, `ElementAsset` type, `getElementSvgMarkup`, `DesignItem`, or the inspector), so this is out of scope for a repair/polish pass and is recorded here as the recommended direction for when it's prioritised.

  **Recommended data model:**
  - Author affected catalog SVGs with a `data-region="<id>"` attribute on each independently-colourable sub-shape (stable, explicit addressing - not fragile array-index or selector-order matching).
  - Add an optional `colourRegions?: { id: string; label: string }[]` field to `ElementAsset` (`element.types.ts`), listing the region ids a given asset exposes and a human-readable label for each (e.g. `{ id: "bar-1", label: "Bar 1" }`). Elements that don't set this field are entirely unaffected - fully backward compatible.
  - Add an optional `regionColours?: Record<string, { fill: string | null; stroke: string | null }>` field to the element `DesignItem` variant (`editor.types.ts`), keyed by region id. When absent, rendering falls back to today's single `fill`/`stroke` behaviour exactly as now.
  - `getElementSvgMarkup` gains a second code path: when `asset.colourRegions` is present, substitute each `data-region="X"` group's colours independently from `item.regionColours[X]` instead of the current single global regex pass. The existing single-colour path stays completely untouched for every other element.
  - `EditorInspector.tsx`/`MobileContextToolbar.tsx`: when `asset.colourRegions` is present, render one fill/stroke swatch pair per region (a short list) instead of the single Fill/Stroke row - reusing the existing `ShapeColourControl`, just repeated per region.
  - Selection bounds/hit-testing/thumbnails need no changes at all - they already operate on the whole rendered SVG regardless of how many colours are inside it.

  This keeps the whole feature additive and opt-in per catalog element, with zero risk to any of the 145 existing single-colour elements.

---

## 5. Export Dialog & Draft Persistence

- 🟢 **Export Preview Zoom Controls**: Add zoom and pan controls inside `ExportDialog.tsx` so users can inspect fine high-res PNG/PDF export detail prior to downloading.
- ✅ **Multi-Draft Local Management**: Expanded local storage infrastructure (`lib/projects/projectsManager.ts`) allowing creators to save, search, rename, duplicate, switch, and delete multiple design projects cleanly.
- 🟢 **Export Progress Indicator**: Add a granular progress indicator during heavy PDF generation for large multi-asset canvases.

---

## 6. Mobile Layout & Contextual Controls

- 🟢 **Adaptive Mobile Inspector Height**: Dynamically adjust `MobileContextToolbar.tsx` bottom sheet heights for ultra-compact mobile viewports (e.g. iPhone SE).
- 🟢 **Mobile Haptic Feedback**: Trigger subtle, non-intrusive haptic vibration feedback on supported mobile devices when snapping elements to canvas guides.
