"use client";

import { useState } from "react";
import {
  CANVAS_PRESETS,
  CUSTOM_CANVAS_MAX_SIZE,
  CUSTOM_CANVAS_MIN_SIZE,
  type CanvasPresetId,
  type CanvasSize,
} from "./editor.constants";

type CanvasSizePanelProps = {
  canvasSize: CanvasSize;
  selectedPresetId: CanvasPresetId;
  onApply: (presetId: CanvasPresetId, size: CanvasSize) => void;
};

const categories = ["Gripix", "Print", "Social"] as const;

export default function CanvasSizePanel({
  canvasSize,
  selectedPresetId,
  onApply,
}: CanvasSizePanelProps) {
  const [customWidth, setCustomWidth] = useState(String(canvasSize.width));
  const [customHeight, setCustomHeight] = useState(String(canvasSize.height));
  const [customError, setCustomError] = useState<string | null>(null);

  const applyCustomSize = () => {
    const width = Number(customWidth);
    const height = Number(customHeight);

    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < CUSTOM_CANVAS_MIN_SIZE ||
      height < CUSTOM_CANVAS_MIN_SIZE ||
      width > CUSTOM_CANVAS_MAX_SIZE ||
      height > CUSTOM_CANVAS_MAX_SIZE
    ) {
      setCustomError(
        `Enter whole numbers from ${CUSTOM_CANVAS_MIN_SIZE} to ${CUSTOM_CANVAS_MAX_SIZE} px.`
      );
      return;
    }

    setCustomError(null);
    onApply("custom", { width, height });
  };

  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-400">
        Canvas size
      </p>
      <p className="mb-3 text-xs text-slate-400">
        Choose a format or enter your own dimensions.
      </p>
      <p className="mb-3 rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-2 text-[11px] text-slate-300">
        <span className="font-semibold text-white">
          {selectedPresetId === "custom"
            ? "Custom Size"
            : CANVAS_PRESETS.find(
                (preset) => preset.id === selectedPresetId
              )?.label ?? "Canvas"}
        </span>
        <span className="ml-1 tabular-nums text-slate-400">
          · {canvasSize.width} × {canvasSize.height} px
        </span>
      </p>

      <div className="space-y-4">
        {categories.map((category) => (
          <section key={category} aria-labelledby={`canvas-${category}`}>
            <h3
              id={`canvas-${category}`}
              className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"
            >
              {category}
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              {CANVAS_PRESETS.filter(
                (preset) => preset.category === category
              ).map((preset) => {
                const selected = selectedPresetId === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-label={`Use ${preset.label} canvas, ${preset.width} by ${preset.height} pixels`}
                    aria-pressed={selected}
                    onClick={() => onApply(preset.id, preset)}
                    className={`flex min-w-0 items-center gap-2 rounded-xl border px-2 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      selected
                        ? "border-blue-400/60 bg-blue-500/20 text-white"
                        : "border-white/10 bg-slate-700/70 text-slate-300 hover:border-white/20 hover:bg-slate-700"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-10 shrink-0 items-center justify-center"
                    >
                      <span
                        className={`block max-h-8 max-w-10 rounded-sm border ${
                          selected
                            ? "border-blue-300 bg-blue-300/15"
                            : "border-slate-400 bg-white/5"
                        }`}
                        style={{
                          width:
                            preset.width >= preset.height
                              ? 32
                              : 32 * (preset.width / preset.height),
                          height:
                            preset.height >= preset.width
                              ? 32
                              : 32 * (preset.height / preset.width),
                        }}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold leading-tight">
                        {preset.label}
                      </span>
                      <span className="block text-[10px] tabular-nums text-slate-400">
                        {preset.width} × {preset.height} px
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <section aria-labelledby="canvas-custom">
          <h3
            id="canvas-custom"
            className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"
          >
            Custom size
          </h3>
          <div
            className={`rounded-xl border p-2 ${
              selectedPresetId === "custom"
                ? "border-blue-400/60 bg-blue-500/10"
                : "border-white/10 bg-slate-700/50"
            }`}
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <label className="min-w-0 text-[10px] font-semibold text-slate-400">
                Width
                <input
                  type="text"
                  inputMode="numeric"
                  value={customWidth}
                  onChange={(event) => setCustomWidth(event.target.value)}
                  aria-invalid={Boolean(customError)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-xs tabular-nums text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                />
              </label>
              <span className="pb-2 text-xs text-slate-500">×</span>
              <label className="min-w-0 text-[10px] font-semibold text-slate-400">
                Height
                <input
                  type="text"
                  inputMode="numeric"
                  value={customHeight}
                  onChange={(event) => setCustomHeight(event.target.value)}
                  aria-invalid={Boolean(customError)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-xs tabular-nums text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                />
              </label>
            </div>
            {customError && (
              <p role="alert" className="mt-2 text-[10px] text-amber-300">
                {customError}
              </p>
            )}
            <button
              type="button"
              onClick={applyCustomSize}
              className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              Apply custom size
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
