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
    <main className="studio-page">
      <ProductStudioHeader backHref="/studio" backLabel="Your products" />

      <div className="platform-container max-w-6xl py-10 sm:py-14">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
            <Sparkles size={14} aria-hidden="true" />
            Start something worth sharing
          </div>
          <h1 className="studio-page-title mt-5">
            What would you like to create?
          </h1>
          <p className="studio-body mt-4 max-w-xl text-base sm:text-lg">
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
                className={`studio-card studio-card-interactive group relative min-h-40 overflow-hidden p-5 text-left ${
                  selected
                    ? "border-blue-500 ring-2 ring-blue-500/10"
                    : ""
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

        <section className="studio-card mt-8 p-5 sm:p-6">
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
              className="studio-input min-w-0 flex-1 text-base font-semibold placeholder:font-normal"
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={isCreating}
              className="studio-button studio-button-primary min-h-12"
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
