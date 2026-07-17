"use client";

import type { ReactNode, RefObject } from "react";
import AlignmentGuides from "./AlignmentGuides";
import CanvasItem from "./CanvasItem";
import type {
  DesignItem,
  ImageDesignItem,
} from "./editor.types";

type EditorCanvasProps = {
  canvasRef: RefObject<HTMLDivElement | null>;
  toolbar: ReactNode;
  items: DesignItem[];
  selectedItemId: string | null;
  editingItemId: string | null;
  verticalGuide: boolean;
  horizontalGuide: boolean;
  onTouchStartCapture: React.TouchEventHandler<HTMLDivElement>;
  onTouchMoveCapture: React.TouchEventHandler<HTMLDivElement>;
  onTouchEndCapture: React.TouchEventHandler<HTMLDivElement>;
  onTouchCancelCapture: React.TouchEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>;
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onImagePointerDown: (id: string) => void;
  onImageResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: ImageDesignItem
  ) => void;
  onRequestAutoFit: (
    id: string,
    textarea: HTMLTextAreaElement
  ) => void;
  onTextValueChange: (id: string, value: string) => void;
  onRemoveEmptyText: (id: string) => void;
  onFinishEditing: () => void;
  onEditingPointerDown: (id: string) => void;
  onPendingDragStart: (
    id: string,
    startX: number,
    startY: number
  ) => void;
};

export default function EditorCanvas({
  canvasRef,
  toolbar,
  items,
  selectedItemId,
  editingItemId,
  verticalGuide,
  horizontalGuide,
  onTouchStartCapture,
  onTouchMoveCapture,
  onTouchEndCapture,
  onTouchCancelCapture,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerDown,
  onImagePointerDown,
  onImageResizeStart,
  onRequestAutoFit,
  onTextValueChange,
  onRemoveEmptyText,
  onFinishEditing,
  onEditingPointerDown,
  onPendingDragStart,
}: EditorCanvasProps) {
  return (
    <div className="min-w-0 md:col-span-3">
      <div className="mb-3 min-h-[72px]"></div>
     <div className="mb-3 min-h-[72px]">
      {toolbar}
    </div>

      <div
        ref={canvasRef}
        onTouchStartCapture={onTouchStartCapture}
        onTouchMoveCapture={onTouchMoveCapture}
        onTouchEndCapture={onTouchEndCapture}
        onTouchCancelCapture={onTouchCancelCapture}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerDown={onPointerDown}
        className="relative h-64 overflow-hidden rounded-xl bg-white text-slate-500 touch-none select-none"
        style={{
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          overscrollBehavior: "contain",
        }}
      >
        {items.length === 0 && (
          <p className="flex h-full items-center justify-center">
            Your design canvas
          </p>
        )}
        <AlignmentGuides
          vertical={verticalGuide}
          horizontal={horizontalGuide}
        />

        {items.map((item) =>
          item.type === "image" ? (
            <CanvasItem
              key={item.id}
              item={item}
              selected={selectedItemId === item.id}
              onPointerDown={onImagePointerDown}
              onResizeStart={onImageResizeStart}
            />
          ) : (
            <CanvasItem
              key={item.id}
              item={item}
              editing={editingItemId === item.id}
              onRequestAutoFit={onRequestAutoFit}
              onValueChange={onTextValueChange}
              onRemoveEmptyText={onRemoveEmptyText}
              onFinishEditing={onFinishEditing}
              onEditingPointerDown={onEditingPointerDown}
              onPendingDragStart={onPendingDragStart}
            />
          )
        )}
      </div>
    </div>
  );
}
