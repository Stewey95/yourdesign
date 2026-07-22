"use client";

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
  onPointerDown: (id: string) => void;
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
    startY: number
  ) => void;
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
            ? "md:ring-2 md:ring-blue-500"
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
        pointerEvents: item.locked ? "none" : undefined,
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {item.type === "image" && "onPointerDown" in props ? (
        <CanvasImageItem
          item={item}
          selected={props.selected}
          displayScale={props.displayScale}
          onPointerDown={props.onPointerDown}
          onResizeStart={props.onResizeStart}
        />
      ) : item.type === "shape" && "onPointerDown" in props ? (
        <CanvasShapeItem
          item={item}
          selected={props.selected}
          displayScale={props.displayScale}
          onPointerDown={props.onPointerDown}
          onResizeStart={props.onResizeStart}
        />
      ) : item.type === "text" && "editing" in props ? (
        <CanvasTextItem
          item={item}
          selected={props.selected}
          editing={props.editing}
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
    </div>
  );
}
