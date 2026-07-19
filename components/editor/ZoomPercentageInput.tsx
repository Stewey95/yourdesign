"use client";

import { useRef, useState } from "react";
import {
  MAX_VIEWPORT_ZOOM,
  MIN_VIEWPORT_ZOOM,
} from "./editor.viewport";

type ZoomPercentageInputProps = {
  zoom: number;
  onApply: (zoom: number) => void;
  className: string;
};

const formatZoom = (zoom: number) => `${Math.round(zoom * 100)}%`;

export default function ZoomPercentageInput({
  zoom,
  onApply,
  className,
}: ZoomPercentageInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cancelBlurRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(formatZoom(zoom));

  const startEditing = () => {
    setDraft(String(Math.round(zoom * 100)));
    setIsEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const finishEditing = () => {
    if (cancelBlurRef.current) {
      cancelBlurRef.current = false;
      setIsEditing(false);
      return;
    }

    const enteredValue = draft.trim();
    const isValid = /^\d+(?:\.\d+)?%?$/.test(enteredValue);
    const percentage = Number(enteredValue.replace(/%$/, ""));

    if (isValid && Number.isFinite(percentage)) {
      const clampedPercentage = Math.min(
        MAX_VIEWPORT_ZOOM * 100,
        Math.max(MIN_VIEWPORT_ZOOM * 100, percentage)
      );

      onApply(clampedPercentage / 100);
    }

    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        aria-label={`Set canvas zoom, currently ${formatZoom(zoom)}`}
        aria-live="polite"
        title="Set exact zoom percentage"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={startEditing}
        className={className}
      >
        {formatZoom(zoom)}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      aria-label="Canvas zoom percentage"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={finishEditing}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        } else if (event.key === "Escape") {
          event.preventDefault();
          cancelBlurRef.current = true;
          event.currentTarget.blur();
        }
      }}
      className={className}
    />
  );
}
