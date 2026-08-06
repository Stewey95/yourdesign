import type { ElementAsset } from "../element.types";
import { svg } from "./svg-helper";

export const CALLOUTS_AND_BANNERS_ELEMENTS: readonly ElementAsset[] = [
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
