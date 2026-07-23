"use client";

import { useEffect, useRef, useState } from "react";

type PropertyStepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  keyboardStep?: number;
  largeStep?: number;
  suffix?: string;
  disabled?: boolean;
  decrementLabel?: string;
  incrementLabel?: string;
  compact?: boolean;
  onCommit: (value: number) => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export default function PropertyStepper({
  label,
  value,
  min,
  max,
  step = 1,
  keyboardStep = step,
  largeStep = 10,
  suffix,
  disabled = false,
  decrementLabel = "−",
  incrementLabel = "+",
  compact = false,
  onCommit,
  onEditStart,
  onEditEnd,
}: PropertyStepperProps) {
  const [draftValue, setDraftValue] = useState(String(Math.round(value)));
  const editingRef = useRef(false);
  const startingValueRef = useRef(value);
  const cancelledRef = useRef(false);
  const editEndRef = useRef(onEditEnd);

  useEffect(() => {
    editEndRef.current = onEditEnd;
  }, [onEditEnd]);

  useEffect(() => {
    if (!editingRef.current) {
      setDraftValue(String(Math.round(value)));
    }
  }, [value]);

  useEffect(
    () => () => {
      if (editingRef.current) {
        editingRef.current = false;
        editEndRef.current?.();
      }
    },
    []
  );

  const finishEditing = (commitDraft: boolean) => {
    if (!editingRef.current) return;

    if (commitDraft) {
      const parsedValue = Number(draftValue.replace("%", "").trim());

      if (draftValue.trim() && Number.isFinite(parsedValue)) {
        const nextValue = clamp(parsedValue, min, max);

        setDraftValue(String(Math.round(nextValue)));
        onCommit(nextValue);
      } else {
        setDraftValue(String(Math.round(value)));
      }
    }

    editingRef.current = false;
    onEditEnd?.();
  };

  const updateBy = (amount: number) => {
    const parsedDraft = Number(draftValue);
    const baseValue = Number.isFinite(parsedDraft) ? parsedDraft : value;
    const nextValue = clamp(baseValue + amount, min, max);

    setDraftValue(String(Math.round(nextValue)));
    onCommit(nextValue);
  };

  const protectPointer = (
    event: React.PointerEvent<HTMLElement>
  ) => {
    event.stopPropagation();
  };

  return (
    <div
      data-editor-retain-selection
      className={compact ? "flex items-center gap-1.5" : "space-y-2"}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
    >
      <span
        className={
          compact
            ? "shrink-0 text-xs font-bold text-slate-300"
            : "block text-xs font-bold text-slate-400"
        }
      >
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || value <= min}
          onPointerDown={protectPointer}
          onClick={() => updateBy(-step)}
          className={`flex shrink-0 items-center justify-center bg-slate-700 font-bold text-white transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40 ${
            compact ? "h-9 min-w-9 rounded-full px-2" : "h-9 w-9 rounded-lg"
          }`}
          aria-label={`Decrease ${label.toLowerCase()}`}
          title={`Decrease ${label.toLowerCase()}`}
        >
          {decrementLabel}
        </button>

        <div
          className={`flex h-9 min-w-0 items-center rounded-lg border border-white/10 bg-slate-800 focus-within:border-blue-400/70 focus-within:ring-2 focus-within:ring-blue-500/20 ${
            compact ? "w-[74px]" : "flex-1"
          }`}
        >
          <input
            type="number"
            inputMode="numeric"
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            value={draftValue}
            onFocus={(event) => {
              editingRef.current = true;
              cancelledRef.current = false;
              startingValueRef.current = value;
              onEditStart?.();
              event.currentTarget.select();
            }}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                finishEditing(true);
                event.currentTarget.blur();
                return;
              }

              if (event.key === "Escape") {
                event.preventDefault();
                cancelledRef.current = true;
                setDraftValue(String(Math.round(startingValueRef.current)));
                onCommit(startingValueRef.current);
                finishEditing(false);
                event.currentTarget.blur();
                return;
              }

              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                updateBy(
                  (event.shiftKey ? largeStep : keyboardStep) *
                    (event.key === "ArrowUp" ? 1 : -1)
                );
              }
            }}
            onBlur={() => {
              if (cancelledRef.current) {
                cancelledRef.current = false;
                return;
              }

              finishEditing(true);
            }}
            onWheel={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onPointerDown={protectPointer}
            onClick={(event) => event.stopPropagation()}
            className="h-full min-w-0 flex-1 appearance-none bg-transparent px-2 text-center text-sm font-bold tabular-nums text-white outline-none disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label={label}
          />
          {suffix && (
            <span className="shrink-0 pr-2 text-xs font-semibold text-slate-400">
              {suffix}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={disabled || value >= max}
          onPointerDown={protectPointer}
          onClick={() => updateBy(step)}
          className={`flex shrink-0 items-center justify-center bg-slate-700 font-bold text-white transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40 ${
            compact ? "h-9 min-w-9 rounded-full px-2" : "h-9 w-9 rounded-lg"
          }`}
          aria-label={`Increase ${label.toLowerCase()}`}
          title={`Increase ${label.toLowerCase()}`}
        >
          {incrementLabel}
        </button>
      </div>
    </div>
  );
}
