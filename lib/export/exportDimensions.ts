import type {
  ExportCanvasDimensions,
  ExportQualityPreset,
} from "../../types/export";

const EXPORT_QUALITY_SCALES: Record<ExportQualityPreset, number> = {
  standard: 1,
  high: 3,
  print: 10,
};

export const getExportScale = (quality: ExportQualityPreset) =>
  EXPORT_QUALITY_SCALES[quality];

export const getScaledExportDimensions = (
  canvas: ExportCanvasDimensions,
  scale: number
) => ({
  width: Math.max(1, Math.round(canvas.width * scale)),
  height: Math.max(1, Math.round(canvas.height * scale)),
});
