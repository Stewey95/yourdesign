"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_VIEWPORT_ZOOM,
  MIN_VIEWPORT_ZOOM,
} from "./editor.viewport";
import ZoomPercentageInput from "./ZoomPercentageInput";

type MobileCanvasZoomHudProps = {
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onZoomChange: (zoom: number) => void;
  onFit: () => void;
  onReset: () => void;
};

export default function MobileCanvasZoomHud({
  zoom,
  onZoomOut,
  onZoomIn,
  onZoomChange,
  onFit,
  onReset,
}: MobileCanvasZoomHudProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      const container = containerRef.current;
      const startedInsideHud = Boolean(
        container && event.composedPath().includes(container)
      );

      if (
        !startedInsideHud &&
        target instanceof Node &&
        !container?.contains(target) &&
        !(
          target instanceof Element &&
          target.closest("[data-editor-keep-zoom-hud-open]")
        )
      ) {
        setExpanded(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);

    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [expanded]);

  const protectPointer = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };
  const protectButtonPointer = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      ref={containerRef}
      data-editor-retain-selection
      data-editor-keep-zoom-hud-open
      onPointerDown={protectPointer}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      className="relative z-[60] flex min-h-11 justify-end pb-2 pl-2 pr-[max(0.5rem,env(safe-area-inset-right))] md:hidden"
    >
      {!expanded ? (
        <button
          type="button"
          onPointerDown={protectButtonPointer}
          onClick={() => setExpanded(true)}
          className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/95 px-3 text-xs font-bold tabular-nums text-white shadow-xl backdrop-blur-xl"
          aria-label="Canvas zoom"
          title="Canvas zoom"
        >
          <ZoomIcon />
          {Math.round(zoom * 100)}%
        </button>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-slate-900/95 p-2 text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            <ZoomIcon />
            Canvas zoom
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onPointerDown={protectButtonPointer}
              disabled={zoom <= MIN_VIEWPORT_ZOOM}
              onClick={onZoomOut}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-bold transition active:bg-slate-600 disabled:opacity-40"
              aria-label="Zoom out"
            >
              −
            </button>
            <ZoomPercentageInput
              zoom={zoom}
              onApply={onZoomChange}
              focusOnPointerDown
              buttonClassName="text-xs"
              inputClassName="text-base"
              className="h-9 w-16 rounded-full bg-slate-700 px-2 text-center font-bold tabular-nums text-white outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onPointerDown={protectButtonPointer}
              disabled={zoom >= MAX_VIEWPORT_ZOOM}
              onClick={onZoomIn}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-bold transition active:bg-slate-600 disabled:opacity-40"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onPointerDown={protectButtonPointer}
              onClick={() => {
                onReset();
                setExpanded(false);
              }}
              className="h-9 rounded-full bg-slate-700 px-3 text-xs font-bold transition active:bg-slate-600"
              aria-label="Reset canvas zoom to 100%"
            >
              100%
            </button>
            <button
              type="button"
              onPointerDown={protectButtonPointer}
              onClick={() => {
                onFit();
                setExpanded(false);
              }}
              className="h-9 rounded-full bg-blue-600 px-3 text-xs font-bold transition active:bg-blue-500"
              aria-label="Fit canvas to workspace"
            >
              Fit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ZoomIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="8.5" cy="8.5" r="5" />
      <path d="m12.2 12.2 4 4" strokeLinecap="round" />
    </svg>
  );
}
