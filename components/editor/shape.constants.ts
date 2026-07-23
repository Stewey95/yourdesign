import type {
  ShapeDesignItem,
  ShapeKind,
  Size,
} from "./editor.types";

export const DEFAULT_SHAPE_COLOUR = "#2563eb";
export const DEFAULT_SHAPE_STROKE_WIDTH = 2;
export const MIN_SHAPE_STROKE_WIDTH = 1;
export const MAX_SHAPE_STROKE_WIDTH = 20;

export const SHAPE_LABELS: Record<ShapeKind, string> = {
  rectangle: "Rectangle",
  roundedRectangle: "Rounded Rectangle",
  circle: "Circle",
  triangle: "Triangle",
  star: "Star",
  line: "Line",
  arrow: "Arrow",
};

export const SHAPE_DEFAULT_SIZES: Record<ShapeKind, Size> = {
  rectangle: { width: 120, height: 84 },
  roundedRectangle: { width: 120, height: 84 },
  circle: { width: 96, height: 96 },
  triangle: { width: 100, height: 92 },
  star: { width: 100, height: 100 },
  line: { width: 140, height: 28 },
  arrow: { width: 140, height: 56 },
};

export const isStrokeOnlyShape = (shapeKind: ShapeKind) =>
  shapeKind === "line" || shapeKind === "arrow";

export const getDefaultShapeStyle = (
  shapeKind: ShapeKind
): Pick<ShapeDesignItem, "fill" | "stroke" | "strokeWidth"> => {
  void shapeKind;

  return {
    fill: null,
    stroke: DEFAULT_SHAPE_COLOUR,
    strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
  };
};
