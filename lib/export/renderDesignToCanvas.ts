import type {
  DesignItem,
  ShapeDesignItem,
  TextDesignItem,
} from "../../components/editor/editor.types";
import { getShapePath } from "../../components/editor/shape.geometry";
import type {
  JpgExportConfig,
  PngExportConfig,
} from "../../types/export";
import { getScaledExportDimensions } from "./exportDimensions";

const TEXT_MAX_WIDTH = 460;
const TEXT_LINE_HEIGHT = 1.15;

const quoteFontFamily = (fontFamily: string) =>
  `"${fontFamily.replaceAll("\"", "\\\"")}"`;

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.addEventListener(
      "load",
      async () => {
        try {
          if (typeof image.decode === "function") {
            await image.decode();
          }
          resolve(image);
        } catch {
          reject(new Error("An uploaded image could not be decoded."));
        }
      },
      { once: true }
    );
    image.addEventListener(
      "error",
      () => reject(new Error("An uploaded image could not be loaded.")),
      { once: true }
    );

    if (/^https?:/.test(source)) {
      const sourceUrl = new URL(source, window.location.href);

      if (sourceUrl.origin !== window.location.origin) {
        image.crossOrigin = "anonymous";
      }
    }

    image.src = source;
  });

const wrapParagraph = (
  context: CanvasRenderingContext2D,
  paragraph: string,
  maximumWidth: number
) => {
  if (paragraph.length === 0) return [""];

  const lines: string[] = [];
  let line = "";
  let lastBreakIndex = -1;

  for (const character of paragraph) {
    const candidate = line + character;

    if (
      line.length === 0 ||
      context.measureText(candidate).width <= maximumWidth
    ) {
      line = candidate;
      if (/\s/.test(character)) lastBreakIndex = line.length - 1;
      continue;
    }

    if (lastBreakIndex >= 0) {
      const completedLine = line.slice(0, lastBreakIndex);
      const remainder = line.slice(lastBreakIndex + 1) + character;

      lines.push(completedLine);
      line = remainder;
    } else {
      lines.push(line);
      line = character;
    }

    lastBreakIndex = -1;
    for (let index = 0; index < line.length; index += 1) {
      if (/\s/.test(line[index])) lastBreakIndex = index;
    }
  }

  lines.push(line);
  return lines;
};

const drawTextItem = (
  context: CanvasRenderingContext2D,
  item: TextDesignItem
) => {
  if (!item.value) return;

  const fontFamily = quoteFontFamily(item.fontFamily);
  const lineHeight = item.fontSize * TEXT_LINE_HEIGHT;

  context.save();
  context.translate(item.position.x, item.position.y);
  context.rotate((item.rotation * Math.PI) / 180);
  context.font = `700 ${item.fontSize}px ${fontFamily}`;
  context.fillStyle = item.color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(0,0,0,0.35)";
  context.shadowBlur = 4;
  context.shadowOffsetY = 1;

  const lines = item.value
    .split("\n")
    .flatMap((paragraph) =>
      wrapParagraph(context, paragraph, TEXT_MAX_WIDTH)
    );
  const blockHeight = lines.length * lineHeight;

  lines.forEach((line, index) => {
    const y = -blockHeight / 2 + lineHeight * (index + 0.5);
    context.fillText(line, 0, y);
  });
  context.restore();
};

const drawShapeItem = (
  context: CanvasRenderingContext2D,
  item: ShapeDesignItem
) => {
  const path = new Path2D(getShapePath(item));

  context.save();
  context.translate(
    item.position.x - item.size.width / 2,
    item.position.y - item.size.height / 2
  );
  context.translate(item.size.width / 2, item.size.height / 2);
  context.rotate((item.rotation * Math.PI) / 180);
  context.translate(-item.size.width / 2, -item.size.height / 2);
  context.lineCap = "round";
  context.lineJoin = "round";

  if (item.fill) {
    context.fillStyle = item.fill;
    context.fill(path);
  }

  if (item.stroke && item.strokeWidth > 0) {
    context.strokeStyle = item.stroke;
    context.lineWidth = item.strokeWidth;
    context.stroke(path);
  }

  context.restore();
};

const addRoundedRectangle = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: "image/png" | "image/jpeg",
  quality?: number
) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Safari could not create the exported image."));
      }
    }, type, quality);
  });

async function renderDesignToImage(
  items: DesignItem[],
  config: PngExportConfig | JpgExportConfig,
  type: "image/png" | "image/jpeg",
  quality?: number
) {
  if (document.fonts) {
    await Promise.all([
      document.fonts.ready,
      ...items
        .filter((item): item is TextDesignItem => item.type === "text")
        .map((item) =>
          document.fonts.load(
            `700 ${item.fontSize}px ${quoteFontFamily(item.fontFamily)}`,
            item.value || " "
          )
        ),
    ]);
  }

  const dimensions = getScaledExportDimensions(
    config.canvas,
    config.scale
  );
  const canvas = document.createElement("canvas");

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Safari could not prepare the export canvas.");
  }

  const scaleX = dimensions.width / config.canvas.width;
  const scaleY = dimensions.height / config.canvas.height;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.setTransform(scaleX, 0, 0, scaleY, 0, 0);

  if (!config.transparentBackground) {
    context.fillStyle = config.canvas.backgroundColor || "#ffffff";
    context.fillRect(0, 0, config.canvas.width, config.canvas.height);
  }

  const imageSources = [
    ...new Set(
      items
        .filter((item) => item.type === "image")
        .map((item) => item.src)
    ),
  ];
  const loadedImages = new Map<string, HTMLImageElement>();

  try {
    const imageEntries = await Promise.all(
      imageSources.map(
        async (source) =>
          [source, await loadImage(source)] as const
      )
    );

    imageEntries.forEach(([source, image]) => {
      loadedImages.set(source, image);
    });

    for (const item of items) {
      if (item.type === "text") {
        drawTextItem(context, item);
        continue;
      }

      if (item.type === "shape") {
        drawShapeItem(context, item);
        continue;
      }

      const image = loadedImages.get(item.src);

      if (!image) {
        throw new Error("An uploaded image was not prepared for export.");
      }

      const x = -item.size.width / 2;
      const y = -item.size.height / 2;

      context.save();
      context.translate(item.position.x, item.position.y);
      context.rotate((item.rotation * Math.PI) / 180);
      context.globalAlpha = item.opacity / 100;
      context.filter = `brightness(${item.brightness}%) contrast(${item.contrast}%) saturate(${item.saturation}%)`;
      addRoundedRectangle(
        context,
        x,
        y,
        item.size.width,
        item.size.height,
        8
      );
      context.clip();
      context.drawImage(
        image,
        x,
        y,
        item.size.width,
        item.size.height
      );
      context.restore();
    }

    return await canvasToBlob(canvas, type, quality);
  } finally {
    loadedImages.clear();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 1;
    canvas.height = 1;
  }
}

export const renderDesignToPng = (
  items: DesignItem[],
  config: PngExportConfig
) => renderDesignToImage(items, config, "image/png");

export const renderDesignToJpg = (
  items: DesignItem[],
  config: JpgExportConfig
) => renderDesignToImage(items, config, "image/jpeg", config.quality);
