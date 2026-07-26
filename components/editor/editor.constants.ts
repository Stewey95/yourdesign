export const SNAP_THRESHOLD = 8;

export type CanvasPresetId =
  | "landscape"
  | "portrait"
  | "a4-portrait"
  | "a4-landscape"
  | "a3-portrait"
  | "a3-landscape"
  | "square"
  | "instagram-post"
  | "instagram-story"
  | "facebook-post"
  | "youtube-thumbnail"
  | "etsy-listing"
  | "pinterest-pin"
  | "custom";

export type CanvasSize = {
  width: number;
  height: number;
};

export type CanvasPreset = CanvasSize & {
  id: CanvasPresetId;
  label: string;
  category: "Gripix" | "Print" | "Social";
  description?: string;
};

export const CANVAS_PRESETS: readonly CanvasPreset[] = [
  {
    id: "landscape",
    label: "Landscape",
    width: 360,
    height: 256,
    category: "Gripix",
  },
  {
    id: "portrait",
    label: "Portrait",
    width: 360,
    height: 480,
    category: "Gripix",
  },
  {
    id: "square",
    label: "Square",
    width: 360,
    height: 360,
    category: "Gripix",
  },
  {
    id: "a4-portrait",
    label: "A4 Portrait",
    width: 794,
    height: 1123,
    category: "Print",
    description: "Portrait print format",
  },
  {
    id: "a4-landscape",
    label: "A4 Landscape",
    width: 1123,
    height: 794,
    category: "Print",
    description: "Landscape print format",
  },
  {
    id: "a3-portrait",
    label: "A3 Portrait",
    width: 1123,
    height: 1587,
    category: "Print",
    description: "Large portrait print format",
  },
  {
    id: "a3-landscape",
    label: "A3 Landscape",
    width: 1587,
    height: 1123,
    category: "Print",
    description: "Large landscape print format",
  },
  {
    id: "instagram-post",
    label: "Instagram Post",
    width: 1080,
    height: 1080,
    category: "Social",
  },
  {
    id: "instagram-story",
    label: "Instagram Story",
    width: 1080,
    height: 1920,
    category: "Social",
  },
  {
    id: "facebook-post",
    label: "Facebook Post",
    width: 1200,
    height: 630,
    category: "Social",
  },
  {
    id: "youtube-thumbnail",
    label: "YouTube Thumbnail",
    width: 1280,
    height: 720,
    category: "Social",
  },
  {
    id: "etsy-listing",
    label: "Etsy Listing Image",
    width: 2000,
    height: 2000,
    category: "Social",
  },
  {
    id: "pinterest-pin",
    label: "Pinterest Pin",
    width: 1000,
    height: 1500,
    category: "Social",
  },
];

export const CUSTOM_CANVAS_MIN_SIZE = 64;
export const CUSTOM_CANVAS_MAX_SIZE = 4000;

export const DEFAULT_DESKTOP_CANVAS_PRESET_ID: CanvasPresetId =
  "landscape";
export const DEFAULT_MOBILE_CANVAS_PRESET_ID: CanvasPresetId =
  "portrait";

export const getCanvasPreset = (id: CanvasPresetId) =>
  CANVAS_PRESETS.find((preset) => preset.id === id) ??
  CANVAS_PRESETS[0];

export const isCanvasPresetId = (
  value: unknown
): value is CanvasPresetId =>
  value === "custom" ||
  CANVAS_PRESETS.some((preset) => preset.id === value);

export const isValidCanvasSize = (
  value: unknown
): value is CanvasSize => {
  if (!value || typeof value !== "object") return false;

  const size = value as Partial<CanvasSize>;

  return (
    Number.isInteger(size.width) &&
    Number.isInteger(size.height) &&
    Number(size.width) >= CUSTOM_CANVAS_MIN_SIZE &&
    Number(size.width) <= CUSTOM_CANVAS_MAX_SIZE &&
    Number(size.height) >= CUSTOM_CANVAS_MIN_SIZE &&
    Number(size.height) <= CUSTOM_CANVAS_MAX_SIZE
  );
};

export const DEFAULT_IMAGE_MAX_WIDTH = 120;
export const DEFAULT_IMAGE_MAX_HEIGHT = 84;
export const IMAGE_MIN_SIZE = 8;
export const IMAGE_MAX_SIZE = 5000;

export const DEFAULT_TEXT_FONT_SIZE = 20;
export const TEXT_MIN_FONT_SIZE = 2;
export const TEXT_MAX_FONT_SIZE = 1000;
export const TEXT_FONT_SIZE_STEP = 2;

export const clampFontSize = (fontSize: number) =>
  Math.max(
    TEXT_MIN_FONT_SIZE,
    Math.min(
      TEXT_MAX_FONT_SIZE,
      Number.isFinite(fontSize)
        ? fontSize
        : DEFAULT_TEXT_FONT_SIZE
    )
  );

export const getBoundedImageSize = (
  width: number,
  height: number
) => {
  const safeWidth =
    Number.isFinite(width) && width > 0
      ? width
      : DEFAULT_IMAGE_MAX_WIDTH;
  const safeHeight =
    Number.isFinite(height) && height > 0
      ? height
      : DEFAULT_IMAGE_MAX_HEIGHT;
  const minimumScale = Math.max(
    IMAGE_MIN_SIZE / safeWidth,
    IMAGE_MIN_SIZE / safeHeight
  );
  const maximumScale = Math.min(
    IMAGE_MAX_SIZE / safeWidth,
    IMAGE_MAX_SIZE / safeHeight
  );
  const scale = Math.min(
    maximumScale,
    Math.max(minimumScale, 1)
  );

  return {
    width: safeWidth * scale,
    height: safeHeight * scale,
  };
};

export const getInitialImageSize = (
  naturalWidth: number,
  naturalHeight: number
) => {
  const safeWidth =
    Number.isFinite(naturalWidth) && naturalWidth > 0
      ? naturalWidth
      : DEFAULT_IMAGE_MAX_WIDTH;
  const safeHeight =
    Number.isFinite(naturalHeight) && naturalHeight > 0
      ? naturalHeight
      : DEFAULT_IMAGE_MAX_HEIGHT;
  const scale = Math.min(
    1,
    DEFAULT_IMAGE_MAX_WIDTH / safeWidth,
    DEFAULT_IMAGE_MAX_HEIGHT / safeHeight
  );

  return {
    width: safeWidth * scale,
    height: safeHeight * scale,
  };
};
