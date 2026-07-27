import type { DesignItem } from "../../components/editor/editor.types";
import type {
  CanvasPresetId,
  CanvasSize,
} from "../../components/editor/editor.constants";

export type ProjectRecord = {
  id: string;
  title: string;
  presetId: CanvasPresetId;
  canvasSize: CanvasSize;
  items: DesignItem[];
  createdAt: number;
  updatedAt: number;
};

export type ProjectSummary = Omit<ProjectRecord, "items"> & {
  itemCount: number;
};
