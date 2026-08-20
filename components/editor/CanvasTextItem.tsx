"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import type { TextDesignItem } from "./editor.types";
import { getFontOption } from "./fonts/font.catalog";
import { ensureGoogleFontLoaded } from "./fonts/googleFontLoader";
import TextWordContent from "./TextWordContent";
import {
  getTextAlignment,
  getTextBoxWidth,
  TEXT_LINE_HEIGHT,
  TEXT_SHADOW,
} from "./textLayout";

type CanvasTextItemProps = {
  item: TextDesignItem;
  editing: boolean;
  mobileLayout: boolean;
  textBoxWidth?: number;
  freeformTextMaxWidth?: number;
  onRequestAutoFit: (
    id: string,
    textarea: HTMLTextAreaElement
  ) => void;
  onValueChange: (id: string, value: string) => void;
  onRemoveEmptyText: (id: string) => void;
  onFinishEditing: () => void;
  onEditingPointerDown: (id: string) => void;
  onPendingDragStart: (
    id: string,
    startX: number,
    startY: number,
    pointerId: number
  ) => void;
};

export default function CanvasTextItem({
  item,
  editing,
  mobileLayout,
  textBoxWidth,
  freeformTextMaxWidth,
  onRequestAutoFit,
  onValueChange,
  onRemoveEmptyText,
  onFinishEditing,
  onEditingPointerDown,
  onPendingDragStart,
}: CanvasTextItemProps) {
  const focusScrollCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    ensureGoogleFontLoaded(getFontOption(item.fontFamily));
  }, [item.fontFamily]);

  const initialiseEditingTextarea = useCallback(
    (textarea: HTMLTextAreaElement | null) => {
      focusScrollCleanupRef.current?.();
      focusScrollCleanupRef.current = null;

      if (!textarea) return;

      if (mobileLayout) {
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const visualViewport = window.visualViewport;
        let restoreFrame: number | null = null;

        const restorePagePosition = () => {
          if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
            window.scrollTo(scrollX, scrollY);
          }
        };

        const reinforcePagePosition = () => {
          restorePagePosition();

          if (restoreFrame !== null) {
            cancelAnimationFrame(restoreFrame);
          }

          restoreFrame = requestAnimationFrame(restorePagePosition);
        };

        textarea.scrollTop = 0;
        textarea.focus({ preventScroll: true });

        const textLength = textarea.value.length;
        textarea.setSelectionRange(textLength, textLength);
        reinforcePagePosition();

        visualViewport?.addEventListener(
          "resize",
          reinforcePagePosition
        );
        visualViewport?.addEventListener(
          "scroll",
          reinforcePagePosition
        );

        const settlingTimer = window.setTimeout(() => {
          visualViewport?.removeEventListener(
            "resize",
            reinforcePagePosition
          );
          visualViewport?.removeEventListener(
            "scroll",
            reinforcePagePosition
          );
          restorePagePosition();
          focusScrollCleanupRef.current = null;
        }, 450);

        focusScrollCleanupRef.current = () => {
          window.clearTimeout(settlingTimer);
          visualViewport?.removeEventListener(
            "resize",
            reinforcePagePosition
          );
          visualViewport?.removeEventListener(
            "scroll",
            reinforcePagePosition
          );

          if (restoreFrame !== null) {
            cancelAnimationFrame(restoreFrame);
          }
        };

        return;
      }

      requestAnimationFrame(() => {
        if (!textarea.isConnected) return;

        const textLength = textarea.value.length;

        textarea.setSelectionRange(textLength, textLength);
        textarea.scrollTop = 0;
        textarea.focus();
      });
    },
    [mobileLayout]
  );

  const boundedWidth = getTextBoxWidth({ textBoxWidth });
  const textAlign = getTextAlignment(item);
  const textBoxStyle = {
    width: boundedWidth ? `${boundedWidth}px` : "auto",
    maxWidth:
      boundedWidth === undefined && freeformTextMaxWidth !== undefined
        ? `${freeformTextMaxWidth}px`
        : undefined,
  } satisfies CSSProperties;
  const wrapsAtBoundary =
    boundedWidth !== undefined || freeformTextMaxWidth !== undefined;

  return (
    <div
      data-canvas-text-root={item.id}
      className="relative grid"
      style={textBoxStyle}
    >
      <div
        data-canvas-text-display={item.id}
        data-text-align={textAlign}
        aria-hidden={editing || undefined}
        onPointerDown={
          editing
            ? undefined
            : (event) => {
                event.stopPropagation();
                onPendingDragStart(
                  item.id,
                  event.clientX,
                  event.clientY,
                  event.pointerId
                );

                // Safari can reject pointer capture on this text wrapper even
                // though the same pointer remains valid. Starting the gesture
                // first keeps desktop text dragging functional in that case.
                try {
                  event.currentTarget.setPointerCapture(event.pointerId);
                } catch {
                  // The canvas still receives the bubbling pointer sequence.
                }
              }
        }
        className={`col-start-1 row-start-1 select-none whitespace-pre-wrap text-center font-bold touch-none ${
          editing ? "pointer-events-none cursor-text" : "cursor-move"
        } ${
          boundedWidth
            ? "w-full [overflow-wrap:normal]"
            : "w-fit max-w-full [overflow-wrap:normal]"
        }`}
        style={{
          fontSize: item.fontSize,
          color: item.color,
          fontFamily: item.fontFamily,
          textShadow: TEXT_SHADOW,
          lineHeight: TEXT_LINE_HEIGHT,
          textAlign,
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
      >
        <TextWordContent value={item.value || "Type here"} />
      </div>

      {editing && (
        <textarea
          data-canvas-text-editor={item.id}
          autoFocus={!mobileLayout}
          ref={initialiseEditingTextarea}
          value={item.value}
          onChange={(event) => {
            const textarea = event.currentTarget;

            textarea.scrollTop = 0;
            onRequestAutoFit(item.id, textarea);
            onValueChange(item.id, event.target.value);
          }}
          onBlur={() => {
            setTimeout(() => {
              const activeElement = document.activeElement;

              if (
                activeElement instanceof HTMLElement &&
                activeElement.closest(`[data-text-toolbar="${item.id}"]`)
              ) {
                return;
              }

              if (item.value.trim() === "") {
                onRemoveEmptyText(item.id);
              }

              onFinishEditing();
            }, 0);
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
            onEditingPointerDown(item.id);
          }}
          placeholder="Type here"
          rows={1}
          className={`absolute inset-0 block resize-none overflow-hidden whitespace-pre-wrap bg-transparent text-center font-bold text-transparent outline-none placeholder:text-transparent touch-none ${
            wrapsAtBoundary ? "[overflow-wrap:normal]" : ""
          }`}
          style={{
            fontSize: item.fontSize,
            color: "transparent",
            caretColor: item.color,
            WebkitTextFillColor: "transparent",
            fontFamily: item.fontFamily,
            textShadow: "none",
            lineHeight: TEXT_LINE_HEIGHT,
            textAlign,
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            border: 0,
            margin: 0,
            padding: 0,
          }}
        />
      )}
    </div>
  );
}
