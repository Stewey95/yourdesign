import { getShapePath } from "./shape.geometry";
import type { ShapeDesignItem } from "./editor.types";

type ShapeSvgProps = {
  item: ShapeDesignItem;
  className?: string;
};

export default function ShapeSvg({ item, className }: ShapeSvgProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${item.size.width} ${item.size.height}`}
      preserveAspectRatio="none"
      className={className}
    >
      <path
        d={getShapePath(item)}
        fill={item.fill ?? "none"}
        stroke={item.stroke ?? "none"}
        strokeWidth={item.stroke ? item.strokeWidth : 0}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
