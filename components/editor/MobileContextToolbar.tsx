"use client";

import {
  Copy,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fontOptions,
  TEXT_FONT_SIZE_STEP,
} from "./editor.constants";
import type {
  DesignItem,
  ImageAdjustment,
} from "./editor.types";

type MobileContextToolbarProps = {
  item: DesignItem;
  canSendBackward: boolean;
  canBringForward: boolean;
  showImageAdjustments: boolean;
  onChangeTextSize: (id: string, amount: number) => void;
  onChangeTextColor: (id: string, color: string) => void;
  onChangeTextFont: (id: string, fontFamily: string) => void;
  onRotate: (id: string, amount: number) => void;
  onMoveBackward: (id: string) => void;
  onMoveForward: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleImageAdjustments: () => void;
  onAdjustmentStart: () => void;
  onAdjustmentEnd: () => void;
  onAdjustmentChange: (
    id: string,
    adjustment: ImageAdjustment,
    value: number
  ) => void;
  onResetImageAdjustments: (id: string) => void;
};

const protectButtonPointer = (
  event: React.PointerEvent<HTMLButtonElement>
) => {
  event.preventDefault();
  event.stopPropagation();
};

export default function MobileContextToolbar({
  item,
  canSendBackward,
  canBringForward,
  showImageAdjustments,
  onChangeTextSize,
  onChangeTextColor,
  onChangeTextFont,
  onRotate,
  onMoveBackward,
  onMoveForward,
  onToggleVisibility,
  onToggleLock,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDuplicate,
  onDelete,
  onToggleImageAdjustments,
  onAdjustmentStart,
  onAdjustmentEnd,
  onAdjustmentChange,
  onResetImageAdjustments,
}: MobileContextToolbarProps) {
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollControls = useCallback(() => {
    const controls = controlsRef.current;

    if (!controls) return;

    const maximumScrollLeft =
      controls.scrollWidth - controls.clientWidth;

    setCanScrollLeft(controls.scrollLeft > 1);
    setCanScrollRight(
      controls.scrollLeft < maximumScrollLeft - 1
    );
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollControls);

    window.addEventListener("resize", updateScrollControls);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollControls);
    };
  }, [
    item.id,
    item.type,
    showImageAdjustments,
    updateScrollControls,
  ]);

  const scrollControls = (direction: -1 | 1) => {
    const controls = controlsRef.current;

    if (!controls) return;

    controls.scrollBy({
      left: controls.clientWidth * 0.75 * direction,
      behavior: "smooth",
    });
  };

  return (
    <div
      data-editor-retain-selection
      data-editor-keep-zoom-hud-open
      data-text-toolbar={item.type === "text" ? item.id : undefined}
      data-image-toolbar={item.type === "image" ? item.id : undefined}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      className="relative z-40 mb-4 flex w-full min-w-0 flex-col gap-2 md:hidden"
      style={{
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {item.type === "image" && showImageAdjustments && (
        <div className="max-h-[44vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-3 text-white shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-3">
            <MobileAdjustmentSlider
              label="Brightness"
              value={item.brightness}
              min={0}
              max={200}
              onAdjustmentStart={onAdjustmentStart}
              onAdjustmentEnd={onAdjustmentEnd}
              onChange={(value) =>
                onAdjustmentChange(item.id, "brightness", value)
              }
            />

            <MobileAdjustmentSlider
              label="Contrast"
              value={item.contrast}
              min={0}
              max={200}
              onAdjustmentStart={onAdjustmentStart}
              onAdjustmentEnd={onAdjustmentEnd}
              onChange={(value) =>
                onAdjustmentChange(item.id, "contrast", value)
              }
            />

            <MobileAdjustmentSlider
              label="Saturation"
              value={item.saturation}
              min={0}
              max={200}
              onAdjustmentStart={onAdjustmentStart}
              onAdjustmentEnd={onAdjustmentEnd}
              onChange={(value) =>
                onAdjustmentChange(item.id, "saturation", value)
              }
            />

            <MobileAdjustmentSlider
              label="Opacity"
              value={item.opacity}
              min={0}
              max={100}
              onAdjustmentStart={onAdjustmentStart}
              onAdjustmentEnd={onAdjustmentEnd}
              onChange={(value) =>
                onAdjustmentChange(item.id, "opacity", value)
              }
            />
          </div>

          <button
            type="button"
            onPointerDown={protectButtonPointer}
            onClick={() => onResetImageAdjustments(item.id)}
            className="mt-3 w-full cursor-pointer rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-600"
          >
            Reset Adjustments
          </button>
        </div>
      )}

      <div className="relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 px-3 py-2 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          disabled={!canScrollLeft}
          onPointerDown={protectButtonPointer}
          onClick={() => scrollControls(-1)}
          className={`absolute inset-y-2 left-2 z-10 flex w-8 items-center justify-center rounded-full bg-slate-800/95 text-xl font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-0 ${
            canScrollLeft ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-label="Scroll toolbar left"
          title="Previous controls"
        >
          ‹
        </button>

        <div
          ref={controlsRef}
          onScroll={updateScrollControls}
          className="flex min-w-0 items-center gap-2 overflow-x-auto px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {item.type === "text" && (
            <>
              <button
                type="button"
                onPointerDown={protectButtonPointer}
                onClick={() =>
                  onChangeTextSize(item.id, -TEXT_FONT_SIZE_STEP)
                }
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white"
                aria-label="Decrease font size"
                title="Decrease font size"
              >
                A−
              </button>

              <button
                type="button"
                onPointerDown={protectButtonPointer}
                onClick={() =>
                  onChangeTextSize(item.id, TEXT_FONT_SIZE_STEP)
                }
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white"
                aria-label="Increase font size"
                title="Increase font size"
              >
                A+
              </button>

              <label
                className="flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-slate-700 px-2 text-sm font-bold text-white"
                title="Text colour"
              >
                🎨
                <span className="sr-only">Text colour</span>
                <input
                  type="color"
                  value={item.color}
                  onPointerDown={(event) => event.stopPropagation()}
                  onChange={(event) =>
                    onChangeTextColor(item.id, event.target.value)
                  }
                  className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0"
                  aria-label="Text colour"
                />
              </label>

              <select
                value={item.fontFamily}
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) =>
                  onChangeTextFont(item.id, event.target.value)
                }
                className="h-9 w-[116px] shrink-0 cursor-pointer rounded-full bg-slate-700 px-3 text-sm font-bold text-white outline-none"
                aria-label="Font family"
                title="Font family"
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            type="button"
            onPointerDown={protectButtonPointer}
            onClick={() => onRotate(item.id, -15)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-xl font-bold text-white"
            aria-label="Rotate left"
            title="Rotate left"
          >
            ↺
          </button>

          <button
            type="button"
            onPointerDown={protectButtonPointer}
            onClick={() => onRotate(item.id, 15)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-xl font-bold text-white"
            aria-label="Rotate right"
            title="Rotate right"
          >
            ↻
          </button>

          {item.type === "image" && (
            <button
              type="button"
              onPointerDown={protectButtonPointer}
              onClick={onToggleImageAdjustments}
              className="h-9 shrink-0 cursor-pointer rounded-full bg-blue-600 px-3 text-xs font-bold text-white"
              aria-label={
                showImageAdjustments
                  ? "Hide image adjustments"
                  : "Show image adjustments"
              }
              title={
                showImageAdjustments
                  ? "Hide Adjustments"
                  : "Adjust Image"
              }
            >
              {showImageAdjustments ? "Done" : "Adjust"}
            </button>
          )}

          <button
            type="button"
            disabled={!canSendBackward}
            onPointerDown={protectButtonPointer}
            onClick={() => onMoveBackward(item.id)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send Backward"
            title="Send Backward"
          >
            ⬇️
          </button>

          <button
            type="button"
            disabled={!canBringForward}
            onPointerDown={protectButtonPointer}
            onClick={() => onMoveForward(item.id)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Bring Forward"
            title="Bring Forward"
          >
            ⬆️
          </button>

          <button
            type="button"
            onPointerDown={protectButtonPointer}
            onClick={() => onToggleVisibility(item.id)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-white transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={item.hidden ? "Show selected item" : "Hide selected item"}
            title={item.hidden ? "Show" : "Hide"}
          >
            {item.hidden ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onPointerDown={protectButtonPointer}
            onClick={() => onToggleLock(item.id)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-white transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={item.locked ? "Unlock selected item" : "Lock selected item"}
            title={item.locked ? "Unlock" : "Lock"}
          >
            {item.locked ? (
              <Lock size={16} aria-hidden="true" />
            ) : (
              <LockOpen size={16} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            disabled={!canUndo}
            onPointerDown={protectButtonPointer}
            onClick={onUndo}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-lg font-bold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Undo"
            title="Undo"
          >
            ↶
          </button>

          <button
            type="button"
            disabled={!canRedo}
            onPointerDown={protectButtonPointer}
            onClick={onRedo}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-lg font-bold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Redo"
            title="Redo"
          >
            ↷
          </button>

          <button
            type="button"
            onPointerDown={protectButtonPointer}
            onClick={onDuplicate}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-white transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label="Duplicate selected item"
            title="Duplicate"
          >
            <Copy size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            onPointerDown={protectButtonPointer}
            onClick={onDelete}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white transition hover:bg-red-500"
            aria-label="Delete selected item"
            title="Delete selected item"
          >
            🗑
          </button>
        </div>

        <button
          type="button"
          disabled={!canScrollRight}
          onPointerDown={protectButtonPointer}
          onClick={() => scrollControls(1)}
          className={`absolute inset-y-2 right-2 z-10 flex w-8 items-center justify-center rounded-full bg-slate-800/95 text-xl font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-0 ${
            canScrollRight ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-label="Scroll toolbar right"
          title="Next controls"
        >
          ›
        </button>
      </div>
    </div>
  );
}

type MobileAdjustmentSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onAdjustmentStart: () => void;
  onAdjustmentEnd: () => void;
  onChange: (value: number) => void;
};

function MobileAdjustmentSlider({
  label,
  value,
  min,
  max,
  onAdjustmentStart,
  onAdjustmentEnd,
  onChange,
}: MobileAdjustmentSliderProps) {
  return (
    <label className="block min-w-0 text-xs font-semibold text-slate-200">
      <span className="mb-1 flex items-center justify-between gap-2">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </span>

      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onPointerDown={(event) => {
          event.stopPropagation();
          onAdjustmentStart();
        }}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => {
          event.stopPropagation();
          onAdjustmentEnd();
        }}
        onPointerCancel={(event) => {
          event.stopPropagation();
          onAdjustmentEnd();
        }}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="block w-full min-w-0 cursor-pointer"
      />
    </label>
  );
}
