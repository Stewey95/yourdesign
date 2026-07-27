# Gripix Master Plan

## 1. Vision & Mission

Gripix exists to become the easiest, fastest, and most enjoyable place to create, organise, and sell digital products online.

Every feature built inside Gripix must reduce friction for creators so they spend less time fighting complex software and more time creating high-value products that make money.

---

## 2. Product Philosophy

When making UI and product decisions, Gripix adheres to five fundamental design principles:

- **Simple over complicated**: Keep interfaces clear, intuitive, and uncluttered.
- **Fast over clever**: Prioritise responsiveness, low friction, and instant Feedback over overly complex algorithms.
- **Beautiful over busy**: Use generous spacing, balanced typography, and clean visual hierarchy.
- **Consistent over different**: Maintain uniform interaction patterns across desktop and mobile.
- **Premium over flashy**: Deliver a calm, refined design language that inspires confidence.

Every screen should feel calm, modern, and intentionally crafted.

---

## 3. Product Inspiration & Standards

Gripix draws inspiration from world-class modern software:

- **Canva**: Accessible design workflows, drag-and-drop mechanics, preset canvases.
- **Figma**: Precision layout controls, layer management, smooth pan/zoom canvas interaction.
- **Apple**: Clean typography, deliberate spacing, hardware-accelerated fluid touch gestures.
- **Linear**: Keyboard-first speed, subtle micro-animations, ultra-focused contextual UI.
- **Notion**: Unobtrusive controls, high performance, structured content management.

*Note: Gripix does not copy these tools directly; instead, it adopts their principles of clarity, speed, and craftsmanship.*

---

## 4. Business & Feature Qualification

Every feature added to Gripix must answer at least one of these four core questions:

1. **Does this help people create?**
2. **Does this help people sell?**
3. **Does this save people time?**
4. **Does this make Gripix feel more premium?**

If a proposed feature cannot answer "yes" to at least one of these questions, it should not exist.

---

## 5. Development Philosophy & The 1% Rule

### Quality Over Speed
- Improve existing features before adding new ones.
- Never break existing working behaviour for the sake of cleaner code refactoring.
- Treat mobile and desktop user experiences as equally important.

### The 1% Rule
When working on Gripix, always look for opportunities to make the product **1% better** than requested. Small, incremental improvements made consistently create exceptional software when they:
- Do not increase unnecessary complexity.
- Do not break existing editor gestures or features.
- Improve usability, consistency, or visual polish.

### Editor Protection Rules
The Canva-style canvas editor (`components/EditorPreview.tsx` & `components/editor/*`) is the heart of Gripix. The following core editor capabilities are protected and must never be broken:
- Text editing & mobile caret placement.
- Text auto-height & auto-fit inside canvas bounds.
- Drag-and-drop item movement & tap-vs-drag gesture discrimination.
- Pinch-to-resize gestures on touch devices and corner resize handles on desktop.
- Element rotation and geometry-aware hit testing.
- Alignment guides and snapping mechanics.
- Layer ordering, layer lock badges, and layer visibility toggles.
- Fixed toolbar spacing, responsive sidebars, and desktop pan cursors.
- Automatic local draft persistence & recovery.

---

## 6. Long-Term Platform Vision

Gripix is evolving beyond a standalone graphics editor into a comprehensive creator platform encompassing:

1. **Design & Canvas Workspace**: High-performance Canva-style multi-format design studio.
2. **Templates & Starter Kits**: Curated, customizable design templates for digital products.
3. **Brand Kits**: Persistent color palettes, custom typography pairings, and brand asset management.
4. **AI Assistance**: Content generation, layout suggestions, and smart background utilities.
5. **Digital Product Preparation**: Multi-page PDF exports, digital lead magnet creation, and asset packaging.
6. **Marketplace & Selling Tools**: Native storefront integrations, creator analytics, and digital product distribution.
