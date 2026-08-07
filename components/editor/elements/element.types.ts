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
  /**
   * Optional per-element ceiling on stroke width, below the shared global
   * MAX_SHAPE_STROKE_WIDTH. Detailed artwork with multiple close internal
   * negative-space regions (e.g. a pencil's banding, a waffle pattern) can
   * have those gaps swallowed by a stroke width that a simple single-outline
   * shape handles fine - this lets each element declare the real ceiling its
   * own geometry supports, rather than weakening the shared default for
   * every element. Omit for elements with no such fragile internal detail.
   */
  maxStrokeWidth?: number;
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
