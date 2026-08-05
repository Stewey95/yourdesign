"use client";

import { useEffect } from "react";
import type { ProjectRecord } from "../../lib/projects/projects.types";
import ElementSvg from "../editor/ElementSvg";
import { getFontOption } from "../editor/fonts/font.catalog";
import { ensureGoogleFontLoaded } from "../editor/fonts/googleFontLoader";

type ProductPageThumbnailProps = {
  project?: ProjectRecord | null;
  className?: string;
};

export default function ProductPageThumbnail({
  project,
  className = "",
}: ProductPageThumbnailProps) {
  useEffect(() => {
    project?.items.forEach((item) => {
      if (item.type === "text") {
        ensureGoogleFontLoaded(getFontOption(item.fontFamily));
      }
    });
  }, [project]);

  if (!project) {
    return (
      <div
        className={`flex aspect-[16/10] w-full items-center justify-center bg-slate-100 text-slate-400 ${className}`}
      >
        <div className="h-6 w-6 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  const { canvasSize, items } = project;
  const width = Math.max(100, canvasSize?.width || 800);
  const height = Math.max(100, canvasSize?.height || 600);
  const aspectRatio = width / height;

  // Compute a scale factor to fit the canvas nicely inside the thumbnail box
  const targetWidth = 320;
  const scale = targetWidth / width;
  const scaledHeight = height * scale;

  return (
    <div
      className={`relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-slate-100/80 p-3 ${className}`}
    >
      <div
        style={{
          width: `${targetWidth}px`,
          height: `${scaledHeight}px`,
          aspectRatio: `${aspectRatio}`,
          maxHeight: "100%",
          maxWidth: "100%",
          transform: `scale(calc(min(1, 100% / ${targetWidth}px)))`,
        }}
        className="relative shrink-0 overflow-hidden rounded bg-white shadow-sm ring-1 ring-slate-900/10 transition-transform duration-200 group-hover:scale-[1.02]"
      >
        {items.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-slate-400">
            Empty page
          </div>
        ) : (
          items.map((item) => {
            if (item.hidden) return null;

            const itemX = item.position.x * scale;
            const itemY = item.position.y * scale;

            if (item.type === "shape") {
              const itemWidth = item.size.width * scale;
              const itemHeight = Math.max(1, item.size.height * scale);

              return (
                <div
                  key={item.id}
                  style={{
                    left: `${itemX}px`,
                    top: `${itemY}px`,
                    width: `${itemWidth}px`,
                    height: `${itemHeight}px`,
                    backgroundColor: item.fill || "transparent",
                    borderColor: item.stroke || "transparent",
                    borderWidth: item.stroke
                      ? Math.max(1, (item.strokeWidth || 1) * scale)
                      : 0,
                    transform: item.rotation
                      ? `rotate(${item.rotation}deg)`
                      : undefined,
                    borderRadius:
                      item.shapeKind === "circle"
                        ? "9999px"
                        : item.shapeKind === "roundedRectangle"
                        ? "4px"
                        : "0px",
                  }}
                  className="pointer-events-none absolute"
                />
              );
            }

            if (item.type === "text") {
              const fontSize = Math.max(4, Math.round(item.fontSize * scale));

              return (
                <div
                  key={item.id}
                  style={{
                    left: `${itemX}px`,
                    top: `${itemY}px`,
                    fontSize: `${fontSize}px`,
                    color: item.color || "#0f172a",
                    fontFamily: item.fontFamily,
                    lineHeight: 1.1,
                    transform: item.rotation
                      ? `rotate(${item.rotation}deg)`
                      : undefined,
                  }}
                  className="pointer-events-none absolute max-w-full select-none overflow-hidden whitespace-pre font-bold opacity-90"
                >
                  {item.value}
                </div>
              );
            }

            if (item.type === "image") {
              const itemWidth = item.size.width * scale;
              const itemHeight = item.size.height * scale;

              return (
                <img
                  key={item.id}
                  src={item.src}
                  alt=""
                  style={{
                    left: `${itemX}px`,
                    top: `${itemY}px`,
                    width: `${itemWidth}px`,
                    height: `${itemHeight}px`,
                    transform: item.rotation
                      ? `rotate(${item.rotation}deg)`
                      : undefined,
                  }}
                  className="pointer-events-none absolute object-cover opacity-90"
                />
              );
            }

            if (item.type === "element") {
              return (
                <ElementSvg
                  key={item.id}
                  item={item}
                  style={{
                    left: itemX,
                    top: itemY,
                    width: item.size.width * scale,
                    height: item.size.height * scale,
                    transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                  }}
                  className="pointer-events-none absolute [&>svg]:h-full [&>svg]:w-full"
                />
              );
            }

            return null;
          })
        )}
      </div>
    </div>
  );
}
