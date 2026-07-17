"use client";

import { useEffect, useRef, useState } from "react";
import {
  fontOptions,
  TEXT_FONT_SIZE_STEP,
} from "./editor.constants";
import type { TextDesignItem } from "./editor.types";

type TextToolbarProps = {
  item: TextDesignItem;
  canSendBackward: boolean;
  canBringForward: boolean;
  onChangeTextSize: (id: string, amount: number) => void;
  onRotateItem: (id: string, amount: number) => void;
  onMoveItemLayer: (
    id: string,
    direction: "forward" | "backward" | "front" | "back"
  ) => void;
  onChangeTextColor: (id: string, color: string) => void;
  onChangeTextFont: (id: string, fontFamily: string) => void;
};

export default function TextToolbar({
  item,
  canSendBackward,
  canBringForward,
  onChangeTextSize,
  onRotateItem,
  onMoveItemLayer,
  onChangeTextColor,
  onChangeTextFont,
}: TextToolbarProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(
    null
  );
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateScrollArrows = () => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) return;

    const maximumScrollLeft =
      scrollContainer.scrollWidth -
      scrollContainer.clientWidth;

    setShowLeftArrow(scrollContainer.scrollLeft > 0);
    setShowRightArrow(
      scrollContainer.scrollLeft < maximumScrollLeft - 1
    );
  };

  useEffect(() => {
    updateScrollArrows();

    window.addEventListener("resize", updateScrollArrows);

    return () => {
      window.removeEventListener(
        "resize",
        updateScrollArrows
      );
    };
  }, []);

  return (
    <div
      data-text-toolbar={item.id}
      onDragStart={(event) => event.preventDefault()}
      onPointerMove={(event) => event.stopPropagation()}
      className="mb-3 w-full min-w-0 select-none overflow-hidden rounded-2xl bg-slate-900/95 px-3 py-2 shadow-lg [&_*]:select-none"
      style={{
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <div className="relative min-w-0">
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollArrows}
          className="flex min-w-0 items-center justify-start gap-2 overflow-x-auto pr-10"
        >
          <div className="hidden shrink-0 gap-2 md:flex">
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={() =>
                onChangeTextSize(item.id, -TEXT_FONT_SIZE_STEP)
              }
              className="cursor-pointer rounded-full bg-slate-700 px-3 py-1 text-sm font-bold text-white"
            >
              A-
            </button>

            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={() =>
                onChangeTextSize(item.id, TEXT_FONT_SIZE_STEP)
              }
              className="cursor-pointer rounded-full bg-slate-700 px-3 py-1 text-sm font-bold text-white"
            >
              A+
            </button>
          </div>

          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => onRotateItem(item.id, -15)}
            className="shrink-0 cursor-pointer rounded-full bg-slate-700 px-3 py-1 text-xl font-bold text-white"
            aria-label="Rotate text left"
          >
            ↺
          </button>

          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => onRotateItem(item.id, 15)}
            className="shrink-0 cursor-pointer rounded-full bg-slate-700 px-3 py-1 text-xl font-bold text-white"
            aria-label="Rotate text right"
          >
            ↻
          </button>

          <button
            type="button"
            disabled={!canSendBackward}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() =>
              onMoveItemLayer(item.id, "backward")
            }
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send Backward"
            title="Send Backward"
          >
            ⬇️
          </button>

          <button
            type="button"
            disabled={!canBringForward}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() =>
              onMoveItemLayer(item.id, "forward")
            }
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Bring Forward"
            title="Bring Forward"
          >
            ⬆️
          </button>
          <button
  type="button"
  disabled={!canSendBackward}
  onPointerDown={(event) => {
    event.preventDefault();
    event.stopPropagation();
  }}
  onClick={() =>
    onMoveItemLayer(item.id, "back")
  }
  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
  aria-label="Send to Back"
  title="Send to Back"
>
  ⏬
</button>

<button
  type="button"
  disabled={!canBringForward}
  onPointerDown={(event) => {
    event.preventDefault();
    event.stopPropagation();
  }}
  onClick={() =>
    onMoveItemLayer(item.id, "front")
  }
  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
  aria-label="Bring to Front"
  title="Bring to Front"
>
  ⏫
</button>

          <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-slate-700 px-3 py-1 text-sm font-bold text-white">
            🎨

            <input
              type="color"
              value={item.color}
              onPointerDown={(event) =>
                event.stopPropagation()
              }
              onChange={(event) =>
                onChangeTextColor(item.id, event.target.value)
              }
              className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>

          <select
            value={item.fontFamily}
            onPointerDown={(event) =>
              event.stopPropagation()
            }
            onChange={(event) =>
              onChangeTextFont(item.id, event.target.value)
            }
            className="w-[110px] shrink-0 cursor-pointer rounded-full bg-slate-700 px-3 py-1 text-sm font-bold text-white outline-none md:w-[150px]"
          >
            {fontOptions.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {showLeftArrow && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-start bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent pl-2 md:hidden"
          >
            <span className="animate-pulse text-3xl font-light text-white/50">
              ‹
            </span>
          </div>
        )}

        {showRightArrow && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent pr-2 md:hidden"
          >
            <span className="animate-pulse text-3xl font-light text-white/50">
              ›
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
