"use client";

import type { TextDesignItem } from "./editor.types";

type CanvasTextItemProps = {
  item: TextDesignItem;
  editing: boolean;
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
};

export default function CanvasTextItem({
  item,
  editing,
  onRequestAutoFit,
  onValueChange,
  onRemoveEmptyText,
  onFinishEditing,
  onEditingPointerDown,
  onPendingDragStart,
}: CanvasTextItemProps) {
  return (
    <div className="relative">
        {editing ? (
          <textarea
            autoFocus
           ref={(textarea) => {
  if (!textarea) return;

  requestAnimationFrame(() => {
  const textLength = textarea.value.length;

  textarea.setSelectionRange(
    textLength,
    textLength
  );

  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
  textarea.scrollTop = 0;

  textarea.focus();
});
}}
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
            className="block min-h-[1.2em] resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent text-center font-bold outline-none touch-none"
            style={{
              fontSize: Math.max(
                16,
                item.fontSize
              ),
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
            className="cursor-move select-none whitespace-pre-wrap break-words text-center font-bold touch-none"
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
    </div>
  );
}
