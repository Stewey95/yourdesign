import type { ElementAsset } from "../element.types";
import { svg } from "./svg-helper";

export const DECORATIVE_ELEMENTS: readonly ElementAsset[] = [
  {
    id: "decorative-laurel-wreath",
    name: "Laurel Wreath",
    category: "Decorative",
    tags: ["laurel", "wreath", "crest", "award", "botanical", "branch"],
    svg: svg(
      '<path d="M50 92C34 90 20 78 16 60C12 42 18 24 34 10" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M50 92C66 90 80 78 84 60C88 42 82 24 66 10" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>' +
        '<ellipse cx="0" cy="0" rx="7" ry="3" transform="translate(44 80) rotate(-30)" fill="none" stroke="#2563eb" stroke-width="3"/>' +
        '<ellipse cx="0" cy="0" rx="7" ry="3" transform="translate(37 66) rotate(-45)" fill="none" stroke="#2563eb" stroke-width="3"/>' +
        '<ellipse cx="0" cy="0" rx="7" ry="3" transform="translate(29 52) rotate(-58)" fill="none" stroke="#2563eb" stroke-width="3"/>' +
        '<ellipse cx="0" cy="0" rx="7" ry="3" transform="translate(24 36) rotate(-72)" fill="none" stroke="#2563eb" stroke-width="3"/>' +
        '<ellipse cx="0" cy="0" rx="7" ry="3" transform="translate(27 18) rotate(-85)" fill="none" stroke="#2563eb" stroke-width="3"/>' +
        '<ellipse cx="0" cy="0" rx="7" ry="3" transform="translate(56 80) rotate(30)" fill="none" stroke="#2563eb" stroke-width="3"/>' +
        '<ellipse cx="0" cy="0" rx="7" ry="3" transform="translate(63 66) rotate(45)" fill="none" stroke="#2563eb" stroke-width="3"/>' +
        '<ellipse cx="0" cy="0" rx="7" ry="3" transform="translate(71 52) rotate(58)" fill="none" stroke="#2563eb" stroke-width="3"/>' +
        '<ellipse cx="0" cy="0" rx="7" ry="3" transform="translate(76 36) rotate(72)" fill="none" stroke="#2563eb" stroke-width="3"/>' +
        '<ellipse cx="0" cy="0" rx="7" ry="3" transform="translate(73 18) rotate(85)" fill="none" stroke="#2563eb" stroke-width="3"/>'
    ),
    defaultSize: { width: 103.024, height: 120 },
    geometryBounds: { x: 14.8, y: 10, width: 70.4, height: 82 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-ornamental-corner-frame",
    name: "Ornamental Corner Frame",
    category: "Decorative",
    tags: ["corner", "frame", "flourish", "ornament", "border", "curl"],
    svg: svg(
      '<path d="M15 15V70Q15 85 30 85H80" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M30 85C30 78 24 75 20 78C17 80 19 84 23 83" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>' +
        '<ellipse cx="0" cy="0" rx="6" ry="3" transform="translate(15 25) rotate(90)" fill="none" stroke="#2563eb" stroke-width="3"/>'
    ),
    defaultSize: { width: 99.321, height: 103 },
    geometryBounds: { x: 12.5, y: 15, width: 67.5, height: 70 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-divider-swirl",
    name: "Divider Swirl",
    category: "Decorative",
    tags: ["divider", "swirl", "separator", "ornament", "flourish", "curl"],
    svg: svg(
      '<path d="M5 50H35M65 50H95" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M35 50C35 42 45 40 45 48C45 54 38 55 38 50C38 46 42 45 42 48" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>'
    ),
    defaultSize: { width: 150, height: 15.49 },
    geometryBounds: { x: 5, y: 43.407, width: 90, height: 9.294 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-dotted-circle-border",
    name: "Dotted Circle Border",
    category: "Decorative",
    tags: ["dots", "circle", "border", "ring", "pattern", "frame"],
    svg: svg(
      '<circle cx="90" cy="50" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/><circle cx="86" cy="67.4" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/>' +
        '<circle cx="74.9" cy="81.3" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/><circle cx="58.9" cy="89" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/>' +
        '<circle cx="41.1" cy="89" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/><circle cx="25.1" cy="81.3" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/>' +
        '<circle cx="14" cy="67.4" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/><circle cx="10" cy="50" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/>' +
        '<circle cx="14" cy="32.6" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/><circle cx="25.1" cy="18.7" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/>' +
        '<circle cx="41.1" cy="11" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/><circle cx="58.9" cy="11" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/>' +
        '<circle cx="74.9" cy="18.7" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/><circle cx="86" cy="32.6" r="2.5" fill="#2563eb" stroke="#2563eb" stroke-width="1"/>'
    ),
    defaultSize: { width: 100, height: 97.647 },
    geometryBounds: { x: 7.5, y: 8.5, width: 85, height: 83 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-flourish-scroll",
    name: "Flourish Scroll",
    category: "Decorative",
    tags: ["scroll", "flourish", "ribbon", "curl", "ornament", "swirl"],
    svg: svg(
      '<path d="M15 35C35 15 65 85 85 65" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M15 35C8 32 6 40 12 42" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M85 65C92 68 94 60 88 58" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>'
    ),
    defaultSize: { width: 120, height: 54.469 },
    geometryBounds: { x: 8.947, y: 31.366, width: 82.105, height: 37.268 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-sparkle-cluster",
    name: "Sparkle Cluster",
    category: "Decorative",
    tags: ["sparkle", "cluster", "shine", "stars", "magic", "confetti"],
    svg: svg(
      '<path d="M0,-10 L2.5,-2.5 L10,0 L2.5,2.5 L0,10 L-2.5,2.5 L-10,0 L-2.5,-2.5 Z" fill="none" stroke="#2563eb" stroke-width="3" stroke-linejoin="round" transform="translate(30 30) scale(1.6)"/>' +
        '<path d="M0,-10 L2.5,-2.5 L10,0 L2.5,2.5 L0,10 L-2.5,2.5 L-10,0 L-2.5,-2.5 Z" fill="none" stroke="#2563eb" stroke-width="3" stroke-linejoin="round" transform="translate(70 60) scale(1.1)"/>' +
        '<path d="M0,-10 L2.5,-2.5 L10,0 L2.5,2.5 L0,10 L-2.5,2.5 L-10,0 L-2.5,-2.5 Z" fill="none" stroke="#2563eb" stroke-width="3" stroke-linejoin="round" transform="translate(55 20) scale(0.7)"/>' +
        '<path d="M0,-10 L2.5,-2.5 L10,0 L2.5,2.5 L0,10 L-2.5,2.5 L-10,0 L-2.5,-2.5 Z" fill="none" stroke="#2563eb" stroke-width="3" stroke-linejoin="round" transform="translate(20 70) scale(0.8)"/>'
    ),
    defaultSize: { width: 96, height: 90.074 },
    geometryBounds: { x: 12.3, y: 13.1, width: 68.85, height: 64.6 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-wavy-divider",
    name: "Wavy Divider",
    category: "Decorative",
    tags: ["wave", "divider", "separator", "line", "water", "ornament"],
    svg: svg(
      '<path d="M5 50C15 35 25 35 35 50C45 65 55 65 65 50C75 35 85 35 95 50" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>'
    ),
    defaultSize: { width: 150, height: 37.5 },
    geometryBounds: { x: 5, y: 38.75, width: 90, height: 22.5 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-zigzag-divider",
    name: "Zigzag Divider",
    category: "Decorative",
    tags: ["zigzag", "divider", "separator", "pattern", "line", "chevron"],
    svg: svg(
      '<path d="M5 50L15 30L25 50L35 30L45 50L55 30L65 50L75 30L85 50L95 30" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
    defaultSize: { width: 150, height: 33.333 },
    geometryBounds: { x: 5, y: 30, width: 90, height: 20 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-arch-half-circle",
    name: "Arch Half Circle",
    category: "Decorative",
    tags: ["arch", "half circle", "doorway", "rainbow", "frame", "curve"],
    svg: svg(
      '<path d="M15 80A35 35 0 0 1 85 80" fill="none" stroke="#2563eb" stroke-width="5"/>' +
        '<path d="M15 80V90M85 80V90" fill="none" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/>'
    ),
    defaultSize: { width: 120, height: 77.143 },
    geometryBounds: { x: 15, y: 45, width: 70, height: 45 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-abstract-blob",
    name: "Abstract Blob",
    category: "Decorative",
    tags: ["blob", "organic", "shape", "abstract", "fluid", "background"],
    svg: svg(
      '<path d="M20 45C15 25 35 8 55 10C75 12 90 25 88 45C86 65 70 88 48 85C28 82 25 65 20 45Z" fill="none" stroke="#2563eb" stroke-width="4" stroke-linejoin="round"/>'
    ),
    defaultSize: { width: 91.422, height: 100 },
    geometryBounds: { x: 19.223, y: 9.84, width: 68.956, height: 75.426 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-quote-marks",
    name: "Quote Marks",
    category: "Decorative",
    tags: ["quote", "quotation", "testimonial", "speech", "text", "marks"],
    svg: svg(
      '<path d="M15 15C15 8 22 5 30 7C28 16 24 28 14 38C10 32 10 22 15 15Z" fill="#2563eb" stroke="#2563eb" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M55 15C55 8 62 5 70 7C68 16 64 28 54 38C50 32 50 22 55 15Z" fill="#2563eb" stroke="#2563eb" stroke-width="2" stroke-linejoin="round"/>'
    ),
    defaultSize: { width: 110, height: 59.045 },
    geometryBounds: { x: 11.115, y: 6.392, width: 58.885, height: 31.608 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-asterisk-flower",
    name: "Asterisk Flower",
    category: "Decorative",
    tags: ["asterisk", "flower", "burst", "star", "radiate", "accent"],
    svg: svg(
      '<path d="M50 50L85 50M50 50L75 25M50 50L50 15M50 50L25 25M50 50L15 50M50 50L25 75M50 50L50 85M50 50L75 75" fill="none" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/>'
    ),
    defaultSize: { width: 96, height: 96 },
    geometryBounds: { x: 15, y: 15, width: 70, height: 70 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-spiral",
    name: "Spiral",
    category: "Decorative",
    tags: ["spiral", "swirl", "curl", "coil", "circular", "loop"],
    svg: svg(
      '<path d="M90 50A40 40 0 1 0 50 90A30 30 0 1 1 65 35A20 20 0 1 0 40 45A10 10 0 1 1 55 55" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>'
    ),
    defaultSize: { width: 95.498, height: 100 },
    geometryBounds: { x: 10, y: 6.268, width: 80, height: 83.771 },
    insertion: { kind: "graphic" },
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-crown",
    name: "Crown",
    category: "Decorative",
    tags: ["crown", "royal", "king", "queen", "award", "premium"],
    svg: svg(
      '<path d="M15 70V55L28 42L38 55L50 28L62 55L72 42L85 55V70Z" fill="none" stroke="#2563eb" stroke-width="4" stroke-linejoin="round"/>' +
        '<rect x="15" y="70" width="70" height="15" rx="2" fill="none" stroke="#2563eb" stroke-width="4"/>' +
        '<circle cx="50" cy="21" r="4" fill="#2563eb" stroke="#2563eb" stroke-width="1.5"/>'
    ),
    defaultSize: { width: 103, height: 100.057 },
    geometryBounds: { x: 15, y: 17, width: 70, height: 68 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
  {
    id: "decorative-feather",
    name: "Feather",
    category: "Decorative",
    tags: ["feather", "quill", "plume", "bird", "write", "boho"],
    svg: svg(
      '<path d="M50 92C40 92 32 75 34 55C36 30 42 15 50 8C58 15 64 30 66 55C68 75 60 92 50 92Z" fill="none" stroke="#2563eb" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M50 88V14" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M50 24L37 32M50 36L36 44M50 48L35 56M50 60L36 68M50 72L38 78" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M50 24L63 32M50 36L64 44M50 48L65 56M50 60L64 68M50 72L62 78" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>'
    ),
    defaultSize: { width: 54.362, height: 140 },
    geometryBounds: { x: 33.691, y: 8, width: 32.617, height: 84 },
    insertion: { kind: "graphic" },
    colourMode: "fill-and-stroke",
    favourite: false,
    recent: false,
  },
];
