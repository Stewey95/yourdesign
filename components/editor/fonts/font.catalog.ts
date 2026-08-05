export type FontCategoryId =
  | "sans-serif"
  | "serif"
  | "display"
  | "handwriting"
  | "script"
  | "monospace";

export type FontCategory = {
  id: FontCategoryId;
  label: string;
};

// Ordered for display. Adding a future category only requires one entry here.
export const FONT_CATEGORIES: readonly FontCategory[] = [
  { id: "sans-serif", label: "Sans Serif" },
  { id: "serif", label: "Serif" },
  { id: "display", label: "Display" },
  { id: "handwriting", label: "Handwriting" },
  { id: "script", label: "Script" },
  { id: "monospace", label: "Monospace" },
];

export type FontOption = {
  id: string;
  label: string;
  family: string;
  fallback: "sans-serif" | "serif" | "monospace" | "cursive";
  category: FontCategoryId;
  source: "system" | "google";
  /** Weights to request from Google Fonts. Ignored for system fonts. */
  weights?: readonly number[];
};

// Web-safe fonts. No network load required - always available.
const SYSTEM_FONTS: readonly FontOption[] = [
  {
    id: "arial",
    label: "Arial",
    family: "Arial",
    fallback: "sans-serif",
    category: "sans-serif",
    source: "system",
  },
  {
    id: "georgia",
    label: "Georgia",
    family: "Georgia",
    fallback: "serif",
    category: "serif",
    source: "system",
  },
  {
    id: "verdana",
    label: "Verdana",
    family: "Verdana",
    fallback: "sans-serif",
    category: "sans-serif",
    source: "system",
  },
  {
    id: "impact",
    label: "Impact",
    family: "Impact",
    fallback: "sans-serif",
    category: "display",
    source: "system",
  },
  {
    id: "courier-new",
    label: "Courier New",
    family: "Courier New",
    fallback: "monospace",
    category: "monospace",
    source: "system",
  },
  {
    id: "trebuchet-ms",
    label: "Trebuchet MS",
    family: "Trebuchet MS",
    fallback: "sans-serif",
    category: "sans-serif",
    source: "system",
  },
  {
    id: "comic-sans-ms",
    label: "Comic Sans MS",
    family: "Comic Sans MS",
    fallback: "cursive",
    category: "handwriting",
    source: "system",
  },
  {
    id: "brush-script-mt",
    label: "Brush Script MT",
    family: "Brush Script MT",
    fallback: "cursive",
    category: "script",
    source: "system",
  },
  {
    id: "times-new-roman",
    label: "Times New Roman",
    family: "Times New Roman",
    fallback: "serif",
    category: "serif",
    source: "system",
  },
];

