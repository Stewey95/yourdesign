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
- 🟡 **Element Tag Search & Filtering**: Add search input and category tag filters inside `ElementsPanel.tsx` for fast element discovery.
- 🟢 **Shape Ratio Lock Toggle**: Provide an aspect ratio lock toggle in `EditorInspector.tsx` for custom vector shape scaling.

---

## 5. Export Dialog & Draft Persistence

- 🟢 **Export Preview Zoom Controls**: Add zoom and pan controls inside `ExportDialog.tsx` so users can inspect fine high-res PNG/PDF export detail prior to downloading.
- 🟡 **Multi-Draft Local Management**: Expand `lib/drafts/editorDraft.ts` to allow users to save, rename, and switch between multiple local design drafts rather than a single active state.
- 🟢 **Export Progress Indicator**: Add a granular progress indicator during heavy PDF generation for large multi-asset canvases.

---

## 6. Mobile Layout & Contextual Controls

- 🟢 **Adaptive Mobile Inspector Height**: Dynamically adjust `MobileContextToolbar.tsx` bottom sheet heights for ultra-compact mobile viewports (e.g. iPhone SE).
- 🟢 **Mobile Haptic Feedback**: Trigger subtle, non-intrusive haptic vibration feedback on supported mobile devices when snapping elements to canvas guides.
