export type Position = { x: number; y: number };
export type Size = { width: number; height: number };
export type ResizeCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type TextAlignment = "left" | "center" | "right";

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
  /**
   * Line alignment inside the text object's current layout width. This is
   * intentionally independent from the object's canvas position.
   */
  textAlign?: TextAlignment;
  /**
   * An explicitly-sized text box. Its absence is intentional: free-form
   * text grows to its content, then wraps against the real canvas boundary.
   * Authored newline characters remain authoritative in either mode.
   */
  textBoxWidth?: number;
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

export type ElementDesignItem = {
  id: string;
  type: "element";
  elementId: string;
  displayName: string;
  category: string;
  hidden: boolean;
  locked: boolean;
  position: Position;
  size: Size;
  rotation: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;
};

export type ResizableDesignItem =
  | ImageDesignItem
  | ShapeDesignItem
  | ElementDesignItem;

export type DesignItem =
  | ImageDesignItem
  | TextDesignItem
  | ShapeDesignItem
  | ElementDesignItem;

export type ImageAdjustment =
  | "brightness"
  | "contrast"
  | "saturation"
  | "opacity";
