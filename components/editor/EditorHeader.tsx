"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Folder,
  Pencil,
  Plus,
  Redo2,
  Undo2,
} from "lucide-react";

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
      className="editor-motion mb-4 flex min-w-0 flex-wrap items-center justify-between gap-2 md:mb-2 md:min-h-9 md:flex-nowrap"
    >
      {/* Brand Logo & Title */}
      <div className="flex min-w-0 items-center gap-2.5">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <img
            src="/brand/genvilo-icon-master.png"
            alt="Gripix"
            className="h-8 w-8 object-contain md:h-8 md:w-8"
          />
          <span className="hidden bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-base font-bold tracking-tight text-transparent sm:inline">
            Gripix
          </span>
        </Link>

        {/* Separator */}
        <span className="hidden text-slate-700 sm:inline">/</span>

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
                className="h-8 max-w-[140px] rounded-lg border border-cyan-400/60 bg-slate-900 px-2 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-cyan-400/40 sm:max-w-[220px] sm:text-sm"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="editor-toolbar-control flex h-8 w-8 cursor-pointer items-center justify-center"
                title="Save Title"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartEditing}
              className="group flex h-8 min-w-0 cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-2 text-xs font-semibold text-slate-100 transition hover:border-[var(--editor-border-subtle)] hover:bg-[var(--editor-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 sm:text-sm"
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
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {/* Document utilities */}
        <button
          type="button"
          onClick={onOpenProjects}
          className="editor-document-action flex cursor-pointer items-center gap-1.5 border border-[var(--editor-border-subtle)] bg-[var(--editor-elevated)] px-2.5 text-slate-200 hover:border-white/20 hover:bg-[var(--editor-hover)] sm:px-3"
          title="Open Saved Projects"
        >
          <Folder size={15} aria-hidden="true" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        {/* New Design Button */}
        <button
          type="button"
          onClick={onNewDesign}
          aria-label="New Design"
          title="New Design"
          className="editor-document-action flex cursor-pointer items-center gap-1.5 whitespace-nowrap border border-[var(--editor-border-subtle)] bg-transparent px-2.5 text-slate-300 hover:border-white/20 hover:bg-[var(--editor-elevated)] hover:text-white sm:px-3"
        >
          <Plus size={15} aria-hidden="true" className="hidden sm:block" />
          <span>New Design</span>
        </button>

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="editor-toolbar-control flex h-8 w-8 cursor-pointer items-center justify-center"
          aria-label="Undo"
          title="Undo"
        >
          <Undo2 size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="editor-toolbar-control flex h-8 w-8 cursor-pointer items-center justify-center"
          aria-label="Redo"
          title="Redo"
        >
          <Redo2 size={15} aria-hidden="true" />
        </button>

        <div
          className="mx-0.5 h-5 w-px bg-[var(--editor-border-subtle)]"
          aria-hidden="true"
        />

        {/* Primary document action */}
        <button
          type="button"
          onClick={onExport}
          className="editor-document-action cursor-pointer bg-blue-600 px-3.5 text-white shadow-[0_5px_14px_rgb(37_99_235/0.2)] hover:bg-blue-500"
        >
          Export
        </button>
      </div>
    </div>
  );
}
