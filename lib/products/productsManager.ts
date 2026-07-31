import {
  completeEditorTransaction,
  openEditorDatabase,
  PRODUCTS_STORE_NAME,
} from "../persistence/editorDatabase";
import {
  createProject,
  duplicateProject,
  deleteProject,
  renameProject,
} from "../projects/projectsManager";
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
    raw.status === "draft" ||
    raw.status === "in-progress" ||
    raw.status === "ready-for-review" ||
    raw.status === "ready"
      ? raw.status
      : raw.status === "idea"
      ? "draft"
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

  const lastEditedAssetId =
    typeof raw.lastEditedAssetId === "string" && raw.lastEditedAssetId
      ? raw.lastEditedAssetId
      : assets[0]?.id;

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
    lastEditedAssetId,
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
  const assetId = `asset_${now}_${Math.random().toString(36).slice(2, 7)}`;

  const product: ProductRecord = {
    id: productId,
    name: name.trim() || definition.name,
    type,
    status: "in-progress",
    assets: [
      {
        id: assetId,
        name: definition.startingAssetName,
        kind: "page",
        projectId: project.id,
        order: 0,
      },
    ],
    deliverables: [],
    lastEditedAssetId: assetId,
    createdAt: now,
    updatedAt: now,
  };

  await saveProduct(product);
  return product;
}

export async function addPageToProduct(
  productId: string,
  name?: string
): Promise<ProductRecord | null> {
  const product = await getProduct(productId);
  if (!product) return null;

  const pageName = name?.trim() || `Page ${product.assets.length + 1}`;
  const project = await createProject(pageName);
  const now = Date.now();
  const assetId = `asset_${now}_${Math.random().toString(36).slice(2, 7)}`;

  const newAsset = {
    id: assetId,
    name: pageName,
    kind: "page" as const,
    projectId: project.id,
    order: product.assets.length,
  };

  const updated: ProductRecord = {
    ...product,
    assets: [...product.assets, newAsset],
    lastEditedAssetId: assetId,
    updatedAt: now,
  };

  await saveProduct(updated);
  return updated;
}

export async function renamePageInProduct(
  productId: string,
  assetId: string,
  newName: string
): Promise<ProductRecord | null> {
  const product = await getProduct(productId);
  if (!product) return null;

  const trimmed = newName.trim();
  if (!trimmed) return product;

  let targetProjectId: string | null = null;
  const updatedAssets = product.assets.map((asset) => {
    if (asset.id === assetId) {
      targetProjectId = asset.projectId;
      return { ...asset, name: trimmed };
    }
    return asset;
  });

  if (targetProjectId) {
    await renameProject(targetProjectId, trimmed);
  }

  const updated: ProductRecord = {
    ...product,
    assets: updatedAssets,
    updatedAt: Date.now(),
  };

  await saveProduct(updated);
  return updated;
}

export async function duplicatePageInProduct(
  productId: string,
  assetId: string
): Promise<ProductRecord | null> {
  const product = await getProduct(productId);
  if (!product) return null;

  const sourceAsset = product.assets.find((asset) => asset.id === assetId);
  if (!sourceAsset) return product;

  const duplicatedProject = await duplicateProject(sourceAsset.projectId);
  if (!duplicatedProject) return product;

  const newTitle = `${sourceAsset.name} (Copy)`;
  await renameProject(duplicatedProject.id, newTitle);

  const now = Date.now();
  const newAssetId = `asset_${now}_${Math.random().toString(36).slice(2, 7)}`;

  const newAsset = {
    id: newAssetId,
    name: newTitle,
    kind: sourceAsset.kind,
    projectId: duplicatedProject.id,
    order: sourceAsset.order + 1,
  };

  const newAssets = [...product.assets];
  const sourceIndex = newAssets.findIndex((a) => a.id === assetId);
  if (sourceIndex >= 0) {
    newAssets.splice(sourceIndex + 1, 0, newAsset);
  } else {
    newAssets.push(newAsset);
  }

  const reindexedAssets = newAssets.map((asset, index) => ({
    ...asset,
    order: index,
  }));

  const updated: ProductRecord = {
    ...product,
    assets: reindexedAssets,
    lastEditedAssetId: newAssetId,
    updatedAt: now,
  };

  await saveProduct(updated);
  return updated;
}

export async function deletePageInProduct(
  productId: string,
  assetId: string
): Promise<ProductRecord | null> {
  const product = await getProduct(productId);
  if (!product) return null;
  if (product.assets.length <= 1) return product; // Don't delete the last remaining page

  const targetAsset = product.assets.find((asset) => asset.id === assetId);
  if (!targetAsset) return product;

  await deleteProject(targetAsset.projectId);

  const remainingAssets = product.assets
    .filter((asset) => asset.id !== assetId)
    .map((asset, index) => ({ ...asset, order: index }));

  const updatedLastEdited =
    product.lastEditedAssetId === assetId
      ? remainingAssets[0]?.id
      : product.lastEditedAssetId;

  const updated: ProductRecord = {
    ...product,
    assets: remainingAssets,
    lastEditedAssetId: updatedLastEdited,
    updatedAt: Date.now(),
  };

  await saveProduct(updated);
  return updated;
}

export async function reorderPagesInProduct(
  productId: string,
  assetIds: string[]
): Promise<ProductRecord | null> {
  const product = await getProduct(productId);
  if (!product) return null;

  const assetMap = new Map(product.assets.map((a) => [a.id, a]));
  const reordered: typeof product.assets = [];

  assetIds.forEach((id, index) => {
    const asset = assetMap.get(id);
    if (asset) {
      reordered.push({ ...asset, order: index });
      assetMap.delete(id);
    }
  });

  // Append any missing assets at the end
  assetMap.forEach((asset) => {
    reordered.push({ ...asset, order: reordered.length });
  });

  const updated: ProductRecord = {
    ...product,
    assets: reordered,
    updatedAt: Date.now(),
  };

  await saveProduct(updated);
  return updated;
}

export async function updateProductStatus(
  productId: string,
  status: ProductStatus
): Promise<ProductRecord | null> {
  const product = await getProduct(productId);
  if (!product) return null;

  const updated: ProductRecord = {
    ...product,
    status,
    updatedAt: Date.now(),
  };

  await saveProduct(updated);
  return updated;
}

export async function setProductLastEditedAsset(
  productId: string,
  assetId: string
): Promise<ProductRecord | null> {
  const product = await getProduct(productId);
  if (!product) return null;
  if (product.lastEditedAssetId === assetId) return product;

  const updated: ProductRecord = {
    ...product,
    lastEditedAssetId: assetId,
    updatedAt: Date.now(),
  };

  await saveProduct(updated);
  return updated;
}
