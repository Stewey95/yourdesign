"use client";

import {
  ChevronRight,
  Copy,
  Folder,
  Image,
  LayoutTemplate,
  PanelsTopLeft,
  Shapes,
  Type,
  Redo2,
  Undo2,
} from "lucide-react";
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
  projectsRevision: number;
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
  projectsRevision,
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

        // Desktop keeps sidebar scrolling self-contained, so opening a
        // lower accordion section never scrolls the editor canvas/page.
        if (window.matchMedia("(min-width: 768px)").matches) {
          const scrollContainer = scrollContainerRef.current;
          if (!scrollContainer) return;

          scrollContainer.scrollTo({
            top: Math.max(0, panelElement.offsetTop - 8),
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          });
          return;
        }

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
      className="editor-floating-panel min-w-0 max-w-full rounded-xl p-3 text-sm text-slate-300 md:flex md:h-full md:min-h-0 md:flex-col md:overflow-hidden"
    >
      <div
        ref={scrollContainerRef}
        className="editor-scrollbar min-w-0 max-w-full md:min-h-0 md:flex-1 md:overflow-y-auto md:pb-3 md:pr-1"
      >
        <div className="grid grid-cols-6 gap-1 rounded-xl border border-white/10 bg-slate-900/95 p-1.5 shadow-lg backdrop-blur-xl md:block md:space-y-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
          {[
            { id: "projects", icon: Folder, label: "Projects" },
            { id: "templates", icon: LayoutTemplate, label: "Templates" },
            { id: "media", icon: Image, label: "Media" },
            { id: "text", icon: Type, label: "Text" },
            { id: "elements", icon: Shapes, label: "Elements" },
            { id: "arrange", icon: PanelsTopLeft, label: "Arrange" },
          ].map((tool) => {
            const panelId = tool.id as Exclude<ToolbarPanel, null>;
            const isActive = activeToolbarPanel === panelId;
            const ToolIcon = tool.icon;
            const panelRef =
              panelId === "projects"
                ? projectsPanelRef
                : panelId === "templates"
                  ? templatesPanelRef
                  : panelId === "media"
                    ? mediaPanelRef
                    : panelId === "text"
                      ? textPanelRef
                      : panelId === "elements"
                        ? elementsPanelRef
                        : arrangePanelRef;

            return (
              <div key={panelId} className="contents md:block">
                <button
                  type="button"
                  onClick={() => openToolbarPanel(panelId, isActive)}
                  className={`flex min-w-0 w-full cursor-pointer flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center text-xs font-semibold transition md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-left md:text-sm ${
                    isActive
                      ? "border-cyan-400/45 bg-[var(--editor-selected)] text-white shadow-[0_8px_22px_rgb(2_6_23/0.2)]"
                      : "border-white/10 bg-slate-800/70 text-slate-300 hover:border-white/20 hover:bg-slate-700/80"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base md:h-8 md:w-8 md:text-base">
                    <ToolIcon size={16} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 truncate text-[11px] md:flex-1 md:text-sm">
                    {tool.label}
                  </span>
                  <ChevronRight
                    size={15}
                    aria-hidden="true"
                    className={`hidden transition-transform md:inline ${
                      isActive ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {isActive && (
                  <div
                    ref={panelRef}
                    data-sidebar-panel={panelId}
                    className="col-span-full mt-2 min-w-0 rounded-xl border border-white/10 bg-slate-800/60 p-3 md:mt-2"
                  >
                    {panelId === "projects" && (
                      <ProjectsPanel
                        activeProjectId={activeProjectId}
                        projectsRevision={projectsRevision}
                        onSelectProject={onSelectProject}
                        onNewProject={onNewProject}
                      />
                    )}
                    {panelId === "templates" && (
                      <TemplatesPanel onSelectTemplate={onSelectTemplate} />
                    )}
                    {panelId === "media" && (
                      <>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                          Media
                        </p>
                        <label className="flex h-10 w-full cursor-pointer select-none items-center justify-center rounded-lg bg-blue-600 px-4 font-semibold text-white transition hover:bg-blue-500">
                          Upload Image
                          <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
                        </label>
                      </>
                    )}
                    {panelId === "text" && (
                      <>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                          Text
                        </p>
                        <button type="button" onClick={onAddText} className="w-full cursor-pointer rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white transition hover:bg-slate-600">
                          Add Text
                        </button>
                      </>
                    )}
                    {panelId === "elements" && (
                      <>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                          Elements
                        </p>
                        <ElementsPanel onInsertElement={onAddElement} />
                      </>
                    )}
                    {panelId === "arrange" && (
                      <CanvasSizePanel
                        key={`${canvasSize.width}x${canvasSize.height}`}
                        canvasSize={canvasSize}
                        selectedPresetId={selectedCanvasPresetId}
                        onApply={onCanvasSizeChange}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="editor-panel-control flex h-8 w-8 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Undo"
          title="Undo"
        >
          <Undo2 size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="editor-panel-control flex h-8 w-8 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Redo"
          title="Redo"
        >
          <Redo2 size={15} aria-hidden="true" />
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
