import type {
  ElementAsset,
  ElementSearchOptions,
  ElementSearchResult,
} from "./element.types";
import { BASIC_SHAPES_ELEMENTS } from "./catalog/basic-shapes.elements";
import { LINES_AND_ARROWS_ELEMENTS } from "./catalog/lines-and-arrows.elements";
import { SYMBOLS_ELEMENTS } from "./catalog/symbols.elements";
import { CALLOUTS_AND_BANNERS_ELEMENTS } from "./catalog/callouts-and-banners.elements";
import { BUSINESS_ELEMENTS } from "./catalog/business.elements";
import { SOCIAL_ELEMENTS } from "./catalog/social.elements";
import { NATURE_ELEMENTS } from "./catalog/nature.elements";
import { FOOD_ELEMENTS } from "./catalog/food.elements";
import { TECHNOLOGY_ELEMENTS } from "./catalog/technology.elements";
import { EDUCATION_ELEMENTS } from "./catalog/education.elements";
import { CELEBRATION_ELEMENTS } from "./catalog/celebration.elements";
import { DECORATIVE_ELEMENTS } from "./catalog/decorative.elements";

// The full catalogue is assembled from one file per category under
// `catalog/`. This is the scalability mechanism: adding or expanding a
// category means adding/editing one small, independently reviewable file
// and appending it below - never growing a single monolithic array. Every
// helper in this module operates on the combined `ELEMENT_CATALOG`, so nothing
// downstream (ElementsPanel, ElementSvg, UniversalSearch, hitTesting) needs
// to know the catalogue is sharded.
export const ELEMENT_CATALOG: readonly ElementAsset[] = [
  ...BASIC_SHAPES_ELEMENTS,
  ...LINES_AND_ARROWS_ELEMENTS,
  ...SYMBOLS_ELEMENTS,
  ...CALLOUTS_AND_BANNERS_ELEMENTS,
  ...BUSINESS_ELEMENTS,
  ...SOCIAL_ELEMENTS,
  ...NATURE_ELEMENTS,
  ...FOOD_ELEMENTS,
  ...TECHNOLOGY_ELEMENTS,
  ...EDUCATION_ELEMENTS,
  ...CELEBRATION_ELEMENTS,
  ...DECORATIVE_ELEMENTS,
];

const ELEMENTS_BY_ID = new Map(
  ELEMENT_CATALOG.map((element) => [element.id, element] as const)
);

export const getElementAsset = (elementId: string) =>
  ELEMENTS_BY_ID.get(elementId);

export const getElementColourMode = (element: ElementAsset) =>
  element.colourMode ??
  (element.insertion.kind === "shape" &&
  element.insertion.shapeKind !== "line" &&
  element.insertion.shapeKind !== "arrow"
    ? "fill-and-stroke"
    : "stroke");

export const getElementDefaultStrokeWidth = (element: ElementAsset) => {
  const match = element.svg.match(/stroke-width="([0-9.]+)"/);
  const width = match ? Number(match[1]) : 5;

  return Number.isFinite(width) ? width : 5;
};

// Inflates an asset's stroke-EXCLUDED geometry bounds by the current
// stroke's half-width to get the true, currently-visible bounds. Pure
// arithmetic, no DOM measurement - safe to call on every render so bounds
// stay correct as stroke/border width changes live. Shared by every
// element: there is exactly one geometry formula, not one per shape kind.
export const getElementVisibleBounds = (
  geometryBounds: ElementAsset["geometryBounds"],
  strokeWidth: number,
  hasStroke: boolean
) => {
  if (!geometryBounds) return null;

  const pad =
    hasStroke && Number.isFinite(strokeWidth) && strokeWidth > 0
      ? strokeWidth / 2
      : 0;

  return {
    x: geometryBounds.x - pad,
    y: geometryBounds.y - pad,
    // A pure-stroke shape (e.g. the Line) has zero geometric extent on one
    // axis; keep a minimal positive extent so the viewBox never collapses.
    width: Math.max(0.01, geometryBounds.width + pad * 2),
    height: Math.max(0.01, geometryBounds.height + pad * 2),
  };
};

export const getElementSvgMarkup = (
  element: ElementAsset,
  style?: {
    fill?: string | null;
    stroke?: string | null;
    strokeWidth?: number;
  }
) => {
  const mode = getElementColourMode(element);
  const safeColour = (colour: string | null) =>
    colour === null || /^#[0-9a-fA-F]{3,8}$/.test(colour)
      ? colour
      : "#2563eb";
  let markup = element.svg;

  if (mode !== "none") {
    if (style?.stroke !== undefined) {
      const stroke = safeColour(style.stroke);

      markup = markup.replaceAll(
        /stroke="#[0-9a-fA-F]{3,8}"/g,
        stroke ? `stroke="${stroke}"` : 'stroke="none"'
      );
    }

    if (style?.strokeWidth !== undefined) {
      markup = markup.replaceAll(
        /stroke-width="[0-9.]+"/g,
        `stroke-width="${style.strokeWidth}"`
      );
    }

    if (mode === "fill-and-stroke" && style?.fill !== undefined) {
      const fill = safeColour(style.fill);

      markup = markup.replaceAll(
        /fill="(?:none|#[0-9a-fA-F]{3,8})"/g,
        fill ? `fill="${fill}"` : 'fill="none"'
      );
    }
  }

  // Crop the render-time viewBox to the artwork's true, currently-visible
  // bounds so canvas placement - selection ring, resize handles, drag hit
  // area, rotation pivot - hugs the rendered artwork exactly, including
  // after stroke/border width changes. Read the stroke state back off the
  // markup produced above (rather than trusting `style` directly) so this
  // always reflects exactly what will be painted, regardless of `mode` or
  // which style fields were provided. Catalog thumbnails are unaffected:
  // they render `element.svg` directly via getElementSvgDataUrl.
  const strokeMatch = markup.match(/stroke="([^"]*)"/);
  const strokeWidthMatch = markup.match(/stroke-width="([0-9.]+)"/);
  const hasStroke = strokeMatch ? strokeMatch[1] !== "none" : false;
  const strokeWidth = strokeWidthMatch ? Number(strokeWidthMatch[1]) : 0;

  const bounds = getElementVisibleBounds(
    element.geometryBounds,
    strokeWidth,
    hasStroke
  );

  if (bounds) {
    markup = markup.replace(
      /viewBox="[^"]*"/,
      `viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" preserveAspectRatio="none"`
    );
  }

  return markup;
};

