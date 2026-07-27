import type { CanvasPresetId } from "../../components/editor/editor.constants";
import type { DesignItem } from "../../components/editor/editor.types";

export type TemplateCategory =
  | "all"
  | "social"
  | "product"
  | "marketing"
  | "personal";

export type Template = {
  id: string;
  name: string;
  category: Exclude<TemplateCategory, "all">;
  description: string;
  presetId: CanvasPresetId;
  width: number;
  height: number;
  badge?: string;
  tags: string[];
  backgroundColor?: string;
  items: DesignItem[];
};
