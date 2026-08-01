"use client";

import {
  ArrowRight,
  Boxes,
  Clock3,
  HardDrive,
  Layers3,
  Pencil,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductStudioHeader from "../../components/product-studio/ProductStudioHeader";
import ProductPageThumbnail from "../../components/product-studio/ProductPageThumbnail";
import {
  getProject,
  setActiveProjectId,
} from "../../lib/projects/projectsManager";
import type { ProjectRecord } from "../../lib/projects/projects.types";
import { getAllProducts } from "../../lib/products/productsManager";
import {
  getProductTypeDefinition,
  type ProductAsset,
  type ProductRecord,
  type ProductStatus,
} from "../../lib/products/products.types";

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

const getActiveAsset = (product: ProductRecord) =>
  product.assets.find((asset) => asset.id === product.lastEditedAssetId) ||
  product.assets[0];

const formatLastEdited = (timestamp: number) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year:
      new Date(timestamp).getFullYear() === new Date().getFullYear()
        ? undefined
        : "numeric",
  }).format(timestamp);

export default function ProductStudioPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [projectsMap, setProjectsMap] = useState<Map<string, ProjectRecord>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const records = await getAllProducts();
      if (!active) return;

      setProducts(records);
      setLoading(false);

      if (records.length > 0) {
        const coverProjects = await Promise.all(
          records.map(async (product) => {
            const coverAsset = getActiveAsset(product);
            if (!coverAsset) return null;
            const project = await getProject(coverAsset.projectId);
            return [coverAsset.projectId, project] as const;
          })
        );

        if (active) {
          const map = new Map<string, ProjectRecord>();
          coverProjects.forEach((entry) => {
            if (entry && entry[1]) map.set(entry[0], entry[1]);
          });
          setProjectsMap(map);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const continueEditing = (product: ProductRecord, asset: ProductAsset) => {
    setActiveProjectId(asset.projectId);
    router.push(`/create?product=${product.id}&asset=${asset.id}`);
  };

  const recentProduct = products[0];
  const recentAsset = recentProduct ? getActiveAsset(recentProduct) : undefined;
  const recentProject = recentAsset
    ? projectsMap.get(recentAsset.projectId)
    : null;
  const remainingProducts = products.slice(1);

  return (
    <main className="studio-page">
      <ProductStudioHeader action />
      <div className="platform-container py-10 sm:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="studio-eyebrow">Product Studio</p>
            <h1 className="studio-page-title mt-2">Your products</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Pick up where you left off or turn a fresh idea into something
              ready to share.
            </p>
          </div>
        </div>

        <aside
          aria-label="Product storage information"
          className="mt-7 flex items-start gap-3 rounded-xl border border-slate-200 bg-white/75 px-4 py-3 text-sm text-slate-600 shadow-sm"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <HardDrive size={16} aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold text-slate-800">Saved on this device</p>
            <p className="mt-0.5 leading-5">
              Your products are currently stored on this device and available
              in this browser.
            </p>
          </div>
        </aside>

        {loading ? (
          <div className="mt-10 space-y-8">
            <div className="studio-skeleton h-72 rounded-xl" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="studio-skeleton h-64 rounded-xl" />
              ))}
            </div>
          </div>
        ) : products.length === 0 ? (
          <section className="studio-empty-state mt-10 min-h-96">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 via-blue-100 to-violet-100 text-blue-700">
              <Boxes size={29} aria-hidden="true" />
            </span>
            <h2 className="mt-6 text-2xl font-black tracking-tight">
              You haven&apos;t created any products yet.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              Create your first product and Gripix will prepare a focused
              workspace for its pages, assets and designs.
            </p>
            <Link
              href="/studio/new"
              className="studio-button studio-button-primary mt-7 min-h-12"
            >
              <Plus size={17} aria-hidden="true" />
              Create your first product
            </Link>
          </section>
        ) : (
          <div className="mt-10 space-y-12">
            {recentProduct && recentAsset && (
              <section aria-labelledby="continue-creating-title">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="studio-eyebrow">Continue Creating</p>
                    <h2
                      id="continue-creating-title"
                      className="studio-section-title mt-1.5"
                    >
                      Return to your latest product
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Clock3 size={14} aria-hidden="true" />
                    Edited {formatLastEdited(recentProduct.updatedAt)}
                  </span>
                </div>

                <div className="studio-card mt-5 overflow-hidden rounded-[var(--studio-radius-prominent)] border-slate-200/80">
                  <div className="grid lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
                    <ProductPageThumbnail
                      project={recentProject}
                      className="h-full min-h-56 w-full border-b border-slate-100 lg:border-b-0 lg:border-r"
                    />
                    <div className="flex flex-col justify-center p-6 sm:p-8">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="studio-badge border border-slate-200 bg-slate-100 text-slate-700">
                          {getProductTypeDefinition(recentProduct.type).name}
                        </span>
                        <span
                          className={`studio-badge border ${statusConfig[recentProduct.status].border} ${statusConfig[recentProduct.status].bg} ${statusConfig[recentProduct.status].text}`}
                        >
                          {statusConfig[recentProduct.status].label}
                        </span>
                      </div>
                      <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                        {recentProduct.name}
                      </h3>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <Layers3 size={15} aria-hidden="true" />
                        {recentProduct.assets.length}{" "}
                        {recentProduct.assets.length === 1 ? "page" : "pages"}
                        <span aria-hidden="true">·</span>
                        Continue with {recentAsset.name}
                      </p>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() =>
                            continueEditing(recentProduct, recentAsset)
                          }
                          className="studio-button studio-button-primary min-h-12"
                        >
                          <Pencil size={16} aria-hidden="true" />
                          Continue Editing
                        </button>
                        <Link
                          href={`/studio/${recentProduct.id}`}
                          className="studio-button studio-button-secondary min-h-12"
                        >
                          View product
                          <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {remainingProducts.length > 0 && (
              <section aria-labelledby="all-products-title">
                <div>
                  <p className="studio-eyebrow">Your Library</p>
                  <h2
                    id="all-products-title"
                    className="studio-section-title mt-1.5"
                  >
                    More products
                  </h2>
                </div>
                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {remainingProducts.map((product) => {
                    const definition = getProductTypeDefinition(product.type);
                    const activeAsset = getActiveAsset(product);
                    const project = activeAsset
                      ? projectsMap.get(activeAsset.projectId)
                      : null;
                    const status = statusConfig[product.status];

                    return (
                      <Link
                        key={product.id}
                        href={`/studio/${product.id}`}
                        className="studio-card studio-card-interactive group flex flex-col justify-between overflow-hidden rounded-xl"
                      >
                        <div>
                          <ProductPageThumbnail
                            project={project}
                            className="w-full border-b border-slate-100"
                          />
                          <div className="p-5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                {definition.name}
                              </span>
                              <span
                                className={`rounded border px-2 py-0.5 text-[10px] font-bold ${status.border} ${status.bg} ${status.text}`}
                              >
                                {status.label}
                              </span>
                            </div>
                            <h3 className="mt-2 truncate text-xl font-black text-slate-900 group-hover:text-blue-600">
                              {product.name}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              Edited {formatLastEdited(product.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs font-semibold text-slate-500">
                          <span>
                            {product.assets.length}{" "}
                            {product.assets.length === 1 ? "page" : "pages"}
                          </span>
                          <span className="inline-flex items-center gap-1 font-bold text-blue-600">
                            Open Product
                            <ArrowRight
                              size={14}
                              className="transition group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
