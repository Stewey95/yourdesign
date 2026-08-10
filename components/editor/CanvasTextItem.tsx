"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import CornerResizeHandles from "./CornerResizeHandles";
import type { ResizeCorner, TextDesignItem } from "./editor.types";
import { getFontOption } from "./fonts/font.catalog";
import { ensureGoogleFontLoaded } from "./fonts/googleFontLoader";
import {
  getTextBoxWidth,
  TEXT_LINE_HEIGHT,
  TEXT_SHADOW,
} from "./textLayout";

export type TextResizeCorner = ResizeCorner;

type CanvasTextItemProps = {
  item: TextDesignItem;
  selected: boolean;
  selectionActive: boolean;
  editing: boolean;
  mobileLayout: boolean;
  displayScale: number;
  textBoxWidth?: number;
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
  selectionActive,
  editing,
  mobileLayout,
  displayScale,
  textBoxWidth,
  onRequestAutoFit,
  onValueChange,
  onRemoveEmptyText,
  onFinishEditing,
  onEditingPointerDown,
  onPendingDragStart,
  onResizeStart,
}: CanvasTextItemProps) {
  const focusScrollCleanupRef = useRef<(() => void) | null>(null);
  const textRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ensureGoogleFontLoaded(getFontOption(item.fontFamily));
  }, [item.fontFamily]);

  useLayoutEffect(() => {
    if (!selectionActive) return;

    const textRoot = textRootRef.current;
    const overlay = document.querySelector<HTMLElement>(
      `[data-selection-overlay="${item.id}"]`
    );
    if (!textRoot || !overlay) return;

    // This renderer receives the same font-size commit that changes the
    // intrinsic text box. Write the selection geometry here so Safari never
    // has to wait for a sibling observer to catch up during a pointer drag.
    overlay.style.width = `${textRoot.offsetWidth}px`;
    overlay.style.height = `${textRoot.offsetHeight}px`;
  }, [item.fontSize, item.id, item.value, selectionActive, textBoxWidth]);

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
  const boundedWidth = getTextBoxWidth({ textBoxWidth });
  const textBoxStyle = boundedWidth ? { width: boundedWidth } : undefined;

  return (
    <div
      ref={textRootRef}
      className="relative inline-grid"
      style={textBoxStyle}
    >
        <span
          aria-hidden="true"
          className={`col-start-1 row-start-1 invisible block min-h-[1.2em] whitespace-pre-wrap text-center font-bold ${
            boundedWidth ? "w-full [overflow-wrap:anywhere]" : "w-fit"
          }`}
          style={{
            fontSize: item.fontSize,
            fontFamily: item.fontFamily,
            textShadow: TEXT_SHADOW,
            lineHeight: TEXT_LINE_HEIGHT,
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
            className={`absolute inset-0 block min-h-[1.2em] resize-none overflow-hidden whitespace-pre-wrap bg-transparent text-center font-bold outline-none touch-none ${
              boundedWidth ? "[overflow-wrap:anywhere]" : ""
            }`}
            style={{
              fontSize: item.fontSize,
              color: item.color,
              fontFamily: item.fontFamily,
              textShadow: TEXT_SHADOW,
              lineHeight: TEXT_LINE_HEIGHT,
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              width: "100%",
            }}
          />
        ) : (
          <div
            data-canvas-text-display={item.id}
            onPointerDown={(event) => {
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
            }}
            className={`col-start-1 row-start-1 cursor-move select-none whitespace-pre-wrap text-center font-bold touch-none ${
              boundedWidth ? "[overflow-wrap:anywhere]" : ""
            }`}
            style={{
              fontSize: item.fontSize,
              color: item.color,
              fontFamily: item.fontFamily,
              textShadow: TEXT_SHADOW,
              lineHeight: TEXT_LINE_HEIGHT,
              width: "100%",
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
