"use client";

import { useEffect, useRef, useState } from "react";
import ZoomPercentageInput from "./ZoomPercentageInput";

export type CanvasViewMode = "fit" | "fill";

type CanvasViewModeControlProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (zoom: number) => void;
  onCenter: () => void;
};

const zoomPresets = [25, 50, 75, 100, 150, 200, 300, 500];

export default function CanvasViewModeControl({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onCenter,
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
      <div
        className="flex h-8 w-[76px] items-center rounded-lg bg-transparent pl-2 transition hover:bg-slate-800"
        title="Canvas zoom"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-3.5 w-3.5 shrink-0 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="8.5" cy="8.5" r="5" />
          <path d="m12.2 12.2 4 4" strokeLinecap="round" />
        </svg>
        <ZoomPercentageInput
          zoom={zoom}
          onApply={onZoomChange}
          className="h-8 min-w-0 flex-1 rounded-lg bg-transparent px-1 text-center text-[11px] font-semibold tabular-nums text-slate-300 outline-none transition hover:text-white focus:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
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
        type="button"
        aria-label="Centre canvas"
        title="Centre canvas"
        onPointerDown={protectPointer}
        onClick={onCenter}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-base font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span aria-hidden="true">⌖</span>
      </button>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open canvas zoom options"
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
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Canvas zoom
          </div>
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
