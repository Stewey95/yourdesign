"use client";

import { Clock3, Heart, Search, Shapes, Star, X } from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import {
  ELEMENT_CATALOG,
  ELEMENT_CATEGORIES,
  getElementCategoriesWithCounts,
  getElementSvgDataUrl,
  searchElementCatalog,
} from "./elements/elements.catalog";
import type { ElementAsset } from "./elements/element.types";

type ElementsPanelProps = {
  onInsertElement: (element: ElementAsset) => void;
};

const FAVORITES_STORAGE_KEY = "gripix_favourite_elements_v1";
const RECENTS_STORAGE_KEY = "gripix_recent_elements_v1";

export default function ElementsPanel({
  onInsertElement,
}: ElementsPanelProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>();

  // Lazy state initialization to read from localStorage without effect setState cascading renders
  const [favouriteIds, setFavouriteIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const storedFavs = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return storedFavs ? JSON.parse(storedFavs) : [];
    } catch {
      return [];
    }
  });

  const [recentIds, setRecentIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const storedRecents = localStorage.getItem(RECENTS_STORAGE_KEY);
      return storedRecents ? JSON.parse(storedRecents) : [];
    } catch {
      return [];
    }
  });

  const toggleFavourite = useCallback((elementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setFavouriteIds((prev) => {
      const next = prev.includes(elementId)
        ? prev.filter((id) => id !== elementId)
        : [...prev, elementId];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleElementClick = useCallback(
    (element: ElementAsset) => {
      // Record recent element insertion
      setRecentIds((prev) => {
        const next = [element.id, ...prev.filter((id) => id !== element.id)].slice(0, 12);
        try {
          localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      onInsertElement(element);
    },
    [onInsertElement]
  );

  const deferredQuery = useDeferredValue(query);

  const searchResult = useMemo(
    () =>
      searchElementCatalog({
        query: deferredQuery,
        category,
      }),
    [category, deferredQuery]
  );

  const categoryCounts = useMemo(
    () => getElementCategoriesWithCounts(ELEMENT_CATALOG),
    []
  );

  const recentElements = useMemo(
    () =>
      recentIds
        .map((id) => ELEMENT_CATALOG.find((el) => el.id === id))
        .filter((el): el is ElementAsset => Boolean(el)),
    [recentIds]
  );

  const favouriteElements = useMemo(
    () =>
      favouriteIds
        .map((id) => ELEMENT_CATALOG.find((el) => el.id === id))
        .filter((el): el is ElementAsset => Boolean(el)),
    [favouriteIds]
  );

  const handleClearSearch = () => {
    setQuery("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div className="min-w-0 max-w-full space-y-4">
      {/* Search Bar */}
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
          onKeyDown={handleKeyDown}
          placeholder="Search shapes, lines, symbols..."
          className="h-10 w-full rounded-lg border border-white/10 bg-slate-900/70 pl-9 pr-8 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/30"
        />
        {query && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </label>

      {/* Recents & Favourites Row */}
      <div className="grid grid-cols-2 gap-2">
        <LibrarySectionHeader
          icon={Clock3}
          title="Recent"
          count={recentElements.length}
          elements={recentElements}
          onInsertElement={handleElementClick}
        />
        <LibrarySectionHeader
          icon={Heart}
          title="Favourites"
          count={favouriteElements.length}
          elements={favouriteElements}
          onInsertElement={handleElementClick}
        />
      </div>

      {/* Category Pills Bar */}
      <section aria-labelledby="element-categories-heading">
        <div className="mb-2 flex items-center justify-between">
          <h3
            id="element-categories-heading"
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
          >
            Categories
          </h3>
          {category && (
            <button
              type="button"
              onClick={() => setCategory(undefined)}
              className="text-[10px] text-blue-400 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="flex max-w-full gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            aria-pressed={category === undefined}
            onClick={() => setCategory(undefined)}
            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              category === undefined
                ? "border-blue-400/50 bg-blue-500/20 text-cyan-200"
                : "border-white/10 bg-slate-700/70 text-slate-300 hover:border-white/20 hover:bg-slate-700"
            }`}
          >
            All ({ELEMENT_CATALOG.length})
          </button>
          {categoryCounts.map(({ category: catName, count }) => {
            const selected = category === catName;
            return (
              <button
                key={catName}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(selected ? undefined : catName)}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  selected
                    ? "border-blue-400/50 bg-blue-500/20 text-cyan-200"
                    : "border-white/10 bg-slate-700/70 text-slate-300 hover:border-white/20 hover:bg-slate-700"
                }`}
              >
                {catName} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Elements Section */}
      <section aria-labelledby="element-results-heading">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3
            id="element-results-heading"
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
          >
            {query
              ? "Search Results"
              : category
                ? category
                : "All Elements"}
          </h3>
          <span className="text-[10px] tabular-nums text-slate-500">
            {searchResult.total} {searchResult.total === 1 ? "element" : "elements"}
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
              Try another search term or clear active filters.
            </p>
          </div>
        ) : !query && !category ? (
          /* Grouped Categorized View when no search or filter active */
          <div className="space-y-4 md:max-h-none md:overflow-visible md:pr-0">
            {ELEMENT_CATEGORIES.map((catName) => {
              const catItems = ELEMENT_CATALOG.filter(
                (item) => item.category === catName
              );
              return (
                <div key={catName} className="space-y-2">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-[11px] font-semibold text-slate-300">
                      {catName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCategory(catName)}
                      className="text-[10px] font-medium text-blue-400 hover:text-blue-300"
                    >
                      See all ({catItems.length})
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-2">
                    {catItems.slice(0, 6).map((element) => (
                      <ElementCard
                        key={element.id}
                        element={element}
                        onInsert={handleElementClick}
                        onToggleFavourite={toggleFavourite}
                        isFavourite={favouriteIds.includes(element.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Search / Filter Grid View */
          <div className="grid grid-cols-3 gap-2 md:max-h-none md:overflow-visible md:pr-0">
            {searchResult.items.map((element) => (
              <ElementCard
                key={element.id}
                element={element}
                onInsert={handleElementClick}
                onToggleFavourite={toggleFavourite}
                isFavourite={favouriteIds.includes(element.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type ElementCardProps = {
  element: ElementAsset;
  onInsert: (element: ElementAsset) => void;
  onToggleFavourite: (elementId: string, event: React.MouseEvent) => void;
  isFavourite: boolean;
};

function ElementCard({
  element,
  onInsert,
  onToggleFavourite,
  isFavourite,
}: ElementCardProps) {
  return (
    <button
      type="button"
      onClick={() => onInsert(element)}
      className="group relative min-w-0 rounded-xl border border-white/10 bg-slate-800/60 p-2 text-left transition hover:border-blue-400/50 hover:bg-slate-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      aria-label={`Add ${element.name}`}
      title={`Add ${element.name}`}
    >
      <span
        aria-hidden="true"
        className="mb-1.5 block aspect-square w-full rounded-lg bg-slate-950/80 bg-contain bg-center bg-no-repeat p-2 transition group-hover:scale-[1.03]"
        style={{
          backgroundImage: `url("${getElementSvgDataUrl(element)}")`,
        }}
      />
      <span className="block truncate text-[10px] font-semibold text-slate-200">
        {element.name}
      </span>
      <button
        type="button"
        onClick={(e) => onToggleFavourite(element.id, e)}
        className={`absolute right-1.5 top-1.5 rounded-md p-1 transition ${
          isFavourite
            ? "text-amber-400 opacity-100"
            : "text-slate-400 opacity-0 group-hover:opacity-100 hover:text-amber-300"
        }`}
        aria-label={isFavourite ? `Remove ${element.name} from favourites` : `Add ${element.name} to favourites`}
      >
        <Star size={12} fill={isFavourite ? "currentColor" : "none"} />
      </button>
    </button>
  );
}

type LibrarySectionHeaderProps = {
  icon: typeof Clock3;
  title: string;
  count: number;
  elements: ElementAsset[];
  onInsertElement: (element: ElementAsset) => void;
};

function LibrarySectionHeader({
  icon: Icon,
  title,
  count,
  elements,
  onInsertElement,
}: LibrarySectionHeaderProps) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-slate-900/50 p-2">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={13} aria-hidden="true" className="shrink-0 text-slate-400" />
          <span className="truncate text-[11px] font-semibold text-slate-300">
            {title}
          </span>
        </div>
        <span className="text-[10px] font-medium text-slate-500 tabular-nums">
          {count}
        </span>
      </div>

      {count > 0 && (
        <div className="mt-2 flex max-w-full gap-1 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {elements.slice(0, 5).map((element) => (
            <button
              key={element.id}
              type="button"
              onClick={() => onInsertElement(element)}
              className="h-8 w-8 shrink-0 rounded-md border border-white/10 bg-slate-950/80 bg-contain bg-center bg-no-repeat p-1 hover:border-blue-400/50"
              style={{
                backgroundImage: `url("${getElementSvgDataUrl(element)}")`,
              }}
              title={`Add ${element.name}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
