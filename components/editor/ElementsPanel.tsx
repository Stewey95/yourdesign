"use client";

import { Clock3, Heart, Search, Shapes } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import {
  ELEMENT_CATALOG,
  ELEMENT_CATEGORIES,
  getElementSvgDataUrl,
  searchElementCatalog,
} from "./elements/elements.catalog";
import type { ElementAsset } from "./elements/element.types";

type ElementsPanelProps = {
  onInsertElement: (element: ElementAsset) => void;
};

export default function ElementsPanel({
  onInsertElement,
}: ElementsPanelProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const deferredQuery = useDeferredValue(query);
  const searchResult = useMemo(
    () =>
      searchElementCatalog({
        query: deferredQuery,
        category,
      }),
    [category, deferredQuery]
  );
  const recentElements = useMemo(
    () => ELEMENT_CATALOG.filter((element) => element.recent),
    []
  );
  const favouriteElements = useMemo(
    () => ELEMENT_CATALOG.filter((element) => element.favourite),
    []
  );

  return (
    <div className="space-y-4">
      <label className="relative block">
        <span className="sr-only">Search elements</span>
        <Search
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search elements"
          className="h-10 w-full rounded-lg border border-white/10 bg-slate-900/70 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/30"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
        <EmptyLibrarySection
          icon={Clock3}
          title="Recent"
          count={recentElements.length}
        />
        <EmptyLibrarySection
          icon={Heart}
          title="Favourites"
          count={favouriteElements.length}
        />
      </div>

      <section aria-labelledby="element-categories-heading">
        <h3
          id="element-categories-heading"
          className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400"
        >
          Categories
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {[undefined, ...ELEMENT_CATEGORIES].map((option) => {
            const selected = category === option;
            const label = option ?? "All";

            return (
              <button
                key={label}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(option)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  selected
                    ? "border-blue-400/50 bg-blue-500/20 text-cyan-200"
                    : "border-white/10 bg-slate-700/70 text-slate-300 hover:border-white/20 hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="element-results-heading">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3
            id="element-results-heading"
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
          >
            Elements
          </h3>
          <span className="text-[10px] tabular-nums text-slate-500">
            {searchResult.total}
          </span>
        </div>

        {searchResult.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 px-3 py-6 text-center">
            <Shapes
              size={20}
              aria-hidden="true"
              className="mx-auto mb-2 text-slate-500"
            />
            <p className="text-xs font-semibold text-slate-300">
              No elements found
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Try another search or category.
            </p>
          </div>
        ) : (
          <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] md:grid-cols-2">
            {searchResult.items.map((element) => (
              <button
                key={element.id}
                type="button"
                onClick={() => onInsertElement(element)}
                className="group min-w-0 rounded-xl border border-white/10 bg-slate-700/60 p-2 text-left transition hover:border-blue-400/40 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label={`Add ${element.name}`}
                title={`Add ${element.name}`}
              >
                <span
                  aria-hidden="true"
                  className="mb-1.5 block aspect-square w-full rounded-lg bg-white/95 bg-contain bg-center bg-no-repeat transition group-hover:scale-[1.02]"
                  style={{
                    backgroundImage: `url("${getElementSvgDataUrl(element)}")`,
                  }}
                />
                <span className="block truncate text-[10px] font-semibold text-slate-200">
                  {element.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {searchResult.total > searchResult.items.length && (
          <p className="mt-2 text-[10px] text-slate-500">
            Refine your search to see more results.
          </p>
        )}
      </section>
    </div>
  );
}

type EmptyLibrarySectionProps = {
  icon: typeof Clock3;
  title: string;
  count: number;
};

function EmptyLibrarySection({
  icon: Icon,
  title,
  count,
}: EmptyLibrarySectionProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/40 px-2.5 py-2">
      <Icon size={14} aria-hidden="true" className="shrink-0 text-slate-500" />
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-semibold text-slate-300">
          {title}
        </span>
        <span className="block text-[10px] text-slate-500">
          {count === 0 ? "Nothing yet" : `${count} saved`}
        </span>
      </span>
    </div>
  );
}
