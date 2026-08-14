import type {
  Size,
  TextAlignment,
  TextDesignItem,
} from "./editor.types";

/**
 * Text metrics shared by the editable canvas, DOM export surface and the
 * Safari canvas fallback. A missing textBoxWidth means free-form text: it
 * grows horizontally until the real canvas boundary is reached and then
 * wraps. A present width is an intentional bounded text area from a template
 * or saved design.
 */
export const TEXT_LINE_HEIGHT = 1.15;
export const TEXT_FONT_WEIGHT = 700;
export const TEXT_SHADOW = "0 1px 4px rgba(0,0,0,0.35)";
export const TEXT_BOX_MIN_WIDTH = 24;
export const DEFAULT_TEXT_ALIGNMENT: TextAlignment = "center";

export const isTextAlignment = (value: unknown): value is TextAlignment =>
  value === "left" || value === "center" || value === "right";

export const getTextAlignment = (
  item: Pick<TextDesignItem, "textAlign">
): TextAlignment =>
  isTextAlignment(item.textAlign)
    ? item.textAlign
    : DEFAULT_TEXT_ALIGNMENT;

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

/**
 * Returns the available inline width for free-form text in canvas units.
 * Text is positioned from its centre, so the nearer canvas edge is the
 * limiting edge. For rotated text, use the matching horizontal/vertical
 * projection so an unwrapped line does not immediately leave the canvas.
 */
export const getFreeformTextMaxWidth = (
  item: Pick<TextDesignItem, "position" | "rotation" | "textBoxWidth">,
  canvas: Size
) => {
  if (getTextBoxWidth(item) !== undefined) return undefined;

  const horizontalRoom = Math.max(
    0,
    Math.min(item.position.x, canvas.width - item.position.x)
  );
  const verticalRoom = Math.max(
    0,
    Math.min(item.position.y, canvas.height - item.position.y)
  );
  const radians = (item.rotation * Math.PI) / 180;
  const horizontalProjection = Math.abs(Math.cos(radians));
  const verticalProjection = Math.abs(Math.sin(radians));
  const horizontalLimit =
    horizontalProjection > 0.0001
      ? horizontalRoom / horizontalProjection
      : Number.POSITIVE_INFINITY;
  const verticalLimit =
    verticalProjection > 0.0001
      ? verticalRoom / verticalProjection
      : Number.POSITIVE_INFINITY;

  return Math.max(1, 2 * Math.min(horizontalLimit, verticalLimit));
};

export const getTextWrapWidth = (
  item: Pick<TextDesignItem, "position" | "rotation" | "textBoxWidth">,
  canvas: Size
) => getTextBoxWidth(item) ?? getFreeformTextMaxWidth(item, canvas);

/**
 * Deterministic word-first wrapping for non-DOM renderers. Explicit newlines
 * are authoritative. An ordinary word moves intact to the next line; only a
 * single word that cannot physically fit is split at character boundaries.
 */
export const wrapTextAtWordBoundaries = (
  value: string,
  maximumWidth: number,
  measureText: (value: string) => number
) => {
  const wrapParagraph = (paragraph: string) => {
    if (paragraph.length === 0) return [""];

    const lines: string[] = [];
    let line = "";
    let lastBreakIndex = -1;

    for (const character of paragraph) {
      const candidate = line + character;

      if (line.length === 0 || measureText(candidate) <= maximumWidth) {
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

  return value
    .split("\n")
    .flatMap((paragraph) => wrapParagraph(paragraph));
};
