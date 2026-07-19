import type { ExportCanvasDimensions } from "../../types/export";

export const getScaledExportDimensions = (
  canvas: ExportCanvasDimensions,
  scale: number
) => ({
  width: Math.max(1, Math.round(canvas.width * scale)),
  height: Math.max(1, Math.round(canvas.height * scale)),
});
