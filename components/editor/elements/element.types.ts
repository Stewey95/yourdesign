import type { Size } from "../editor.types";
import type { ShapeKind } from "../editor.types";

export type ElementAssetMetadataValue =
  | string
  | number
  | boolean
  | readonly string[];

export type ElementVisibleBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ElementAsset = {
  id: string;
  name: string;
  category: string;
  tags: readonly string[];
  svg: string;
  defaultSize: Size;
  insertion:
    | { kind: "shape"; shapeKind: ShapeKind }
    | { kind: "graphic" };
  colourMode?: "fill-and-stroke" | "stroke" | "none";
  favourite: boolean;
  recent: boolean;
  metadata?: Readonly<Record<string, ElementAssetMetadataValue>>;
  /**
   * Tight bounding box (in the asset's native 0-100 viewBox units) of the
   * artwork actually painted by `svg`, stroke included. Used only for canvas
   * placement (selection/resize/drag bounds) so those hug the visible
   * artwork instead of the full authoring viewBox; catalog thumbnails still
   * render the untouched `svg` at its native viewBox.
   */
  visibleBounds?: ElementVisibleBounds;
};

export type ElementSearchOptions = {
  query?: string;
  category?: string;
  limit?: number;
};

export type ElementSearchResult = {
  items: readonly ElementAsset[];
  total: number;
};
