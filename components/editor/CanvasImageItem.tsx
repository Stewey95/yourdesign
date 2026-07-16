"use client";

import type { ImageDesignItem } from "./editor.types";

type CanvasImageItemProps = {
  item: ImageDesignItem;
  selected: boolean;
  onPointerDown: (id: string) => void;
  onResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: ImageDesignItem
  ) => void;
};

export default function CanvasImageItem({
  item,
  selected,
  onPointerDown,
  onResizeStart,
}: CanvasImageItemProps) {
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
        transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: item.size.width,
          height: item.size.height,
        }}
      >
        <img
          src={item.src}
          alt="Uploaded design"
          draggable={false}
          onPointerDown={(event) => {
            event.stopPropagation();

            onPointerDown(item.id);
          }}
          className="h-full w-full cursor-move select-none rounded-lg object-contain"
          style={{
            filter: `brightness(${item.brightness}%) contrast(${item.contrast}%) saturate(${item.saturation}%)`,
            opacity: item.opacity / 100,
          }}
        />

        {selected && (
          <div
            onPointerDown={(event) =>
              onResizeStart(event, item)
            }
            className="absolute bottom-0 right-0 hidden h-5 w-5 cursor-se-resize rounded-full bg-blue-500 md:block"
          />
        )}
      </div>
    </div>
  );
}
