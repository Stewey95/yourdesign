import type {
  ElementAsset,
  ElementSearchOptions,
  ElementSearchResult,
} from "./element.types";

const svg = (content: string, viewBox = "0 0 100 100") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${content}</svg>`;

export const ELEMENT_CATALOG: readonly ElementAsset[] = [
  {
    id: "basic-rectangle",
    name: "Rectangle",
    category: "Basic shapes",
    tags: ["box", "square", "block", "frame"],
    svg: svg('<rect x="8" y="18" width="84" height="64" fill="none" stroke="#2563eb" stroke-width="5"/>'),
    defaultSize: { width: 120, height: 84 },
    insertion: { kind: "shape", shapeKind: "rectangle" },
    favourite: false,
    recent: false,
  },
  {
    id: "basic-rounded-rectangle",
    name: "Rounded Rectangle",
    category: "Basic shapes",
    tags: ["box", "card", "button", "round"],
    svg: svg('<rect x="8" y="18" width="84" height="64" rx="14" fill="none" stroke="#2563eb" stroke-width="5"/>'),
    defaultSize: { width: 120, height: 84 },
    insertion: { kind: "shape", shapeKind: "roundedRectangle" },
    favourite: false,
    recent: false,
  },
  {
    id: "basic-circle",
    name: "Circle",
    category: "Basic shapes",
    tags: ["round", "ellipse", "dot", "badge"],
    svg: svg('<circle cx="50" cy="50" r="41" fill="none" stroke="#2563eb" stroke-width="5"/>'),
    defaultSize: { width: 96, height: 96 },
    insertion: { kind: "shape", shapeKind: "circle" },
    favourite: false,
    recent: false,
  },
  {
    id: "basic-triangle",
    name: "Triangle",
    category: "Basic shapes",
    tags: ["shape", "three sides", "play"],
    svg: svg('<path d="M50 8 93 89H7Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 100, height: 92 },
    insertion: { kind: "shape", shapeKind: "triangle" },
    favourite: false,
    recent: false,
  },
  {
    id: "line-straight",
    name: "Line",
    category: "Lines and arrows",
    tags: ["divider", "rule", "straight", "stroke"],
    svg: svg('<path d="M5 50H95" fill="none" stroke="#2563eb" stroke-width="8" stroke-linecap="round"/>'),
    defaultSize: { width: 140, height: 28 },
    insertion: { kind: "shape", shapeKind: "line" },
    favourite: false,
    recent: false,
  },
  {
    id: "arrow-right",
    name: "Arrow",
    category: "Lines and arrows",
    tags: ["direction", "pointer", "right", "next"],
    svg: svg('<path d="M7 50H84M62 27l23 23-23 23" fill="none" stroke="#2563eb" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'),
    defaultSize: { width: 140, height: 56 },
    insertion: { kind: "shape", shapeKind: "arrow" },
    favourite: false,
    recent: false,
  },
  {
    id: "symbol-star",
    name: "Star",
    category: "Symbols",
    tags: ["favourite", "rating", "sparkle", "award"],
    svg: svg('<path d="m50 7 13.3 27L93 38.3 71.5 59.2 76.6 88 50 74 23.4 88l5.1-28.8L7 38.3 36.7 34Z" fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round"/>'),
    defaultSize: { width: 100, height: 100 },
    insertion: { kind: "shape", shapeKind: "star" },
    favourite: false,
    recent: false,
  },
];

const normalizeSearchValue = (value: string) =>
  value.trim().toLocaleLowerCase();

const SEARCH_INDEX = ELEMENT_CATALOG.map((element) => ({
  element,
  searchableText: normalizeSearchValue(
    [element.name, element.category, ...element.tags].join(" ")
  ),
}));

export const ELEMENT_CATEGORIES = Array.from(
  new Set(ELEMENT_CATALOG.map((element) => element.category))
).sort((left, right) => left.localeCompare(right));

export const searchElementCatalog = ({
  query = "",
  category,
  limit = 200,
}: ElementSearchOptions = {}): ElementSearchResult => {
  const tokens = normalizeSearchValue(query).split(/\s+/).filter(Boolean);
  const matches = SEARCH_INDEX.filter(
    ({ element, searchableText }) =>
      (!category || element.category === category) &&
      tokens.every((token) => searchableText.includes(token))
  );

  return {
    items: matches.slice(0, Math.max(0, limit)).map(({ element }) => element),
    total: matches.length,
  };
};

const svgDataUrlCache = new Map<string, string>();

export const getElementSvgDataUrl = (element: ElementAsset) => {
  const cachedUrl = svgDataUrlCache.get(element.id);

  if (cachedUrl) return cachedUrl;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(element.svg)}`;

  svgDataUrlCache.set(element.id, dataUrl);
  return dataUrl;
};
