"use client";

export type CanvasViewMode = "fit" | "fill";

type CanvasViewModeControlProps = {
  mode: CanvasViewMode;
  zoom: number;
  onChange: (mode: CanvasViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
};

export default function CanvasViewModeControl({
  mode,
  zoom,
  onChange,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
}: CanvasViewModeControlProps) {
  const stopPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      data-editor-retain-selection
      className="flex h-10 items-center rounded-xl border border-white/10 bg-slate-900/95 p-1 shadow-lg"
      aria-label="Canvas viewport controls"
    >
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        onPointerDown={stopPointerDown}
        onClick={onZoomOut}
        disabled={zoom <= 0.25}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
      >
        −
      </button>
      <span
        aria-live="polite"
        className="w-11 text-center text-[10px] font-semibold text-slate-400"
      >
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        onPointerDown={stopPointerDown}
        onClick={onZoomIn}
        disabled={zoom >= 5}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
      >
        +
      </button>
      <button
        type="button"
        aria-label="Reset zoom to 100%"
        title="Reset zoom to 100%"
        onPointerDown={stopPointerDown}
        onClick={onReset}
        className="h-8 rounded-lg px-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
      >
        100%
      </button>
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
            onClick={() => {
              if (viewMode === "fit") {
                onFit();
              } else {
                onChange(viewMode);
              }
            }}
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
