"use client";

import { Lock } from "lucide-react";
import CanvasImageItem from "./CanvasImageItem";
import CanvasShapeItem from "./CanvasShapeItem";
import CanvasTextItem from "./CanvasTextItem";
import type { TextResizeCorner } from "./CanvasTextItem";
import type {
  ImageDesignItem,
  ResizableDesignItem,
  ShapeDesignItem,
  TextDesignItem,
} from "./editor.types";

type ImageCanvasItemProps = {
  item: ImageDesignItem | ShapeDesignItem;
  selected: boolean;
  displayScale: number;
  onPointerDown: (
    id: string,
    clientX: number,
    clientY: number,
    pointerId: number
  ) => void;
  onLockedPointerDown: (id: string) => void;
  onResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: ResizableDesignItem
  ) => void;
};

type TextCanvasItemProps = {
  item: TextDesignItem;
  selected: boolean;
  editing: boolean;
  mobileLayout: boolean;
  displayScale: number;
  canvasWidth: number;
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
  const textMaximumWidth =
    item.type === "text" && "canvasWidth" in props
      ? Math.max(
          1,
          Math.min(
            props.canvasWidth,
            2 *
              Math.min(
                item.position.x,
                props.canvasWidth - item.position.x
              )
          )
        )
      : undefined;

  return (
    <div
      data-canvas-item-id={item.id}
      className={`absolute ${
        selected
          ? item.type === "text"
            ? item.locked
              ? "ring-2 ring-blue-500"
              : "md:ring-2 md:ring-blue-500"
            : "ring-2 ring-blue-500"
          : ""
      }`}
      style={{
        left: item.position.x,
        top: item.position.y,
        width:
          item.type === "text"
            ? "max-content"
            : item.type === "shape"
              ? item.size.width
              : undefined,
        height: item.type === "shape" ? item.size.height : undefined,
        maxWidth: textMaximumWidth,
        transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {item.type === "image" && "onPointerDown" in props ? (
        <CanvasImageItem
          item={item}
          selected={props.selected && !item.locked}
          displayScale={props.displayScale}
          onPointerDown={props.onPointerDown}
          onResizeStart={props.onResizeStart}
        />
      ) : item.type === "shape" && "onPointerDown" in props ? (
        <CanvasShapeItem
          item={item}
          selected={props.selected && !item.locked}
          displayScale={props.displayScale}
          onPointerDown={props.onPointerDown}
          onResizeStart={props.onResizeStart}
        />
      ) : item.type === "text" && "editing" in props ? (
        <CanvasTextItem
          item={item}
          selected={props.selected && !item.locked}
          editing={props.editing && !item.locked}
          mobileLayout={props.mobileLayout}
          displayScale={props.displayScale}
          maximumWidth={textMaximumWidth ?? props.canvasWidth}
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
            props.onLockedPointerDown(item.id);
          }}
        />
      )}

      {selected && item.locked && (
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
