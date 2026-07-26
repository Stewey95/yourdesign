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
  filterFonts,
  getFontOption,
} from "./fonts/font.catalog";

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
  maxHeight: number;
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
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [panelPosition, setPanelPosition] =
    useState<PanelPosition | null>(null);
  const fonts = useMemo(() => filterFonts(query), [query]);
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
      180,
      Math.min(320, openBelow ? availableBelow : availableAbove)
    );
    const left = Math.min(
      window.innerWidth - width - viewportPadding,
      Math.max(viewportPadding, bounds.left)
    );
    const top = openBelow
      ? bounds.bottom + 6
      : Math.max(viewportPadding, bounds.top - maxHeight - 6);

    setPanelPosition({ left, top, width, maxHeight });
  }, [variant]);

  const closePicker = (restoreButtonFocus = false) => {
    setOpen(false);
    setQuery("");
    setPanelPosition(null);

    if (restoreButtonFocus) {
      requestAnimationFrame(() => buttonRef.current?.focus());
    }
  };

  const openPicker = () => {
    const completeFonts = filterFonts("");
    const selectedIndex = completeFonts.findIndex(
      (font) => font.family === value
    );

    setQuery("");
    setHighlightedIndex(Math.max(0, selectedIndex));
    setOpen(true);
    updatePanelPosition();

    if (window.matchMedia("(min-width: 768px)").matches) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  };

  const selectFont = (fontFamily: string) => {
    onChange(fontFamily);
    closePicker(true);
  };

  const updateQuery = (nextQuery: string) => {
    const nextFonts = filterFonts(nextQuery);
    const activeIndex = nextFonts.findIndex(
      (font) => font.family === value
    );

    setQuery(nextQuery);
    setHighlightedIndex(activeIndex >= 0 ? activeIndex : 0);
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
          id={listboxId}
          role="listbox"
          aria-label="Fonts"
          className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(100,116,139,0.75)_transparent] [scrollbar-width:thin]"
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
                  <span className="min-w-0 flex-1 truncate">
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
