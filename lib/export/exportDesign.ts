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

const downloadExport = (
  blob: Blob,
  filename: string,
  extension: "png" | "jpg" | "pdf"
) => {
  const objectUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = objectUrl;
  downloadLink.download = `${sanitizeExportFilename(filename)}.${extension}`;
  downloadLink.hidden = true;
  document.body.appendChild(downloadLink);

  try {
    downloadLink.click();
  } finally {
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
};

export async function exportDesignAsPng(
  node: HTMLElement,
  items: DesignItem[],
  config: PngExportConfig
) {
  const blob = await captureDesignAsPng(node, items, config);

  downloadExport(blob, config.filename, "png");
}

export async function exportDesignAsJpg(
  node: HTMLElement,
  items: DesignItem[],
  config: JpgExportConfig
) {
  const blob = await captureDesignAsJpg(node, items, config);

  downloadExport(blob, config.filename, "jpg");
}

export async function exportDesignAsPdf(
  node: HTMLElement,
  items: DesignItem[],
  config: PdfExportConfig
) {
  const jpegConfig: JpgExportConfig = {
    ...config,
    format: "jpg",
    transparentBackground: false,
    quality: config.pdfType === "print-ready" ? 0.98 : 0.92,
  };
  const jpeg = await captureDesignAsJpg(node, items, jpegConfig);
  const pdf = await createSinglePagePdf(jpeg, config);

  downloadExport(pdf, config.filename, "pdf");
}

export async function exportDesign(
  node: HTMLElement,
  items: DesignItem[],
  config: DesignExportConfig
) {
  if (config.format === "png") {
    return exportDesignAsPng(node, items, config);
  }

  if (config.format === "jpg") {
    return exportDesignAsJpg(node, items, config);
  }

  return exportDesignAsPdf(node, items, config);
}
