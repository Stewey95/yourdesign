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
    <main className="studio-page">
      <ProductStudioHeader action />
      <div className="platform-container py-10 sm:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="studio-eyebrow">Product Studio</p>
            <h1 className="studio-page-title mt-2">
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
                className="studio-skeleton h-52"
              />
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
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const definition = getProductTypeDefinition(product.type);
              return (
                <Link
                  key={product.id}
                  href={`/studio/${product.id}`}
                  className="studio-card studio-card-interactive group overflow-hidden"
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
