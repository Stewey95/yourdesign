"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Folder,
  LayoutTemplate,
  Search,
  Shapes,
  Type,
  X,
} from "lucide-react";
import {
  filterFonts,
  type FontOption,
} from "./fonts/font.catalog";
import { ensureGoogleFontLoaded } from "./fonts/googleFontLoader";
import {
  getElementSvgDataUrl,
  searchElementCatalog,
} from "./elements/elements.catalog";
import type { ElementAsset } from "./elements/element.types";
import { filterTemplates } from "../../lib/templates/templates.catalog";
import type { Template } from "../../lib/templates/templates.types";
import {
  filterProjects,
  getAllProjects,
} from "../../lib/projects/projectsManager";
import type { ProjectRecord } from "../../lib/projects/projects.types";
import TemplateThumbnail from "./TemplateThumbnail";
import ProjectThumbnail from "./ProjectThumbnail";

type UniversalSearchCategory =
  | "all"
  | "fonts"
  | "elements"
  | "templates"
  | "projects";

type ResultRow =
  | { kind: "font"; key: string; font: FontOption }
  | { kind: "element"; key: string; element: ElementAsset }
  | { kind: "template"; key: string; template: Template }
  | { kind: "project"; key: string; project: ProjectRecord };

type UniversalSearchProps = {
  open: boolean;
  onClose: () => void;
  hasSelectedTextItem: boolean;
  onSelectFont: (fontFamily: string) => void;
  onInsertElement: (element: ElementAsset) => void;
  onSelectTemplate: (template: Template) => void;
  onSelectProject: (project: ProjectRecord) => void;
};

const PREVIEW_LIMIT = 4;

const CATEGORY_TABS: {
  id: UniversalSearchCategory;
  label: string;
  icon: typeof Search;
}[] = [
  { id: "all", label: "All", icon: Search },
  { id: "fonts", label: "Fonts", icon: Type },
  { id: "elements", label: "Elements", icon: Shapes },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "projects", label: "Projects", icon: Folder },
];

const toFontRow = (font: FontOption) => ({
  kind: "font" as const,
  key: `font-${font.id}`,
  font,
});
const toElementRow = (element: ElementAsset) => ({
  kind: "element" as const,
  key: `element-${element.id}`,
  element,
});
const toTemplateRow = (template: Template) => ({
  kind: "template" as const,
  key: `template-${template.id}`,
  template,
});
const toProjectRow = (project: ProjectRecord) => ({
  kind: "project" as const,
  key: `project-${project.id}`,
  project,
});

