import type { PngExportConfig } from "../../types/export";
import { captureDesignAsPng } from "./captureDesign";

export const sanitizeExportFilename = (filename: string) => {
  const sanitized = filename
    .normalize("NFKC")
    .trim()
    .replace(/\.png$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[. -]+|[. -]+$/g, "")
    .slice(0, 120);

  return sanitized || "genvilo-design";
};

export async function exportDesignAsPng(
  node: HTMLElement,
  config: PngExportConfig
) {
  const blob = await captureDesignAsPng(node, config);
  const objectUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = objectUrl;
  downloadLink.download = `${sanitizeExportFilename(config.filename)}.png`;
  downloadLink.hidden = true;
  document.body.appendChild(downloadLink);

  try {
    downloadLink.click();
  } finally {
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}
