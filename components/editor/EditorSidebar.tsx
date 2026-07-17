"use client";

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
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/95 p-3 text-sm text-slate-300 shadow-xl">
    <div className="mb-4 space-y-2">
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
        onToolbarPanelChange(
          isActive
            ? null
            : (tool.id as
                | "media"
                | "text"
                | "arrange"
                | "effects")
        )
      }
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-left font-semibold transition ${
        isActive
          ? "border-blue-400/60 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 text-white shadow-[0_0_18px_rgba(59,130,246,0.25)]"
          : "border-white/10 bg-slate-800 text-slate-300 hover:border-white/20 hover:bg-slate-700"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg">
        {tool.icon}
      </span>

      <span className="flex-1">{tool.label}</span>

      <span
        className={`text-lg transition-transform ${
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
<div className="mt-3 rounded-xl border border-white/10 bg-slate-800/60 p-3">
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
<div className="mt-3 rounded-xl border border-white/10 bg-slate-800/60 p-3">
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

      <div className="mt-4 flex items-center gap-2">
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
