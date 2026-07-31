export const PRODUCT_TYPES = [
  "printable-planner",
  "worksheet",
  "social-media-pack",
  "invitation",
  "wall-art-collection",
  "blank-product",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];
export type ProductStatus =
  | "draft"
  | "in-progress"
  | "ready-for-review"
  | "ready";
export type ProductAssetKind = "page" | "asset";
export type DeliverableStatus = "planned" | "ready";

export type ProductAsset = {
  id: string;
  name: string;
  kind: ProductAssetKind;
  projectId: string;
  order: number;
};

export type ProductDeliverable = {
  id: string;
  name: string;
  status: DeliverableStatus;
};

export type ProductRecord = {
  id: string;
  name: string;
  type: ProductType;
  status: ProductStatus;
  assets: ProductAsset[];
  deliverables: ProductDeliverable[];
  lastEditedAssetId?: string;
  createdAt: number;
  updatedAt: number;
};

export type ProductTypeDefinition = {
  id: ProductType;
  name: string;
  description: string;
  startingAssetName: string;
  accent: string;
};

export const PRODUCT_TYPE_DEFINITIONS: ProductTypeDefinition[] = [
  {
    id: "printable-planner",
    name: "Printable Planner",
    description: "Build an organised planner ready to print or download.",
    startingAssetName: "Planner cover",
    accent: "from-cyan-400 to-blue-600",
  },
  {
    id: "worksheet",
    name: "Worksheet",
    description: "Create a clear, useful learning or activity resource.",
    startingAssetName: "Worksheet",
    accent: "from-emerald-400 to-cyan-600",
  },
  {
    id: "social-media-pack",
    name: "Social Media Pack",
    description: "Start a coordinated collection of social content.",
    startingAssetName: "Social post",
    accent: "from-violet-400 to-fuchsia-600",
  },
  {
    id: "invitation",
    name: "Invitation",
    description: "Design a memorable invitation for a special occasion.",
    startingAssetName: "Invitation",
    accent: "from-rose-400 to-orange-500",
  },
  {
    id: "wall-art-collection",
    name: "Wall Art Collection",
    description: "Create the first piece in a coordinated art collection.",
    startingAssetName: "Artwork 1",
    accent: "from-amber-300 to-rose-500",
  },
  {
    id: "blank-product",
    name: "Blank Product",
    description: "Begin freely with a clean product and an empty canvas.",
    startingAssetName: "Page 1",
    accent: "from-slate-400 to-slate-600",
  },
];

export const getProductTypeDefinition = (type: ProductType) =>
  PRODUCT_TYPE_DEFINITIONS.find((definition) => definition.id === type) ??
  PRODUCT_TYPE_DEFINITIONS[PRODUCT_TYPE_DEFINITIONS.length - 1];
