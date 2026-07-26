export type FontOption = {
  id: string;
  label: string;
  family: string;
  fallback: "sans-serif" | "serif" | "monospace" | "cursive";
};

export const FONT_CATALOG: readonly FontOption[] = [
  { id: "arial", label: "Arial", family: "Arial", fallback: "sans-serif" },
  { id: "georgia", label: "Georgia", family: "Georgia", fallback: "serif" },
  { id: "verdana", label: "Verdana", family: "Verdana", fallback: "sans-serif" },
  { id: "impact", label: "Impact", family: "Impact", fallback: "sans-serif" },
  {
    id: "courier-new",
    label: "Courier New",
    family: "Courier New",
    fallback: "monospace",
  },
  {
    id: "trebuchet-ms",
    label: "Trebuchet MS",
    family: "Trebuchet MS",
    fallback: "sans-serif",
  },
  {
    id: "comic-sans-ms",
    label: "Comic Sans MS",
    family: "Comic Sans MS",
    fallback: "cursive",
  },
  {
    id: "brush-script-mt",
    label: "Brush Script MT",
    family: "Brush Script MT",
    fallback: "cursive",
  },
  {
    id: "times-new-roman",
    label: "Times New Roman",
    family: "Times New Roman",
    fallback: "serif",
  },
];

export const filterFonts = (query: string) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) return FONT_CATALOG;

  return FONT_CATALOG.filter((font) =>
    `${font.label} ${font.family}`
      .toLocaleLowerCase()
      .includes(normalizedQuery)
  );
};

export const getFontOption = (family: string) =>
  FONT_CATALOG.find((font) => font.family === family);
