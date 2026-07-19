"use client";

import { useCallback } from "react";
import type { TextDesignItem } from "./editor.types";

export type TextResizeCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

type CanvasTextItemProps = {
  item: TextDesignItem;
  selected: boolean;
  editing: boolean;
  displayScale: number;
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
    startY: number
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
  displayScale,
  onRequestAutoFit,
  onValueChange,
  onRemoveEmptyText,
  onFinishEditing,
  onEditingPointerDown,
  onPendingDragStart,
  onResizeStart,
}: CanvasTextItemProps) {
  const initialiseEditingTextarea = useCallback(
    (textarea: HTMLTextAreaElement | null) => {
      if (!textarea) return;

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
    []
  );

  const resizeHandles: Array<{
    corner: TextResizeCorner;
    className: string;
    style: React.CSSProperties;
  }> = [
    {
      corner: "top-left",
      className: "cursor-nwse-resize",
      style: { left: 0, top: 0 },
    },
    {
      corner: "top-right",
      className: "cursor-nesw-resize",
      style: { left: "100%", top: 0 },
    },
    {
      corner: "bottom-left",
      className: "cursor-nesw-resize",
      style: { left: 0, top: "100%" },
    },
    {
      corner: "bottom-right",
      className: "cursor-nwse-resize",
      style: { left: "100%", top: "100%" },
    },
  ];
  const measurementValue = item.value.endsWith("\n")
    ? `${item.value}\u200b`
    : item.value || "Type here";

  return (
    <div className="mobile-canvas-text relative md:inline-grid md:max-w-full">
        <span
          aria-hidden="true"
          className="invisible hidden min-h-[1.2em] w-fit max-w-[min(76vw,460px)] whitespace-pre-wrap break-words text-center font-bold md:block"
          style={{
            fontSize: item.fontSize,
            fontFamily: item.fontFamily,
            textShadow: "0 1px 4px rgba(0,0,0,0.35)",
            lineHeight: 1.15,
          }}
        >
          {measurementValue}
        </span>

        {editing ? (
          <textarea
            autoFocus
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
            className="block min-h-[1.2em] resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent text-center font-bold outline-none touch-none md:absolute md:inset-0 md:h-full md:!w-full md:!max-w-full"
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
             width: "min(76vw, 460px)",
maxWidth: "100%",
            }}
          />
        ) : (
          <div
            onPointerDown={(event) => {
              event.stopPropagation();

              onPendingDragStart(
                item.id,
                event.clientX,
                event.clientY
              );
            }}
            className="cursor-move select-none whitespace-pre-wrap break-words text-center font-bold touch-none md:absolute md:inset-0 md:!w-full md:!max-w-full"
            style={{
              fontSize: item.fontSize,
              color: item.color,
              fontFamily: item.fontFamily,
              textShadow:
                "0 1px 4px rgba(0,0,0,0.35)",
              lineHeight: 1.15,
              width: "min(76vw, 460px)",
maxWidth: "100%",
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            {item.value || "Type here"}
          </div>
        )}

        {selected && resizeHandles.map((handle) => (
          <div
            key={handle.corner}
            onPointerDown={(event) =>
              onResizeStart(event, item, handle.corner)
            }
            className={`absolute hidden items-center justify-center md:flex ${handle.className}`}
            style={{
              ...handle.style,
              width: 20 / displayScale,
              height: 20 / displayScale,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              aria-hidden="true"
              className="block bg-blue-500"
              style={{
                width: 4 / displayScale,
                height: 4 / displayScale,
                outline: `${1 / displayScale}px solid white`,
                borderRadius: 1 / displayScale,
              }}
            />
          </div>
        ))}
    </div>
  );
}
