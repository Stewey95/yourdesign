export type ExportFormat = "png" | "jpg" | "pdf";
export type ExportQualityPreset = "standard" | "high" | "print";
export type PdfExportType = "standard" | "print-ready";

export type ExportCanvasDimensions = {
  width: number;
  height: number;
  backgroundColor?: string;
};

export type ExportConfig = {
  format: ExportFormat;
  filename: string;
  qualityPreset: ExportQualityPreset;
  scale: number;
  transparentBackground: boolean;
  canvas: ExportCanvasDimensions;
};

export type PngExportConfig = ExportConfig & {
  format: "png";
};

export type JpgExportConfig = ExportConfig & {
  format: "jpg";
  quality: number;
};

export type PdfExportConfig = ExportConfig & {
  format: "pdf";
  pdfType: PdfExportType;
};

export type DesignExportConfig =
  | PngExportConfig
  | JpgExportConfig
  | PdfExportConfig;
