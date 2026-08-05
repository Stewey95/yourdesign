import type {
  ElementAsset,
  ElementSearchOptions,
  ElementSearchResult,
} from "./element.types";

const svg = (content: string, viewBox = "0 0 100 100") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${content}</svg>`;

export const ELEMENT_CATALOG: readonly ElementAsset[] = [
  // --- Basic Shapes ---
  {
    id: "basic-rectangle",
    name: "Rectangle",
    category: "Basic shapes",
    tags: ["box", "square", "block", "frame", "shape"],
    svg: svg('<rect x="8" y="18" width="84" height="64" fill="none" stroke="#2563eb" stroke-width="5"/>'),
    defaultSize: { width: 120, height: 92.09 },
    geometryBounds: { x: 8, y: 18, width: 84, height: 64 },
    insertion: { kind: "shape", shapeKind: "rectangle" },
    favourite: false,
    recent: false,
  },
  {
    id: "basic-square",
    name: "Square",
    category: "Basic shapes",
    tags: ["box", "square", "block", "frame", "shape"],
    svg: svg('<rect x="8" y="8" width="84" height="84" fill="none" stroke="#2563eb" stroke-width="5"/>'),
    defaultSize: { width: 96, height: 96 },
    geometryBounds: { x: 8, y: 8, width: 84, height: 84 },
    insertion: { kind: "shape", shapeKind: "rectangle" },
    favourite: false,
    recent: false,
  },
  {
    id: "basic-rounded-rectangle",
    name: "Rounded Rectangle",
    category: "Basic shapes",
    tags: ["box", "card", "button", "round", "pill", "container"],
    svg: svg('<rect x="8" y="18" width="84" height="64" rx="14" fill="none" stroke="#2563eb" stroke-width="5"/>'),
    defaultSize: { width: 120, height: 92.09 },
    geometryBounds: { x: 8, y: 18, width: 84, height: 64 },
    insertion: { kind: "shape", shapeKind: "roundedRectangle" },
    favourite: false,
    recent: false,
  },
  {
    id: "basic-circle",
    name: "Circle",
    category: "Basic shapes",
    tags: ["round", "ellipse", "dot", "badge", "ring", "disc"],
    svg: svg('<circle cx="50" cy="50" r="41" fill="none" stroke="#2563eb" stroke-width="5"/>'),
    defaultSize: { width: 96, height: 96 },
    geometryBounds: { x: 9, y: 9, width: 82, height: 82 },
    insertion: { kind: "shape", shapeKind: "circle" },
    favourite: false,
    recent: false,
  },
  {
    id: "basic-triangle",
    name: "Triangle",
    category: "Basic shapes",
    tags: ["shape", "three sides", "play", "delta", "pyramid"],
    svg: svg('<path d="M50 8 93 89H7Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 100, height: 94.32 },
    geometryBounds: { x: 7, y: 8, width: 86, height: 81 },
    insertion: { kind: "shape", shapeKind: "triangle" },
    favourite: false,
    recent: false,
  },
  {
    id: "basic-diamond",
    name: "Diamond",
    category: "Basic shapes",
    tags: ["rhombus", "gem", "rotate", "crystal", "card"],
    svg: svg('<path d="M50 6 94 50 50 94 6 50Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 96, height: 96 },
    geometryBounds: { x: 6, y: 6, width: 88, height: 88 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
  {
    id: "basic-hexagon",
    name: "Hexagon",
    category: "Basic shapes",
    tags: ["polygon", "6 sides", "honeycomb", "geometry", "nut"],
    svg: svg('<path d="M25 8H75L96 50L75 92H25L4 50Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 104, height: 95.42 },
    geometryBounds: { x: 4, y: 8, width: 92, height: 84 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
  {
    id: "basic-octagon",
    name: "Octagon",
    category: "Basic shapes",
    tags: ["stop sign", "polygon", "8 sides", "badge"],
    svg: svg('<path d="M30 6H70L94 30V70L70 94H30L6 70V30Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 96, height: 96 },
    geometryBounds: { x: 6, y: 6, width: 88, height: 88 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },

  // --- Lines & Arrows ---
  {
    id: "line-straight",
    name: "Line",
    category: "Lines and arrows",
    tags: ["divider", "rule", "straight", "stroke", "border"],
    svg: svg('<path d="M5 50H95" fill="none" stroke="#2563eb" stroke-width="8" stroke-linecap="round"/>'),
    defaultSize: { width: 140, height: 3.04 },
    geometryBounds: { x: 5, y: 50, width: 90, height: 0 },
    insertion: { kind: "shape", shapeKind: "line" },
    favourite: false,
    recent: false,
  },
  {
    id: "line-dashed",
    name: "Dashed Line",
    category: "Lines and arrows",
    tags: ["dash", "divider", "separator", "dotted", "border"],
    svg: svg('<path d="M5 50H95" fill="none" stroke="#2563eb" stroke-width="8" stroke-dasharray="14 10" stroke-linecap="round"/>'),
    defaultSize: { width: 140, height: 11.43 },
    geometryBounds: { x: 5, y: 50, width: 90, height: 0 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "arrow-right",
    name: "Arrow",
    category: "Lines and arrows",
    tags: ["direction", "pointer", "right", "next", "forward"],
    svg: svg('<path d="M7 50H84M62 27l23 23-23 23" fill="none" stroke="#2563eb" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'),
    defaultSize: { width: 140, height: 84 },
    geometryBounds: { x: 7, y: 27, width: 78, height: 46 },
    insertion: { kind: "shape", shapeKind: "arrow" },
    favourite: false,
    recent: false,
  },
  {
    id: "arrow-double",
    name: "Double Arrow",
    category: "Lines and arrows",
    tags: ["both sides", "expand", "width", "pointer", "swap"],
    svg: svg('<path d="M18 50h64M38 27L16 50l22 23M62 27l22 23-22 23" fill="none" stroke="#2563eb" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'),
    defaultSize: { width: 140, height: 99.47 },
    geometryBounds: { x: 16, y: 27, width: 68, height: 46 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "arrow-curved",
    name: "Curved Arrow",
    category: "Lines and arrows",
    tags: ["turn", "rotate", "u-turn", "curve", "loop"],
    svg: svg('<path d="M15 82C15 38 38 18 80 18M58 5l25 13-25 15" fill="none" stroke="#2563eb" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'),
    defaultSize: { width: 98.35, height: 110 },
    geometryBounds: { x: 15, y: 5, width: 68, height: 77 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },

  // --- Symbols & Badges ---
  {
    id: "symbol-star",
    name: "Star",
    category: "Symbols",
    tags: ["favourite", "rating", "sparkle", "award", "favorite", "5 point"],
    svg: svg('<path d="m50 7 13.3 27L93 38.3 71.5 59.2 76.6 88 50 74 23.4 88l5.1-28.8L7 38.3 36.7 34Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 100, height: 94.32 },
    geometryBounds: { x: 7, y: 7, width: 86, height: 81 },
    insertion: { kind: "shape", shapeKind: "star" },
    favourite: false,
    recent: false,
  },
  {
    id: "symbol-sparkle",
    name: "Sparkle",
    category: "Symbols",
    tags: ["magic", "shine", "glimmer", "starburst", "clean", "ai"],
    svg: svg('<path d="M50 5C50 30 70 50 95 50C70 50 50 70 50 95C50 70 30 50 5 50C30 50 50 30 50 5Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 96, height: 96 },
    geometryBounds: { x: 5, y: 5, width: 90, height: 90 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
  {
    id: "symbol-heart",
    name: "Heart",
    category: "Symbols",
    tags: ["love", "like", "favourite", "valentine", "health", "care"],
    svg: svg('<path d="M50 86S12 60 12 34a22 22 0 0 1 38-15 22 22 0 0 1 38 15c0 26-38 52-38 52Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 96, height: 93.51 },
    geometryBounds: { x: 12, y: 12.099, width: 76, height: 73.901 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
  {
    id: "symbol-checkmark",
    name: "Checkmark",
    category: "Symbols",
    tags: ["check", "tick", "done", "complete", "approved", "correct"],
    svg: svg('<path d="M12 53 38 79 89 20" fill="none" stroke="#2563eb" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>'),
    defaultSize: { width: 100, height: 79.31 },
    geometryBounds: { x: 12, y: 20, width: 77, height: 59 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "symbol-cross",
    name: "Cross",
    category: "Symbols",
    tags: ["x", "close", "cancel", "remove", "incorrect", "no"],
    svg: svg('<path d="M18 18 82 82M82 18 18 82" fill="none" stroke="#2563eb" stroke-width="10" stroke-linecap="round"/>'),
    defaultSize: { width: 92, height: 92 },
    geometryBounds: { x: 18, y: 18, width: 64, height: 64 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "symbol-location-pin",
    name: "Location Pin",
    category: "Symbols",
    tags: ["map", "marker", "place", "address", "destination", "travel"],
    svg: svg('<path d="M50 94S20 66 20 40a30 30 0 1 1 60 0c0 26-30 54-30 54Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="40" r="10" fill="none" stroke="#2563eb" stroke-width="5"/>'),
    defaultSize: { width: 73.03, height: 100 },
    geometryBounds: { x: 20, y: 10, width: 60, height: 84 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "symbol-sunburst",
    name: "Sunburst",
    category: "Symbols",
    tags: ["sun", "rays", "badge", "burst", "bright", "starburst"],
    svg: svg('<path d="M50 18V6M50 94V82M18 50H6M94 50H82M27 27L18 18M82 82l-9-9M27 73l-9 9M82 18l-9 9" stroke="#2563eb" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="50" r="18" fill="none" stroke="#2563eb" stroke-width="5"/>'),
    defaultSize: { width: 100, height: 100 },
    geometryBounds: { x: 6, y: 6, width: 88, height: 88 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "symbol-shield",
    name: "Shield",
    category: "Symbols",
    tags: ["security", "protection", "badge", "guard", "safe", "crest"],
    svg: svg('<path d="M50 8L90 22V48C90 70 72 88 50 95C28 88 10 70 10 48V22L50 8Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 92.39, height: 100 },
    geometryBounds: { x: 10, y: 8, width: 80, height: 87 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
  {
    id: "symbol-ribbon-badge",
    name: "Ribbon Badge",
    category: "Symbols",
    tags: ["award", "ribbon", "winner", "certificate", "medal", "first"],
    svg: svg('<circle cx="50" cy="38" r="28" fill="none" stroke="#2563eb" stroke-width="5"/><path d="M36 62L25 92L50 80L75 92L64 62" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 77.13, height: 110 },
    geometryBounds: { x: 22, y: 10, width: 56, height: 82 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },

  // --- Callouts & Banners ---
  {
    id: "callout-speech",
    name: "Speech Bubble",
    category: "Callouts and banners",
    tags: ["talk", "chat", "quote", "dialogue", "message", "comment"],
    svg: svg('<path d="M12 20h76a8 8 0 0 1 8 8v40a8 8 0 0 1-8 8H45L22 90V76h-10a8 8 0 0 1-8-8V28a8 8 0 0 1 8-8Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 120, height: 92.78 },
    geometryBounds: { x: 4, y: 20, width: 92, height: 70 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
  {
    id: "callout-thought",
    name: "Thought Bubble",
    category: "Callouts and banners",
    tags: ["think", "idea", "cloud", "dream", "mind", "bubble"],
    svg: svg('<path d="M25 55a18 18 0 0 1 4-35 24 24 0 0 1 42-2 18 18 0 0 1 20 18 18 18 0 0 1-10 32H25a18 18 0 0 1 0-13Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/><circle cx="28" cy="78" r="6" stroke="#2563eb" stroke-width="4" fill="none"/><circle cx="18" cy="90" r="3.5" stroke="#2563eb" stroke-width="3" fill="none"/>'),
    defaultSize: { width: 118.84, height: 120 },
    geometryBounds: { x: 12.684, y: 6.563, width: 85.057, height: 86.937 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "banner-ribbon",
    name: "Banner Ribbon",
    category: "Callouts and banners",
    tags: ["ribbon", "headline", "tag", "label", "heading", "flag"],
    svg: svg('<path d="M10 30L25 45L10 60H85L70 45L85 30H10Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 130, height: 56.88 },
    geometryBounds: { x: 10, y: 30, width: 75, height: 30 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
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
