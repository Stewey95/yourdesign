import type {
  DesignExportConfig,
  JpgExportConfig,
  PdfExportConfig,
  PngExportConfig,
} from "../../types/export";
import type { DesignItem } from "../../components/editor/editor.types";
import {
  captureDesignAsJpg,
  captureDesignAsPng,
} from "./captureDesign";
import { createSinglePagePdf } from "./createPdf";

export type ExportDeliveryOptions = {
  onBeforeDownload?: () => void | Promise<void>;
};

export const sanitizeExportFilename = (filename: string) => {
  const sanitized = filename
    .normalize("NFKC")
    .trim()
    .replace(/\.(?:png|jpe?g|pdf)$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[. -]+|[. -]+$/g, "")
    .slice(0, 120);

  return sanitized || "genvilo-design";
};

const downloadExport = async (
  blob: Blob,
  filename: string,
  extension: "png" | "jpg" | "pdf",
  options?: ExportDeliveryOptions
) => {
  const objectUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = objectUrl;
  downloadLink.download = `${sanitizeExportFilename(filename)}.${extension}`;
  downloadLink.hidden = true;
  document.body.appendChild(downloadLink);

  try {
    await options?.onBeforeDownload?.();
    downloadLink.click();
  } finally {
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
};

export async function exportDesignAsPng(
  node: HTMLElement,
  items: DesignItem[],
  config: PngExportConfig,
  options?: ExportDeliveryOptions
) {
  const blob = await captureDesignAsPng(node, items, config);

  await downloadExport(blob, config.filename, "png", options);
}

export async function exportDesignAsJpg(
  node: HTMLElement,
  items: DesignItem[],
  config: JpgExportConfig,
  options?: ExportDeliveryOptions
) {
  const blob = await captureDesignAsJpg(node, items, config);

  await downloadExport(blob, config.filename, "jpg", options);
}

export async function exportDesignAsPdf(
  node: HTMLElement,
  items: DesignItem[],
  config: PdfExportConfig,
  options?: ExportDeliveryOptions
) {
  const jpegConfig: JpgExportConfig = {
    ...config,
    format: "jpg",
    transparentBackground: false,
    quality: config.pdfType === "print-ready" ? 0.98 : 0.92,
  };
  const jpeg = await captureDesignAsJpg(node, items, jpegConfig);
  const pdf = await createSinglePagePdf(jpeg, config);

  await downloadExport(pdf, config.filename, "pdf", options);
}

export async function exportDesign(
  node: HTMLElement,
  items: DesignItem[],
  config: DesignExportConfig,
  options?: ExportDeliveryOptions
) {
  if (config.format === "png") {
    return exportDesignAsPng(node, items, config, options);
  }

  if (config.format === "jpg") {
    return exportDesignAsJpg(node, items, config, options);
  }

  return exportDesignAsPdf(node, items, config, options);
}
