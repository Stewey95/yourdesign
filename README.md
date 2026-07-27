# Gripix — Canva-Style Design Platform

> **Gripix** is a Next.js TypeScript design platform featuring a high-performance Canva-style interactive editor. Built for creators to create, organize, and export digital products effortlessly.

---

## 📚 Living Project Documentation

The `/docs` directory serves as the single source of truth for Gripix development, architecture, product philosophy, and engineering standards:

- **[Master Plan](docs/MASTER_PLAN.md)**: Mission, business vision, product philosophy, 1% rule, and editor protection rules.
- **[Roadmap](docs/ROADMAP.md)**: Product development roadmap categorized by completion status (✅ Complete, 🚧 In Progress, 📋 Planned, 💡 Future).
- **[Playbook](docs/PLAYBOOK.md)**: The 12-step standard development, testing, and shipping workflow.
- **[Engineering Standards](docs/ENGINEERING.md)**: Architecture principles, directory structure, state coordination, testing, performance, and accessibility.
- **[UX Principles](docs/UX_PRINCIPLES.md)**: Long-term UX design philosophy focusing on simplicity, speed, clarity, premium spacing, and mobile equality.
- **[System Architecture](docs/ARCHITECTURE.md)**: High-level architectural layout, state coordinator model, viewport math, and subsystems.
- **[Changelog](docs/CHANGELOG.md)**: Verified historical changelog compiled strictly from git commit history.
- **[Polish Backlog](docs/POLISH_BACKLOG.md)**: Structured UX and technical backlog for continuous refinement.

---

## ✨ Features

- 🎨 **Canva-Style Design Editor**: Full-screen dedicated workspace at `/create` for creating graphics, text layouts, and digital product assets.
- 📐 **Preset Canvas Dimensions**: One-click canvas presets (`Instagram Post`, `Story`, `Logo`, `Flyer`, `Presentation`) and custom dimensions.
- 🔤 **Searchable Typography**: Integrated `FontPicker` with real-time font search, custom text styling, font previews, and caret placement.
- 🔷 **Vector Elements Catalog**: Rich library of editable SVG elements (`rectangles`, `circles`, `stars`, `hearts`, `badges`) with stroke/fill customization.
- 📑 **Layers Subsystem**: Comprehensive desktop and mobile layers inspector supporting layer ordering, lock controls (`isLocked`), and visibility toggles (`hidden`).
- 🔍 **Smooth Pan & Zoom Viewport**: Responsive zoom controls (`Fit`, `Fill`, percentage input), desktop hand-panning, and mobile two-finger touch gesture ownership.
- 📤 **Multi-Format Export**: High-resolution client-side export to PNG (with transparency), JPG, and PDF with iOS Safari fallbacks.
- 💾 **Local Draft Persistence**: Automatic `localStorage` autosave with instant state recovery on page reload.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19, Tailwind CSS 4, Radix UI, Lucide Icons
- **State Coordination**: Custom transactional state history (`useEditorHistory`)
- **Export Pipeline**: html-to-image, HTML5 Canvas rendering engine, jsPDF

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the homepage, or navigate to [http://localhost:3000/create](http://localhost:3000/create) to open the editor.

### 3. Verification Commands
```bash
# Run ESLint check
npm run lint

# Run TypeScript compilation check
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## 📄 License

Private repository. All rights reserved.
