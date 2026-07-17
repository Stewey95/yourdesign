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

export const LOGICAL_CANVAS_WIDTH = 360;
export const LOGICAL_CANVAS_HEIGHT = 256;

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
