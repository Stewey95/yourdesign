// Shared authoring helper for every category file under `catalog/`. Every
// element is drawn on the same 0-100 viewBox authoring canvas using literal
// `#2563eb` placeholder hex colours - `getElementSvgMarkup` in
// `elements.catalog.ts` recolours those placeholders to the item's live
// fill/stroke at render time via regex substitution, so this exact
// convention (hex colours, not currentColor/CSS vars) must be followed by
// every category file.
export const svg = (content: string, viewBox = "0 0 100 100") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${content}</svg>`;
