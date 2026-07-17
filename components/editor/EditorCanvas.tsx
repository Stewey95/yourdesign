"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import AlignmentGuides from "./AlignmentGuides";
import CanvasItem from "./CanvasItem";
import {
  LOGICAL_CANVAS_HEIGHT,
  LOGICAL_CANVAS_WIDTH,
} from "./editor.constants";
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
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);

  const updateDisplayScale = useCallback(() => {
    const workspace = workspaceRef.current;

    if (!workspace) return;

    const widthScale =
      workspace.clientWidth / LOGICAL_CANVAS_WIDTH;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const heightScale = isDesktop && workspace.clientHeight > 0
      ? workspace.clientHeight / LOGICAL_CANVAS_HEIGHT
      : Number.POSITIVE_INFINITY;
    const nextScale = Math.min(widthScale, heightScale);

    setIsDesktopLayout(isDesktop);

    setDisplayScale((currentScale) =>
      Math.abs(currentScale - nextScale) > 0.001
        ? nextScale
        : currentScale
    );
  }, []);

  useEffect(() => {
    const workspace = workspaceRef.current;

    if (!workspace) return;

    const resizeObserver = new ResizeObserver(updateDisplayScale);
    resizeObserver.observe(workspace);
    updateDisplayScale();
    window.addEventListener("resize", updateDisplayScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDisplayScale);
    };
  }, [updateDisplayScale]);

  return (
    <div className="order-first min-w-0 md:order-none md:grid md:h-full md:min-h-0 md:grid-rows-[auto_minmax(0,1fr)]">
      <div className="mb-3 hidden min-h-[72px] md:block">
        {toolbar}
      </div>

      <div
        ref={workspaceRef}
        className="relative w-full overflow-hidden md:h-full md:min-h-0"
        style={{
          height: isDesktopLayout
            ? undefined
            : LOGICAL_CANVAS_HEIGHT * displayScale,
        }}
      >
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
          className="absolute left-1/2 top-0 overflow-hidden rounded-xl bg-white text-slate-500 touch-none select-none"
          style={{
            width: LOGICAL_CANVAS_WIDTH,
            height: LOGICAL_CANVAS_HEIGHT,
            transform: `translateX(-50%) scale(${displayScale})`,
            transformOrigin: "top center",
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
    </div>
  );
}
