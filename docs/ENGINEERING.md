# Gripix Engineering Standards & Guidelines

This document outlines the engineering architecture, code organization standards, state management model, testing expectations, performance optimizations, and accessibility guidelines for Gripix.

---

## 1. Architecture Principles

### Single Stateful Coordinator Pattern
- `components/EditorPreview.tsx` acts as the single stateful coordinator for the design editor.
- All canvas items (`DesignItem[]`), canvas size parameters (`CanvasPresetId`, width, height), selection state (`selectedItemId`), and viewports are coordinated centrally.
- Presentational subcomponents in `components/editor/` receive typed props and callbacks, remaining decoupled from state mutations.

### Transaction-Based History Management
- State undo/redo operations are managed via the custom hook `components/editor/useEditorHistory.ts`.
- Gesture interactions (such as dragging items or resizing canvas elements) use transaction batching (`beginTransaction`, `updateTransaction`, `commitTransaction`) so continuous pointer movements collapse into a single atomic history step.

### Presentational Extraction & Component Safety
- Presentational UI components (e.g. `TextToolbar.tsx`, `ImageToolbar.tsx`, `LayersPanel.tsx`, `FontPicker.tsx`) are extracted cleanly before moving gesture or state logic.
- Avoid introducing React Context, reducers, or custom hooks without explicit approval.

---

## 2. Code Organisation & Directory Structure

```
yourdesign/
├── app/                      # Next.js App Router routes & page entry points
│   ├── page.tsx              # Public Gripix marketing homepage (responsive)
│   ├── create/page.tsx       # Dedicated full-screen editor workspace route
│   ├── globals.css           # Tailwind CSS directives & global style resets
│   └── layout.tsx            # Root layout wrapper & font definitions
├── components/               # React UI components
│   ├── EditorPreview.tsx     # Primary editor state coordinator & controller
│   ├── FeatureCard.tsx       # Landing page presentation card
│   ├── ImageToolbar.tsx      # Desktop contextual image controls
│   ├── editor/               # Domain-specific editor subcomponents
│   │   ├── EditorCanvas.tsx  # Interactive HTML5 design canvas workspace
│   │   ├── EditorHeader.tsx  # Desktop top navigation header
│   │   ├── EditorSidebar.tsx # Left tool navigation sidebar
│   │   ├── EditorInspector.tsx# Right property & layer inspector panel
│   │   ├── CanvasTextItem.tsx# Canvas text item renderer & corner handle resize
│   │   ├── CanvasImageItem.tsx# Canvas image item renderer
│   │   ├── CanvasShapeItem.tsx# Canvas vector shape item renderer
│   │   ├── FontPicker.tsx    # Searchable typography picker & preview catalog
│   │   ├── LayersPanel.tsx   # Desktop/mobile layer ordering & lock controls
│   │   ├── MobileContextToolbar.tsx # Responsive mobile bottom toolbar
│   │   ├── ExportDialog.tsx  # PNG, JPG & PDF export modal
│   │   ├── elements/         # Editable SVG elements library catalog
│   │   ├── fonts/            # Typography catalog metadata
│   │   └── hitTesting.ts     # Smart transparent image & geometry hit testing
│   └── ui/                   # Shared UI primitive components
├── lib/                      # Pure helper libraries & utilities
│   ├── drafts/               # localStorage auto-save draft persistence logic
│   └── export/               # Canvas rendering engine, PDF generation & fallbacks
└── types/                    # Shared TypeScript interface definitions
```

---

## 3. State Management Standards

### Editor State Schema (`EditorDesignState`)
```typescript
type EditorDesignState = {
  items: DesignItem[];
  canvas: CanvasSize & { presetId: CanvasPresetId };
};
```

### Layer Array Integrity
- `items` array index directly defines the visual layer z-order on the canvas (index `0` is bottom-most, last index is top-most).
- Reordering layers simply repositions items within the array (`moveLayerUp`, `moveLayerDown`, `moveLayerToFront`, `moveLayerToBack`).
- Every canvas item requires a stable, unique `id` key (`item.id`) that persists across operations and undo/redo cycles.

### Property Stepping & Bounds
- Numeric property updates (e.g. font size, stroke width, opacity, rotation, dimensions) use bounded stepping helper functions in `components/editor/editor.constants.ts` (e.g. `clampFontSize`, `getBoundedImageSize`).

---

## 4. Testing & Verification Expectations

Every pull request or code modification must satisfy three levels of verification:

### 1. Static Lint Analysis
```bash
npm run lint
```
- Must complete with zero errors and zero warnings.

### 2. TypeScript Compilation Check
```bash
npx tsc --noEmit
```
- Ensures strict type adherence across all `.ts` and `.tsx` files.

### 3. Production Build Compilation
```bash
npm run build
```
- Guarantees server-side rendering (SSR) and client bundle compilation without build-time failures.

### 4. Runtime Behavior Verification
- **Desktop**: Test selection, resizing, drag panning, font picker searching, and layer locking on macOS Chrome.
- **Mobile**: Test touch pinch-zoom, caret placement inside canvas text, two-finger canvas panning, and Safari iPhone export.

---

## 5. Performance Optimizations

- **Geometry-Aware Hit Testing**: `components/editor/hitTesting.ts` performs smart hit-testing on transparent PNG images and SVG shape outlines to ensure users select items naturally without clicking transparent background padding.
- **Canvas Rendering Engine**: `lib/export/renderDesignToCanvas.ts` uses an offscreen HTML5 `<canvas>` element with crisp device pixel ratio scaling (`getCanvasDisplayScale`) for ultra-sharp PNG/JPG export without DOM layout thrashing.
- **Gesture Animation Frames**: Dragging and resizing updates use `requestAnimationFrame` timing to maintain 60fps interaction smoothness.
- **Debounced Draft Persistence**: Draft saving (`lib/drafts/editorDraft.ts`) uses debounced writing to `localStorage` to eliminate main-thread IO latency during active drawing.

---

## 6. Accessibility (a11y) & Usability

- **Keyboard Shortcuts**:
  - `Cmd+Z` / `Ctrl+Z`: Undo.
  - `Cmd+Shift+Z` / `Ctrl+Shift+Z`: Redo.
  - `Delete` / `Backspace`: Delete selected item (when not editing text).
  - `Cmd+D` / `Ctrl+D`: Duplicate selected item.
- **Semantic HTML & Focus Management**:
  - Main editor wrapped in semantic `<main>` workspace containers.
  - Icon buttons utilize `title` attributes and accessible `aria-label` tags.
  - Text editing triggers focused inline content-editable input with native caret placement.
- **High-Contrast Touch Targets**:
  - Mobile bottom toolbar buttons maintain a minimum target height of 44px for comfortable touch access.
