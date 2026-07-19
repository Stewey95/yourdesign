"use client";

import type { ImageDesignItem } from "./editor.types";

type CanvasImageItemProps = {
  item: ImageDesignItem;
  selected: boolean;
  displayScale: number;
  onPointerDown: (id: string) => void;
  onResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: ImageDesignItem
  ) => void;
};

export default function CanvasImageItem({
  item,
  selected,
  displayScale,
  onPointerDown,
  onResizeStart,
}: CanvasImageItemProps) {
  const hasImageFilters =
    item.brightness !== 100 ||
    item.contrast !== 100 ||
    item.saturation !== 100;

  return (
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
          filter: hasImageFilters
            ? `brightness(${item.brightness}%) contrast(${item.contrast}%) saturate(${item.saturation}%)`
            : undefined,
          opacity: item.opacity === 100 ? undefined : item.opacity / 100,
        }}
      />

      {selected && (
        <div
          onPointerDown={(event) =>
            onResizeStart(event, item)
          }
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