// Curated Google Fonts. Each entry only requests the weights it actually
// ships (some display/script/handwriting families only publish a 400
// regular weight - the editor already relies on browser-synthesised bold
// for those, matching how system fonts like Comic Sans MS behave today).
const GOOGLE_FONTS: readonly FontOption[] = [
  // Sans Serif
  { id: "inter", label: "Inter", family: "Inter", fallback: "sans-serif", category: "sans-serif", source: "google", weights: [400, 700] },
  { id: "poppins", label: "Poppins", family: "Poppins", fallback: "sans-serif", category: "sans-serif", source: "google", weights: [400, 700] },
  { id: "montserrat", label: "Montserrat", family: "Montserrat", fallback: "sans-serif", category: "sans-serif", source: "google", weights: [400, 700] },
  { id: "lato", label: "Lato", family: "Lato", fallback: "sans-serif", category: "sans-serif", source: "google", weights: [400, 700] },
  { id: "nunito", label: "Nunito", family: "Nunito", fallback: "sans-serif", category: "sans-serif", source: "google", weights: [400, 700] },
  { id: "raleway", label: "Raleway", family: "Raleway", fallback: "sans-serif", category: "sans-serif", source: "google", weights: [400, 700] },
  { id: "work-sans", label: "Work Sans", family: "Work Sans", fallback: "sans-serif", category: "sans-serif", source: "google", weights: [400, 700] },
  { id: "manrope", label: "Manrope", family: "Manrope", fallback: "sans-serif", category: "sans-serif", source: "google", weights: [400, 700] },

  // Serif
  { id: "playfair-display", label: "Playfair Display", family: "Playfair Display", fallback: "serif", category: "serif", source: "google", weights: [400, 700] },
  { id: "cormorant-garamond", label: "Cormorant Garamond", family: "Cormorant Garamond", fallback: "serif", category: "serif", source: "google", weights: [400, 700] },
  { id: "libre-baskerville", label: "Libre Baskerville", family: "Libre Baskerville", fallback: "serif", category: "serif", source: "google", weights: [400, 700] },
  { id: "merriweather", label: "Merriweather", family: "Merriweather", fallback: "serif", category: "serif", source: "google", weights: [400, 700] },
  { id: "lora", label: "Lora", family: "Lora", fallback: "serif", category: "serif", source: "google", weights: [400, 700] },
  { id: "pt-serif", label: "PT Serif", family: "PT Serif", fallback: "serif", category: "serif", source: "google", weights: [400, 700] },
  { id: "crimson-text", label: "Crimson Text", family: "Crimson Text", fallback: "serif", category: "serif", source: "google", weights: [400, 700] },
  { id: "eb-garamond", label: "EB Garamond", family: "EB Garamond", fallback: "serif", category: "serif", source: "google", weights: [400, 700] },

  // Display
  { id: "oswald", label: "Oswald", family: "Oswald", fallback: "sans-serif", category: "display", source: "google", weights: [400, 700] },
  { id: "anton", label: "Anton", family: "Anton", fallback: "sans-serif", category: "display", source: "google", weights: [400] },
  { id: "bebas-neue", label: "Bebas Neue", family: "Bebas Neue", fallback: "sans-serif", category: "display", source: "google", weights: [400] },
  { id: "league-spartan", label: "League Spartan", family: "League Spartan", fallback: "sans-serif", category: "display", source: "google", weights: [400, 700] },
  { id: "bungee", label: "Bungee", family: "Bungee", fallback: "sans-serif", category: "display", source: "google", weights: [400] },
  { id: "alfa-slab-one", label: "Alfa Slab One", family: "Alfa Slab One", fallback: "sans-serif", category: "display", source: "google", weights: [400] },
  { id: "fjalla-one", label: "Fjalla One", family: "Fjalla One", fallback: "sans-serif", category: "display", source: "google", weights: [400] },
  { id: "archivo-black", label: "Archivo Black", family: "Archivo Black", fallback: "sans-serif", category: "display", source: "google", weights: [400] },

  // Handwriting
  { id: "caveat", label: "Caveat", family: "Caveat", fallback: "cursive", category: "handwriting", source: "google", weights: [400, 700] },
  { id: "kalam", label: "Kalam", family: "Kalam", fallback: "cursive", category: "handwriting", source: "google", weights: [400, 700] },
  { id: "shadows-into-light", label: "Shadows Into Light", family: "Shadows Into Light", fallback: "cursive", category: "handwriting", source: "google", weights: [400] },
  { id: "indie-flower", label: "Indie Flower", family: "Indie Flower", fallback: "cursive", category: "handwriting", source: "google", weights: [400] },
  { id: "patrick-hand", label: "Patrick Hand", family: "Patrick Hand", fallback: "cursive", category: "handwriting", source: "google", weights: [400] },
  { id: "architects-daughter", label: "Architects Daughter", family: "Architects Daughter", fallback: "cursive", category: "handwriting", source: "google", weights: [400] },
  { id: "gochi-hand", label: "Gochi Hand", family: "Gochi Hand", fallback: "cursive", category: "handwriting", source: "google", weights: [400] },
  { id: "neucha", label: "Neucha", family: "Neucha", fallback: "cursive", category: "handwriting", source: "google", weights: [400] },

  // Script
  { id: "dancing-script", label: "Dancing Script", family: "Dancing Script", fallback: "cursive", category: "script", source: "google", weights: [400, 700] },
  { id: "great-vibes", label: "Great Vibes", family: "Great Vibes", fallback: "cursive", category: "script", source: "google", weights: [400] },
  { id: "pacifico", label: "Pacifico", family: "Pacifico", fallback: "cursive", category: "script", source: "google", weights: [400] },
  { id: "lobster", label: "Lobster", family: "Lobster", fallback: "cursive", category: "script", source: "google", weights: [400] },
  { id: "sacramento", label: "Sacramento", family: "Sacramento", fallback: "cursive", category: "script", source: "google", weights: [400] },
  { id: "satisfy", label: "Satisfy", family: "Satisfy", fallback: "cursive", category: "script", source: "google", weights: [400] },
  { id: "parisienne", label: "Parisienne", family: "Parisienne", fallback: "cursive", category: "script", source: "google", weights: [400] },
  { id: "yellowtail", label: "Yellowtail", family: "Yellowtail", fallback: "cursive", category: "script", source: "google", weights: [400] },

  // Monospace
  { id: "jetbrains-mono", label: "JetBrains Mono", family: "JetBrains Mono", fallback: "monospace", category: "monospace", source: "google", weights: [400, 700] },
  { id: "roboto-mono", label: "Roboto Mono", family: "Roboto Mono", fallback: "monospace", category: "monospace", source: "google", weights: [400, 700] },
  { id: "space-mono", label: "Space Mono", family: "Space Mono", fallback: "monospace", category: "monospace", source: "google", weights: [400, 700] },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", family: "IBM Plex Mono", fallback: "monospace", category: "monospace", source: "google", weights: [400, 700] },
  { id: "source-code-pro", label: "Source Code Pro", family: "Source Code Pro", fallback: "monospace", category: "monospace", source: "google", weights: [400, 700] },
  { id: "fira-code", label: "Fira Code", family: "Fira Code", fallback: "monospace", category: "monospace", source: "google", weights: [400, 700] },
  { id: "courier-prime", label: "Courier Prime", family: "Courier Prime", fallback: "monospace", category: "monospace", source: "google", weights: [400, 700] },
  { id: "overpass-mono", label: "Overpass Mono", family: "Overpass Mono", fallback: "monospace", category: "monospace", source: "google", weights: [400, 700] },
];

export const FONT_CATALOG: readonly FontOption[] = [
  ...SYSTEM_FONTS,
  ...GOOGLE_FONTS,
];

export const filterFonts = (
  query: string,
  category?: FontCategoryId | "all"
) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const byCategory =
    !category || category === "all"
      ? FONT_CATALOG
      : FONT_CATALOG.filter((font) => font.category === category);

  if (!normalizedQuery) return byCategory;

  return byCategory.filter((font) =>
    `${font.label} ${font.family}`
      .toLocaleLowerCase()
      .includes(normalizedQuery)
  );
};

export const getFontOption = (family: string) =>
  FONT_CATALOG.find((font) => font.family === family);
