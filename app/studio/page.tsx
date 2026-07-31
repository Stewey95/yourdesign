"use client";

import { ArrowRight, Boxes, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductStudioHeader from "../../components/product-studio/ProductStudioHeader";
import ProductPageThumbnail from "../../components/product-studio/ProductPageThumbnail";
import { getProject } from "../../lib/projects/projectsManager";
import type { ProjectRecord } from "../../lib/projects/projects.types";
import { getAllProducts } from "../../lib/products/productsManager";
import {
  getProductTypeDefinition,
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

export default function ProductStudioPage() {
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
          records.map(async (p) => {
            const coverAsset =
              p.assets.find((a) => a.id === p.lastEditedAssetId) || p.assets[0];
            if (!coverAsset) return null;
            const proj = await getProject(coverAsset.projectId);
            return [coverAsset.projectId, proj] as const;
          })
        );

        if (active) {
          const map = new Map<string, ProjectRecord>();
          coverProjects.forEach((entry) => {
            if (entry && entry[1]) {
              map.set(entry[0], entry[1]);
            }
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

  return (
    <main className="studio-page">
      <ProductStudioHeader action />
      <div className="platform-container py-10 sm:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="studio-eyebrow">Product Studio</p>
            <h1 className="studio-page-title mt-2">Your products</h1>
            <p className="mt-3 text-slate-600">
              Continue a product or turn a fresh idea into something ready to
              share.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="studio-skeleton h-64 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <section className="studio-empty-state mt-10 min-h-96">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 via-blue-100 to-violet-100 text-blue-700">
              <Boxes size={29} aria-hidden="true" />
            </span>
            <h2 className="mt-6 text-2xl font-black tracking-tight">
              Your first product starts here
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              Choose what you want to make and Gripix will prepare a simple,
              focused place to build it.
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
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const definition = getProductTypeDefinition(product.type);
              const activeAsset =
                product.assets.find((a) => a.id === product.lastEditedAssetId) ||
                product.assets[0];
              const project = activeAsset
                ? projectsMap.get(activeAsset.projectId)
                : null;
              const statusCfg =
                statusConfig[product.status] || statusConfig["in-progress"];

              return (
                <Link
                  key={product.id}
                  href={`/studio/${product.id}`}
                  className="studio-card studio-card-interactive group flex flex-col justify-between overflow-hidden rounded-xl"
                >
                  <div>
                    {/* Cover Real Thumbnail Preview */}
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
                          className={`rounded px-2 py-0.5 text-[10px] font-bold border ${statusCfg.border} ${statusCfg.bg} ${statusCfg.text}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>

                      <h2 className="mt-2 truncate text-xl font-black text-slate-900 group-hover:text-blue-600">
                        {product.name}
                      </h2>
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
        )}
      </div>
    </main>
  );
}
