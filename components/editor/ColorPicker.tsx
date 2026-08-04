"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pipette, X } from "lucide-react";

const POPOVER_WIDTH = 256;
const VIEWPORT_MARGIN = 8;

const clampToViewport = (
  top: number,
  left: number,
  width: number,
  height: number
) => ({
  top: Math.min(
    Math.max(VIEWPORT_MARGIN, top),
    Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN)
  ),
  left: Math.min(
    Math.max(VIEWPORT_MARGIN, left),
    Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN)
  ),
});

// --- Color Helpers ---

export function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } {
  let cleanHex = hex.trim().replace(/^#/, "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (cleanHex.length === 6) {
    cleanHex += "ff";
  }

  const num = parseInt(cleanHex, 16);
  if (isNaN(num) || cleanHex.length !== 8) {
    return { r: 37, g: 99, b: 235, a: 1 };
  }

  return {
    r: (num >> 24) & 255,
    g: (num >> 16) & 255,
    b: (num >> 8) & 255,
    a: Math.round(((num & 255) / 255) * 100) / 100,
  };
}

export function rgbToHex(r: number, g: number, b: number, a = 1): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const hexR = clamp(r).toString(16).padStart(2, "0");
  const hexG = clamp(g).toString(16).padStart(2, "0");
  const hexB = clamp(b).toString(16).padStart(2, "0");

  if (a < 0.995) {
    const hexA = Math.max(0, Math.min(255, Math.round(a * 255)))
      .toString(16)
      .padStart(2, "0");
    return `#${hexR}${hexG}${hexB}${hexA}`.toUpperCase();
  }

  return `#${hexR}${hexG}${hexB}`.toUpperCase();
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const normR = r / 255;
  const normG = g / 255;
  const normB = b / 255;

  const max = Math.max(normR, normG, normB);
  const min = Math.min(normR, normG, normB);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case normR:
        h = (normG - normB) / d + (normG < normB ? 6 : 0);
        break;
      case normG:
        h = (normB - normR) / d + 2;
        break;
      case normB:
        h = (normR - normG) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const normH = (h % 360) / 60;
  const normS = Math.max(0, Math.min(100, s)) / 100;
  const normV = Math.max(0, Math.min(100, v)) / 100;

  const c = normV * normS;
  const x = c * (1 - Math.abs((normH % 2) - 1));
  const m = normV - c;

  let r1 = 0,
    g1 = 0,
    b1 = 0;

  if (normH >= 0 && normH < 1) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (normH >= 1 && normH < 2) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (normH >= 2 && normH < 3) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (normH >= 3 && normH < 4) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (normH >= 4 && normH < 5) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

const PRESET_SWATCHES = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

type GripixColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  allowAlpha?: boolean;
  label?: string;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
  showHexText?: boolean;
};

