"use client";

import { useState } from "react";
import Link from "next/link";
import { Folder, Pencil, Check } from "lucide-react";

type EditorHeaderProps = {
  projectTitle: string;
  onTitleChange: (newTitle: string) => void;
  onOpenProjects: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewDesign: () => void;
  onExport: () => void;
};

export default function EditorHeader({
  projectTitle,
  onTitleChange,
  onOpenProjects,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewDesign,
  onExport,
}: EditorHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectTitle);

  const handleStartEditing = () => {
    setTitleInput(projectTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onTitleChange(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      data-editor-retain-selection
      className="mb-4 flex flex-wrap items-center justify-between gap-2 md:mb-1"
    >
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/brand/genvilo-icon-master.png"
            alt="Gripix"
            className="h-8 w-8 object-contain md:h-9 md:w-9"
          />
          <span className="hidden bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-base font-extrabold text-transparent sm:inline md:text-lg">
            Gripix
          </span>
        </Link>

        {/* Separator */}
        <span className="hidden text-slate-600 sm:inline">/</span>

        {/* Dynamic Project Title Inline Input */}
        <div className="flex items-center gap-1.5">
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                onBlur={handleSaveTitle}
                autoFocus
                className="max-w-[140px] rounded border border-cyan-400 bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white focus:outline-none sm:max-w-[220px] sm:text-sm"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="cursor-pointer text-cyan-400 hover:text-white"
                title="Save Title"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartEditing}
              className="group flex cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-2 py-1 text-xs font-bold text-slate-100 transition hover:border-white/10 hover:bg-slate-800 sm:text-sm"
              title="Click to rename design"
            >
              <span className="max-w-[120px] truncate sm:max-w-[200px]">
                {projectTitle || "Untitled Design"}
              </span>
              <Pencil
                size={13}
                className="text-slate-400 opacity-60 transition group-hover:text-cyan-400 group-hover:opacity-100"
              />
            </button>
          )}
        </div>
      </div>

      {/* Header Tools */}
      <div className="flex items-center gap-2">
        {/* Saved Projects Button */}
        <button
          type="button"
          onClick={onOpenProjects}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:px-3 sm:text-sm"
          title="Open Saved Projects"
        >
          <Folder size={14} />
          <span className="hidden sm:inline">Projects</span>
        </button>

        {/* New Design Button */}
        <button
          type="button"
          onClick={onNewDesign}
          aria-label="New Design"
          title="New Design"
          className="cursor-pointer whitespace-nowrap rounded-lg border border-purple-400/40 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-200 transition hover:border-purple-300/60 hover:bg-purple-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:px-3 sm:text-sm"
        >
          New Design
        </button>

        {/* Undo / Redo */}
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

        {/* Export Button */}
        <button
          type="button"
          onClick={onExport}
          className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-500 sm:text-sm"
        >
          Export
        </button>
      </div>
    </div>
  );
}
