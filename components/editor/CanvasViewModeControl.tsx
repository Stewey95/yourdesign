"use client";

export type CanvasViewMode = "fit" | "fill";

type CanvasViewModeControlProps = {
  mode: CanvasViewMode;
  onChange: (mode: CanvasViewMode) => void;
};

export default function CanvasViewModeControl({
  mode,
  onChange,
}: CanvasViewModeControlProps) {
  return (
    <div
      data-editor-retain-selection
      className="flex h-10 items-center rounded-xl border border-white/10 bg-slate-900/95 p-1 shadow-lg"
      aria-label="Canvas view mode"
    >
      {(["fit", "fill"] as const).map((viewMode) => {
        const active = mode === viewMode;
        const label = viewMode === "fit" ? "Fit" : "Fill";

        return (
          <button
            key={viewMode}
            type="button"
            aria-label={`${label} canvas to workspace`}
            aria-pressed={active}
            title={`${label} canvas to workspace`}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => onChange(viewMode)}
            className={`h-8 rounded-lg px-3 text-xs font-bold transition ${
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
