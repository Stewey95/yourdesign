"use client";

import { ChevronLeft, Clock3, Heart, Search, Shapes, Star, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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

// A dedicated view mode for browsing the full Recent/Favourites collections
// (as normal, favouritable, insertable cards) - distinct from category
// filtering so the two can't collide, and cleared whenever the user starts
// a search or picks a real category so there's never an ambiguous state.
type CollectionView = "recent" | "favourites" | null;

export default function ElementsPanel({
  onInsertElement,
}: ElementsPanelProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [collectionView, setCollectionView] = useState<CollectionView>(null);

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
      // Record recent element insertion. The localStorage write happens as
      // a plain statement here rather than inside the setRecentIds updater,
      // because onInsertElement below auto-selects the new item, which on
      // mobile unmounts this whole panel in the same React batch - if the
      // write only happened inside the updater, React would never run it
      // for a fiber that's being torn down in the same commit, silently
      // dropping the recent-insertion record.
      const nextRecentIds = [
        element.id,
        ...recentIds.filter((id) => id !== element.id),
      ].slice(0, 12);
      try {
        localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(nextRecentIds));
      } catch {}
      setRecentIds(nextRecentIds);

      onInsertElement(element);
    },
    [onInsertElement, recentIds]
  );

  const searchResult = useMemo(
    () =>
      searchElementCatalog({
        query,
        category,
      }),
    [category, query]
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

  const updateQuery = (value: string) => {
    setQuery(value);
    if (value) setCollectionView(null);
  };

  const selectCategory = (nextCategory: string | undefined) => {
    setCategory(nextCategory);
    if (nextCategory) setCollectionView(null);
  };

  const openCollection = (view: Exclude<CollectionView, null>) => {
    setCollectionView(view);
    setQuery("");
    setCategory(undefined);
  };

  const isSearching = query.trim().length > 0;

  // A collection is its own browsing destination, rather than a later
  // subsection in the normal catalogue. This makes See all visibly respond
  // at the exact place the user clicked and prevents a hidden below-fold jump.
  if (collectionView) {
    const title = collectionView === "recent" ? "Recent" : "Favourites";
    const collectionElements =
      collectionView === "recent" ? recentElements : favouriteElements;

    return (
      <section
        aria-labelledby="element-results-heading"
        className="min-w-0 max-w-full space-y-4"
      >
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setCollectionView(null)}
              aria-label="Back to all elements"
              className="shrink-0 rounded-md p-1 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h3
                id="element-results-heading"
                className="truncate text-sm font-bold text-white"
              >
                {title}
              </h3>
              <p className="text-[11px] text-slate-400">
                {collectionElements.length} {collectionElements.length === 1 ? "element" : "elements"}
              </p>
            </div>
          </div>
        </div>

        {collectionElements.length === 0 ? (
          <CollectionEmptyState collectionView={collectionView} />
        ) : (
          <div className="grid grid-cols-3 gap-2 md:grid-cols-2">
            {collectionElements.map((element) => (
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
    );
  }

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
          onChange={(event) => updateQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search elements..."
          className="h-10 w-full rounded-lg border border-white/10 bg-slate-900/70 pl-9 pr-8 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/30 md:pl-8 md:text-[11px]"
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

      {isSearching ? (
        <section aria-labelledby="element-results-heading" data-element-search-results>
          <ElementResults
            heading="Search Results"
            total={searchResult.total}
            elements={searchResult.items}
            onInsert={handleElementClick}
            onToggleFavourite={toggleFavourite}
            favouriteIds={favouriteIds}
          />
        </section>
      ) : (
        <>
          {/* Normal browse mode stays rich; search mode intentionally hides
              these sections so results are the first thing below the input. */}
          <div className="space-y-2">
            <LibrarySectionHeader icon={Clock3} title="Recent" count={recentElements.length} elements={recentElements} onInsertElement={handleElementClick} onSeeAll={() => openCollection("recent")} />
            <LibrarySectionHeader icon={Heart} title="Favourites" count={favouriteElements.length} elements={favouriteElements} onInsertElement={handleElementClick} onSeeAll={() => openCollection("favourites")} />
          </div>

          <section aria-labelledby="element-categories-heading">
            <div className="mb-2 flex items-center justify-between">
              <h3 id="element-categories-heading" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Categories</h3>
              {category && <button type="button" onClick={() => selectCategory(undefined)} className="text-[10px] text-blue-400 hover:underline">Clear filter</button>}
            </div>
            <div className="flex max-w-full gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] md:flex-wrap md:overflow-x-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
              <button type="button" aria-pressed={category === undefined} onClick={() => selectCategory(undefined)} className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${category === undefined ? "border-blue-400/50 bg-blue-500/20 text-cyan-200" : "border-white/10 bg-slate-700/70 text-slate-300 hover:border-white/20 hover:bg-slate-700"}`}>All ({ELEMENT_CATALOG.length})</button>
              {categoryCounts.map(({ category: catName, count }) => {
                const selected = category === catName;
                return <button key={catName} type="button" aria-pressed={selected} onClick={() => selectCategory(selected ? undefined : catName)} className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${selected ? "border-blue-400/50 bg-blue-500/20 text-cyan-200" : "border-white/10 bg-slate-700/70 text-slate-300 hover:border-white/20 hover:bg-slate-700"}`}>{catName} ({count})</button>;
              })}
            </div>
          </section>

          <section aria-labelledby="element-results-heading">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 id="element-results-heading" className="min-w-0 truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {category ?? "All Elements"}
              </h3>
              <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
                {searchResult.total} {searchResult.total === 1 ? "element" : "elements"}
              </span>
            </div>

            {searchResult.items.length === 0 ? (
              <EmptyResults />
            ) : !category ? (
          /* Grouped Categorized View when no search or filter active */
          <div className="space-y-4 md:max-h-none md:overflow-visible md:pr-0">
            {ELEMENT_CATEGORIES.map((catName) => {
              const catItems = ELEMENT_CATALOG.filter(
                (item) => item.category === catName
              );
              return (
                <div key={catName} className="space-y-2">
                  <div className="flex min-w-0 items-center justify-between gap-2 border-b border-white/5 pb-1">
                    <span className="min-w-0 text-[11px] font-semibold text-slate-300">
                      {catName}
                    </span>
                    <button
                      type="button"
                      onClick={() => selectCategory(catName)}
                      className="shrink-0 whitespace-nowrap text-[10px] font-medium text-blue-400 hover:text-blue-300"
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
          <div className="grid grid-cols-3 gap-2 md:max-h-none md:grid-cols-2 md:overflow-visible md:pr-0">
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
        </>
      )}
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 px-3 py-6 text-center">
      <Shapes size={20} aria-hidden="true" className="mx-auto mb-2 text-slate-500" />
      <p className="text-xs font-semibold text-slate-300">No elements found</p>
      <p className="mt-1 text-[11px] text-slate-500">
        Try another search term or clear active filters.
      </p>
    </div>
  );
}

function CollectionEmptyState({ collectionView }: { collectionView: Exclude<CollectionView, null> }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 px-3 py-6 text-center">
      <Shapes size={20} aria-hidden="true" className="mx-auto mb-2 text-slate-500" />
      <p className="text-xs font-semibold text-slate-300">
        {collectionView === "recent" ? "No recent elements yet" : "No favourites yet"}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        {collectionView === "recent" ? "Elements you insert will show up here." : "Tap the star on any element to save it here."}
      </p>
    </div>
  );
}

function ElementResults({
  heading,
  total,
  elements,
  onInsert,
  onToggleFavourite,
  favouriteIds,
}: {
  heading: string;
  total: number;
  elements: readonly ElementAsset[];
  onInsert: (element: ElementAsset) => void;
  onToggleFavourite: (elementId: string, event: React.MouseEvent) => void;
  favouriteIds: string[];
}) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 id="element-results-heading" className="min-w-0 truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {heading}
        </h3>
        <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
          {total} {total === 1 ? "element" : "elements"}
        </span>
      </div>
      {elements.length === 0 ? <EmptyResults /> : (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-2">
          {elements.map((element) => (
            <ElementCard key={element.id} element={element} onInsert={onInsert} onToggleFavourite={onToggleFavourite} isFavourite={favouriteIds.includes(element.id)} />
          ))}
        </div>
      )}
    </>
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
  const insertElement = () => onInsert(element);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={insertElement}
      onKeyDown={(event) => {
        // Ignore Enter/Space bubbling up from the nested favourite button -
        // without this, keyboard-activating the star also inserted the
        // element, since preventDefault() here suppressed the star's own
        // default click-on-Enter behaviour before it could fire.
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          insertElement();
        }
      }}
      className="group min-w-0 rounded-xl border border-white/10 bg-slate-800/60 p-2 text-left transition hover:border-blue-400/50 hover:bg-slate-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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
      {/* Favourite control lives permanently beside the name, rather than
          overlapping the thumbnail on hover-only, so it's visible on touch
          devices (no hover state) and has a real tap target of its own. */}
      <div className="flex min-w-0 items-center gap-1">
        <span className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-tight text-slate-200 md:text-[11px]">
          {element.name}
        </span>
        <button
          type="button"
          onClick={(e) => onToggleFavourite(element.id, e)}
          className={`-m-1 shrink-0 rounded-md p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            isFavourite
              ? "text-amber-400 hover:text-amber-300"
              : "text-slate-400 hover:text-amber-300"
          }`}
          aria-label={isFavourite ? `Remove ${element.name} from favourites` : `Add ${element.name} to favourites`}
          aria-pressed={isFavourite}
        >
          <Star size={13} fill={isFavourite ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}

type LibrarySectionHeaderProps = {
  icon: typeof Clock3;
  title: string;
  count: number;
  elements: ElementAsset[];
  onInsertElement: (element: ElementAsset) => void;
  onSeeAll: () => void;
};

function LibrarySectionHeader({
  icon: Icon,
  title,
  count,
  elements,
  onInsertElement,
  onSeeAll,
}: LibrarySectionHeaderProps) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-slate-900/50 p-2">
      {/* Full-width row (not a cramped 2-column half) so the title and
          count always have enough room - this is what was clipping. */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon size={13} aria-hidden="true" className="shrink-0 text-slate-400" />
          <span className="truncate text-[11px] font-semibold text-slate-300">
            {title}
          </span>
          <span className="shrink-0 text-[10px] font-medium text-slate-500 tabular-nums">
            ({count})
          </span>
        </div>
        {count > 0 && (
          <button
            type="button"
            onClick={onSeeAll}
            aria-label={`See all ${title}`}
            className="shrink-0 whitespace-nowrap text-[10px] font-medium text-blue-400 hover:text-blue-300"
          >
            See all
          </button>
        )}
      </div>

      {count > 0 ? (
        <div className="mt-2 flex max-w-full gap-1 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {elements.slice(0, 8).map((element) => (
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
      ) : (
        <p className="mt-1 text-[10px] text-slate-500">
          {title === "Recent"
            ? "Elements you insert will show up here."
            : "Tap the star on any element to save it here."}
        </p>
      )}
    </div>
  );
}
