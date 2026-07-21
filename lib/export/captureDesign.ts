import { toBlob, toJpeg } from "html-to-image";
import type {
  JpgExportConfig,
  PngExportConfig,
} from "../../types/export";
import type { DesignItem } from "../../components/editor/editor.types";
import { getScaledExportDimensions } from "./exportDimensions";
import { isMobileSafari } from "./isMobileSafari";
import {
  renderDesignToJpg,
  renderDesignToPng,
} from "./renderDesignToCanvas";

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

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("An uploaded image could not be embedded."));
      }
    });
    reader.addEventListener("error", () => {
      reject(new Error("An uploaded image could not be embedded."));
    });
    reader.readAsDataURL(blob);
  });

const embedBlobImages = async (node: HTMLElement) => {
  const images = Array.from(node.querySelectorAll("img"));
  const originalSources = new Map<HTMLImageElement, string>();
  const dataUrlCache = new Map<string, string>();

  try {
    for (const image of images) {
      const source = image.src;

      if (!source.startsWith("blob:")) continue;

      originalSources.set(image, source);

      let dataUrl = dataUrlCache.get(source);

      if (!dataUrl) {
        const response = await fetch(source);

        if (!response.ok) {
          throw new Error("An uploaded image could not be embedded.");
        }

        dataUrl = await readBlobAsDataUrl(await response.blob());
        dataUrlCache.set(source, dataUrl);
      }

      image.src = dataUrl;
      await waitForImage(image);
    }
  } catch (error) {
    originalSources.forEach((source, image) => {
      image.src = source;
    });
    throw error;
  }

  return () => {
    originalSources.forEach((source, image) => {
      image.src = source;
    });
    originalSources.clear();
    dataUrlCache.clear();
  };
};

export async function captureDesignAsPng(
  node: HTMLElement,
  items: DesignItem[],
  config: PngExportConfig
) {
  if (isMobileSafari()) {
    return renderDesignToPng(items, config);
  }

  const restoreBlobImages = await embedBlobImages(node);

  try {
    await waitForDesignAssets(node);

    const dimensions = getScaledExportDimensions(
      config.canvas,
      config.scale
    );
    const blob = await toBlob(node, {
      width: config.canvas.width,
      height: config.canvas.height,
      canvasWidth: dimensions.width,
      canvasHeight: dimensions.height,
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
  } finally {
    restoreBlobImages();
  }
}

export async function captureDesignAsJpg(
  node: HTMLElement,
  items: DesignItem[],
  config: JpgExportConfig
) {
  if (isMobileSafari()) {
    return renderDesignToJpg(items, config);
  }

  const restoreBlobImages = await embedBlobImages(node);

  try {
    await waitForDesignAssets(node);

    const dimensions = getScaledExportDimensions(
      config.canvas,
      config.scale
    );
    const dataUrl = await toJpeg(node, {
      width: config.canvas.width,
      height: config.canvas.height,
      canvasWidth: dimensions.width,
      canvasHeight: dimensions.height,
      pixelRatio: 1,
      quality: config.quality,
      backgroundColor: config.canvas.backgroundColor || "#ffffff",
      cacheBust: false,
    });
    const response = await fetch(dataUrl);

    if (!response.ok) {
      throw new Error("The browser could not create the JPG image.");
    }

    return await response.blob();
  } finally {
    restoreBlobImages();
  }
}
