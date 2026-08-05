import type { Size } from "../editor.types";
import type { ShapeKind } from "../editor.types";

export type ElementAssetMetadataValue =
  | string
  | number
  | boolean
  | readonly string[];

export type ElementGeometryBounds = {
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
   * Pure geometric bounding box (in the asset's native 0-100 viewBox units)
   * of the path/shape geometry painted by `svg` - stroke EXCLUDED, so it is
   * invariant to the item's current stroke/border width. Used only for
   * canvas placement: at render time `getElementSvgMarkup` inflates this by
   * the item's *current* stroke width to get the true visible bounds, so
   * the selection ring/resize handles/drag area stay correct automatically
   * as stroke width changes. Catalog thumbnails render the untouched `svg`
   * at its native viewBox and are unaffected.
   */
  geometryBounds?: ElementGeometryBounds;
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
