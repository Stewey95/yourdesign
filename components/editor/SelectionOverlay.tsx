"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import CornerResizeHandles from "./CornerResizeHandles";
import type {
  DesignItem,
  ResizeCorner,
  ResizableDesignItem,
  Size,
  TextDesignItem,
} from "./editor.types";

type SelectionOverlayProps = {
  canvasRef: RefObject<HTMLDivElement | null>;
  item: DesignItem | null;
  displayScale: number;
  desktopLayout: boolean;
  onImageResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: ResizableDesignItem,
    corner: ResizeCorner
  ) => void;
  onTextResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: TextDesignItem,
    corner: ResizeCorner
  ) => void;
};

export default function SelectionOverlay({
  canvasRef,
  item,
  displayScale,
  desktopLayout,
  onImageResizeStart,
  onTextResizeStart,
}: SelectionOverlayProps) {
  const [textSize, setTextSize] = useState<Size | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!item || item.type !== "text") return;

    const textItem = canvasRef.current?.querySelector<HTMLElement>(
      `[data-canvas-item-id="${item.id}"]`
    );
    if (!textItem) return;

    let active = true;
    const measure = () => {
      const width = textItem.offsetWidth;
      const height = textItem.offsetHeight;
      if (!active || width <= 0 || height <= 0) return;

      // React state is intentionally not the paint-critical part of the
      // update. Safari can defer the state render while it is processing a
      // pointermove, so keep the existing overlay element in lockstep with
      // the measured text box before the browser paints that frame.
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.style.width = `${width}px`;
        overlay.style.height = `${height}px`;
      }

      queueMicrotask(() => {
        if (active) setTextSize({ width, height });
      });

    };

    // The text's intrinsic box changes with every font-size update. Force
    // that measurement in the layout phase rather than waiting a frame.
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(textItem);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [canvasRef, item]);

  if (!item || item.hidden) return null;

  const size = item.type === "text" ? textSize : item.size;
  if (!size) return null;

  const startResize = (
    event: React.PointerEvent<HTMLDivElement>,
    corner: ResizeCorner
  ) => {
    if (item.type === "text") {
      onTextResizeStart(event, item, corner);
      return;
    }

    onImageResizeStart(event, item, corner);
  };

  return (
    <div
      ref={overlayRef}
      data-selection-overlay={item.id}
      className="pointer-events-none absolute z-[70]"
      style={{
        left: item.position.x,
        top: item.position.y,
        width: size.width,
        height: size.height,
        transform: `translate3d(-50%, -50%, 0) rotate(${item.rotation}deg) scale(var(--text-resize-preview-scale, 1))`,
        transformOrigin: "center",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    >
      {(desktopLayout || item.type !== "text") && (
        <div
          data-selection-ring
          className="absolute inset-0 ring-2 ring-blue-500"
        />
      )}
      {desktopLayout && !item.locked && (
        <CornerResizeHandles
          displayScale={displayScale}
          onResizeStart={startResize}
        />
      )}
    </div>
  );
}
