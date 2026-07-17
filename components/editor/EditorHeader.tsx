"use client";

type EditorHeaderProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export default function EditorHeader({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: EditorHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
  <img
    src="/brand/genvilo-icon-master.png"
    alt="Genvilo"
    className="h-9 w-9 object-contain"
  />

  <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-lg font-extrabold text-transparent">
    Editor
  </span>
</div>

       <div className="flex items-center gap-2">
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

  <button className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1 text-sm text-white">
    Export
  </button>
</div>
    </div>
  );
}
