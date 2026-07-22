import type { ShapeDesignItem } from "./editor.types";

const number = (value: number) => Number(value.toFixed(3));

const getStarPoints = (
  width: number,
  height: number,
  padding: number
) => {
  const centreX = width / 2;
  const centreY = height / 2;
  const outerX = Math.max(1, width / 2 - padding);
  const outerY = Math.max(1, height / 2 - padding);
  const innerScale = 0.46;

  return Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const scale = index % 2 === 0 ? 1 : innerScale;

    return {
      x: number(centreX + Math.cos(angle) * outerX * scale),
      y: number(centreY + Math.sin(angle) * outerY * scale),
    };
  });
};

export const getShapePath = (
  item: Pick<ShapeDesignItem, "shapeKind" | "size" | "strokeWidth">
) => {
  const { width, height } = item.size;
  const padding = Math.max(1, item.strokeWidth / 2 + 0.5);
  const left = padding;
  const top = padding;
  const right = Math.max(left, width - padding);
  const bottom = Math.max(top, height - padding);
  const middleX = width / 2;
  const middleY = height / 2;

  switch (item.shapeKind) {
    case "rectangle":
      return `M${left} ${top}H${right}V${bottom}H${left}Z`;
    case "roundedRectangle": {
      const radius = Math.min(width, height) * 0.16;

      return `M${left + radius} ${top}H${right - radius}Q${right} ${top} ${right} ${top + radius}V${bottom - radius}Q${right} ${bottom} ${right - radius} ${bottom}H${left + radius}Q${left} ${bottom} ${left} ${bottom - radius}V${top + radius}Q${left} ${top} ${left + radius} ${top}Z`;
    }
    case "circle": {
      const radiusX = Math.max(1, (right - left) / 2);
      const radiusY = Math.max(1, (bottom - top) / 2);
      const kappa = 0.5522847498;

      return `M${middleX} ${top}C${middleX + radiusX * kappa} ${top} ${right} ${middleY - radiusY * kappa} ${right} ${middleY}C${right} ${middleY + radiusY * kappa} ${middleX + radiusX * kappa} ${bottom} ${middleX} ${bottom}C${middleX - radiusX * kappa} ${bottom} ${left} ${middleY + radiusY * kappa} ${left} ${middleY}C${left} ${middleY - radiusY * kappa} ${middleX - radiusX * kappa} ${top} ${middleX} ${top}Z`;
    }
    case "triangle":
      return `M${middleX} ${top}L${right} ${bottom}H${left}Z`;
    case "star": {
      const points = getStarPoints(width, height, padding);

      return points
        .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
        .join("") + "Z";
    }
    case "line":
      return `M${left} ${middleY}H${right}`;
    case "arrow": {
      const headWidth = Math.min(width * 0.25, height * 0.55);
      const shaftEnd = Math.max(left, right - headWidth);
      const headHeight = Math.min(height * 0.36, headWidth);

      return `M${left} ${middleY}H${right}M${shaftEnd} ${middleY - headHeight}L${right} ${middleY} ${shaftEnd} ${middleY + headHeight}`;
    }
  }
};
