export type Position = { x: number; y: number };
export type Size = { width: number; height: number };

export type ShapeKind =
  | "rectangle"
  | "roundedRectangle"
  | "circle"
  | "triangle"
  | "star"
  | "line"
  | "arrow";

export type ImageDesignItem = {
  id: string;
  type: "image";
  hidden: boolean;
  locked: boolean;
  src: string;
  position: Position;
  size: Size;
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  opacity: number;
};

export type TextDesignItem = {
  id: string;
  type: "text";
  hidden: boolean;
  locked: boolean;
  value: string;
  position: Position;
  fontSize: number;
  color: string;
  fontFamily: string;
  rotation: number;
};

export type ShapeDesignItem = {
  id: string;
  type: "shape";
  shapeKind: ShapeKind;
  hidden: boolean;
  locked: boolean;
  position: Position;
  size: Size;
  rotation: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
};

export type ResizableDesignItem = ImageDesignItem | ShapeDesignItem;

export type DesignItem =
  | ImageDesignItem
  | TextDesignItem
  | ShapeDesignItem;

export type ImageAdjustment =
  | "brightness"
  | "contrast"
  | "saturation"
  | "opacity";
