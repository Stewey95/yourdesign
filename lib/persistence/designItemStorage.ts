import {
  DEFAULT_IMAGE_MAX_HEIGHT,
  DEFAULT_IMAGE_MAX_WIDTH,
  DEFAULT_TEXT_FONT_SIZE,
  getBoundedImageSize,
} from "../../components/editor/editor.constants";
import { getElementAsset } from "../../components/editor/elements/elements.catalog";
import {
  getDefaultShapeStyle,
  SHAPE_DEFAULT_SIZES,
} from "../../components/editor/shape.constants";
import type {
  DesignItem,
  ImageDesignItem,
  Position,
  ShapeKind,
  Size,
} from "../../components/editor/editor.types";

export type StoredImageItem = Omit<ImageDesignItem, "src"> & {
  src: string | Blob;
};

export type StoredDesignItem =
  | Exclude<DesignItem, ImageDesignItem>
  | StoredImageItem;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const finiteNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;

const normalisePosition = (value: unknown): Position => {
  if (!isRecord(value)) return { x: 0, y: 0 };

  return {
    x: finiteNumber(value.x, 0),
    y: finiteNumber(value.y, 0),
  };
};

const normaliseSize = (value: unknown, fallback: Size): Size => {
  if (!isRecord(value)) return fallback;

  return getBoundedImageSize(
    finiteNumber(value.width, fallback.width),
    finiteNumber(value.height, fallback.height)
  );
};

const isShapeKind = (value: unknown): value is ShapeKind =>
  value === "rectangle" ||
  value === "roundedRectangle" ||
  value === "circle" ||
  value === "triangle" ||
  value === "star" ||
  value === "line" ||
  value === "arrow";

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("An uploaded image could not be prepared."));
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });

const isBlob = (value: unknown): value is Blob =>
  typeof Blob !== "undefined" && value instanceof Blob;

const prepareImageSource = async (source: string) => {
  if (!source.startsWith("blob:")) return source;

  const response = await fetch(source);

  if (!response.ok) {
    throw new Error("An uploaded image could not be saved locally.");
  }

  return readBlobAsDataUrl(await response.blob());
};

export const prepareDesignItemsForStorage = (items: DesignItem[]) =>
  Promise.all(
    items.map(async (item): Promise<StoredDesignItem> =>
      item.type === "image"
        ? { ...item, src: await prepareImageSource(item.src) }
        : item
    )
  );

const restoreStoredItem = async (
  value: unknown
): Promise<DesignItem | null> => {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.id.length === 0
  ) {
    return null;
  }

  const common = {
    id: value.id,
    hidden: value.hidden === true,
    locked: value.locked === true,
    position: normalisePosition(value.position),
    rotation: finiteNumber(value.rotation, 0),
  };

  if (value.type === "text") {
    return {
      ...value,
      ...common,
      type: "text",
      value: typeof value.value === "string" ? value.value : "",
      fontSize: Math.max(
        1,
        finiteNumber(value.fontSize, DEFAULT_TEXT_FONT_SIZE)
      ),
      color:
        typeof value.color === "string" ? value.color : "#0f172a",
      fontFamily:
        typeof value.fontFamily === "string"
          ? value.fontFamily
          : "Arial",
      // Legacy projects predate text-box modes. Keep them free-form instead
      // of silently restoring the retired fixed-width wrap behaviour.
      textBoxWidth:
        typeof value.textBoxWidth === "number" &&
        Number.isFinite(value.textBoxWidth) &&
        value.textBoxWidth >= 24
          ? value.textBoxWidth
          : undefined,
    };
  }

  if (value.type === "shape") {
    const shapeKind = isShapeKind(value.shapeKind)
      ? value.shapeKind
      : "rectangle";
    const defaults = getDefaultShapeStyle(shapeKind);

    return {
      ...value,
      ...common,
      type: "shape",
      shapeKind,
      size: normaliseSize(value.size, SHAPE_DEFAULT_SIZES[shapeKind]),
      fill:
        typeof value.fill === "string" || value.fill === null
          ? value.fill
          : defaults.fill,
      stroke:
        typeof value.stroke === "string" || value.stroke === null
          ? value.stroke
          : defaults.stroke,
      strokeWidth: Math.max(
        0,
        finiteNumber(value.strokeWidth, defaults.strokeWidth)
      ),
    };
  }

  if (
    value.type === "element" &&
    typeof value.elementId === "string" &&
    typeof value.displayName === "string" &&
    typeof value.category === "string"
  ) {
    const asset = getElementAsset(value.elementId);

    return {
      ...value,
      ...common,
      type: "element",
      elementId: value.elementId,
      displayName: value.displayName,
      category: value.category,
      size: normaliseSize(value.size, asset?.defaultSize ?? {
        width: DEFAULT_IMAGE_MAX_WIDTH,
        height: DEFAULT_IMAGE_MAX_HEIGHT,
      }),
      fill:
        typeof value.fill === "string" || value.fill === null
          ? value.fill
          : null,
      stroke:
        typeof value.stroke === "string" || value.stroke === null
          ? value.stroke
          : "#2563eb",
      strokeWidth: Math.max(0, finiteNumber(value.strokeWidth, 5)),
      opacity: Math.max(0, Math.min(100, finiteNumber(value.opacity, 100))),
    };
  }

  if (value.type === "image") {
    const source = value.src;

    if (typeof source !== "string" && !isBlob(source)) return null;

    return {
      ...value,
      ...common,
      type: "image",
      src:
        typeof source === "string"
          ? source
          : await readBlobAsDataUrl(source),
      size: normaliseSize(value.size, {
        width: DEFAULT_IMAGE_MAX_WIDTH,
        height: DEFAULT_IMAGE_MAX_HEIGHT,
      }),
      brightness: finiteNumber(value.brightness, 100),
      contrast: finiteNumber(value.contrast, 100),
      saturation: finiteNumber(value.saturation, 100),
      opacity: finiteNumber(value.opacity, 100),
    };
  }

  return null;
};

export const restoreStoredDesignItems = async (
  value: unknown
): Promise<DesignItem[]> => {
  if (!Array.isArray(value)) return [];

  const restoredItems = await Promise.all(
    value.map(restoreStoredItem)
  );

  return restoredItems.filter(
    (item): item is DesignItem => item !== null
  );
};
