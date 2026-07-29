"use client";

import { Copy } from "lucide-react";
import { useRef } from "react";
import type {
  CanvasPresetId,
  CanvasSize,
} from "./editor.constants";
import CanvasSizePanel from "./CanvasSizePanel";
import ElementsPanel from "./ElementsPanel";
import ProjectsPanel from "./ProjectsPanel";
import TemplatesPanel from "./TemplatesPanel";
import type { ElementAsset } from "./elements/element.types";
import type { Template } from "../../lib/templates/templates.types";
import type { ProjectRecord } from "../../lib/projects/projects.types";

export type ToolbarPanel =
  | "projects"
  | "templates"
  | "media"
  | "text"
  | "elements"
  | "arrange"
  | null;

type EditorSidebarProps = {
  activeToolbarPanel: ToolbarPanel;
  onToolbarPanelChange: (panel: ToolbarPanel) => void;
  activeProjectId: string | null;
  projectTitle?: string;
  onSelectProject: (project: ProjectRecord) => void;
  onNewProject: () => void;
  onImageUpload: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onAddText: () => void;
  onAddElement: (element: ElementAsset) => void;
  onSelectTemplate: (template: Template) => void;
  canvasSize: CanvasSize;
  selectedCanvasPresetId: CanvasPresetId;
  onCanvasSizeChange: (
    presetId: CanvasPresetId,
    size: CanvasSize
  ) => void;
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
  activeProjectId,
  projectTitle,
  onSelectProject,
  onNewProject,
  onImageUpload,
  onAddText,
  onAddElement,
  onSelectTemplate,
  canvasSize,
  selectedCanvasPresetId,
  onCanvasSizeChange,
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
  const projectsPanelRef = useRef<HTMLDivElement | null>(null);
  const templatesPanelRef = useRef<HTMLDivElement | null>(null);
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
        if (window.matchMedia("(min-width: 768px)").matches) {
          scrollContainerRef.current?.scrollTo({ top: 0 });
          return;
        }

        const panelElement =
          panel === "projects"
            ? projectsPanelRef.current
            : panel === "templates"
            ? templatesPanelRef.current
            : panel === "media"
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
      className="min-w-0 max-w-full rounded-2xl border border-white/10 bg-slate-900/95 p-3 text-sm text-slate-300 shadow-xl md:flex md:h-full md:min-h-0 md:flex-col md:overflow-hidden"
    >
      <div className="sticky top-[calc(7rem+env(safe-area-inset-top))] z-30 -mx-1 mb-4 grid grid-cols-6 gap-1 rounded-xl border border-white/10 bg-slate-900/95 p-1.5 shadow-lg backdrop-blur-xl md:static md:mx-0 md:block md:shrink-0 md:space-y-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
        {[
          { id: "projects", icon: "📁", label: "Projects" },
          { id: "templates", icon: "🎨", label: "Templates" },
          { id: "media", icon: "🖼️", label: "Media" },
          { id: "text", icon: "T", label: "Text" },
          { id: "elements", icon: "✦", label: "Elements" },
          { id: "arrange", icon: "▱", label: "Arrange" },
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
              className={`flex min-w-0 w-full cursor-pointer flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center text-xs font-semibold transition md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-left md:text-sm ${
                isActive
                  ? "border-cyan-400/60 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 text-white shadow-[0_0_18px_rgba(6,182,212,0.25)]"
                  : "border-white/10 bg-slate-800 text-slate-300 hover:border-white/20 hover:bg-slate-700"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base md:h-8 md:w-8 md:text-base">
                {tool.icon}
              </span>

              <span className="min-w-0 truncate text-[11px] md:flex-1 md:text-sm">
                {tool.label}
              </span>

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

      <div
        ref={scrollContainerRef}
        className="min-w-0 max-w-full md:min-h-0 md:flex-1 md:overflow-y-auto md:pb-3 md:pr-1 md:[scrollbar-color:rgba(100,116,139,0.75)_rgba(15,23,42,0.35)] md:[scrollbar-width:thin] md:[&::-webkit-scrollbar]:w-1.5 md:[&::-webkit-scrollbar-track]:rounded-full md:[&::-webkit-scrollbar-track]:bg-slate-900/40 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-slate-500/70"
      >
        {activeToolbarPanel === "projects" && (
          <div ref={projectsPanelRef}>
            <ProjectsPanel
              activeProjectId={activeProjectId}
              projectTitle={projectTitle}
              onSelectProject={onSelectProject}
              onNewProject={onNewProject}
            />
          </div>
        )}

        {activeToolbarPanel === "templates" && (
          <div ref={templatesPanelRef}>
            <TemplatesPanel onSelectTemplate={onSelectTemplate} />
          </div>
        )}

        {activeToolbarPanel === "media" && (
          <div
            ref={mediaPanelRef}
            className="mt-3 scroll-mt-[calc(12rem+env(safe-area-inset-top))] rounded-xl border border-white/10 bg-slate-800/60 p-3 md:mt-0 md:scroll-mt-0"
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-400">
              Media
            </p>
            <label className="flex h-10 w-full cursor-pointer select-none items-center justify-center rounded-lg bg-blue-600 px-4 font-semibold text-white transition hover:bg-blue-500">
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
            className="mt-3 scroll-mt-[calc(12rem+env(safe-area-inset-top))] rounded-xl border border-white/10 bg-slate-800/60 p-3 md:mt-0 md:scroll-mt-0"
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-400">
              Text
            </p>
            <button
              type="button"
              onClick={onAddText}
              className="w-full cursor-pointer rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white transition hover:bg-slate-600"
            >
              Add Text
            </button>
          </div>
        )}

        {activeToolbarPanel === "elements" && (
          <div
            ref={elementsPanelRef}
            className="mt-3 scroll-mt-[calc(12rem+env(safe-area-inset-top))] rounded-xl border border-white/10 bg-slate-800/60 p-3 md:mt-0 md:scroll-mt-0"
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-400">
              Elements
            </p>
            <ElementsPanel onInsertElement={onAddElement} />
          </div>
        )}

        {activeToolbarPanel === "arrange" && (
          <div
            ref={arrangePanelRef}
            className="mt-3 scroll-mt-[calc(12rem+env(safe-area-inset-top))] rounded-xl border border-white/10 bg-slate-800/60 p-3 md:mt-0 md:scroll-mt-0"
          >
            <CanvasSizePanel
              key={`${canvasSize.width}x${canvasSize.height}`}
              canvasSize={canvasSize}
              selectedPresetId={selectedCanvasPresetId}
              onApply={onCanvasSizeChange}
            />
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
