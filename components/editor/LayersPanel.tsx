"use client";

import {
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Lock,
  LockOpen,
  Type,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { DesignItem } from "./editor.types";

type LayersPanelProps = {
  items: DesignItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onReorderLayers: (orderedIds: string[]) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
};

const getTextLayerName = (value: string) => {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "Text";

  const name = words.slice(0, 4).join(" ");

  return name.length > 30 ? `${name.slice(0, 29)}…` : name;
};

export default function LayersPanel({
  items,
  selectedItemId,
  onSelectItem,
  onReorderLayers,
  onToggleVisibility,
  onToggleLock,
}: LayersPanelProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const imageNames = useMemo(() => {
    const names = new Map<string, string>();
    let imageNumber = 0;

    items.forEach((item) => {
      if (item.type !== "image") return;

      imageNumber += 1;
      names.set(
        item.id,
        imageNumber === 1 ? "Image" : `Image ${imageNumber}`
      );
    });

    return names;
  }, [items]);
  const visibleItems = [...items].reverse();

  const finishDrop = (targetId: string) => {
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDropTargetId(null);
      return;
    }

    const visibleIds = visibleItems.map((item) => item.id);
    const draggedIndex = visibleIds.indexOf(draggedItemId);
    const targetIndex = visibleIds.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [movedId] = visibleIds.splice(draggedIndex, 1);

    visibleIds.splice(targetIndex, 0, movedId);
    onReorderLayers(visibleIds.reverse());
    setDraggedItemId(null);
    setDropTargetId(null);
  };

  return (
    <section aria-labelledby="layers-heading">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2
          id="layers-heading"
          className="text-xs font-bold uppercase tracking-widest text-cyan-400"
        >
          Layers
        </h2>
        <span className="text-[10px] font-semibold tabular-nums text-slate-500">
          {items.length}
        </span>
      </div>

      {visibleItems.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2.5 text-xs text-slate-500">
          No layers yet
        </p>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {visibleItems.map((layer) => {
            const selected = layer.id === selectedItemId;
            const hidden = layer.hidden === true;
            const locked = layer.locked === true;
            const dragging = layer.id === draggedItemId;
            const dropTarget = layer.id === dropTargetId;
            const name =
              layer.type === "text"
                ? getTextLayerName(layer.value)
                : imageNames.get(layer.id) ?? "Image";
            const LayerIcon = layer.type === "text" ? Type : ImageIcon;

            return (
              <div
                key={layer.id}
                draggable
                onDragStart={(event) => {
                  setDraggedItemId(layer.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", layer.id);
                }}
                onDragOver={(event) => {
                  if (!draggedItemId || draggedItemId === layer.id) return;

                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropTargetId(layer.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  finishDrop(layer.id);
                }}
                onDragEnd={() => {
                  setDraggedItemId(null);
                  setDropTargetId(null);
                }}
                className={`group flex items-center gap-1 rounded-lg border transition ${
                  dropTarget
                    ? "border-blue-400/70 bg-blue-500/15"
                    : selected
                      ? "border-blue-400/50 bg-gradient-to-r from-blue-500/20 to-purple-500/15"
                      : "border-transparent bg-slate-800/50 hover:border-white/10 hover:bg-slate-800"
                } ${
                  dragging
                    ? "opacity-50"
                    : hidden
                      ? "opacity-70"
                      : "opacity-100"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-slate-500 group-hover:text-slate-300 active:cursor-grabbing"
                >
                  <GripVertical size={13} />
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                    selected
                      ? "bg-blue-500/20 text-cyan-300"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  <LayerIcon size={13} />
                </span>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Select layer ${name}`}
                  disabled={hidden || locked}
                  onClick={() => onSelectItem(layer.id)}
                  className="min-w-0 flex-1 rounded-md py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-default"
                >
                  <span
                    className={`block truncate text-xs font-semibold ${
                      selected
                        ? "text-white"
                        : hidden || locked
                          ? "text-slate-400"
                          : "text-slate-300"
                    }`}
                  >
                    {name}
                  </span>
                </button>
                <div className="ml-auto mr-1 flex shrink-0 items-center">
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleVisibility(layer.id);
                    }}
                    onDragStart={(event) => event.preventDefault()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label={`${hidden ? "Show" : "Hide"} layer ${name}`}
                    title={hidden ? "Show layer" : "Hide layer"}
                  >
                    {hidden ? (
                      <EyeOff size={14} aria-hidden="true" />
                    ) : (
                      <Eye size={14} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleLock(layer.id);
                    }}
                    onDragStart={(event) => event.preventDefault()}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      locked ? "text-slate-300" : "text-slate-500"
                    }`}
                    aria-label={`${locked ? "Unlock" : "Lock"} layer ${name}`}
                    title={locked ? "Unlock layer" : "Lock layer"}
                  >
                    {locked ? (
                      <Lock size={14} aria-hidden="true" />
                    ) : (
                      <LockOpen size={14} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