const normalizeSearchValue = (value: string) =>
  value.trim().toLocaleLowerCase();

const SEARCH_INDEX = ELEMENT_CATALOG.map((element) => ({
  element,
  normalizedName: normalizeSearchValue(element.name),
  normalizedCategory: normalizeSearchValue(element.category),
  normalizedTags: element.tags.map(normalizeSearchValue),
}));

export const ELEMENT_CATEGORIES = Array.from(
  new Set(ELEMENT_CATALOG.map((element) => element.category))
).sort((left, right) => left.localeCompare(right));

export const getElementCategoriesWithCounts = (
  items: readonly ElementAsset[] = ELEMENT_CATALOG
): { category: string; count: number }[] => {
  const countsMap = new Map<string, number>();

  items.forEach((item) => {
    countsMap.set(item.category, (countsMap.get(item.category) ?? 0) + 1);
  });

  return ELEMENT_CATEGORIES.map((cat) => ({
    category: cat,
    count: countsMap.get(cat) ?? 0,
  }));
};

export const searchElementCatalog = ({
  query = "",
  category,
  limit = 200,
}: ElementSearchOptions = {}): ElementSearchResult => {
  const rawQuery = normalizeSearchValue(query);
  const tokens = rawQuery.split(/\s+/).filter(Boolean);

  if (tokens.length === 0 && !category) {
    return {
      items: ELEMENT_CATALOG.slice(0, Math.max(0, limit)),
      total: ELEMENT_CATALOG.length,
    };
  }

  const scoredMatches = SEARCH_INDEX.map((entry) => {
    const { element, normalizedName, normalizedCategory, normalizedTags } = entry;

    if (category && element.category !== category) {
      return { element, score: -1 };
    }

    if (tokens.length === 0) {
      return { element, score: 10 };
    }

    let score = 0;
    const matchesAllTokens = tokens.every((token) => {
      let tokenMatched = false;

      if (normalizedName === token) {
        score += 100;
        tokenMatched = true;
      } else if (normalizedName.startsWith(token)) {
        score += 80;
        tokenMatched = true;
      } else if (normalizedName.includes(token)) {
        score += 60;
        tokenMatched = true;
      }

      for (const tag of normalizedTags) {
        if (tag === token) {
          score += 50;
          tokenMatched = true;
        } else if (tag.startsWith(token)) {
          score += 40;
          tokenMatched = true;
        } else if (tag.includes(token)) {
          score += 20;
          tokenMatched = true;
        }
      }

      if (normalizedCategory.includes(token)) {
        score += 15;
        tokenMatched = true;
      }

      return tokenMatched;
    });

    return { element, score: matchesAllTokens ? score : -1 };
  })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  return {
    items: scoredMatches.slice(0, Math.max(0, limit)).map(({ element }) => element),
    total: scoredMatches.length,
  };
};

const svgDataUrlCache = new Map<string, string>();

// Paints an opaque white rect spanning the artwork's own viewBox as the
// first shape in the markup, so the thumbnail always reads as "black
// artwork on a white canvas" regardless of the dark UI it's displayed
// inside - every consumer (ElementsPanel cards, its recents/favourites
// row, and Universal Search) renders this same data URL via a square,
// `background-size: contain` box, so the rect exactly fills it edge to
// edge with no dark UI showing through.
const withWhiteCanvasBackground = (svgMarkup: string) => {
  const viewBoxAttribute = svgMarkup.match(/viewBox="([^"]*)"/)?.[1] ?? "0 0 100 100";
  const [minX = "0", minY = "0", boxWidth = "100", boxHeight = "100"] =
    viewBoxAttribute.split(/\s+/);
  const backgroundRect = `<rect x="${minX}" y="${minY}" width="${boxWidth}" height="${boxHeight}" fill="#ffffff"/>`;

  return svgMarkup.replace(/(<svg[^>]*>)/, `$1${backgroundRect}`);
};

export const getElementSvgDataUrl = (element: ElementAsset) => {
  // Use a thumbnail-specific cache key so we don't interfere with any
  // other consumers that might rely on the raw `element.svg` markup.
  const cacheKey = `${element.id}:thumb`;
  const cachedUrl = svgDataUrlCache.get(cacheKey);

  if (cachedUrl) return cachedUrl;

  // Produce a neutral, high-contrast thumbnail appearance by replacing
  // any explicit stroke/fill hex colours with black for thumbnails. Keep
  // `fill="none"` as-is (the regex below won't match `fill="none"`).
  const thumbMarkup = withWhiteCanvasBackground(
    element.svg
      .replace(/stroke="#([0-9a-fA-F]{3,8})"/g, 'stroke="#000000"')
      .replace(/fill="#([0-9a-fA-F]{3,8})"/g, 'fill="#000000"')
  );

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(thumbMarkup)}`;

  svgDataUrlCache.set(cacheKey, dataUrl);
  return dataUrl;
};
