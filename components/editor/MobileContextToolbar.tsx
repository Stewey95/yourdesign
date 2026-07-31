"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  Lock,
  LockOpen,
  Palette,
  Redo2,
  RotateCcw,
  RotateCw,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  TEXT_MAX_FONT_SIZE,
  TEXT_MIN_FONT_SIZE,
  TEXT_FONT_SIZE_STEP,
} from "./editor.constants";
import FontPicker from "./FontPicker";
import type {
  DesignItem,
  ImageAdjustment,
  ShapeDesignItem,
} from "./editor.types";
import {
  DEFAULT_SHAPE_COLOUR,
  MAX_SHAPE_STROKE_WIDTH,
  MIN_SHAPE_STROKE_WIDTH,
  isStrokeOnlyShape,
} from "./shape.constants";
import MobileStylePanel from "./MobileStylePanel";
import PropertyStepper from "./PropertyStepper";

type MobileContextToolbarProps = {
  item: DesignItem;
  canSendBackward: boolean;
  canBringForward: boolean;
  showImageAdjustments: boolean;
  showShapeStyle: boolean;
  onChangeTextFontSize: (id: string, fontSize: number) => void;
  onChangeTextColor: (id: string, color: string) => void;
  onChangeTextFont: (id: string, fontFamily: string) => void;
  onRotate: (id: string, amount: number) => void;
  onMoveBackward: (id: string) => void;
  onMoveForward: (id: string) => void;
  onToggleLock: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleImageAdjustments: () => void;
  onToggleShapeStyle: () => void;
  onChangeShapeFill: (id: string, fill: string | null) => void;
  onChangeShapeStroke: (id: string, stroke: string | null) => void;
  onChangeShapeStrokeWidth: (id: string, strokeWidth: number) => void;
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
  showShapeStyle,
  onChangeTextFontSize,
  onChangeTextColor,
  onChangeTextFont,
  onRotate,
  onMoveBackward,
  onMoveForward,
  onToggleLock,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDuplicate,
  onDelete,
  onToggleImageAdjustments,
  onToggleShapeStyle,
  onChangeShapeFill,
  onChangeShapeStroke,
  onChangeShapeStrokeWidth,
  onAdjustmentStart,
  onAdjustmentEnd,
  onAdjustmentChange,
  onResetImageAdjustments,
}: MobileContextToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const canvasItemTapRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const revealFrameRef = useRef<number | null>(null);
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

  const resetControlsScroll = useCallback(() => {
    const controls = controlsRef.current;

    if (!controls) return;

    controls.scrollLeft = 0;
    updateScrollControls();
  }, [updateScrollControls]);

  const revealToolbarInVisualViewport = useCallback(() => {
    const toolbar = toolbarRef.current;

    if (
      !toolbar ||
      !window.matchMedia("(max-width: 767px)").matches
    ) {
      return;
    }

    const visualViewport = window.visualViewport;
    const visibleTop = visualViewport?.offsetTop ?? 0;
    const visibleHeight = visualViewport?.height ?? window.innerHeight;
    const visibleBottom = visibleTop + visibleHeight;
    const toolbarBounds = toolbar.getBoundingClientRect();
    const scrollMarginTop =
      Number.parseFloat(getComputedStyle(toolbar).scrollMarginTop) || 0;
    const desiredTop = visibleTop + scrollMarginTop;
    const bottomClearance = Math.min(scrollMarginTop, visibleHeight * 0.05);
    const desiredBottom = visibleBottom - bottomClearance;
    let scrollDelta = 0;

    if (toolbarBounds.top < desiredTop) {
      scrollDelta = toolbarBounds.top - desiredTop;
    } else if (toolbarBounds.bottom > desiredBottom) {
      scrollDelta = toolbarBounds.bottom - desiredBottom;
    }

    if (Math.abs(scrollDelta) > 1) {
      window.scrollBy({
        top: scrollDelta,
        left: 0,
        behavior: "auto",
      });
    }
  }, []);

  const revealToolbarAfterLayout = useCallback(() => {
    revealToolbarInVisualViewport();

    if (revealFrameRef.current !== null) {
      cancelAnimationFrame(revealFrameRef.current);
    }

    revealFrameRef.current = requestAnimationFrame(() => {
      revealFrameRef.current = null;
      revealToolbarInVisualViewport();
    });
  }, [revealToolbarInVisualViewport]);

  useLayoutEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    resetControlsScroll();
    revealToolbarAfterLayout();
  }, [
    item.id,
    item.type,
    resetControlsScroll,
    revealToolbarAfterLayout,
  ]);

  useEffect(() => {
    const startCanvasItemTap = (event: PointerEvent) => {
      if (!window.matchMedia("(max-width: 767px)").matches) return;
      if (!event.isPrimary) return;

      const canvasItem =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-canvas-item-id]")
          : null;

      if (!canvasItem) return;

      resetControlsScroll();
      canvasItemTapRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
    };

    const trackCanvasItemTap = (event: PointerEvent) => {
      const candidate = canvasItemTapRef.current;

      if (!candidate || candidate.pointerId !== event.pointerId) return;

      if (
        Math.abs(event.clientX - candidate.startX) > 5 ||
        Math.abs(event.clientY - candidate.startY) > 5
      ) {
        canvasItemTapRef.current = null;
      }
    };

    const finishCanvasItemTap = (event: PointerEvent) => {
      const candidate = canvasItemTapRef.current;

      canvasItemTapRef.current = null;

      if (!candidate || candidate.pointerId !== event.pointerId) return;

      revealToolbarAfterLayout();
    };

    const cancelCanvasItemTap = () => {
      canvasItemTapRef.current = null;
    };

    document.addEventListener("pointerdown", startCanvasItemTap, true);
    document.addEventListener("pointermove", trackCanvasItemTap, true);
    document.addEventListener("pointerup", finishCanvasItemTap, true);
    document.addEventListener("pointercancel", cancelCanvasItemTap, true);

    return () => {
      document.removeEventListener("pointerdown", startCanvasItemTap, true);
      document.removeEventListener("pointermove", trackCanvasItemTap, true);
      document.removeEventListener("pointerup", finishCanvasItemTap, true);
      document.removeEventListener(
        "pointercancel",
        cancelCanvasItemTap,
        true
      );
    };
  }, [resetControlsScroll, revealToolbarAfterLayout]);

  useEffect(
    () => () => {
      if (revealFrameRef.current !== null) {
        cancelAnimationFrame(revealFrameRef.current);
      }
    },
    []
  );

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
    showShapeStyle,
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
      ref={toolbarRef}
      data-editor-retain-selection
      data-editor-keep-zoom-hud-open
      data-mobile-context-toolbar
      data-text-toolbar={item.type === "text" ? item.id : undefined}
      data-image-toolbar={item.type === "image" ? item.id : undefined}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      className="relative z-40 mb-4 flex w-full min-w-0 flex-col gap-2 md:hidden"
      style={{
        scrollMarginTop: "max(0.75rem, env(safe-area-inset-top))",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {!item.locked && item.type === "image" && showImageAdjustments && (
        <MobileStylePanel scrollTarget="image-adjustments">
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
        </MobileStylePanel>
      )}

      {!item.locked && item.type === "shape" && showShapeStyle && (
        <MobileShapeStylePanel
          item={item}
          onChangeFill={onChangeShapeFill}
          onChangeStroke={onChangeShapeStroke}
          onChangeStrokeWidth={onChangeShapeStrokeWidth}
          onAdjustmentStart={onAdjustmentStart}
          onAdjustmentEnd={onAdjustmentEnd}
        />
      )}

      <div className="editor-floating-toolbar relative min-w-0 overflow-hidden rounded-xl px-3 py-2">
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
          {!item.locked && item.type === "text" && (
            <>
              <PropertyStepper
                key={item.id}
                compact
                label="Font size"
                value={item.fontSize}
                min={TEXT_MIN_FONT_SIZE}
                max={TEXT_MAX_FONT_SIZE}
                step={TEXT_FONT_SIZE_STEP}
                keyboardStep={1}
                largeStep={10}
                suffix="px"
                decrementLabel="A−"
                incrementLabel="A+"
                onCommit={(fontSize) =>
                  onChangeTextFontSize(item.id, fontSize)
                }
                onEditStart={onAdjustmentStart}
                onEditEnd={onAdjustmentEnd}
              />

              <label
                className="flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-slate-700 px-2 text-sm font-bold text-white"
                title="Text colour"
              >
                <Palette size={15} aria-hidden="true" />
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

              <FontPicker
                itemId={item.id}
                value={item.fontFamily}
                onChange={(fontFamily) =>
                  onChangeTextFont(item.id, fontFamily)
                }
                variant="mobile"
              />
            </>
          )}

          {!item.locked && (
            <>
              <button
                type="button"
                onPointerDown={protectButtonPointer}
                onClick={() => onRotate(item.id, -15)}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-xl font-bold text-white"
                aria-label="Rotate left"
                title="Rotate left"
              >
                <RotateCcw size={16} aria-hidden="true" />
              </button>

              <button
                type="button"
                onPointerDown={protectButtonPointer}
                onClick={() => onRotate(item.id, 15)}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-xl font-bold text-white"
                aria-label="Rotate right"
                title="Rotate right"
              >
                <RotateCw size={16} aria-hidden="true" />
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

              {item.type === "shape" && (
                <button
                  type="button"
                  onPointerDown={protectButtonPointer}
                  onClick={onToggleShapeStyle}
                  className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    showShapeStyle
                      ? "bg-blue-500 hover:bg-blue-400"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                  aria-label={
                    showShapeStyle
                      ? "Close shape style"
                      : "Style shape"
                  }
                  aria-expanded={showShapeStyle}
                  title="Style"
                >
                  <Palette size={15} aria-hidden="true" />
                  Style
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
                <ArrowDown size={16} aria-hidden="true" />
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
                <ArrowUp size={16} aria-hidden="true" />
              </button>
            </>
          )}

          <button
            type="button"
            onPointerDown={protectButtonPointer}
            onClick={() => onToggleLock(item.id)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-white transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={
              item.locked
                ? "Unlock selected item"
                : "Lock selected item"
            }
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
            <Undo2 size={16} aria-hidden="true" />
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
            <Redo2 size={16} aria-hidden="true" />
          </button>

          {!item.locked && (
            <>
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
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </>
          )}
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

type MobileShapeStylePanelProps = {
  item: ShapeDesignItem;
  onChangeFill: (id: string, fill: string | null) => void;
  onChangeStroke: (id: string, stroke: string | null) => void;
  onChangeStrokeWidth: (id: string, strokeWidth: number) => void;
  onAdjustmentStart: () => void;
  onAdjustmentEnd: () => void;
};

function MobileShapeStylePanel({
  item,
  onChangeFill,
  onChangeStroke,
  onChangeStrokeWidth,
  onAdjustmentStart,
  onAdjustmentEnd,
}: MobileShapeStylePanelProps) {
  const strokeOnly = isStrokeOnlyShape(item.shapeKind);
  const strokeLabel = strokeOnly ? "Line" : "Border";
  const hasVisibleStroke = Boolean(item.stroke && item.strokeWidth > 0);

  return (
    <MobileStylePanel
      title="Shape style"
      description="Choose colours and line weight."
      icon={
        <Palette size={18} aria-hidden="true" className="text-cyan-300" />
      }
    >
      <div className="space-y-3">
        {!strokeOnly && (
          <MobileShapeColourControl
            label="Fill"
            value={item.fill}
            fallback={DEFAULT_SHAPE_COLOUR}
            emptyLabel="No fill"
            restoreLabel="Restore fill"
            onChange={(value) => onChangeFill(item.id, value)}
          />
        )}

        <MobileShapeColourControl
          label={`${strokeLabel} colour`}
          value={item.stroke}
          fallback={DEFAULT_SHAPE_COLOUR}
          emptyLabel="No border"
          restoreLabel={`Restore ${strokeLabel.toLowerCase()}`}
          allowEmpty={!strokeOnly}
          onChange={(value) => onChangeStroke(item.id, value)}
        />

        <label className="block rounded-xl border border-white/10 bg-slate-800/70 p-3">
          <span className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-200">
            <span>{strokeLabel} width</span>
            <span className="tabular-nums text-cyan-300">
              {Math.max(
                MIN_SHAPE_STROKE_WIDTH,
                Math.round(item.strokeWidth)
              )}{" "}
              px
            </span>
          </span>
          <input
            type="range"
            min={MIN_SHAPE_STROKE_WIDTH}
            max={MAX_SHAPE_STROKE_WIDTH}
            step={1}
            value={Math.max(MIN_SHAPE_STROKE_WIDTH, item.strokeWidth)}
            disabled={!hasVisibleStroke}
            onFocus={onAdjustmentStart}
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
            onBlur={onAdjustmentEnd}
            onChange={(event) =>
              onChangeStrokeWidth(item.id, Number(event.target.value))
            }
            className="block h-7 w-full cursor-pointer accent-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`${strokeLabel} width`}
          />
          {!hasVisibleStroke && (
            <span className="mt-1 block text-[10px] text-slate-500">
              Restore {strokeLabel.toLowerCase()} to adjust its width.
            </span>
          )}
        </label>

        <div className="rounded-xl border border-white/10 bg-slate-800/70 p-3">
          <PropertyStepper
            key={item.id}
            label={`${strokeLabel} width`}
            value={Math.max(
              MIN_SHAPE_STROKE_WIDTH,
              item.strokeWidth
            )}
            min={MIN_SHAPE_STROKE_WIDTH}
            max={MAX_SHAPE_STROKE_WIDTH}
            suffix="px"
            disabled={!hasVisibleStroke}
            onCommit={(strokeWidth) =>
              onChangeStrokeWidth(item.id, strokeWidth)
            }
            onEditStart={onAdjustmentStart}
            onEditEnd={onAdjustmentEnd}
          />
        </div>
      </div>
    </MobileStylePanel>
  );
}

type MobileShapeColourControlProps = {
  label: string;
  value: string | null;
  fallback: string;
  emptyLabel: string;
  restoreLabel: string;
  allowEmpty?: boolean;
  onChange: (value: string | null) => void;
};

function MobileShapeColourControl({
  label,
  value,
  fallback,
  emptyLabel,
  restoreLabel,
  allowEmpty = true,
  onChange,
}: MobileShapeColourControlProps) {
  const activeColour = value ?? fallback;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/70 p-3">
      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
          <span
            aria-hidden="true"
            className="h-9 w-9 shrink-0 rounded-lg border-2 border-white/20 shadow-inner"
            style={{ backgroundColor: value ?? "transparent" }}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-slate-200">
              {label}
            </span>
            <span className="block truncate text-[10px] uppercase text-slate-400">
              {value ?? "None"}
            </span>
          </span>
          <input
            type="color"
            value={activeColour}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onChange(event.target.value)}
            className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-slate-700 p-1"
            aria-label={`${label} colour`}
          />
        </label>
      </div>

      {(allowEmpty || !value) && (
        <button
          type="button"
          onPointerDown={protectButtonPointer}
          onClick={() => onChange(value && allowEmpty ? null : fallback)}
          aria-pressed={!value}
          className={`mt-2 h-9 w-full rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            !value
              ? "border-blue-400/50 bg-blue-500/20 text-cyan-200"
              : "border-white/10 bg-slate-700 text-slate-200 hover:bg-slate-600"
          }`}
        >
          {value ? emptyLabel : restoreLabel}
        </button>
      )}
    </div>
  );
}

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
