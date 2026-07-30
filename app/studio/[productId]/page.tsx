"use client";

import {
  ArrowRight,
  CheckCircle2,
  FileText,
  PackageCheck,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductStudioHeader from "../../../components/product-studio/ProductStudioHeader";
import { setActiveProjectId } from "../../../lib/projects/projectsManager";
import { getProduct } from "../../../lib/products/productsManager";
import {
  getProductTypeDefinition,
  type ProductAsset,
  type ProductRecord,
} from "../../../lib/products/products.types";

const statusLabels = {
  idea: "Idea",
  "in-progress": "In progress",
  ready: "Ready",
} as const;

export default function ProductPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getProduct(params.productId).then((record) => {
      if (active) {
        setProduct(record);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [params.productId]);

  const openAsset = (asset: ProductAsset) => {
    if (!product) return;
    setActiveProjectId(asset.projectId);
    router.push(`/create?product=${product.id}&asset=${asset.id}`);
  };

  if (loading) {
    return (
      <main className="min-h-dvh bg-slate-50">
        <ProductStudioHeader backHref="/studio" backLabel="Your products" />
        <div className="mx-auto max-w-7xl animate-pulse px-5 py-12 sm:px-6 lg:px-8">
          <div className="h-8 w-44 rounded-lg bg-slate-200" />
          <div className="mt-5 h-14 max-w-xl rounded-xl bg-slate-200" />
          <div className="mt-10 h-80 rounded-3xl bg-slate-200" />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-dvh bg-slate-50 text-slate-950">
        <ProductStudioHeader backHref="/studio" backLabel="Your products" />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-3xl font-black">Product not found</h1>
          <p className="mt-3 text-slate-600">
            This product may have been removed or belongs to another browser.
          </p>
          <Link
            href="/studio"
            className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white"
          >
            Return to Product Studio
          </Link>
        </div>
      </main>
    );
  }

  const definition = getProductTypeDefinition(product.type);
  const primaryAsset = product.assets[0];

  return (
    <main className="min-h-dvh overflow-x-hidden bg-slate-50 text-slate-950">
      <ProductStudioHeader backHref="/studio" backLabel="Your products" action />

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-6 sm:py-12 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            className={`relative bg-gradient-to-br ${definition.accent} px-6 py-8 text-white sm:px-9 sm:py-10`}
          >
            <div className="absolute inset-0 bg-slate-950/10" />
            <div className="relative">
              <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
                {definition.name}
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                {product.name}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/90">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/20 px-3 py-1.5 backdrop-blur">
                  <CheckCircle2 size={15} aria-hidden="true" />
                  {statusLabels[product.status]}
                </span>
                <span>
                  {product.assets.length}{" "}
                  {product.assets.length === 1 ? "page" : "pages"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Your product has a place to grow
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Open the first page in the Gripix editor. Product pages,
                deliverables, and completion tools will build from this
                foundation.
              </p>
            </div>
            {primaryAsset && (
              <button
                type="button"
                onClick={() => openAsset(primaryAsset)}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <Pencil size={17} aria-hidden="true" />
                Edit Product
              </button>
            )}
          </div>
        </section>

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-blue-600">
                  Product contents
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Pages and assets
                </h2>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {product.assets.map((asset, index) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => openAsset(asset)}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                    <FileText size={42} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <div className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Page {index + 1}
                      </p>
                      <p className="mt-1 truncate font-extrabold text-slate-900">
                        {asset.name}
                      </p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="shrink-0 text-blue-600 transition group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <PackageCheck size={21} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-black">Deliverables</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Product packages and sell-ready outputs will appear here in a
              future sprint.
            </p>
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-xs font-semibold text-slate-500">
              No deliverables planned yet
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
