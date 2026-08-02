"use client";

import { memo } from "react";
import ElementSvg from "./ElementSvg";
import type { ProjectRecord } from "../../lib/projects/projects.types";

type ProjectThumbnailProps = {
  project: ProjectRecord;
};

function ProjectThumbnail({ project }: ProjectThumbnailProps) {
  const { canvasSize, items } = project;
  const width = canvasSize.width;
  const height = canvasSize.height;
  const maxDim = Math.max(width, height);
  const scale = 110 / maxDim;
  const containerWidth = Math.round(width * scale);
  const containerHeight = Math.round(height * scale);

  return (
    <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-950 p-2 shadow-inner">
      <div
        style={{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
          backgroundColor: "#0f172a",
        }}
        className="relative overflow-hidden rounded border border-white/10 shadow-md"
      >
        {items.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-[10px] italic text-slate-500">
            Empty canvas
          </div>
        ) : (
          items.map((item) => {
            if (item.hidden) return null;

            const itemX = item.position.x * scale;
            const itemY = item.position.y * scale;

            if (item.type === "shape") {
              const itemWidth = item.size.width * scale;
              const itemHeight = Math.max(2, item.size.height * scale);

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
                        ? "3px"
                        : "0px",
                  }}
                  className="absolute pointer-events-none"
                />
              );
            }

            if (item.type === "text") {
              const fontSize = Math.max(5, Math.round(item.fontSize * scale));

              return (
                <div
                  key={item.id}
                  style={{
                    left: `${itemX}px`,
                    top: `${itemY}px`,
                    fontSize: `${fontSize}px`,
                    color: item.color,
                    fontFamily: item.fontFamily,
                    lineHeight: 1.1,
                    transform: item.rotation
                      ? `rotate(${item.rotation}deg)`
                      : undefined,
                  }}
                  className="absolute max-w-full overflow-hidden whitespace-pre pointer-events-none font-bold select-none opacity-90"
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
                  className="absolute object-cover pointer-events-none opacity-80"
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

export default memo(ProjectThumbnail);
