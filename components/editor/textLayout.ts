import type { TextDesignItem } from "./editor.types";

/**
 * Text metrics shared by the editable canvas, DOM export surface and the
 * Safari canvas fallback. A missing textBoxWidth means free-form text: it
 * grows horizontally and only honours authored newlines. A present width is
 * an intentional bounded text area (from a template or a resize gesture).
 */
export const TEXT_LINE_HEIGHT = 1.15;
export const TEXT_FONT_WEIGHT = 700;
export const TEXT_SHADOW = "0 1px 4px rgba(0,0,0,0.35)";
export const TEXT_BOX_MIN_WIDTH = 24;

export const getTextBoxWidth = (
  item: Pick<TextDesignItem, "textBoxWidth">
) =>
  typeof item.textBoxWidth === "number" &&
  Number.isFinite(item.textBoxWidth) &&
  item.textBoxWidth >= TEXT_BOX_MIN_WIDTH
    ? item.textBoxWidth
    : undefined;

export const isBoundedText = (
  item: Pick<TextDesignItem, "textBoxWidth">
) => getTextBoxWidth(item) !== undefined;
