# Gripix UX Principles & Design Philosophy

This document defines the core user experience principles that govern every interface design, interaction, and visual decision in Gripix.

---

## 1. Simplicity

### Reduce Cognitive Load
- Design screens to look calm, uncluttered, and intentionally structured.
- Expose essential controls first; hide advanced settings until requested.
- Avoid adding UI controls simply because other platforms have them. Every control must earn its place on the screen.

### Natural Selection & Manipulation
- Selecting canvas elements should feel immediate and predictable.
- Selection bounding boxes should accurately reflect the active item bounds without obscure visual artifacts.

---

## 2. Speed & Low Friction

### Instant Feedback
- Interactions should respond immediately without noticeable input lag.
- Text blocks should focus instantly with native caret placement when created.
- Undo and redo transactions must execute seamlessly without resetting viewport context or scroll position.

### Local-First Persistence
- Drafts auto-save silently in the background. Users never lose work when closing or refreshing the browser.

---

## 3. Visual Clarity & Precision

### Unambiguous Status Indicators
- Use clear visual affordances for item states: selection bounding boxes, corner resize handles, lock status badges, and visibility indicators.
- Provide crisp, real-time alignment snapping guides (`AlignmentGuides.tsx`) when elements align to canvas center or adjacent items.

### Visual Hierarchy & Typography
- Maintain consistent font scales, readable weights, and high-contrast color palettes.
- Ensure text elements auto-fit their bounds cleanly without unexpected wrapping or overflow clipping.

---

## 4. Premium Spacing & Aesthetic Elegance

### Generous Spacing
- Prefer open layouts with generous margins over cramped control boxes.
- Maintain consistent spacing tokens across headers, sidebars, context toolbars, and inspector panels.

### Elegant Micro-Animations
- Incorporate subtle, high-performance transitions for panel expansions, toolbar appearances, and modal dialog overlays.
- Keep micro-animations under 200ms to ensure the UI feels snappy rather than sluggish.

---

## 5. Mobile-First Equality

### Touch-First Interaction Design
- Mobile interfaces must receive the same design care and precision as desktop viewports.
- Touch target sizes must maintain comfortable tap bounds (minimum 44x44px target sizes).
- Contextual toolbars on mobile devices pin to the bottom edge (`MobileContextToolbar.tsx`) to fit comfortable thumb reach zones.

### Two-Finger Gesture Ownership
- Viewport panning and pinch-zooming on mobile devices operate smoothly without triggering unwanted browser page scrolling or pull-to-refresh gestures.

---

## 6. Contextual Controls

### Adaptive Interface Toolbars
- Display contextual control toolbars based on the active selection (e.g. `TextToolbar` for text items, `ImageToolbar` for uploaded images, `MobileStylePanel` for shapes).
- Automatically dismiss contextual toolbars when items are deselected to keep the workspace clean.

### Inspector Hierarchy
- Group related controls logically inside the inspector panel (e.g., Position & Dimensions, Layers, Appearance, Adjustments).

---

## 7. Intuitive Workflows

### Fewer Clicks to Result
- Minimize the number of steps required to achieve common outcomes (e.g., one-click canvas size presets, instant layer locking, quick export preset downloads).
- Modal dialogs (such as `ExportDialog.tsx`) provide live format previews and clear, single-action export buttons.

### Confidence-Building UX
- Safeguard user actions with non-destructive state undo/redo capabilities, draft recovery warnings, and explicit confirmation prompts for permanent canvas resets.
