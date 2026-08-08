/**
 * Text metrics shared by the editable canvas, DOM export surface and the
 * Safari canvas fallback. Text items intentionally do not persist a width;
 * keeping this contract in one place prevents each renderer from choosing a
 * different wrap point for the same design.
 */
export const TEXT_MAX_WIDTH = 460;
export const TEXT_LINE_HEIGHT = 1.15;
export const TEXT_FONT_WEIGHT = 700;
export const TEXT_SHADOW = "0 1px 4px rgba(0,0,0,0.35)";

export const getTextMaximumWidth = (canvasWidth: number) =>
  Math.min(TEXT_MAX_WIDTH, Math.max(0, canvasWidth));
