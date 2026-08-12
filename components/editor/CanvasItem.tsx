"use client";

import { Lock } from "lucide-react";
import CanvasImageItem from "./CanvasImageItem";
import CanvasElementItem from "./CanvasElementItem";
import CanvasShapeItem from "./CanvasShapeItem";
import CanvasTextItem from "./CanvasTextItem";
import type { TextResizeCorner } from "./CanvasTextItem";
import {
  getFreeformTextMaxWidth,
  getTextBoxWidth,
} from "./textLayout";
import type {
  ImageDesignItem,
  ElementDesignItem,
  ResizeCorner,
  ResizableDesignItem,
  ShapeDesignItem,
  TextDesignItem,
  Size,
} from "./editor.types";

type ImageCanvasItemProps = {
  item: ImageDesignItem | ShapeDesignItem | ElementDesignItem;
  selected: boolean;
  mobileLayout?: boolean;
  displayScale: number;
  canvasSize: Size;
  onPointerDown: (
    id: string,
    clientX: number,
    clientY: number,
    pointerId: number,
    pointerType: string,
    sourceElement?: HTMLElement
  ) => boolean;
  onLockedPointerDown: (id: string) => void;
  onResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: ResizableDesignItem,
    corner: ResizeCorner
  ) => void;
};

type TextCanvasItemProps = {
  item: TextDesignItem;
  selected: boolean;
  editing: boolean;
  mobileLayout: boolean;
  displayScale: number;
  canvasSize: Size;
  onRequestAutoFit: (
    id: string,
    textarea: HTMLTextAreaElement
  ) => void;
  onValueChange: (id: string, value: string) => void;
  onRemoveEmptyText: (id: string) => void;
  onFinishEditing: () => void;
  onEditingPointerDown: (id: string) => void;
  onPendingDragStart: (
    id: string,
    startX: number,
    startY: number,
    pointerId: number
  ) => void;
  onLockedPointerDown: (id: string) => void;
  onResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: TextDesignItem,
    corner: TextResizeCorner
  ) => void;
};

type CanvasItemProps =
  | ImageCanvasItemProps
  | TextCanvasItemProps;

export default function CanvasItem(props: CanvasItemProps) {
  const { item } = props;
  const selected = "selected" in props && props.selected;
  const textBoxWidth = item.type === "text" ? getTextBoxWidth(item) : undefined;
  const freeformTextMaxWidth =
    item.type === "text"
      ? getFreeformTextMaxWidth(item, props.canvasSize)
      : undefined;

  return (
    <div
      data-canvas-item-id={item.id}
      className="absolute"
      style={{
        left: item.position.x,
        top: item.position.y,
        width:
          item.type === "text"
            ? textBoxWidth ?? "max-content"
            : item.type === "shape" || item.type === "element"
              ? item.size.width
              : undefined,
        maxWidth:
          item.type === "text" && textBoxWidth === undefined
            ? freeformTextMaxWidth
            : undefined,
        height:
          item.type === "shape" || item.type === "element"
            ? item.size.height
            : undefined,
        transform: `translate3d(-50%, -50%, 0) rotate(${item.rotation}deg) scale(var(--text-resize-preview-scale, 1))`,
        transformOrigin: "center",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {item.type === "image" && "onPointerDown" in props ? (
        <CanvasImageItem
          item={item}
          selected={false}
          mobileLayout={props.mobileLayout}
          displayScale={props.displayScale}
          onPointerDown={props.onPointerDown}
          onResizeStart={props.onResizeStart}
        />
      ) : item.type === "shape" && "onPointerDown" in props ? (
        <CanvasShapeItem
          item={item}
          selected={false}
          mobileLayout={props.mobileLayout}
          displayScale={props.displayScale}
          onPointerDown={props.onPointerDown}
          onResizeStart={props.onResizeStart}
        />
      ) : item.type === "element" && "onPointerDown" in props ? (
        <CanvasElementItem
          item={item}
          selected={false}
          mobileLayout={props.mobileLayout}
          displayScale={props.displayScale}
          onPointerDown={props.onPointerDown}
          onResizeStart={props.onResizeStart}
        />
      ) : item.type === "text" && "editing" in props ? (
        <CanvasTextItem
          item={item}
          selected={false}
          selectionActive={selected}
          editing={props.editing && !item.locked}
          mobileLayout={props.mobileLayout}
          displayScale={props.displayScale}
          textBoxWidth={textBoxWidth}
          freeformTextMaxWidth={freeformTextMaxWidth}
          onRequestAutoFit={props.onRequestAutoFit}
          onValueChange={props.onValueChange}
          onRemoveEmptyText={props.onRemoveEmptyText}
          onFinishEditing={props.onFinishEditing}
          onEditingPointerDown={props.onEditingPointerDown}
          onPendingDragStart={props.onPendingDragStart}
          onResizeStart={props.onResizeStart}
        />
      ) : null}

      {item.locked && (
        <div
          className="absolute inset-0 z-20 cursor-default"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();

            if (item.type !== "text" && "onPointerDown" in props) {
              const ownsInteraction = props.onPointerDown(
                item.id,
                event.clientX,
                event.clientY,
                event.pointerId,
                event.pointerType,
                event.currentTarget
              );

              if (ownsInteraction) {
                event.currentTarget.setPointerCapture(event.pointerId);
              }

              return;
            }

            props.onLockedPointerDown(item.id);
          }}
        />
      )}

      {props.selected && item.locked && (
        <span
          aria-label="Locked item"
          title="Locked"
          className="pointer-events-none absolute -right-3 -top-3 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-blue-300/60 bg-slate-900 text-cyan-300 shadow-lg"
        >
          <Lock size={13} strokeWidth={2.25} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
