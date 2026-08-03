"use client";

import CornerResizeHandles from "./CornerResizeHandles";
import ElementSvg from "./ElementSvg";
import type { ElementDesignItem, ResizeCorner } from "./editor.types";

export default function CanvasElementItem({
  item,
  selected,
  mobileLayout,
  displayScale,
  onPointerDown,
  onResizeStart,
}: {
  item: ElementDesignItem;
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
    item: ElementDesignItem,
    corner: ResizeCorner
  ) => void;
}) {
  return (
    <div
      className="relative"
      style={{ width: item.size.width, height: item.size.height }}
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
    >
      <ElementSvg
        item={item}
        className="h-full w-full cursor-move select-none [&>svg]:h-full [&>svg]:w-full [&>svg]:overflow-visible"
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
