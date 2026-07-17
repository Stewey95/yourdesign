"use client";

import CanvasImageItem from "./CanvasImageItem";
import CanvasTextItem from "./CanvasTextItem";
import type {
  ImageDesignItem,
  TextDesignItem,
} from "./editor.types";

type ImageCanvasItemProps = {
  item: ImageDesignItem;
  selected: boolean;
  displayScale: number;
  onPointerDown: (id: string) => void;
  onResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: ImageDesignItem
  ) => void;
};

type TextCanvasItemProps = {
  item: TextDesignItem;
  editing: boolean;
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
};

type CanvasItemProps =
  | ImageCanvasItemProps
  | TextCanvasItemProps;

export default function CanvasItem(props: CanvasItemProps) {
  const { item } = props;
  const selected =
    item.type === "image" &&
    "selected" in props &&
    props.selected;

  return (
    <div
      className={`absolute ${
        selected
          ? "ring-2 ring-blue-500"
          : ""
      }`}
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.type === "text" ? "max-content" : undefined,
        transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {item.type === "image" && "selected" in props ? (
        <CanvasImageItem
          item={item}
          selected={props.selected}
          displayScale={props.displayScale}
          onPointerDown={props.onPointerDown}
          onResizeStart={props.onResizeStart}
        />
      ) : item.type === "text" && "editing" in props ? (
        <CanvasTextItem
          item={item}
          editing={props.editing}
          onRequestAutoFit={props.onRequestAutoFit}
          onValueChange={props.onValueChange}
          onRemoveEmptyText={props.onRemoveEmptyText}
          onFinishEditing={props.onFinishEditing}
          onEditingPointerDown={props.onEditingPointerDown}
          onPendingDragStart={props.onPendingDragStart}
        />
      ) : null}
    </div>
  );
}
