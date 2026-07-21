import type { PdfExportConfig } from "../../types/export";
import { getScaledExportDimensions } from "./exportDimensions";

const POINTS_PER_CSS_PIXEL = 72 / 96;

const formatPdfNumber = (value: number) =>
  Number.parseFloat(value.toFixed(4)).toString();

export async function createSinglePagePdf(
  jpeg: Blob,
  config: PdfExportConfig
) {
  const jpegBytes = new Uint8Array(await jpeg.arrayBuffer());
  const imageDimensions = getScaledExportDimensions(
    config.canvas,
    config.scale
  );
  const pageWidth = config.canvas.width * POINTS_PER_CSS_PIXEL;
  const pageHeight = config.canvas.height * POINTS_PER_CSS_PIXEL;
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteLength = 0;

  const append = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;

    chunks.push(bytes);
    byteLength += bytes.length;
  };

  const startObject = (objectNumber: number) => {
    offsets[objectNumber] = byteLength;
    append(`${objectNumber} 0 obj\n`);
  };

  append("%PDF-1.4\n%Gripix\n");

  startObject(1);
  append("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObject(2);
  append("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  startObject(3);
  append(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${formatPdfNumber(pageWidth)} ${formatPdfNumber(pageHeight)}] /Resources << /XObject << /Design 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  startObject(4);
  append(
    `<< /Type /XObject /Subtype /Image /Width ${imageDimensions.width} /Height ${imageDimensions.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  append(jpegBytes);
  append("\nendstream\nendobj\n");

  const pageContent = `q\n${formatPdfNumber(pageWidth)} 0 0 ${formatPdfNumber(pageHeight)} 0 0 cm\n/Design Do\nQ\n`;
  const pageContentBytes = encoder.encode(pageContent);

  startObject(5);
  append(`<< /Length ${pageContentBytes.length} >>\nstream\n`);
  append(pageContentBytes);
  append("endstream\nendobj\n");

  const crossReferenceOffset = byteLength;

  append("xref\n0 6\n");
  append("0000000000 65535 f \n");

  for (let objectNumber = 1; objectNumber <= 5; objectNumber += 1) {
    append(`${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`);
  }

  append(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF`
  );

  const pdfBuffer = new ArrayBuffer(byteLength);
  const pdfBytes = new Uint8Array(pdfBuffer);
  let writeOffset = 0;

  chunks.forEach((chunk) => {
    pdfBytes.set(chunk, writeOffset);
    writeOffset += chunk.length;
  });

  return new Blob([pdfBuffer], { type: "application/pdf" });
}
