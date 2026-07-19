import { toBlob } from "html-to-image";
import type { PngExportConfig } from "../../types/export";

const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const waitForImage = async (image: HTMLImageElement) => {
  if (!image.complete) {
    await new Promise<void>((resolve, reject) => {
      const handleLoad = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error("An uploaded image could not be prepared."));
      };
      const cleanup = () => {
        image.removeEventListener("load", handleLoad);
        image.removeEventListener("error", handleError);
      };

      image.addEventListener("load", handleLoad, { once: true });
      image.addEventListener("error", handleError, { once: true });
    });
  }

  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    throw new Error("An uploaded image could not be prepared.");
  }

  if (typeof image.decode === "function") {
    await image.decode();
  }
};

const waitForDesignAssets = async (node: HTMLElement) => {
  await waitForNextPaint();

  if (document.fonts) {
    await document.fonts.ready;
  }

  const images = Array.from(node.querySelectorAll("img"));

  await Promise.all(images.map(waitForImage));
};

export async function captureDesignAsPng(
  node: HTMLElement,
  config: PngExportConfig
) {
  await waitForDesignAssets(node);

  const canvasWidth = Math.max(
    1,
    Math.round(config.canvas.width * config.scale)
  );
  const canvasHeight = Math.max(
    1,
    Math.round(config.canvas.height * config.scale)
  );
  const blob = await toBlob(node, {
    width: config.canvas.width,
    height: config.canvas.height,
    canvasWidth,
    canvasHeight,
    pixelRatio: 1,
    backgroundColor: config.transparentBackground
      ? undefined
      : config.canvas.backgroundColor || "#ffffff",
    cacheBust: false,
  });

  if (!blob) {
    throw new Error("The browser could not create the PNG image.");
  }

  return blob;
}
