# Genvilo Development Instructions

## Project overview

Genvilo is a Next.js TypeScript design platform with a Canva-style editor.

The project uses:
- Next.js App Router
- TypeScript
- Tailwind CSS
- React client components
- Vercel deployment
- Git and GitHub

## Core working rules

- Preserve all existing working features unless explicitly asked to change them.
- Treat desktop and mobile behaviour as equally important.
- Never redesign the UI without explicit approval.
- Keep Genvilo's premium, friendly, Canva-style visual language.
- Prefer small, reviewable changes over large rewrites.
- Do not combine refactoring, visual redesign, and new functionality in the same step.
- Do not commit or push to GitHub unless explicitly instructed.
- Always explain which files were changed and why.
- Stop after the approved task and wait for review before continuing.

## Editor protection rules

Preserve:
- Text editing
- Mobile caret placement
- Text auto-height
- Text auto-fit inside the canvas
- Dragging
- Tap-versus-drag behaviour
- Pinch-to-resize for images and text
- Rotation
- Image adjustments
- Selection behaviour
- Empty-text deletion
- Alignment guides and snapping
- Layer ordering
- Fixed toolbar spacing
- Premium sidebar behaviour
- Desktop resize handles
- Mobile-friendly layouts
- Existing pointer, touch, blur, and requestAnimationFrame timing

Do not casually restructure gesture handling or DOM hierarchy.

Keep:
- Touch handlers in their existing capture or bubble phase
- Existing event propagation behaviour
- Stable item keys
- Array order as the layer order
- Current Tailwind classes unless the task specifically requires changes

## Refactoring rules

- Keep EditorPreview as the stateful coordinator until component extractions are proven safe.
- Extract presentational components before moving gesture or state logic.
- Do not introduce Context, reducers, or custom hooks without approval.
- Do not clean up unrelated code during a focused extraction.
- Preserve existing numeric values exactly during refactoring.
- Avoid changing uploaded-image rendering unless explicitly requested.
- Do not fix existing img optimization warnings as part of unrelated work.

## Verification

After every code change:
- Run npm run lint.
- Report lint errors and warnings separately.
- Do not claim success if new lint errors were introduced.
- Summarise the files changed.
- Summarise the behavioural impact.
- Show a concise diff summary.
- Do not continue to another task without approval.

When practical, preserve compatibility with:
- The homepage route /
- The editor route /create
- Safari on iPhone
- Desktop browsers on Mac

## Git rules

- Never commit automatically.
- Never push automatically.
- Never rewrite Git history.
- Never delete branches.
- Never reset or discard user work without explicit approval.

## Communication style

- Be concise and action-focused.
- Avoid repeating the full project background unless needed.
- Flag risks before editing.
- Prefer one safe task at a time.
- Ask for approval before beginning the next task.

# Genvilo Product Vision

## Mission

Genvilo exists to become the easiest and most enjoyable place to create, organise and sell digital products online.

Every feature should help creators spend less time fighting software and more time creating products that make money.

## Design Philosophy

When making UI decisions, prefer:

- Simple over complicated
- Fast over clever
- Beautiful over busy
- Consistent over different
- Premium over flashy

Every screen should feel calm, modern and intentionally designed.

## Inspiration

Use these products as inspiration:

- Canva
- Figma
- Apple
- Linear
- Notion

Do not copy them.

Instead, adopt their principles:

- Clean interfaces
- Smooth interactions
- Excellent spacing
- Predictable behaviour
- Professional typography
- Small delightful animations

## Editor Philosophy

The editor is the heart of Genvilo.

Every improvement should make creating designs feel:

- Faster
- Easier
- More enjoyable
- More professional

Avoid adding controls simply because they exist elsewhere.

Every tool should earn its place.

## User Experience Rules

Whenever multiple solutions exist, prefer the one that:

- Requires fewer clicks
- Is easier to discover
- Feels more natural
- Reduces user frustration
- Makes users feel confident

Never sacrifice usability for cleverness.

## Business Philosophy

Every feature should answer at least one of these questions:

- Does this help people create?
- Does this help people sell?
- Does this save people time?
- Does this make Genvilo feel more premium?

If the answer is no, question whether the feature should exist.

## Future Vision

Genvilo should eventually become more than a design editor.

It should become an entire creator platform including:

- Design
- Templates
- Brand Kits
- AI assistance
- Project management
- Digital product preparation
- Marketplace integrations
- Selling tools

Every new feature should move the product one step closer to that vision.

## Development Philosophy

Improve existing features before adding new ones.

Protect quality over speed.

Never break existing behaviour for the sake of cleaner code.

Small improvements made consistently create exceptional software.

## The 1% Rule

When working on Genvilo, always look for an opportunity to make the product 1% better than requested.

Small improvements are encouraged when they:

- do not increase complexity
- do not break existing features
- improve usability
- improve consistency
- improve visual polish

Over hundreds of iterations, these small improvements create an exceptional product.

