"use client";

import ShapeSvg from "./ShapeSvg";
import CornerResizeHandles from "./CornerResizeHandles";
import type { ResizeCorner, ShapeDesignItem } from "./editor.types";

type CanvasShapeItemProps = {
  item: ShapeDesignItem;
  selected: boolean;
  mobileLayout?: boolean;
  displayScale: number;
  onPointerDown: (
    id: string,
    clientX: number,
    clientY: number,
    pointerId: number,
    pointerType: string,
    sourceElement?: HTMLElement
  ) => boolean;
  onResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: ShapeDesignItem,
    corner: ResizeCorner
  ) => void;
};

export default function CanvasShapeItem({
  item,
  selected,
  mobileLayout,
  displayScale,
  onPointerDown,
  onResizeStart,
}: CanvasShapeItemProps) {
  return (
    <div
      className="relative"
      style={{ width: item.size.width, height: item.size.height }}
    >
      <ShapeSvg
        item={item}
        className="h-full w-full cursor-move select-none overflow-visible"
      />
      <div
        className="absolute inset-0 cursor-move"
        onPointerDown={(event) => {
          event.stopPropagation();
          const ownsInteraction = onPointerDown(
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
        }}
      />

      {selected && !mobileLayout && (
        <CornerResizeHandles
          displayScale={displayScale}
          onResizeStart={(event, corner) =>
            onResizeStart(event, item, corner)
          }
        />
      )}
    </div>
  );
}
