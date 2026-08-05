"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  FolderPlus,
  Pencil,
  Search,
  Trash2,
  X,
  Check,
} from "lucide-react";
import type { ProjectRecord } from "../../lib/projects/projects.types";
import {
  deleteProject,
  duplicateProject,
  filterProjects,
  getAllProjects,
  renameProject,
} from "../../lib/projects/projectsManager";
import ProjectThumbnail from "./ProjectThumbnail";

type ProjectsPanelProps = {
  activeProjectId: string | null;
  projectsRevision: number;
  onSelectProject: (project: ProjectRecord) => void;
  onNewProject: () => void;
};

function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function ProjectsPanel({
  activeProjectId,
  projectsRevision,
  onSelectProject,
  onNewProject,
}: ProjectsPanelProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const projectCardRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingSelectionAnchorRef = useRef<{
    projectId: string;
    viewportTop: number;
  } | null>(null);

  useLayoutEffect(() => {
    const pendingAnchor = pendingSelectionAnchorRef.current;

    if (!pendingAnchor || pendingAnchor.projectId !== activeProjectId) return;

    pendingSelectionAnchorRef.current = null;

    if (!window.matchMedia("(max-width: 767px)").matches) return;

    const selectedCard = projectCardRefs.current.get(pendingAnchor.projectId);

    if (!selectedCard) return;

    const viewportDelta =
      selectedCard.getBoundingClientRect().top - pendingAnchor.viewportTop;

    if (Math.abs(viewportDelta) > 0.5) {
      window.scrollBy({ top: viewportDelta, behavior: "auto" });
    }
  }, [activeProjectId]);

  const selectProject = (
    project: ProjectRecord,
    projectCard: HTMLDivElement | null
  ) => {
    if (project.id === activeProjectId) return;

    if (projectCard) {
      pendingSelectionAnchorRef.current = {
        projectId: project.id,
        viewportTop: projectCard.getBoundingClientRect().top,
      };
    }

    onSelectProject(project);
  };

  const loadProjectsList = async () => {
    const list = await getAllProjects();
    setProjects(list);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    void getAllProjects().then((list) => {
      if (active) {
        setProjects(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [projectsRevision]);

  const filteredProjects = useMemo(
    () => filterProjects(projects, searchQuery),
    [projects, searchQuery]
  );

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const dup = await duplicateProject(id);
    if (dup) {
      await loadProjectsList();
    }
  };

  const handleStartRename = (e: React.MouseEvent, project: ProjectRecord) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditingTitle(project.title);
  };

  const handleSaveRename = async (e: React.SyntheticEvent, id: string) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      await renameProject(id, editingTitle.trim());
      await loadProjectsList();
    }
    setEditingId(null);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteProject(id);
    setDeletingId(null);
    await loadProjectsList();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header Action */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
          Saved Projects ({projects.length})
        </p>
        <button
          type="button"
          onClick={onNewProject}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
        >
          <FolderPlus size={14} />
          <span>New Project</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved designs..."
          className="w-full rounded-xl border border-white/10 bg-slate-800/80 py-1.5 pl-8 pr-8 text-xs text-white placeholder-slate-400 transition focus:border-cyan-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Projects List Grid */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Loading saved projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 p-6 text-center">
          <p className="text-xs font-medium text-slate-400">
            {searchQuery
              ? `No designs match "${searchQuery}"`
              : "No saved projects yet"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Create your first custom design or select a starter template!
          </p>
          <button
            type="button"
            onClick={onNewProject}
            className="mt-3 cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            Create New Design
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-1">
          {filteredProjects.map((project) => {
            const isActive = project.id === activeProjectId;
            const isDeleting = deletingId === project.id;
            const isEditing = editingId === project.id;

            return (
              <div
                key={project.id}
                ref={(element) => {
                  if (element) {
                    projectCardRefs.current.set(project.id, element);
                  } else {
                    projectCardRefs.current.delete(project.id);
                  }
                }}
                onClick={(event) => selectProject(project, event.currentTarget)}
                className={`group relative cursor-pointer overflow-hidden rounded-xl border p-2.5 [-webkit-tap-highlight-color:transparent] focus-within:ring-1 focus-within:ring-cyan-400/50 ${
                  isActive
                    ? "border-cyan-400 bg-slate-800/50"
                    : "border-white/10 bg-slate-800/50 md:hover:border-white/20 md:hover:bg-slate-800"
                }`}
              >
                {/* Visual Thumbnail Preview */}
                <ProjectThumbnail project={project} />

                {/* Content Header */}
                <div className="mt-2.5 flex items-start justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1"
                      >
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(e, project.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          className="w-full rounded border border-cyan-400 bg-slate-900 px-1.5 py-0.5 text-xs font-semibold text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(e, project.id)}
                          className="cursor-pointer text-cyan-400 hover:text-white"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-xs font-bold text-slate-100">
                          {project.title}
                        </h4>
                        <span
                          aria-hidden={!isActive}
                          className={`shrink-0 rounded-full border px-1.5 py-0.2 text-[9px] font-extrabold ${
                            isActive
                              ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-300 opacity-100"
                              : "border-transparent text-transparent opacity-0"
                          }`}
                        >
                          Active
                        </span>
                      </div>
                    )}

                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>
                        {project.canvasSize.width}×{project.canvasSize.height}
                      </span>
                      <span>•</span>
                      <span>{project.items.length} items</span>
                      <span>•</span>
                      <span>{formatTimeAgo(project.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Toolbar Actions */}
                {isDeleting ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 flex items-center justify-between rounded-lg border border-red-500/40 bg-red-500/10 p-1.5 text-[11px]"
                  >
                    <span className="font-semibold text-red-300">Delete design?</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConfirm(e, project.id)}
                        className="cursor-pointer rounded bg-red-600 px-2 py-0.5 font-bold text-white transition hover:bg-red-500"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="cursor-pointer rounded bg-slate-700 px-2 py-0.5 font-medium text-slate-300 transition hover:bg-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        selectProject(
                          project,
                          event.currentTarget.closest<HTMLDivElement>(".group")
                        );
                      }}
                      className="cursor-pointer text-[11px] font-semibold text-cyan-400 transition hover:text-cyan-300"
                    >
                      {isActive ? "Currently Editing" : "Open Design →"}
                    </button>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(e, project)}
                        title="Rename"
                        className="cursor-pointer rounded p-1 transition hover:bg-white/10 hover:text-white"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(e, project.id)}
                        title="Duplicate"
                        className="cursor-pointer rounded p-1 transition hover:bg-white/10 hover:text-white"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(project.id);
                        }}
                        title="Delete"
                        className="cursor-pointer rounded p-1 transition hover:bg-red-500/20 hover:text-red-300"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
