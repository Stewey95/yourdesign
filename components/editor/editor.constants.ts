export const fontOptions = [
  "Arial",
  "Georgia",
  "Verdana",
  "Impact",
  "Courier New",
  "Trebuchet MS",
  "Comic Sans MS",
  "Brush Script MT",
  "Times New Roman",
];

export const SNAP_THRESHOLD = 8;

export type CanvasPresetId = "landscape" | "portrait" | "square";

export type CanvasPreset = {
  id: CanvasPresetId;
  label: string;
  width: number;
  height: number;
};

export const CANVAS_PRESETS: readonly CanvasPreset[] = [
  { id: "landscape", label: "Landscape", width: 360, height: 256 },
  { id: "portrait", label: "Portrait", width: 360, height: 480 },
  { id: "square", label: "Square", width: 360, height: 360 },
];

export const DEFAULT_DESKTOP_CANVAS_PRESET_ID: CanvasPresetId =
  "landscape";
export const DEFAULT_MOBILE_CANVAS_PRESET_ID: CanvasPresetId =
  "portrait";

export const getCanvasPreset = (id: CanvasPresetId) =>
  CANVAS_PRESETS.find((preset) => preset.id === id) ??
  CANVAS_PRESETS[0];

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
