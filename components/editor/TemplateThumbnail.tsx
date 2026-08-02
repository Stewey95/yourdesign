"use client";

import type { Template } from "../../lib/templates/templates.types";
import ElementSvg from "./ElementSvg";

type TemplateThumbnailProps = {
  template: Template;
};

export default function TemplateThumbnail({ template }: TemplateThumbnailProps) {
  const { width, height, items, backgroundColor = "#0f172a" } = template;
  const maxDim = Math.max(width, height);
  const scale = 120 / maxDim;
  const containerWidth = Math.round(width * scale);
  const containerHeight = Math.round(height * scale);

  return (
    <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-950 p-2 shadow-inner">
      <div
        style={{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
          backgroundColor,
        }}
        className="relative overflow-hidden rounded border border-white/10 shadow-md transition-transform group-hover:scale-105"
      >
        {items.map((item) => {
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
                  borderWidth: item.stroke ? Math.max(1, item.strokeWidth * scale) : 0,
                  transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                  borderRadius:
                    item.shapeKind === "circle"
                      ? "9999px"
                      : item.shapeKind === "roundedRectangle"
                        ? "4px"
                        : "0px",
                }}
                className="absolute pointer-events-none"
              />
            );
          }

          if (item.type === "text") {
            const fontSize = Math.max(6, Math.round(item.fontSize * scale));

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
                  transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                }}
                className="absolute max-w-full overflow-hidden whitespace-pre pointer-events-none font-bold select-none opacity-90"
              >
                {item.value}
              </div>
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
        })}
      </div>
    </div>
  );
}
