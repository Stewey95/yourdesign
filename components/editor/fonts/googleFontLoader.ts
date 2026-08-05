import type { FontOption } from "./font.catalog";

// Module-level cache so re-mounted components never re-inject a stylesheet
// for a font that's already loading or loaded in this session.
const loadedFamilies = new Set<string>();

/**
 * Lazily loads a Google Font's stylesheet the first time it's needed
 * (a live preview scrolling into view, or a design that uses it), and
 * never again afterwards. Safe to call repeatedly - it's a no-op once
 * a family has been requested.
 */
export const ensureGoogleFontLoaded = (font: FontOption | undefined) => {
  if (!font || font.source !== "google") return;
  if (typeof document === "undefined") return;
  if (loadedFamilies.has(font.family)) return;

  if (document.head.querySelector(`link[data-gripix-font="${font.id}"]`)) {
    loadedFamilies.add(font.family);
    return;
  }

  const weights = font.weights && font.weights.length > 0 ? font.weights : [400];
  const encodedFamily = encodeURIComponent(font.family).replace(/%20/g, "+");
  const href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weights.join(
    ";"
  )}&display=swap`;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.gripixFont = font.id;
  document.head.appendChild(link);

  loadedFamilies.add(font.family);
};
