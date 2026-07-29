"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import type { Template, TemplateCategory } from "../../lib/templates/templates.types";
import { filterTemplates, TEMPLATES_CATALOG } from "../../lib/templates/templates.catalog";
import TemplateThumbnail from "./TemplateThumbnail";
import { getCanvasPreset } from "./editor.constants";

type TemplatesPanelProps = {
  onSelectTemplate: (template: Template) => void;
};

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "social", label: "Social" },
  { id: "product", label: "Product" },
  { id: "marketing", label: "Marketing" },
  { id: "personal", label: "Personal" },
];

export default function TemplatesPanel({ onSelectTemplate }: TemplatesPanelProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("all");

  const categoryCounts = useMemo(() => {
    const counts: Record<TemplateCategory, number> = {
      all: TEMPLATES_CATALOG.length,
      social: 0,
      product: 0,
      marketing: 0,
      personal: 0,
    };

    TEMPLATES_CATALOG.forEach((t) => {
      counts[t.category] += 1;
    });

    return counts;
  }, []);

  const templates = useMemo(
    () => filterTemplates(query, selectedCategory),
    [query, selectedCategory]
  );

  return (
    <div className="mt-3 min-w-0 max-w-full scroll-mt-[calc(12rem+env(safe-area-inset-top))] rounded-xl border border-white/10 bg-slate-800/60 p-3 md:mt-0 md:scroll-mt-0">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" />
          <p className="min-w-0 truncate text-xs font-bold uppercase tracking-widest text-cyan-400">
            Starter Templates
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-300">
          {templates.length}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full rounded-lg border border-white/10 bg-slate-900/90 py-2 pl-9 pr-8 text-xs font-medium text-slate-200 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="mb-3 flex max-w-full items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] md:flex-wrap md:overflow-x-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = categoryCounts[cat.id];

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                isActive
                  ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "border-white/10 bg-slate-900/60 text-slate-400 hover:border-white/20 hover:text-slate-200"
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] opacity-75 ${isActive ? "text-cyan-300" : "text-slate-500"}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-xs text-slate-400">
          <p className="font-semibold text-slate-300">No templates found</p>
          <p className="mt-1 text-slate-500">Try searching for quote, badge, ebook, or sale.</p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-slate-700 px-3 py-1 text-xs font-medium text-white hover:bg-slate-600"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {templates.map((template) => {
            const preset = getCanvasPreset(template.presetId);

            return (
              <div
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="group relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 p-2.5 transition hover:border-cyan-500/50 hover:bg-slate-900 hover:shadow-lg active:scale-[0.99]"
              >
                <div className="relative mb-2">
                  <TemplateThumbnail template={template} />

                  {template.badge && (
                    <span className="absolute left-2 top-2 rounded-full bg-cyan-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950 shadow-md">
                      {template.badge}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h4 className="break-words text-xs font-bold text-slate-100 transition group-hover:text-cyan-300 md:text-sm">
                      {template.name}
                    </h4>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-slate-400 md:leading-snug">
                      {template.description}
                    </p>
                  </div>

                  <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2">
                    <span className="min-w-0 flex-1 break-words text-[10px] font-medium text-slate-500">
                      {template.width} × {template.height} • {preset?.label || template.presetId}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectTemplate(template)}
                      className="shrink-0 whitespace-nowrap rounded-lg bg-cyan-600 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-500 active:scale-95"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
