"use client";

import { useState } from "react";
import CornerResizeHandles from "./CornerResizeHandles";
import type { ImageDesignItem, ResizeCorner } from "./editor.types";

type CanvasImageItemProps = {
  item: ImageDesignItem;
  selected: boolean;
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
    item: ImageDesignItem,
    corner: ResizeCorner
  ) => void;
};

export default function CanvasImageItem({
  item,
  selected,
  displayScale,
  onPointerDown,
  onResizeStart,
}: CanvasImageItemProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageFailed = failedSource === item.src;
  const hasImageFilters =
    item.brightness !== 100 ||
    item.contrast !== 100 ||
    item.saturation !== 100;

  return (
    <div
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
      className="relative"
      style={{
        width: item.size.width,
        height: item.size.height,
      }}
    >
      <img
        src={item.src}
        alt="Uploaded design"
        draggable={false}
        onError={() => setFailedSource(item.src)}
        className={`h-full w-full cursor-move select-none rounded-lg object-contain ${
          imageFailed ? "invisible" : ""
        }`}
        style={{
          filter: hasImageFilters
            ? `brightness(${item.brightness}%) contrast(${item.contrast}%) saturate(${item.saturation}%)`
            : undefined,
          opacity: item.opacity === 100 ? undefined : item.opacity / 100,
        }}
      />

      {imageFailed && (
        <div className="absolute inset-0 flex cursor-move items-center justify-center rounded-lg border border-dashed border-slate-400/60 bg-slate-100/90 p-2 text-center text-[10px] leading-tight text-slate-600">
          Image unavailable
          <br />
          Re-upload this image
        </div>
      )}

      {selected && (
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
