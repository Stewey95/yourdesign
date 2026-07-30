import {
  completeEditorTransaction,
  openEditorDatabase,
  PRODUCTS_STORE_NAME,
} from "../persistence/editorDatabase";
import { createProject } from "../projects/projectsManager";
import {
  PRODUCT_TYPES,
  getProductTypeDefinition,
  type ProductRecord,
  type ProductStatus,
  type ProductType,
} from "./products.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const isProductType = (value: unknown): value is ProductType =>
  typeof value === "string" &&
  (PRODUCT_TYPES as readonly string[]).includes(value);

const restoreProduct = (raw: unknown): ProductRecord | null => {
  if (!isRecord(raw) || typeof raw.id !== "string" || !raw.id) return null;

  const type = isProductType(raw.type) ? raw.type : "blank-product";
  const now = Date.now();
  const status: ProductStatus =
    raw.status === "idea" ||
    raw.status === "in-progress" ||
    raw.status === "ready"
      ? raw.status
      : "in-progress";

  const assets = Array.isArray(raw.assets)
    ? raw.assets
        .filter(
          (asset): asset is Record<string, unknown> =>
            isRecord(asset) &&
            typeof asset.id === "string" &&
            typeof asset.projectId === "string"
        )
        .map((asset, index) => ({
          id: asset.id as string,
          projectId: asset.projectId as string,
          name:
            typeof asset.name === "string" && asset.name.trim()
              ? asset.name
              : `Page ${index + 1}`,
          kind: asset.kind === "asset" ? ("asset" as const) : ("page" as const),
          order:
            typeof asset.order === "number" ? asset.order : index,
        }))
        .sort((a, b) => a.order - b.order)
    : [];

  const deliverables = Array.isArray(raw.deliverables)
    ? raw.deliverables
        .filter(
          (item): item is Record<string, unknown> =>
            isRecord(item) &&
            typeof item.id === "string" &&
            typeof item.name === "string"
        )
        .map((item) => ({
          id: item.id as string,
          name: item.name as string,
          status:
            item.status === "ready"
              ? ("ready" as const)
              : ("planned" as const),
        }))
    : [];

  return {
    id: raw.id,
    name:
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name
        : "Untitled Product",
    type,
    status,
    assets,
    deliverables,
    createdAt:
      typeof raw.createdAt === "number" ? raw.createdAt : now,
    updatedAt:
      typeof raw.updatedAt === "number" ? raw.updatedAt : now,
  };
};

export async function saveProduct(product: ProductRecord): Promise<void> {
  const database = await openEditorDatabase();
  const transaction = database.transaction(PRODUCTS_STORE_NAME, "readwrite");
  transaction.objectStore(PRODUCTS_STORE_NAME).put({
    ...product,
    updatedAt: Date.now(),
  });
  await completeEditorTransaction(transaction);
}

export async function getProduct(id: string): Promise<ProductRecord | null> {
  try {
    const database = await openEditorDatabase();
    const transaction = database.transaction(PRODUCTS_STORE_NAME, "readonly");
    const request = transaction.objectStore(PRODUCTS_STORE_NAME).get(id);
    const raw = await new Promise<unknown>((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
    await completeEditorTransaction(transaction);
    return restoreProduct(raw);
  } catch (error) {
    console.error("Failed to load product:", error);
    return null;
  }
}

export async function getAllProducts(): Promise<ProductRecord[]> {
  try {
    const database = await openEditorDatabase();
    const transaction = database.transaction(PRODUCTS_STORE_NAME, "readonly");
    const request = transaction.objectStore(PRODUCTS_STORE_NAME).getAll();
    const raw = await new Promise<unknown[]>((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result || []));
      request.addEventListener("error", () => reject(request.error));
    });
    await completeEditorTransaction(transaction);
    return raw
      .map(restoreProduct)
      .filter((product): product is ProductRecord => product !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Failed to load products:", error);
    return [];
  }
}

export async function createProduct(
  name: string,
  type: ProductType
): Promise<ProductRecord> {
  const definition = getProductTypeDefinition(type);
  const project = await createProject(definition.startingAssetName);
  const now = Date.now();
  const productId = `product_${now}_${Math.random().toString(36).slice(2, 7)}`;

  const product: ProductRecord = {
    id: productId,
    name: name.trim() || definition.name,
    type,
    status: "in-progress",
    assets: [
      {
        id: `asset_${now}_${Math.random().toString(36).slice(2, 7)}`,
        name: definition.startingAssetName,
        kind: "page",
        projectId: project.id,
        order: 0,
      },
    ],
    deliverables: [],
    createdAt: now,
    updatedAt: now,
  };

  await saveProduct(product);
  return product;
}
