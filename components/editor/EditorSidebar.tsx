"use client";

import { useRef } from "react";

type ToolbarPanel =
  | "media"
  | "text"
  | "arrange"
  | "effects"
  | null;

type EditorSidebarProps = {
  activeToolbarPanel: ToolbarPanel;
  onToolbarPanelChange: (panel: ToolbarPanel) => void;
  onImageUpload: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onAddText: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canDelete: boolean;
  onDelete: () => void;
};

export default function EditorSidebar({
  activeToolbarPanel,
  onToolbarPanelChange,
  onImageUpload,
  onAddText,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  canDelete,
  onDelete,
}: EditorSidebarProps) {
  const mediaPanelRef = useRef<HTMLDivElement | null>(null);
  const textPanelRef = useRef<HTMLDivElement | null>(null);

  const openToolbarPanel = (
    panel: Exclude<ToolbarPanel, null>,
    isActive: boolean
  ) => {
    onToolbarPanelChange(isActive ? null : panel);

    if (
      isActive ||
      (panel !== "media" && panel !== "text") ||
      window.matchMedia("(min-width: 768px)").matches
    ) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const panelElement =
          panel === "media"
            ? mediaPanelRef.current
            : textPanelRef.current;

        panelElement?.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      });
    });
  };

  return (
    <div
      data-editor-retain-selection
      data-editor-keep-zoom-hud-open
      className="rounded-2xl border border-white/10 bg-slate-900/95 p-3 text-sm text-slate-300 shadow-xl md:flex md:h-full md:min-h-0 md:flex-col md:overflow-hidden"
    >
    <div className="md:min-h-0 md:flex-1 md:overflow-y-auto">
    <div className="sticky top-[calc(7rem+env(safe-area-inset-top))] z-30 -mx-1 mb-4 grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-slate-900/95 p-2 shadow-lg backdrop-blur-xl md:static md:mx-0 md:block md:space-y-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
{[
  { id: "media", icon: "🖼️", label: "Media" },
  { id: "text", icon: "T", label: "Text" },
  { id: "arrange", icon: "▱", label: "Arrange" },
  { id: "effects", icon: "✨", label: "Effects" },
].map((tool) => {
  const isActive = activeToolbarPanel === tool.id;

  return (
    <button
      key={tool.id}
      type="button"
      onClick={() =>
        openToolbarPanel(
          tool.id as Exclude<ToolbarPanel, null>,
          isActive
        )
      }
      className={`flex min-w-0 w-full cursor-pointer flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center text-xs font-semibold transition md:flex-row md:gap-3 md:px-3 md:py-3 md:text-left md:text-sm ${
        isActive
          ? "border-blue-400/60 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 text-white shadow-[0_0_18px_rgba(59,130,246,0.25)]"
          : "border-white/10 bg-slate-800 text-slate-300 hover:border-white/20 hover:bg-slate-700"
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base md:h-9 md:w-9 md:text-lg">
        {tool.icon}
      </span>

      <span className="min-w-0 truncate md:flex-1">{tool.label}</span>

      <span
        className={`hidden text-lg transition-transform md:inline ${
          isActive ? "rotate-90" : ""
        }`}
      >
        ›
      </span>
    </button>
  );
})}
</div>
       {activeToolbarPanel === "media" && (
<div
  ref={mediaPanelRef}
  className="mt-3 scroll-mt-[calc(12rem+env(safe-area-inset-top))] rounded-xl border border-white/10 bg-slate-800/60 p-3 md:scroll-mt-0"
>
  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-400">
    Media
  </p>
<label className="flex h-10 w-full cursor-pointer select-none items-center justify-center rounded-lg bg-blue-600 px-4 font-semibold text-white">
  Upload Image

  <input
    type="file"
    accept="image/*"
    onChange={onImageUpload}
    className="hidden"
  />
</label>
</div>
)}

      {activeToolbarPanel === "text" && (
<div
  ref={textPanelRef}
  className="mt-3 scroll-mt-[calc(12rem+env(safe-area-inset-top))] rounded-xl border border-white/10 bg-slate-800/60 p-3 md:scroll-mt-0"
>
  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-400">
    Text
  </p>
<button
  onClick={onAddText}
  className="w-full cursor-pointer rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white transition hover:bg-slate-600"
>
  Add Text
</button>
</div>
)}
    </div>

      <div className="mt-4 flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-lg font-bold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Undo"
          title="Undo"
        >
          ↶
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-lg font-bold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Redo"
          title="Redo"
        >
          ↷
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          className="ml-auto cursor-pointer rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete
        </button>
      </div>

      
    </div>
  );
}
