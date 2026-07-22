"use client";

import { Copy } from "lucide-react";
import { useRef } from "react";
import {
  CANVAS_PRESETS,
  type CanvasPresetId,
} from "./editor.constants";
import ElementsPanel from "./ElementsPanel";
import type { ElementAsset } from "./elements/element.types";

type ToolbarPanel =
  | "media"
  | "text"
  | "arrange"
  | "elements"
  | null;

type EditorSidebarProps = {
  activeToolbarPanel: ToolbarPanel;
  onToolbarPanelChange: (panel: ToolbarPanel) => void;
  onImageUpload: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onAddText: () => void;
  onAddElement: (element: ElementAsset) => void;
  selectedCanvasPresetId: CanvasPresetId;
  onCanvasPresetChange: (presetId: CanvasPresetId) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canDuplicate: boolean;
  onDuplicate: () => void;
  canDelete: boolean;
  onDelete: () => void;
};

export default function EditorSidebar({
  activeToolbarPanel,
  onToolbarPanelChange,
  onImageUpload,
  onAddText,
  onAddElement,
  selectedCanvasPresetId,
  onCanvasPresetChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  canDuplicate,
  onDuplicate,
  canDelete,
  onDelete,
}: EditorSidebarProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const mediaPanelRef = useRef<HTMLDivElement | null>(null);
  const textPanelRef = useRef<HTMLDivElement | null>(null);
  const arrangePanelRef = useRef<HTMLDivElement | null>(null);
  const elementsPanelRef = useRef<HTMLDivElement | null>(null);

  const openToolbarPanel = (
    panel: Exclude<ToolbarPanel, null>,
    isActive: boolean
  ) => {
    onToolbarPanelChange(isActive ? null : panel);

    if (isActive) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const panelElement =
          panel === "media"
            ? mediaPanelRef.current
            : panel === "text"
              ? textPanelRef.current
              : panel === "arrange"
                ? arrangePanelRef.current
                : elementsPanelRef.current;

        if (!panelElement) return;

        const behavior = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth";

        if (window.matchMedia("(min-width: 768px)").matches) {
          scrollContainerRef.current?.scrollTo({
            top: panelElement.offsetTop - 8,
            behavior,
          });
          return;
        }

        panelElement.scrollIntoView({
          behavior,
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
    <div
      ref={scrollContainerRef}
      className="md:min-h-0 md:flex-1 md:overflow-y-auto"
    >
    <div className="sticky top-[calc(7rem+env(safe-area-inset-top))] z-30 -mx-1 mb-4 grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-slate-900/95 p-2 shadow-lg backdrop-blur-xl md:static md:mx-0 md:block md:space-y-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
{[
  { id: "media", icon: "🖼️", label: "Media" },
  { id: "text", icon: "T", label: "Text" },
  { id: "arrange", icon: "▱", label: "Arrange" },
  { id: "elements", icon: "✦", label: "Elements" },
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

      {activeToolbarPanel === "arrange" && (
        <div
          ref={arrangePanelRef}
          className="mt-3 scroll-mt-[calc(12rem+env(safe-area-inset-top))] rounded-xl border border-white/10 bg-slate-800/60 p-3 md:scroll-mt-0"
        >
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-400">
            Canvas size
          </p>
          <p className="mb-3 text-xs text-slate-400">
            Choose your design format
          </p>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
            {CANVAS_PRESETS.map((preset) => {
              const selected = selectedCanvasPresetId === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={`Use ${preset.label} canvas, ${preset.width} by ${preset.height}`}
                  aria-pressed={selected}
                  onClick={() => onCanvasPresetChange(preset.id)}
                  className={`flex min-w-0 flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 md:flex-row md:text-left ${
                    selected
                      ? "border-blue-400/60 bg-blue-500/20 text-white"
                      : "border-white/10 bg-slate-700/70 text-slate-300 hover:border-white/20 hover:bg-slate-700"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-10 shrink-0 items-center justify-center"
                  >
                    <span
                      className={`block max-h-8 max-w-10 rounded-sm border ${
                        selected
                          ? "border-blue-300 bg-blue-300/15"
                          : "border-slate-400 bg-white/5"
                      }`}
                      style={{
                        width:
                          preset.width >= preset.height
                            ? 32
                            : 32 * (preset.width / preset.height),
                        height:
                          preset.height >= preset.width
                            ? 32
                            : 32 * (preset.height / preset.width),
                      }}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">
                      {preset.label}
                    </span>
                    <span className="block text-[10px] tabular-nums text-slate-400">
                      {preset.width} × {preset.height}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeToolbarPanel === "elements" && (
        <div
          ref={elementsPanelRef}
          className="mt-3 scroll-mt-[calc(12rem+env(safe-area-inset-top))] rounded-xl border border-white/10 bg-slate-800/60 p-3 md:flex md:h-[calc(100%_-_0.75rem)] md:min-h-[420px] md:flex-col md:scroll-mt-0"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-400">
            Elements
          </p>
          <ElementsPanel onInsertElement={onAddElement} />
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
          onClick={onDuplicate}
          disabled={!canDuplicate}
          className="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-white transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Duplicate selected item"
          title="Duplicate"
        >
          <Copy size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          className="cursor-pointer rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Delete selected item"
          title="Delete"
        >
          Delete
        </button>
      </div>

      
    </div>
  );
}