export default function GripixColorPicker({
  value,
  onChange,
  allowAlpha = false,
  label,
  ariaLabel = "Colour picker",
  className = "",
  buttonClassName = "",
  showHexText = false,
}: GripixColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const squareRef = useRef<HTMLDivElement | null>(null);
  const hueSliderRef = useRef<HTMLDivElement | null>(null);
  const alphaSliderRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const initialRgb = hexToRgb(value || "#2563EB");
  const initialHsv = rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b);

  const [hsv, setHsv] = useState(initialHsv);
  const [alpha, setAlpha] = useState(initialRgb.a);
  const [hexInput, setHexInput] = useState(value ? value.toUpperCase() : "#2563EB");

  const [prevValue, setPrevValue] = useState(value);

  // Synchronize internal state when value prop changes while popover is closed
  if (value !== prevValue && !isOpen) {
    setPrevValue(value);
    const rgb = hexToRgb(value || "#2563EB");
    setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
    setAlpha(rgb.a);
    setHexInput(value ? value.toUpperCase() : "#2563EB");
  }

  // Handle clicking outside (either the trigger or the floating panel) to close
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        containerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
    };
  }, [isOpen]);

  // Escape key closes the floating panel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Anchor the floating panel beneath the trigger, clamped to the viewport
  // using an estimated panel height (refined once real drag events occur).
  const openPopoverNearTrigger = () => {
    const trigger = containerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const estimatedHeight = allowAlpha ? 460 : 420;

    setPopoverPosition(
      clampToViewport(
        triggerRect.bottom + 8,
        triggerRect.left,
        POPOVER_WIDTH,
        estimatedHeight
      )
    );
    setIsOpen(true);
  };

  const startPanelDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const panel = popoverRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();

    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      const offset = dragOffsetRef.current;
      if (!offset) return;

      const panelRect = panel.getBoundingClientRect();

      setPopoverPosition(
        clampToViewport(
          moveEvent.clientY - offset.y,
          moveEvent.clientX - offset.x,
          panelRect.width,
          panelRect.height
        )
      );
    };

    const onPointerUp = () => {
      dragOffsetRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const updateColorFromHsv = useCallback(
    (newHsv: { h: number; s: number; v: number }, newAlpha = alpha) => {
      setHsv(newHsv);
      const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
      const newHex = rgbToHex(rgb.r, rgb.g, rgb.b, allowAlpha ? newAlpha : 1);
      setHexInput(newHex);
      onChange(newHex);
    },
    [alpha, allowAlpha, onChange]
  );

  const updateAlpha = useCallback(
    (newAlpha: number) => {
      const clampedAlpha = Math.max(0, Math.min(1, Math.round(newAlpha * 100) / 100));
      setAlpha(clampedAlpha);
      const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      const newHex = rgbToHex(rgb.r, rgb.g, rgb.b, allowAlpha ? clampedAlpha : 1);
      setHexInput(newHex);
      onChange(newHex);
    },
    [hsv, allowAlpha, onChange]
  );

  // 2D Square Interaction
  const handleSquarePointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = squareRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));

      const s = Math.round((x / rect.width) * 100);
      const v = Math.round((1 - y / rect.height) * 100);

      updateColorFromHsv({ ...hsv, s, v });
    },
    [hsv, updateColorFromHsv]
  );

  const startSquareDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleSquarePointer(event);

    const onPointerMove = (e: PointerEvent) => {
      const rect = squareRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

      const s = Math.round((x / rect.width) * 100);
      const v = Math.round((1 - y / rect.height) * 100);

      updateColorFromHsv({ ...hsv, s, v });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Hue Slider Interaction
  const handleHuePointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = hueSliderRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      const h = Math.round((x / rect.width) * 360);

      updateColorFromHsv({ ...hsv, h: h >= 360 ? 359 : h });
    },
    [hsv, updateColorFromHsv]
  );

  const startHueDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleHuePointer(event);

    const onPointerMove = (e: PointerEvent) => {
      const rect = hueSliderRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const h = Math.round((x / rect.width) * 360);

      updateColorFromHsv({ ...hsv, h: h >= 360 ? 359 : h });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Alpha Slider Interaction
  const handleAlphaPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = alphaSliderRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      updateAlpha(x / rect.width);
    },
    [updateAlpha]
  );

  const startAlphaDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleAlphaPointer(event);

    const onPointerMove = (e: PointerEvent) => {
      const rect = alphaSliderRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      updateAlpha(x / rect.width);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Eyedropper API
  const handleEyeDropper = async () => {
    if (typeof window === "undefined" || !("EyeDropper" in window)) return;
    try {
      const EyeDropper = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        const rgb = hexToRgb(result.sRGBHex);
        const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        updateColorFromHsv(newHsv, 1);
      }
    } catch {
      // User cancelled eye dropper selection
    }
  };

  // Input changes
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#?([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(val)) {
      const rgb = hexToRgb(val);
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
      setAlpha(rgb.a);
      onChange(rgbToHex(rgb.r, rgb.g, rgb.b, allowAlpha ? rgb.a : 1));
    }
  };

  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const pureHueRgb = hsvToRgb(hsv.h, 100, 100);
  const pureHueHex = rgbToHex(pureHueRgb.r, pureHueRgb.g, pureHueRgb.b);

  const handleRgbChange = (channel: "r" | "g" | "b", valStr: string) => {
    const num = Math.max(0, Math.min(255, Number(valStr) || 0));
    const nextRgb = { ...currentRgb, [channel]: num };
    const nextHsv = rgbToHsv(nextRgb.r, nextRgb.g, nextRgb.b);
    updateColorFromHsv(nextHsv);
  };

  const supportsEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Swatch Button */}
      <button
        type="button"
        aria-label={ariaLabel}
        title={label || ariaLabel}
        onClick={() => (isOpen ? setIsOpen(false) : openPopoverNearTrigger())}
        onPointerDown={(e) => e.stopPropagation()}
        className={`group flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 p-1.5 transition hover:border-cyan-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${buttonClassName}`}
      >
        <span
          className="h-5 w-5 shrink-0 rounded-md border border-white/20 shadow-inner"
          style={{ backgroundColor: value || "transparent" }}
        />
        {label && <span className="text-xs font-semibold text-slate-200">{label}</span>}
        {showHexText && (
          <span className="font-mono text-xs uppercase text-slate-400 group-hover:text-slate-200">
            {value || "None"}
          </span>
        )}
      </button>

      {/* Floating Popover (portaled so it can never be clipped or dismissed by ancestor scrolling) */}
      {isOpen &&
        popoverPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            data-editor-retain-selection
            onPointerDown={(e) => e.stopPropagation()}
            className="fixed z-[1000] w-64 rounded-xl border border-white/15 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
            style={{ top: popoverPosition.top, left: popoverPosition.left }}
          >
          {/* Header (drag handle) */}
          <div
            onPointerDown={startPanelDrag}
            className="mb-3 flex cursor-grab items-center justify-between active:cursor-grabbing"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              Colour
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Close colour picker"
            >
              <X size={14} />
            </button>
          </div>

          {/* 2D Saturation / Value Canvas Square */}
          <div
            ref={squareRef}
            onPointerDown={startSquareDrag}
            className="relative h-36 w-full cursor-crosshair overflow-hidden rounded-lg select-none"
            style={{
              backgroundColor: pureHueHex,
              backgroundImage:
                "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
            }}
          >
            <div
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                backgroundColor: rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b),
              }}
            />
          </div>

          {/* Hue Slider */}
          <div className="mt-3 space-y-2">
            <div
              ref={hueSliderRef}
              onPointerDown={startHueDrag}
              className="relative h-3.5 w-full cursor-pointer rounded-full select-none"
              style={{
                background:
                  "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
              }}
            >
              <div
                className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-md"
                style={{ left: `${(hsv.h / 360) * 100}%` }}
              />
            </div>

            {/* Opacity Slider (if enabled) */}
            {allowAlpha && (
              <div
                ref={alphaSliderRef}
                onPointerDown={startAlphaDrag}
                className="relative h-3.5 w-full cursor-pointer rounded-full bg-[linear-gradient(45deg,#334155_25%,transparent_25%),linear-gradient(-45deg,#334155_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#334155_75%),linear-gradient(-45deg,transparent_75%,#334155_75%)] bg-[length:10px_10px] bg-[position:0_0,0_5px,5px_-5px,-5px_0px] select-none"
              >
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background: `linear-gradient(to right, transparent, ${rgbToHex(
                      currentRgb.r,
                      currentRgb.g,
                      currentRgb.b
                    )})`,
                  }}
                />
                <div
                  className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-md"
                  style={{ left: `${alpha * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* HEX & EyeDropper Controls */}
          <div className="mt-3 flex items-center gap-2">
            {supportsEyeDropper && (
              <button
                type="button"
                onClick={handleEyeDropper}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                title="Pick colour from screen"
                aria-label="EyeDropper colour picker"
              >
                <Pipette size={14} />
              </button>
            )}

            <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800 px-2 py-1">
              <span className="text-xs font-bold text-slate-400">HEX</span>
              <input
                type="text"
                value={hexInput}
                onChange={handleHexChange}
                className="w-full bg-transparent font-mono text-xs font-semibold text-white outline-none"
                placeholder="#2563EB"
              />
            </div>
          </div>

          {/* RGB Field Inputs */}
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <label className="flex flex-col items-center rounded-lg border border-white/10 bg-slate-800 p-1">
              <span className="text-[9px] font-bold text-slate-400">R</span>
              <input
                type="number"
                min={0}
                max={255}
                value={currentRgb.r}
                onChange={(e) => handleRgbChange("r", e.target.value)}
                className="w-full text-center font-mono text-xs font-semibold text-white outline-none"
              />
            </label>
            <label className="flex flex-col items-center rounded-lg border border-white/10 bg-slate-800 p-1">
              <span className="text-[9px] font-bold text-slate-400">G</span>
              <input
                type="number"
                min={0}
                max={255}
                value={currentRgb.g}
                onChange={(e) => handleRgbChange("g", e.target.value)}
                className="w-full text-center font-mono text-xs font-semibold text-white outline-none"
              />
            </label>
            <label className="flex flex-col items-center rounded-lg border border-white/10 bg-slate-800 p-1">
              <span className="text-[9px] font-bold text-slate-400">B</span>
              <input
                type="number"
                min={0}
                max={255}
                value={currentRgb.b}
                onChange={(e) => handleRgbChange("b", e.target.value)}
                className="w-full text-center font-mono text-xs font-semibold text-white outline-none"
              />
            </label>
          </div>

          {/* Quick Preset Palette */}
          <div className="mt-3">
            <span className="mb-1.5 block text-[10px] font-semibold text-slate-400">
              Presets
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {PRESET_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    const rgb = hexToRgb(hex);
                    updateColorFromHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
                  }}
                  className="h-6 w-6 rounded-md border border-white/15 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
                  style={{ backgroundColor: hex }}
                  aria-label={`Select preset colour ${hex}`}
                  title={hex}
                />
              ))}
            </div>
          </div>
          </div>,
          document.body
        )}
    </div>
  );
}
