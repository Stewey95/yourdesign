"use client";

import { ArrowRight, Boxes, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductStudioHeader from "../../components/product-studio/ProductStudioHeader";
import { getAllProducts } from "../../lib/products/productsManager";
import {
  getProductTypeDefinition,
  type ProductRecord,
} from "../../lib/products/products.types";

export default function ProductStudioPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getAllProducts().then((records) => {
      if (active) {
        setProducts(records);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-dvh overflow-x-hidden bg-slate-50 text-slate-950">
      <ProductStudioHeader action />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold text-blue-600">Product Studio</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">
              Your products
            </h1>
            <p className="mt-3 text-slate-600">
              Continue a product or turn a fresh idea into something ready to
              share.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <section className="mt-10 flex min-h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
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
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Plus size={17} aria-hidden="true" />
              Create your first product
            </Link>
          </section>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const definition = getProductTypeDefinition(product.type);
              return (
                <Link
                  key={product.id}
                  href={`/studio/${product.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div
                    className={`h-24 bg-gradient-to-br ${definition.accent} opacity-90`}
                  />
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      {definition.name}
                    </p>
                    <h2 className="mt-2 truncate text-xl font-black">
                      {product.name}
                    </h2>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-500">
                        {product.assets.length}{" "}
                        {product.assets.length === 1 ? "page" : "pages"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-bold text-blue-600">
                        Open
                        <ArrowRight
                          size={15}
                          className="transition group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
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
