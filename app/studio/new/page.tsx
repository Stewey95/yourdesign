"use client";

import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ProductStudioHeader from "../../../components/product-studio/ProductStudioHeader";
import {
  PRODUCT_TYPE_DEFINITIONS,
  type ProductType,
} from "../../../lib/products/products.types";
import { createProduct } from "../../../lib/products/productsManager";

export default function NewProductPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] =
    useState<ProductType>("printable-planner");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDefinition =
    PRODUCT_TYPE_DEFINITIONS.find(({ id }) => id === selectedType) ??
    PRODUCT_TYPE_DEFINITIONS[0];

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setError(null);

    try {
      const product = await createProduct(
        name.trim() || selectedDefinition.name,
        selectedType
      );
      router.push(`/studio/${product.id}`);
    } catch (creationError) {
      console.error("Failed to create product:", creationError);
      setError("Your product could not be created. Please try again.");
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-dvh overflow-x-hidden bg-slate-50 text-slate-950">
      <ProductStudioHeader backHref="/studio" backLabel="Your products" />

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
            <Sparkles size={14} aria-hidden="true" />
            Start something worth sharing
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            What would you like to create?
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Choose a starting point. Gripix will prepare the first page, and
            you can shape everything from there.
          </p>
        </div>

        <div
          className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          role="radiogroup"
          aria-label="Product type"
        >
          {PRODUCT_TYPE_DEFINITIONS.map((definition) => {
            const selected = definition.id === selectedType;
            return (
              <button
                key={definition.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedType(definition.id)}
                className={`group relative min-h-40 overflow-hidden rounded-2xl border p-5 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  selected
                    ? "border-blue-500 bg-white shadow-md shadow-blue-950/5"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <span
                  className={`mb-5 block h-2 w-16 rounded-full bg-gradient-to-r ${definition.accent}`}
                />
                <span className="block pr-8 text-lg font-extrabold text-slate-950">
                  {definition.name}
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  {definition.description}
                </span>
                {selected && (
                  <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check size={15} aria-hidden="true" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label
            htmlFor="product-name"
            className="text-sm font-bold text-slate-900"
          >
            Give your product a name
          </label>
          <p className="mt-1 text-sm text-slate-500">
            You can change this later.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              id="product-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleCreate();
              }}
              placeholder={`My ${selectedDefinition.name}`}
              maxLength={80}
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={isCreating}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {isCreating ? "Preparing your product…" : "Create Product"}
              {!isCreating && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
