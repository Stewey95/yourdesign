"use client";

import { useCallback, useEffect, useRef } from "react";
import CornerResizeHandles from "./CornerResizeHandles";
import type { ResizeCorner, TextDesignItem } from "./editor.types";
import { getFontOption } from "./fonts/font.catalog";
import { ensureGoogleFontLoaded } from "./fonts/googleFontLoader";

export type TextResizeCorner = ResizeCorner;

type CanvasTextItemProps = {
  item: TextDesignItem;
  selected: boolean;
  editing: boolean;
  mobileLayout: boolean;
  displayScale: number;
  maximumWidth: number;
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
  onResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: TextDesignItem,
    corner: TextResizeCorner
  ) => void;
};

export default function CanvasTextItem({
  item,
  selected,
  editing,
  mobileLayout,
  displayScale,
  maximumWidth,
  onRequestAutoFit,
  onValueChange,
  onRemoveEmptyText,
  onFinishEditing,
  onEditingPointerDown,
  onPendingDragStart,
  onResizeStart,
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

        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
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
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
        textarea.scrollTop = 0;
        textarea.focus();
      });
    },
    [mobileLayout]
  );

  const measurementValue = item.value.endsWith("\n")
    ? `${item.value}\u200b`
    : item.value || "Type here";
  const constrainedWidth = `min(76vw, 460px, ${maximumWidth}px)`;

  return (
    <div
      className="relative md:inline-grid md:max-w-full"
      style={{ maxWidth: maximumWidth }}
    >
        <span
          aria-hidden="true"
          className="invisible hidden min-h-[1.2em] w-fit whitespace-pre-wrap [overflow-wrap:anywhere] text-center font-bold md:block"
          style={{
            fontSize: item.fontSize,
            fontFamily: item.fontFamily,
            textShadow: "0 1px 4px rgba(0,0,0,0.35)",
            lineHeight: 1.15,
            maxWidth: maximumWidth,
          }}
        >
          {measurementValue}
        </span>

        {editing ? (
          <textarea
            data-canvas-text-editor={item.id}
            autoFocus={!mobileLayout}
            ref={initialiseEditingTextarea}
            value={item.value}
           onChange={(event) => {
  const value =
    event.target.value;

  const textarea = event.currentTarget;

  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
  textarea.scrollTop = 0;
 onRequestAutoFit(item.id, textarea);

requestAnimationFrame(() => {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
  textarea.scrollTop = 0;
});

onValueChange(item.id, value);
            }}
            onBlur={() => {
              setTimeout(() => {
                const activeElement =
                  document.activeElement;

                if (
                  activeElement instanceof
                    HTMLElement &&
                  activeElement.closest(
                    `[data-text-toolbar="${item.id}"]`
                  )
                ) {
                  return;
                }

                if (
                  item.value.trim() === ""
                ) {
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
            className="block min-h-[1.2em] resize-none overflow-hidden whitespace-pre-wrap [overflow-wrap:anywhere] bg-transparent text-center font-bold outline-none touch-none md:absolute md:inset-0 md:h-full md:!w-full md:!max-w-full"
            style={{
              fontSize: item.fontSize,
              color: item.color,
              fontFamily: item.fontFamily,
              textShadow:
                "0 1px 4px rgba(0,0,0,0.35)",
              lineHeight: 1.15,
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
             width: constrainedWidth,
maxWidth: maximumWidth,
            }}
          />
        ) : (
          <div
            onPointerDown={(event) => {
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);

              onPendingDragStart(
                item.id,
                event.clientX,
                event.clientY,
                event.pointerId
              );
            }}
            className="cursor-move select-none whitespace-pre-wrap [overflow-wrap:anywhere] text-center font-bold touch-none md:absolute md:inset-0 md:!w-full md:!max-w-full"
            style={{
              fontSize: item.fontSize,
              color: item.color,
              fontFamily: item.fontFamily,
              textShadow:
                "0 1px 4px rgba(0,0,0,0.35)",
              lineHeight: 1.15,
              width: constrainedWidth,
maxWidth: maximumWidth,
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            {item.value || "Type here"}
          </div>
        )}

        {selected && !mobileLayout && (
          <CornerResizeHandles
            displayScale={displayScale}
            onResizeStart={(event, corner) =>
              onResizeStart(event, item, corner)
            }
          />
        )}
    </div>
  );
}
