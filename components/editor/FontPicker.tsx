"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  FONT_CATEGORIES,
  filterFonts,
  getFontOption,
  type FontCategoryId,
} from "./fonts/font.catalog";
import { ensureGoogleFontLoaded } from "./fonts/googleFontLoader";

type CategoryFilter = FontCategoryId | "all";

type FontPickerProps = {
  itemId: string;
  value: string;
  onChange: (fontFamily: string) => void;
  variant?: "toolbar" | "inspector" | "mobile";
};

type PanelPosition = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export default function FontPicker({
  itemId,
  value,
  onChange,
  variant = "toolbar",
}: FontPickerProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [panelPosition, setPanelPosition] =
    useState<PanelPosition | null>(null);
  const [showTopOverflow, setShowTopOverflow] = useState(false);
  const [showBottomOverflow, setShowBottomOverflow] = useState(false);
  const fonts = useMemo(
    () => filterFonts(query, category),
    [query, category]
  );
  const activeFont = getFontOption(value);
  const highlightedFont = fonts[highlightedIndex];

  const updatePanelPosition = useCallback(() => {
    const anchor = buttonRef.current;

    if (!anchor) return;

    const bounds = anchor.getBoundingClientRect();
    const viewportPadding = 8;
    const desiredWidth = variant === "inspector" ? 260 : 280;
    const width = Math.min(
      desiredWidth,
      window.innerWidth - viewportPadding * 2
    );
    const availableBelow =
      window.innerHeight - bounds.bottom - viewportPadding;
    const availableAbove = bounds.top - viewportPadding;
    const openBelow = availableBelow >= 220 || availableBelow >= availableAbove;
    const maxHeight = Math.max(
      220,
      Math.min(340, openBelow ? availableBelow : availableAbove)
    );
    const left = Math.min(
      window.innerWidth - width - viewportPadding,
      Math.max(viewportPadding, bounds.left)
    );
    const top = openBelow
      ? bounds.bottom + 6
      : Math.max(viewportPadding, bounds.top - maxHeight - 6);

    setPanelPosition({ left, top, width, height: maxHeight });
  }, [variant]);

  const closePicker = (restoreButtonFocus = false) => {
    setOpen(false);
    setQuery("");
    setCategory("all");
    setPanelPosition(null);
    setShowTopOverflow(false);
    setShowBottomOverflow(false);

    if (restoreButtonFocus) {
      requestAnimationFrame(() => buttonRef.current?.focus());
    }
  };

  const openPicker = () => {
    const completeFonts = filterFonts("", "all");
    const selectedIndex = completeFonts.findIndex(
      (font) => font.family === value
    );

    setQuery("");
    setCategory("all");
    setHighlightedIndex(Math.max(0, selectedIndex));
    setOpen(true);
    updatePanelPosition();

    requestAnimationFrame(() => {
      updateOverflowIndicators();

      if (window.matchMedia("(min-width: 768px)").matches) {
        searchRef.current?.focus();
      }
    });
  };

  const selectFont = (fontFamily: string) => {
    ensureGoogleFontLoaded(getFontOption(fontFamily));
    onChange(fontFamily);
    closePicker(true);
  };

  const resetListScroll = () => {
    const list = listboxRef.current;

    if (list) list.scrollTop = 0;
  };

  const updateQuery = (nextQuery: string) => {
    const nextFonts = filterFonts(nextQuery, category);
    const activeIndex = nextFonts.findIndex(
      (font) => font.family === value
    );

    setQuery(nextQuery);
    setHighlightedIndex(activeIndex >= 0 ? activeIndex : 0);
    resetListScroll();
    requestAnimationFrame(() => updateOverflowIndicators());
  };

  const updateCategory = (nextCategory: CategoryFilter) => {
    const nextFonts = filterFonts(query, nextCategory);
    const activeIndex = nextFonts.findIndex(
      (font) => font.family === value
    );

    setCategory(nextCategory);
    setHighlightedIndex(activeIndex >= 0 ? activeIndex : 0);
    resetListScroll();
    requestAnimationFrame(() => updateOverflowIndicators());
  };

  const updateOverflowIndicators = () => {
    const list = listboxRef.current;

    if (!list) return;

    setShowTopOverflow(list.scrollTop > 1);
    setShowBottomOverflow(
      list.scrollTop + list.clientHeight < list.scrollHeight - 1
    );
  };

  const moveHighlight = (direction: 1 | -1) => {
    if (fonts.length === 0) return;

    setHighlightedIndex((currentIndex) => {
      const nextIndex =
        (currentIndex + direction + fonts.length) % fonts.length;

      requestAnimationFrame(() => {
        optionRefs.current[nextIndex]?.scrollIntoView({
          block: "nearest",
        });
      });

      return nextIndex;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (event.key === "Enter" && highlightedFont) {
      event.preventDefault();
      selectFont(highlightedFont.family);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closePicker(true);
    }
  };

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        (panelRef.current?.contains(target) ||
          buttonRef.current?.contains(target))
      ) {
        return;
      }

      closePicker();
    };
    const reposition = () => updatePanelPosition();

    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    return () => {
      document.removeEventListener(
        "pointerdown",
        closeOnOutsidePointer,
        true
      );
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, updatePanelPosition]);

  // Only fetch a font's stylesheet once its preview row actually scrolls
  // into view, so opening the library never downloads the whole catalog.
  useEffect(() => {
    if (!open) return;

    const list = listboxRef.current;

    if (!list) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const fontId = (entry.target as HTMLElement).dataset.fontId;
          const font = fonts.find((candidate) => candidate.id === fontId);

          ensureGoogleFontLoaded(font);
        });
      },
      { root: list, rootMargin: "200px 0px", threshold: 0.01 }
    );

    optionRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [open, fonts]);

  const buttonClasses =
    variant === "inspector"
      ? "h-9 w-full rounded-lg border border-white/10 bg-slate-800 px-2 text-left text-sm font-semibold"
      : variant === "mobile"
        ? "h-9 w-[126px] shrink-0 rounded-full bg-slate-700 px-3 text-sm font-bold"
        : "h-8 w-[150px] shrink-0 rounded-full bg-slate-700 px-3 text-sm font-bold";

  const pickerPanel =
    open &&
    panelPosition &&
    createPortal(
      <div
        ref={panelRef}
        data-editor-retain-selection
        data-text-toolbar={itemId}
        className="fixed z-[100] flex flex-col overflow-hidden rounded-xl border border-white/15 bg-slate-900/98 p-2 text-slate-200 shadow-2xl backdrop-blur-xl"
        style={panelPosition}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/30">
          <Search aria-hidden="true" className="h-4 w-4 text-slate-400" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            role="combobox"
            aria-label="Search fonts"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={
              highlightedFont
                ? `${listboxId}-${highlightedFont.id}`
                : undefined
            }
            autoComplete="off"
            placeholder="Search fonts"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => updateQuery("")}
              aria-label="Clear font search"
              className="rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Font categories"
          className="mt-2 flex shrink-0 items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[{ id: "all" as const, label: "All" }, ...FONT_CATEGORIES].map(
            (categoryOption) => {
              const active = category === categoryOption.id;

              return (
                <button
                  key={categoryOption.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => updateCategory(categoryOption.id)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    active
                      ? "bg-blue-500/25 text-white ring-1 ring-blue-400/40"
                      : "bg-slate-800 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {categoryOption.label}
                </button>
              );
            }
          )}
        </div>

        <div className="relative mt-2 min-h-0 flex-1 overflow-hidden">
          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label="Fonts"
            onScroll={updateOverflowIndicators}
            className="editor-scrollbar absolute inset-0 overflow-y-scroll overscroll-contain pr-1"
          >
            {fonts.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-400">
                No fonts found
              </p>
            ) : (
              fonts.map((font, index) => {
                const selected = font.family === value;
                const highlighted = index === highlightedIndex;

                return (
                  <button
                    key={font.id}
                    id={`${listboxId}-${font.id}`}
                    data-font-id={font.id}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onPointerMove={() => setHighlightedIndex(index)}
                    onClick={() => selectFont(font.family)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      highlighted
                        ? "bg-blue-500/20 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span
                      className="min-w-0 flex-1 truncate text-base"
                      style={{
                        fontFamily: `${font.family}, ${font.fallback}`,
                      }}
                    >
                      {font.label}
                    </span>
                    {selected && (
                      <>
                        <span className="sr-only">Selected</span>
                        <Check
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-cyan-300"
                        />
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {showTopOverflow && (
            <div
              data-font-overflow-indicator="top"
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-slate-900 to-transparent"
            />
          )}
          {showBottomOverflow && (
            <div
              data-font-overflow-indicator="bottom"
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-slate-900 to-transparent"
            />
          )}
        </div>
      </div>,
      document.body
    );

  return (
    <div
      data-text-toolbar={itemId}
      className={variant === "inspector" ? "w-full" : "shrink-0"}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Font family, ${activeFont?.label ?? value}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => (open ? closePicker() : openPicker())}
        className={`flex cursor-pointer items-center gap-2 text-white outline-none transition hover:bg-slate-600 focus-visible:ring-2 focus-visible:ring-blue-400 ${buttonClasses}`}
        title="Font family"
      >
        <span className="min-w-0 flex-1 truncate">
          {activeFont?.label ?? value}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {pickerPanel}
    </div>
  );
}
