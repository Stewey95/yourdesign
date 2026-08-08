import type { FontOption } from "./font.catalog";

// Module-level cache so re-mounted components never re-inject a stylesheet
// for a font that's already loading or loaded in this session.
const loadedFamilies = new Set<string>();
const fontLoadPromises = new Map<string, Promise<void>>();

/**
 * Lazily loads a Google Font's stylesheet the first time it's needed
 * (a live preview scrolling into view, or a design that uses it), and
 * never again afterwards. Safe to call repeatedly - it's a no-op once
 * a family has been requested.
 */
export const ensureGoogleFontLoaded = (
  font: FontOption | undefined
): Promise<void> => {
  if (!font || font.source !== "google") return Promise.resolve();
  if (typeof document === "undefined") return Promise.resolve();

  const existingRequest = fontLoadPromises.get(font.family);
  if (existingRequest) return existingRequest;

  if (document.head.querySelector(`link[data-gripix-font="${font.id}"]`)) {
    loadedFamilies.add(font.family);
    return Promise.resolve();
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
  loadedFamilies.add(font.family);

  // A font stylesheet is asynchronous. Callers that render to a bitmap must
  // wait for it before asking document.fonts to resolve the requested face;
  // otherwise a fallback face can be permanently measured into an export.
  const request = new Promise<void>((resolve) => {
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
  });

  fontLoadPromises.set(font.family, request);
  document.head.appendChild(link);

  return request;
};
