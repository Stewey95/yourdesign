"use client";

import { forwardRef, useEffect } from "react";
import type { DesignItem } from "./editor.types";
import ShapeSvg from "./ShapeSvg";
import ElementSvg from "./ElementSvg";
import { getFontOption } from "./fonts/font.catalog";
import { ensureGoogleFontLoaded } from "./fonts/googleFontLoader";
import {
  getFreeformTextMaxWidth,
  getTextBoxWidth,
  TEXT_FONT_WEIGHT,
  TEXT_LINE_HEIGHT,
  TEXT_SHADOW,
} from "./textLayout";

type ExportCanvasProps = {
  items: DesignItem[];
  width: number;
  height: number;
};

const ExportCanvas = forwardRef<HTMLDivElement, ExportCanvasProps>(
  function ExportCanvas({ items, width, height }, ref) {
    useEffect(() => {
      items.forEach((item) => {
        if (item.type === "text") {
          ensureGoogleFontLoaded(getFontOption(item.fontFamily));
        }
      });
    }, [items]);

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
                  ? getTextBoxWidth(item) ?? "max-content"
                  : item.type === "shape" || item.type === "element"
                    ? item.size.width
                    : undefined,
              maxWidth:
                item.type === "text" && !getTextBoxWidth(item)
                  ? getFreeformTextMaxWidth(item, { width, height })
                  : undefined,
              height:
                item.type === "shape" || item.type === "element"
                  ? item.size.height
                  : undefined,
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
            ) : item.type === "element" ? (
              <ElementSvg
                item={item}
                className="block h-full w-full [&>svg]:h-full [&>svg]:w-full [&>svg]:overflow-visible"
              />
            ) : (
              <div
                data-export-text={item.id}
                style={{
                  display: "inline-block",
                  width: getTextBoxWidth(item) ?? "max-content",
                  maxWidth: getFreeformTextMaxWidth(item, {
                    width,
                    height,
                  }),
                  minHeight: "1.2em",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  textAlign: "center",
                  fontSize: item.fontSize,
                  fontFamily: item.fontFamily,
                  fontWeight: TEXT_FONT_WEIGHT,
                  color: item.color,
                  lineHeight: TEXT_LINE_HEIGHT,
                  textShadow: TEXT_SHADOW,
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
