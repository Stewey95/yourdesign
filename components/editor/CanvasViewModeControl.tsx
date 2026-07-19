"use client";

import { useEffect, useRef, useState } from "react";
import ZoomPercentageInput from "./ZoomPercentageInput";

export type CanvasViewMode = "fit" | "fill";

type CanvasViewModeControlProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (zoom: number) => void;
  onFit: () => void;
  onFill: () => void;
};

const zoomPresets = [25, 50, 75, 100, 150, 200, 300, 500];

export default function CanvasViewModeControl({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onFit,
  onFill,
}: CanvasViewModeControlProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        !containerRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      setMenuOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const protectPointer = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const selectMenuAction = (action: () => void) => {
    action();
    setMenuOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <div
      ref={containerRef}
      data-editor-retain-selection
      className="relative flex h-10 items-center rounded-xl border border-white/10 bg-slate-900/95 p-1 shadow-lg"
      aria-label="Canvas zoom controls"
    >
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        onPointerDown={protectPointer}
        onClick={onZoomOut}
        disabled={zoom <= 0.25}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
      >
        −
      </button>
      <ZoomPercentageInput
        zoom={zoom}
        onApply={onZoomChange}
        className="h-8 w-14 rounded-lg bg-transparent px-1 text-center text-[11px] font-semibold tabular-nums text-slate-300 outline-none transition hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        onPointerDown={protectPointer}
        onClick={onZoomIn}
        disabled={zoom >= 5}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
      >
        +
      </button>
      <div className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open zoom presets"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title="Zoom presets"
        onPointerDown={protectPointer}
        onClick={() => setMenuOpen((open) => !open)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        ▼
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.375rem)] z-[70] w-32 overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-1.5 text-xs text-slate-200 shadow-2xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => selectMenuAction(onFit)}
            className="block w-full rounded-lg px-3 py-2 text-left font-semibold hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Fit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => selectMenuAction(onFill)}
            className="block w-full rounded-lg px-3 py-2 text-left font-semibold hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Fill
          </button>
          <div className="my-1 h-px bg-white/10" aria-hidden="true" />
          {zoomPresets.map((percentage) => (
            <button
              key={percentage}
              type="button"
              role="menuitem"
              onClick={() =>
                selectMenuAction(() => onZoomChange(percentage / 100))
              }
              className="block w-full rounded-lg px-3 py-1.5 text-left tabular-nums hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {percentage}%
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
