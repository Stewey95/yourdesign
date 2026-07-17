"use client";

export default function EditorHeader() {
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
  <button className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1 text-sm text-white">
    Export
  </button>
</div>
    </div>
  );
}
