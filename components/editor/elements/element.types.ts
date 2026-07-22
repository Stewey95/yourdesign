import type { Size } from "../editor.types";
import type { ShapeKind } from "../editor.types";

export type ElementAssetMetadataValue =
  | string
  | number
  | boolean
  | readonly string[];

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
  favourite: boolean;
  recent: boolean;
  metadata?: Readonly<Record<string, ElementAssetMetadataValue>>;
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
