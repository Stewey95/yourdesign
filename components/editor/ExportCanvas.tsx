"use client";

import { forwardRef } from "react";
import type { DesignItem } from "./editor.types";
import ShapeSvg from "./ShapeSvg";

type ExportCanvasProps = {
  items: DesignItem[];
  width: number;
  height: number;
};

const ExportCanvas = forwardRef<HTMLDivElement, ExportCanvasProps>(
  function ExportCanvas({ items, width, height }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        style={{
          position: "relative",
          width,
          height,
          overflow: "hidden",
          backgroundColor: "transparent",
          color: "#64748b",
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: item.position.x,
              top: item.position.y,
              width:
                item.type === "text"
                  ? "max-content"
                  : item.type === "shape"
                    ? item.size.width
                    : undefined,
              height: item.type === "shape" ? item.size.height : undefined,
              transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
              transformOrigin: "center",
            }}
          >
            {item.type === "image" ? (
              <div
                style={{
                  width: item.size.width,
                  height: item.size.height,
                }}
              >
                {/* Raw img is required for blob-backed user uploads and DOM capture. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt=""
                  draggable={false}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    borderRadius: 8,
                    objectFit: "contain",
                    filter: `brightness(${item.brightness}%) contrast(${item.contrast}%) saturate(${item.saturation}%)`,
                    opacity: item.opacity / 100,
                  }}
                />
              </div>
            ) : item.type === "shape" ? (
              <ShapeSvg
                item={item}
                className="block h-full w-full overflow-visible"
              />
            ) : (
              <div
                style={{
                  display: "inline-block",
                  width: "fit-content",
                  maxWidth: 460,
                  minHeight: "1.2em",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                  textAlign: "center",
                  fontSize: item.fontSize,
                  fontFamily: item.fontFamily,
                  fontWeight: 700,
                  color: item.color,
                  lineHeight: 1.15,
                  textShadow: "0 1px 4px rgba(0,0,0,0.35)",
                }}
              >
                {item.value}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
);

export default ExportCanvas;
