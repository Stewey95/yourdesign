"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductStudioHeader from "../../../components/product-studio/ProductStudioHeader";
import ProductPageThumbnail from "../../../components/product-studio/ProductPageThumbnail";
import {
  getProject,
  setActiveProjectId,
} from "../../../lib/projects/projectsManager";
import type { ProjectRecord } from "../../../lib/projects/projects.types";
import {
  addPageToProduct,
  deletePageInProduct,
  duplicatePageInProduct,
  getProduct,
  renamePageInProduct,
  reorderPagesInProduct,
  updateProductStatus,
} from "../../../lib/products/productsManager";
import {
  getProductTypeDefinition,
  type ProductAsset,
  type ProductRecord,
  type ProductStatus,
} from "../../../lib/products/products.types";

const statusConfig: Record<
  ProductStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
  },
  "in-progress": {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  "ready-for-review": {
    label: "Ready for Review",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  ready: {
    label: "Ready",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
};

export default function ProductPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [projectsMap, setProjectsMap] = useState<Map<string, ProjectRecord>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  // Modal state for delete confirmation
  const [deleteTargetAsset, setDeleteTargetAsset] =
    useState<ProductAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline page renaming state
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Status selector dropdown toggle
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Drag and drop page reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (!product || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newAssets = [...product.assets];
    const [moved] = newAssets.splice(draggedIndex, 1);
    newAssets.splice(targetIndex, 0, moved);
    setDraggedIndex(null);
    setDragOverIndex(null);

    const assetIds = newAssets.map((a) => a.id);
    const updated = await reorderPagesInProduct(product.id, assetIds);
    if (updated) {
      setProduct(updated);
    }
  };

  useEffect(() => {
    let active = true;

    const loadProductData = async () => {
      if (!params.productId) return;
      const record = await getProduct(params.productId);
      if (!active) return;

      setProduct(record);
      setLoading(false);

      if (record && record.assets.length > 0) {
        const loadedProjects = await Promise.all(
          record.assets.map(async (asset) => {
            const proj = await getProject(asset.projectId);
            return [asset.projectId, proj] as const;
          })
        );

        if (active) {
          const map = new Map<string, ProjectRecord>();
          loadedProjects.forEach(([pid, proj]) => {
            if (proj) map.set(pid, proj);
          });
          setProjectsMap(map);
        }
      }
    };

    void loadProductData();

    return () => {
      active = false;
    };
  }, [params.productId]);

  const refreshProject = async (projectId: string) => {
    const proj = await getProject(projectId);
    if (proj) {
      setProjectsMap((prev) => new Map(prev).set(projectId, proj));
    }
  };

  const openAsset = (asset: ProductAsset) => {
    if (!product) return;
    setActiveProjectId(asset.projectId);
    router.push(`/create?product=${product.id}&asset=${asset.id}`);
  };

  const handleAddPage = async () => {
    if (!product) return;
    const updated = await addPageToProduct(product.id);
    if (updated) {
      setProduct(updated);
      const newAsset = updated.assets[updated.assets.length - 1];
      if (newAsset) {
        await refreshProject(newAsset.projectId);
      }
    }
  };

  const handleStartRename = (asset: ProductAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAssetId(asset.id);
    setEditingName(asset.name);
  };

  const handleSaveRename = async (assetId: string) => {
    if (!product || !editingName.trim()) {
      setEditingAssetId(null);
      return;
    }
    const updated = await renamePageInProduct(
      product.id,
      assetId,
      editingName.trim()
    );
    if (updated) {
      setProduct(updated);
    }
    setEditingAssetId(null);
  };

  const handleDuplicatePage = async (
    asset: ProductAsset,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!product) return;
    const updated = await duplicatePageInProduct(product.id, asset.id);
    if (updated) {
      setProduct(updated);
      // load all projects again to catch duplicated project
      const loadedProjects = await Promise.all(
        updated.assets.map(async (a) => {
          const proj = await getProject(a.projectId);
          return [a.projectId, proj] as const;
        })
      );
      const map = new Map<string, ProjectRecord>();
      loadedProjects.forEach(([pid, proj]) => {
        if (proj) map.set(pid, proj);
      });
      setProjectsMap(map);
    }
  };

  const handleConfirmDelete = async () => {
    if (!product || !deleteTargetAsset || isDeleting) return;
    setIsDeleting(true);
    const updated = await deletePageInProduct(product.id, deleteTargetAsset.id);
    if (updated) {
      setProduct(updated);
    }
    setIsDeleting(false);
    setDeleteTargetAsset(null);
  };

  const handleMovePage = async (
    assetId: string,
    direction: "up" | "down",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!product) return;
    const currentIndex = product.assets.findIndex((a) => a.id === assetId);
    if (currentIndex < 0) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= product.assets.length) return;

    const newAssets = [...product.assets];
    const [moved] = newAssets.splice(currentIndex, 1);
    newAssets.splice(targetIndex, 0, moved);

    const assetIds = newAssets.map((a) => a.id);
    const updated = await reorderPagesInProduct(product.id, assetIds);
    if (updated) {
      setProduct(updated);
    }
  };

  const handleSelectStatus = async (status: ProductStatus) => {
    if (!product) return;
    setShowStatusMenu(false);
    const updated = await updateProductStatus(product.id, status);
    if (updated) {
      setProduct(updated);
    }
  };

  if (loading) {
    return (
      <main className="studio-page">
        <ProductStudioHeader backHref="/studio" backLabel="Your products" />
        <div className="platform-container py-12">
          <div className="studio-skeleton h-8 w-44" />
          <div className="studio-skeleton mt-5 h-14 max-w-xl" />
          <div className="studio-skeleton mt-10 h-80" />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="studio-page">
        <ProductStudioHeader backHref="/studio" backLabel="Your products" />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-3xl font-black">Product not found</h1>
          <p className="mt-3 text-slate-600">
            This product may have been removed or belongs to another browser.
          </p>
          <Link
            href="/studio"
            className="studio-button studio-button-primary mt-7"
          >
            Return to Product Studio
          </Link>
        </div>
      </main>
    );
  }

  const definition = getProductTypeDefinition(product.type);
  const activeAsset =
    product.assets.find((a) => a.id === product.lastEditedAssetId) ||
    product.assets[0];
  const activeProject = activeAsset
    ? projectsMap.get(activeAsset.projectId)
    : null;
  const currentStatus = statusConfig[product.status] || statusConfig["in-progress"];

  return (
    <main className="studio-page">
      <ProductStudioHeader backHref="/studio" backLabel="Your products" action />

      <div className="platform-container py-8 sm:py-10">
        {/* Workspace Hero Header */}
        <section className="studio-card overflow-hidden rounded-[var(--studio-radius-prominent)] border border-slate-200/80 shadow-sm">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            {/* Hero Details */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="studio-badge border border-slate-200 bg-slate-100 text-slate-700">
                  {definition.name}
                </span>

                {/* Status Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStatusMenu((prev) => !prev)}
                    className={`studio-badge cursor-pointer border ${currentStatus.border} ${currentStatus.bg} ${currentStatus.text} transition hover:opacity-90`}

                    title="Change product status"
                  >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    {currentStatus.label}
                  </button>

                  {showStatusMenu && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                      {(
                        [
                          "draft",
                          "in-progress",
                          "ready-for-review",
                          "ready",
                        ] as ProductStatus[]
                      ).map((statusKey) => {
                        const cfg = statusConfig[statusKey];
                        return (
                          <button
                            key={statusKey}
                            type="button"
                            onClick={() => handleSelectStatus(statusKey)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition ${
                              product.status === statusKey
                                ? "bg-slate-100 text-slate-900"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${cfg.bg} ${cfg.border}`}
                              />
                              {cfg.label}
                            </span>
                            {product.status === statusKey && (
                              <Check size={14} className="text-blue-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <span className="text-xs font-semibold text-slate-500">
                  {product.assets.length}{" "}
                  {product.assets.length === 1 ? "page" : "pages"}
                </span>
              </div>

              <h1 className="studio-page-title mt-4 text-slate-900">
                {product.name}
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                {definition.description} Work on your pages, refine visual items, and build toward a sell-ready release.
              </p>

              {activeAsset && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openAsset(activeAsset)}
                    className="studio-button studio-button-primary min-h-11 shadow-md"
                  >
                    <Pencil size={16} aria-hidden="true" />
                    Continue Editing {activeAsset.name}
                  </button>

                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Clock size={14} aria-hidden="true" />
                    Last edited page
                  </span>
                </div>
              )}
            </div>

            {/* Visual Hero Thumbnail Preview */}
            <div className="group relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5 p-2 shadow-inner">
              <ProductPageThumbnail
                project={activeProject}
                className="h-full w-full rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => activeAsset && openAsset(activeAsset)}
                  className="studio-button studio-button-primary shadow-lg"
                >
                  <Pencil size={15} aria-hidden="true" />
                  Edit Page
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Product Hierarchy & Page List */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Product Contents
                </p>
                <h2 className="mt-0.5 text-xl font-black tracking-tight text-slate-900">
                  Pages and Assets ({product.assets.length})
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Drag pages into place, or use the order controls on each card.
                </p>
              </div>

              {/* Add Page Action */}
              <button
                type="button"
                onClick={handleAddPage}
                className="studio-button studio-button-secondary min-h-10 text-xs font-bold"
              >
                <Plus size={16} aria-hidden="true" />
                Add Page
              </button>
            </div>

            {/* Page Grid */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {product.assets.map((asset, index) => {
                const project = projectsMap.get(asset.projectId);
                const isEditingThisAsset = editingAssetId === asset.id;
                const isLastEdited = product.lastEditedAssetId === asset.id;
                const isBeingDragged = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={asset.id}
                    draggable
                    onDragStart={(e) => handleDragStart(index, e)}
                    onDragOver={(e) => handleDragOver(index, e)}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDrop={(e) => handleDrop(index, e)}
                    className={`studio-card group relative flex flex-col justify-between overflow-hidden rounded-xl transition ${
                      isBeingDragged ? "opacity-40 border-dashed border-blue-400" : ""
                    } ${
                      isDragOver
                        ? "border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/20"
                        : isLastEdited
                        ? "ring-2 ring-blue-500/40"
                        : "hover:border-slate-300"
                    }`}
                  >
                    {/* Thumbnail Section */}
                    <div
                      onClick={() => openAsset(asset)}
                      className="cursor-pointer"
                    >
                      <ProductPageThumbnail
                        project={project}
                        className="w-full"
                      />
                    </div>

                    {/* Page Meta & Actions Bar */}
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex cursor-grab items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-200"
                            title="Drag to reorder page"
                          >
                            <GripVertical size={12} className="text-slate-400" />
                            Page {index + 1}
                          </span>
                          {isLastEdited && (
                            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Order & Management Buttons */}
                        <div
                          className="flex items-center gap-1"
                          aria-label={`Page ${index + 1} order and management controls`}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleMovePage(asset.id, "up", e)}
                            disabled={index === 0}
                            className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35"
                            title="Move page up"
                            aria-label={`Move page ${index + 1} up`}
                          >
                            <ArrowUp size={13} aria-hidden="true" />
                            <span>Up</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleMovePage(asset.id, "down", e)}
                            disabled={index === product.assets.length - 1}
                            className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35"
                            title="Move page down"
                            aria-label={`Move page ${index + 1} down`}
                          >
                            <ArrowDown size={13} aria-hidden="true" />
                            <span>Down</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDuplicatePage(asset, e)}
                            className="flex min-h-8 min-w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Duplicate page"
                            aria-label={`Duplicate page ${index + 1}`}
                          >
                            <Copy size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetAsset(asset);
                            }}
                            disabled={product.assets.length <= 1}
                            className="flex min-h-8 min-w-8 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                            title="Delete page"
                            aria-label={`Delete page ${index + 1}`}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Editable Asset Title */}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {isEditingThisAsset ? (
                          <div className="flex flex-1 items-center gap-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleSaveRename(asset.id);
                                if (e.key === "Escape")
                                  setEditingAssetId(null);
                              }}
                              autoFocus
                              className="h-8 w-full rounded-md border border-blue-400 bg-white px-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-400/30"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(asset.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-1 items-center justify-between">
                            <span
                              onClick={() => openAsset(asset)}
                              className="truncate text-sm font-bold text-slate-900 cursor-pointer hover:text-blue-600"
                            >
                              {asset.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(asset, e)}
                              className="rounded p-1 text-slate-400 opacity-60 transition hover:text-slate-700 hover:opacity-100"
                              title="Rename page"
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Workflow & Deliverables Sidebar */}
          <aside className="flex flex-col gap-6">
            <div className="studio-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CheckCircle2 size={20} aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-base font-black text-slate-900">
                Product Workflow
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Turn your pages into a cohesive product bundle. Pages sync live with Focus Studio.
              </p>
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Total pages</span>
                  <span className="font-bold text-slate-900">
                    {product.assets.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lifecycle status</span>
                  <span className="font-bold text-slate-900">
                    {currentStatus.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="studio-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <PackageCheck size={20} aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-base font-black text-slate-900">
                Deliverables
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Digital product packages and export bundles will build from your pages.
              </p>
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs font-medium text-slate-500">
                No deliverables planned yet
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Delete Page Confirmation Modal */}
      {deleteTargetAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="studio-card max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Delete &quot;{deleteTargetAsset.name}&quot;?
              </h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Are you sure you want to delete this page from your product? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetAsset(null)}
                className="studio-button studio-button-secondary min-h-10 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="studio-button min-h-10 bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Page"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