export default function UniversalSearch({
  open,
  onClose,
  hasSelectedTextItem,
  onSelectFont,
  onInsertElement,
  onSelectTemplate,
  onSelectProject,
}: UniversalSearchProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<UniversalSearchCategory>("all");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [fontHint, setFontHint] = useState(false);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [wasOpen, setWasOpen] = useState(open);

  // Reset to a clean slate every time the panel opens (adjusting state
  // during render, per React's guidance, rather than in an effect).
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setQuery("");
      setCategory("all");
      setHighlightedIndex(0);
      setFontHint(false);
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }

    if (!open) return;

    void getAllProjects().then(setProjects);

    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      // On desktop focus the search input, but on mobile explicitly blur
      // the active element to avoid the virtual keyboard popping up when
      // the dialog opens. Users can tap the search field to begin typing.
      if (window.matchMedia("(min-width: 768px)").matches) {
        searchRef.current?.focus();
      } else {
        // Blur any currently-focused element (e.g. an input that was
        // focused before opening) to prevent mobile keyboards from
        // appearing automatically.
        (document.activeElement as HTMLElement | null)?.blur();
      }
    });

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  const fontResults = useMemo(() => filterFonts(query, "all"), [query]);
  const elementResults = useMemo(
    () => searchElementCatalog({ query }).items,
    [query]
  );
  const templateResults = useMemo(
    () => filterTemplates(query, "all"),
    [query]
  );
  const projectResults = useMemo(
    () => filterProjects(projects, query),
    [projects, query]
  );

  const flatResults: ResultRow[] = useMemo(() => {
    if (category === "fonts") return fontResults.map(toFontRow);
    if (category === "elements") return elementResults.map(toElementRow);
    if (category === "templates") return templateResults.map(toTemplateRow);
    if (category === "projects") return projectResults.map(toProjectRow);

    return [
      ...fontResults.slice(0, PREVIEW_LIMIT).map(toFontRow),
      ...elementResults.slice(0, PREVIEW_LIMIT).map(toElementRow),
      ...templateResults.slice(0, PREVIEW_LIMIT).map(toTemplateRow),
      ...projectResults.slice(0, PREVIEW_LIMIT).map(toProjectRow),
    ];
  }, [category, fontResults, elementResults, templateResults, projectResults]);

  const highlightedRow = flatResults[highlightedIndex];

  // Only fetch a font's stylesheet once its result row actually scrolls
  // into view - identical lazy-loading behaviour to the Font Library panel.
  useEffect(() => {
    if (!open) return;

    const list = listRef.current;

    if (!list) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const fontId = (entry.target as HTMLElement).dataset.fontId;
          const font = fontResults.find((candidate) => candidate.id === fontId);

          ensureGoogleFontLoaded(font);
        });
      },
      { root: list, rootMargin: "200px 0px", threshold: 0.01 }
    );

    optionRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [open, flatResults, fontResults]);

  const closeDialog = () => {
    onClose();
  };

  const selectRow = (row: ResultRow) => {
    if (row.kind === "font") {
      if (!hasSelectedTextItem) {
        setFontHint(true);
        return;
      }

      ensureGoogleFontLoaded(row.font);
      onSelectFont(row.font.family);
      closeDialog();
      return;
    }

    if (row.kind === "element") {
      onInsertElement(row.element);
      closeDialog();
      return;
    }

    if (row.kind === "template") {
      onSelectTemplate(row.template);
      closeDialog();
      return;
    }

    onSelectProject(row.project);
    closeDialog();
  };

  const moveHighlight = (direction: 1 | -1) => {
    if (flatResults.length === 0) return;

    setHighlightedIndex((currentIndex) => {
      const nextIndex =
        (currentIndex + direction + flatResults.length) % flatResults.length;

      requestAnimationFrame(() => {
        optionRefs.current[nextIndex]?.scrollIntoView({ block: "nearest" });
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

    if (event.key === "Enter" && highlightedRow) {
      event.preventDefault();
      selectRow(highlightedRow);
      return;
    }

    if (event.key === "Escape") {
      // A native <input type="search"> clears its own value on the first
      // Escape press instead of letting the dialog's native cancel event
      // fire, so close explicitly here (matches the Font Library panel).
      event.preventDefault();
      event.stopPropagation();
      closeDialog();
    }
  };

  const changeCategory = (nextCategory: UniversalSearchCategory) => {
    setCategory(nextCategory);
    setHighlightedIndex(0);
  };

  const updateQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    setHighlightedIndex(0);
  };

  const registerOptionRef = (index: number) => (element: HTMLButtonElement | null) => {
    optionRefs.current[index] = element;
  };

  const rowIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    flatResults.forEach((row, index) => map.set(row.key, index));
    return map;
  }, [flatResults]);

  const renderFontRow = (row: ResultRow & { kind: "font" }) => {
    const index = rowIndexByKey.get(row.key) ?? -1;
    const highlighted = index === highlightedIndex;

    return (
      <button
        key={row.key}
        id={`${listboxId}-${row.key}`}
        data-font-id={row.font.id}
        ref={registerOptionRef(index)}
        type="button"
        role="option"
        aria-selected={highlighted}
        onPointerMove={() => setHighlightedIndex(index)}
        onClick={() => selectRow(row)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          highlighted
            ? "bg-blue-500/20 text-white"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Type size={15} aria-hidden="true" className="shrink-0 text-slate-500" />
        <span
          className="min-w-0 flex-1 truncate text-base"
          style={{ fontFamily: `${row.font.family}, ${row.font.fallback}` }}
        >
          {row.font.label}
        </span>
      </button>
    );
  };

  const renderElementRow = (row: ResultRow & { kind: "element" }) => {
    const index = rowIndexByKey.get(row.key) ?? -1;
    const highlighted = index === highlightedIndex;

    return (
      <button
        key={row.key}
        id={`${listboxId}-${row.key}`}
        ref={registerOptionRef(index)}
        type="button"
        role="option"
        aria-selected={highlighted}
        onPointerMove={() => setHighlightedIndex(index)}
        onClick={() => selectRow(row)}
        className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          highlighted
            ? "border-blue-400/50 bg-blue-500/20"
            : "border-white/10 bg-slate-800/60 hover:border-blue-400/40 hover:bg-slate-700/80"
        }`}
      >
        <span
          aria-hidden="true"
          className="block aspect-square w-full rounded-lg bg-slate-950/80 bg-contain bg-center bg-no-repeat p-2"
          style={{
            backgroundImage: `url("${getElementSvgDataUrl(row.element)}")`,
          }}
        />
        <span className="line-clamp-2 min-h-[2.4em] w-full truncate text-[11px] font-semibold leading-tight text-slate-200">
          {row.element.name}
        </span>
      </button>
    );
  };

  const renderTemplateRow = (row: ResultRow & { kind: "template" }) => {
    const index = rowIndexByKey.get(row.key) ?? -1;
    const highlighted = index === highlightedIndex;

    return (
      <button
        key={row.key}
        id={`${listboxId}-${row.key}`}
        ref={registerOptionRef(index)}
        type="button"
        role="option"
        aria-selected={highlighted}
        onPointerMove={() => setHighlightedIndex(index)}
        onClick={() => selectRow(row)}
        className={`flex min-w-0 flex-col overflow-hidden rounded-xl border p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          highlighted
            ? "border-cyan-400/50 bg-cyan-500/10"
            : "border-white/10 bg-slate-800/60 hover:border-cyan-400/40"
        }`}
      >
        <TemplateThumbnail template={row.template} />
        <span className="mt-2 truncate text-xs font-bold text-slate-100">
          {row.template.name}
        </span>
        <span className="truncate text-[10px] text-slate-500">
          {row.template.width} × {row.template.height}
        </span>
      </button>
    );
  };

  const renderProjectRow = (row: ResultRow & { kind: "project" }) => {
    const index = rowIndexByKey.get(row.key) ?? -1;
    const highlighted = index === highlightedIndex;

    return (
      <button
        key={row.key}
        id={`${listboxId}-${row.key}`}
        ref={registerOptionRef(index)}
        type="button"
        role="option"
        aria-selected={highlighted}
        onPointerMove={() => setHighlightedIndex(index)}
        onClick={() => selectRow(row)}
        className={`flex min-w-0 flex-col overflow-hidden rounded-xl border p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          highlighted
            ? "border-cyan-400/50 bg-cyan-500/10"
            : "border-white/10 bg-slate-800/60 hover:border-cyan-400/40"
        }`}
      >
        <ProjectThumbnail project={row.project} />
        <span className="mt-2 truncate text-xs font-bold text-slate-100">
          {row.project.title}
        </span>
        <span className="truncate text-[10px] text-slate-500">
          {row.project.items.length} items
        </span>
      </button>
    );
  };

  const renderSection = (
    title: string,
    icon: typeof Search,
    total: number,
    rows: ResultRow[],
    tab: UniversalSearchCategory,
    renderRow: (row: ResultRow) => React.ReactNode,
    layout: "list" | "grid"
  ) => {
    if (total === 0) return null;

    const Icon = icon;

    return (
      <section key={tab} aria-label={title} className="mb-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Icon size={13} aria-hidden="true" className="text-slate-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {title}
            </h3>
          </div>
          {total > PREVIEW_LIMIT && (
            <button
              type="button"
              onClick={() => changeCategory(tab)}
              className="text-[10px] font-medium text-blue-400 hover:text-blue-300"
            >
              See all ({total})
            </button>
          )}
        </div>
        <div
          className={
            layout === "list" ? "space-y-0.5" : "grid grid-cols-4 gap-2"
          }
        >
          {rows.map(renderRow)}
        </div>
      </section>
    );
  };

  const hasAnyResults = flatResults.length > 0;

  return (
    <dialog
      ref={dialogRef}
      data-editor-retain-selection
      aria-labelledby="universal-search-title"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
      className="fixed bottom-0 left-0 right-0 top-auto m-0 h-[min(85dvh,640px)] max-h-[calc(100dvh-0.75rem)] w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-left text-slate-100 backdrop:bg-slate-950/75 backdrop:backdrop-blur-sm md:inset-0 md:m-auto md:h-auto md:max-h-[calc(100dvh-2rem)] md:w-[min(640px,calc(100vw-2rem))] md:rounded-3xl"
    >
      <div
        className="editor-dialog-surface relative flex h-full max-h-[inherit] flex-col overflow-hidden rounded-t-[var(--studio-radius-dialog)] md:h-auto md:max-h-[80dvh] md:rounded-[var(--studio-radius-dialog)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <h2 id="universal-search-title" className="sr-only">
            Search Gripix
          </h2>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/30">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-label="Search fonts, elements, templates, and projects"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-activedescendant={
                highlightedRow ? `${listboxId}-${highlightedRow.key}` : undefined
              }
              autoComplete="off"
              placeholder="Search fonts, elements, templates, projects…"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <button
            type="button"
            onClick={closeDialog}
            aria-label="Close search"
            title="Close"
            className="editor-toolbar-control flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-800"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <div
          role="tablist"
          aria-label="Search categories"
          className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-white/10 px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => changeCategory(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  active
                    ? "bg-blue-500/25 text-white ring-1 ring-blue-400/40"
                    : "bg-slate-800 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={13} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          onKeyDown={handleKeyDown}
          className="editor-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
        >
          {fontHint && (
            <p
              role="status"
              className="mb-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100"
            >
              Select a text layer on the canvas, then choose a font here to apply it.
            </p>
          )}

          {!hasAnyResults ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 px-3 py-10 text-center">
              <p className="text-sm font-semibold text-slate-300">
                No results{query ? ` for "${query}"` : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try a different search term or category.
              </p>
            </div>
          ) : category === "all" ? (
            <>
              {renderSection(
                "Fonts",
                Type,
                fontResults.length,
                fontResults.slice(0, PREVIEW_LIMIT).map(toFontRow),
                "fonts",
                (row) => renderFontRow(row as ResultRow & { kind: "font" }),
                "list"
              )}
              {renderSection(
                "Elements",
                Shapes,
                elementResults.length,
                elementResults.slice(0, PREVIEW_LIMIT).map(toElementRow),
                "elements",
                (row) => renderElementRow(row as ResultRow & { kind: "element" }),
                "grid"
              )}
              {renderSection(
                "Templates",
                LayoutTemplate,
                templateResults.length,
                templateResults.slice(0, PREVIEW_LIMIT).map(toTemplateRow),
                "templates",
                (row) => renderTemplateRow(row as ResultRow & { kind: "template" }),
                "grid"
              )}
              {renderSection(
                "Projects",
                Folder,
                projectResults.length,
                projectResults.slice(0, PREVIEW_LIMIT).map(toProjectRow),
                "projects",
                (row) => renderProjectRow(row as ResultRow & { kind: "project" }),
                "grid"
              )}
            </>
          ) : category === "fonts" ? (
            <div className="space-y-0.5">{fontResults.map(toFontRow).map(renderFontRow)}</div>
          ) : category === "elements" ? (
            <div className="grid grid-cols-4 gap-2">
              {elementResults.map(toElementRow).map(renderElementRow)}
            </div>
          ) : category === "templates" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {templateResults.map(toTemplateRow).map(renderTemplateRow)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {projectResults.map(toProjectRow).map(renderProjectRow)}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
