"use client";

import ShapeSvg from "./ShapeSvg";
import type { ShapeDesignItem } from "./editor.types";

type CanvasShapeItemProps = {
  item: ShapeDesignItem;
  selected: boolean;
  displayScale: number;
  onPointerDown: (id: string) => void;
  onResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: ShapeDesignItem
  ) => void;
};

export default function CanvasShapeItem({
  item,
  selected,
  displayScale,
  onPointerDown,
  onResizeStart,
}: CanvasShapeItemProps) {
  return (
    <div
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
          onPointerDown(item.id);
        }}
      />

      {selected && (
        <div
          onPointerDown={(event) => onResizeStart(event, item)}
          className="absolute hidden cursor-se-resize items-center justify-center md:flex"
          style={{
            left: "100%",
            top: "100%",
            width: 20 / displayScale,
            height: 20 / displayScale,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span
            aria-hidden="true"
            className="block bg-blue-500"
            style={{
              width: 4 / displayScale,
              height: 4 / displayScale,
              outline: `${1 / displayScale}px solid white`,
              borderRadius: 1 / displayScale,
            }}
          />
        </div>
      )}
    </div>
  );
}
