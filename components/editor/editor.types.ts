export type Position = { x: number; y: number };
export type Size = { width: number; height: number };

export type ImageDesignItem = {
  id: string;
  type: "image";
  hidden: boolean;
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
  value: string;
  position: Position;
  fontSize: number;
  color: string;
  fontFamily: string;
  rotation: number;
};

export type DesignItem = ImageDesignItem | TextDesignItem;

export type ImageAdjustment =
  | "brightness"
  | "contrast"
  | "saturation"
  | "opacity";
