"use client";

import { useRef, useState } from "react";
import ImageToolbar from "./ImageToolbar";
import AlignmentGuides from "./editor/AlignmentGuides";
import CanvasImageItem from "./editor/CanvasImageItem";
import EditorHeader from "./editor/EditorHeader";
import EditorSidebar from "./editor/EditorSidebar";
import TextToolbar from "./editor/TextToolbar";
import { SNAP_THRESHOLD } from "./editor/editor.constants";
import type {
  DesignItem,
  Position,
} from "./editor/editor.types";

export default function EditorPreview() {
  const [items, setItems] = useState<DesignItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showImageAdjustments, setShowImageAdjustments] = useState(false);
  const [activeToolbarPanel, setActiveToolbarPanel] = useState<
  "media" | "text" | "arrange" | "effects" | null
>(null);
  const [alignmentGuides, setAlignmentGuides] = useState({
  vertical: false,
  horizontal: false,
});

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const hideAlignmentGuides = () => {
  setAlignmentGuides({
    vertical: false,
    horizontal: false,
  });
};
const getSnappedPosition = (
  event: React.PointerEvent<HTMLDivElement>,
  canvasBounds: DOMRect
): Position => {
  const rawX = event.clientX - canvasBounds.left;
  const rawY = event.clientY - canvasBounds.top;

  const canvasCentreX = canvasBounds.width / 2;
  const canvasCentreY = canvasBounds.height / 2;
  const activeSnapThreshold =
  event.pointerType === "touch" ? 18 : SNAP_THRESHOLD;

  const snapToVerticalCentre =
    Math.abs(rawX - canvasCentreX) <= activeSnapThreshold;

  const snapToHorizontalCentre =
    Math.abs(rawY - canvasCentreY) <= activeSnapThreshold;

  setAlignmentGuides({
    vertical: snapToVerticalCentre,
    horizontal: snapToHorizontalCentre,
  });

  return {
    x: snapToVerticalCentre ? canvasCentreX : rawX,
    y: snapToHorizontalCentre ? canvasCentreY : rawY,
  };
};
  const justPinchedRef = useRef(false);

  const selectedTextItem = items.find(
    (item): item is Extract<DesignItem, { type: "text" }> =>
      item.id === selectedItemId && item.type === "text"
  );

  const selectedImageItem = items.find(
    (item): item is Extract<DesignItem, { type: "image" }> =>
      item.id === selectedItemId && item.type === "image"
  );
    const selectedItemIndex = items.findIndex(
    (item) => item.id === selectedItemId
  );

  const canSendBackward = selectedItemIndex > 0;

  const canBringForward =
    selectedItemIndex !== -1 &&
    selectedItemIndex < items.length - 1;

  const pendingDragRef = useRef<{
    itemId: string;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const pinchRef = useRef<{
    itemId: string;
    itemType: "image" | "text";
    startDistance: number;
    startWidth?: number;
    startHeight?: number;
    startFontSize?: number;
  } | null>(null);

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;

    return Math.sqrt(dx * dx + dy * dy);
  };

  const clearSelection = () => {
    if (selectedItemId) {
      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            !(
              item.id === selectedItemId &&
              item.type === "text" &&
              item.value.trim() === ""
            )
        )
      );
    }

    setSelectedItemId(null);
    setEditingItemId(null);
    setShowImageAdjustments(false);
    hideAlignmentGuides();
  };

  const changeTextSize = (id: string, amount: number) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "text"
          ? {
              ...item,
              fontSize: Math.max(
                12,
                Math.min(140, item.fontSize + amount)
              ),
            }
          : item
      )
    );
  };

  const changeTextColor = (id: string, color: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "text"
          ? { ...item, color }
          : item
      )
    );
  };

  const changeTextFont = (id: string, fontFamily: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "text"
          ? { ...item, fontFamily }
          : item
      )
    );
  };
  const fitTextInsideCanvas = (
  id: string,
  textarea: HTMLTextAreaElement
) => {
  const canvas = canvasRef.current;

  if (!canvas) return;

  const maximumTextHeight =
    canvas.clientHeight * 0.82;

  if (textarea.scrollHeight <= maximumTextHeight) {
    return;
  }

  setItems((currentItems) =>
    currentItems.map((item) => {
      if (item.id !== id || item.type !== "text") {
        return item;
      }

      const scale =
        maximumTextHeight / textarea.scrollHeight;

      return {
        ...item,
        fontSize: Math.max(
          12,
          Math.floor(item.fontSize * scale)
        ),
      };
    })
  );
};

  const rotateItem = (id: string, amount: number) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              rotation: item.rotation + amount,
            }
          : item
      )
    );
  };
    const moveItemLayer = (
    id: string,
    direction:
  | "forward"
  | "backward"
  | "front"
  | "back"
  ) => {
    setItems((currentItems) => {
      const currentIndex = currentItems.findIndex(
        (item) => item.id === id
      );

      if (currentIndex === -1) {
        return currentItems;
      }
      if (direction === "front") {
  if (currentIndex === currentItems.length - 1) {
    return currentItems;
  }

  const reorderedItems = [...currentItems];

  const [selectedItem] = reorderedItems.splice(
    currentIndex,
    1
  );

  reorderedItems.push(selectedItem);

  return reorderedItems;
}
if (direction === "back") {
  if (currentIndex === 0) {
    return currentItems;
  }

  const reorderedItems = [...currentItems];

  const [selectedItem] = reorderedItems.splice(
    currentIndex,
    1
  );

  reorderedItems.unshift(selectedItem);

  return reorderedItems;
}

      const targetIndex =
        direction === "forward"
          ? currentIndex + 1
          : currentIndex - 1;

      if (
        targetIndex < 0 ||
        targetIndex >= currentItems.length
      ) {
        return currentItems;
      }

      const reorderedItems = [...currentItems];

      [
        reorderedItems[currentIndex],
        reorderedItems[targetIndex],
      ] = [
        reorderedItems[targetIndex],
        reorderedItems[currentIndex],
      ];

      return reorderedItems;
    });
  };

  const changeImageAdjustment = (
    id: string,
    adjustment: "brightness" | "contrast" | "saturation" | "opacity",
    value: number
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "image"
          ? {
              ...item,
              [adjustment]: value,
            }
          : item
      )
    );
  };

  const resetImageAdjustments = (id: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "image"
          ? {
              ...item,
              brightness: 100,
              contrast: 100,
              saturation: 100,
              opacity: 100,
            }
          : item
      )
    );
  };

  const startCanvasPinch = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    if (event.touches.length !== 2 || !selectedItemId) return;

    const selectedItem = items.find(
      (item) => item.id === selectedItemId
    );

    if (!selectedItem) return;

    event.preventDefault();
    event.stopPropagation();

    pinchRef.current = {
      itemId: selectedItem.id,
      itemType: selectedItem.type,
      startDistance: getTouchDistance(event.touches),
      startWidth:
        selectedItem.type === "image"
          ? selectedItem.size.width
          : undefined,
      startHeight:
        selectedItem.type === "image"
          ? selectedItem.size.height
          : undefined,
      startFontSize:
        selectedItem.type === "text"
          ? selectedItem.fontSize
          : undefined,
    };

    justPinchedRef.current = true;
    pendingDragRef.current = null;
    setDraggingItemId(null);

    if (selectedItem.type === "image") {
      setEditingItemId(null);
    }
  };

  const moveCanvasPinch = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    if (event.touches.length !== 2 || !pinchRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    const newDistance = getTouchDistance(event.touches);
    const scale =
      newDistance / pinchRef.current.startDistance;

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== pinchRef.current?.itemId) {
          return item;
        }

        if (item.type === "image") {
          return {
            ...item,
            size: {
              width: Math.max(
                60,
                (pinchRef.current.startWidth || 160) * scale
              ),
              height: Math.max(
                60,
                (pinchRef.current.startHeight || 160) * scale
              ),
            },
          };
        }

        return {
          ...item,
          fontSize: Math.max(
            12,
            Math.min(
              140,
              (pinchRef.current.startFontSize || 32) * scale
            )
          ),
        };
      })
    );
  };

  const endCanvasPinch = () => {
    if (pinchRef.current) {
      justPinchedRef.current = true;

      setTimeout(() => {
        justPinchedRef.current = false;
      }, 500);
    }

    pinchRef.current = null;
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const newImage: DesignItem = {
      id: crypto.randomUUID(),
      type: "image",
      src: URL.createObjectURL(file),
      position: { x: 180, y: 120 },
      size: { width: 160, height: 160 },
      rotation: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      opacity: 100,
    };

    setItems((currentItems) => [
      ...currentItems,
      newImage,
    ]);

    setSelectedItemId(newImage.id);
    setEditingItemId(null);
    setShowImageAdjustments(false);

    event.target.value = "";
  };

  const addText = () => {
    const canvas = canvasRef.current;

    const canvasWidth = canvas?.clientWidth || 360;
    const canvasHeight = canvas?.clientHeight || 256;

    const newText: DesignItem = {
      id: crypto.randomUUID(),
      type: "text",
      value: "",
      position: {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
      },
      fontSize: 32,
      color: "#0f172a",
      fontFamily: "Arial",
      rotation: 0,
    };

    setItems((currentItems) => [
      ...currentItems,
      newText,
    ]);

    setSelectedItemId(newText.id);
    setEditingItemId(null);
    setShowImageAdjustments(false);

    setTimeout(() => {
      canvasRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const deleteSelected = () => {
    if (!selectedItemId) return;

    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== selectedItemId
      )
    );

    setSelectedItemId(null);
    setEditingItemId(null);
    setShowImageAdjustments(false);
  };

  const moveItem = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (pinchRef.current) return;

    const pending = pendingDragRef.current;
    const canvas =
      event.currentTarget.getBoundingClientRect();

    if (pending) {
      const movedEnough =
        Math.abs(event.clientX - pending.startX) > 5 ||
        Math.abs(event.clientY - pending.startY) > 5;

      if (movedEnough || pending.moved) {
        pending.moved = true;

        setDraggingItemId(pending.itemId);
        setEditingItemId(null);

        setItems((currentItems) =>
  currentItems.map((item) =>
    item.id === pending.itemId
      ? {
          ...item,
          position: getSnappedPosition(
            event,
            canvas
          ),
        }
      : item
  )
);
      }

      return;
    }

    if (!draggingItemId) return;

    setEditingItemId(null);

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === draggingItemId
          ? {
              ...item,
              position: getSnappedPosition(
                event,
                canvas
              ),
            }
          : item
      )
    );
  };

  const stopDragging = () => {
  hideAlignmentGuides();

  requestAnimationFrame(() => {
    hideAlignmentGuides();
  });
    if (justPinchedRef.current) {
      pendingDragRef.current = null;
      setDraggingItemId(null);

      return;
    }

    if (
      pendingDragRef.current &&
      !pendingDragRef.current.moved
    ) {
      setEditingItemId(
        pendingDragRef.current.itemId
      );

      setSelectedItemId(
        pendingDragRef.current.itemId
      );
    }

    pendingDragRef.current = null;
    setDraggingItemId(null);
  };

  const startImageResize = (
    event: React.PointerEvent<HTMLDivElement>,
    item: Extract<DesignItem, { type: "image" }>
  ) => {
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = item.size.width;
    const startHeight = item.size.height;

    const resize = (moveEvent: PointerEvent) => {
      const change = Math.max(
        moveEvent.clientX - startX,
        moveEvent.clientY - startY
      );

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id &&
          currentItem.type === "image"
            ? {
                ...currentItem,
                size: {
                  width: Math.max(
                    60,
                    startWidth + change
                  ),
                  height: Math.max(
                    60,
                    startHeight + change
                  ),
                },
              }
            : currentItem
        )
      );
    };

    const stopResize = () => {
      window.removeEventListener(
        "pointermove",
        resize
      );

      window.removeEventListener(
        "pointerup",
        stopResize
      );
    };

    window.addEventListener(
      "pointermove",
      resize
    );

    window.addEventListener(
      "pointerup",
      stopResize
    );
  };
  const toggleImageAdjustments = () => {
  setShowImageAdjustments((currentValue) => {
    const nextValue = !currentValue;

    if (nextValue) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          canvasRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        });
      });
    }

    return nextValue;
  });
};

  return (
    <div className="mx-auto mt-16 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <EditorHeader
        canDelete={Boolean(selectedItemId)}
        onDelete={deleteSelected}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <EditorSidebar
          activeToolbarPanel={activeToolbarPanel}
          onToolbarPanelChange={setActiveToolbarPanel}
          onImageUpload={handleImageUpload}
          onAddText={addText}
        />

        <div className="min-w-0 md:col-span-3">
          <div className="mb-3 min-h-[72px]"></div>
         <div className="mb-3 min-h-[72px]">
  {selectedTextItem && (
    <TextToolbar
      item={selectedTextItem}
      canSendBackward={canSendBackward}
      canBringForward={canBringForward}
      onChangeTextSize={changeTextSize}
      onRotateItem={rotateItem}
      onMoveItemLayer={moveItemLayer}
      onChangeTextColor={changeTextColor}
      onChangeTextFont={changeTextFont}
    />
  )}

  {selectedImageItem && (
    <ImageToolbar
      item={selectedImageItem}
      showAdjustments={showImageAdjustments}
      canBringForward={canBringForward}
      canSendBackward={canSendBackward}
      onToggleAdjustments={toggleImageAdjustments}
      onRotate={rotateItem}
      onBringForward={(id) =>
        moveItemLayer(id, "forward")
      }
      onSendBackward={(id) =>
        moveItemLayer(id, "backward")
      }
      onBringToFront={(id) =>
        moveItemLayer(id, "front")
      }
      onSendToBack={(id) =>
        moveItemLayer(id, "back")
      }
      onAdjustmentChange={changeImageAdjustment}
      onResetAdjustments={resetImageAdjustments}
    />
  )}
</div>

          <div
            ref={canvasRef}
            onTouchStartCapture={startCanvasPinch}
            onTouchMoveCapture={moveCanvasPinch}
            onTouchEndCapture={() => {
  endCanvasPinch();
  stopDragging();
}}
onTouchCancelCapture={() => {
  endCanvasPinch();
  stopDragging();
}}
            onPointerMove={moveItem}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse") {
                clearSelection();
              }
            }}
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
              vertical={alignmentGuides.vertical}
              horizontal={alignmentGuides.horizontal}
            />

            {items.map((item) =>
              item.type === "image" ? (
                <CanvasImageItem
                  key={item.id}
                  item={item}
                  selected={selectedItemId === item.id}
                  onPointerDown={(id) => {
                    setDraggingItemId(id);
                    setSelectedItemId(id);
                    setEditingItemId(null);
                    setShowImageAdjustments(false);
                  }}
                  onResizeStart={startImageResize}
                />
              ) : (
              <div
                key={item.id}
                className="absolute"
                style={{
                  left: item.position.x,
                  top: item.position.y,
                  width: "max-content",
                  transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                  touchAction: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                }}
              >
                  <div className="relative">
                    {editingItemId === item.id ? (
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
 fitTextInsideCanvas(item.id, textarea);

requestAnimationFrame(() => {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
  textarea.scrollTop = 0;
});

setItems((currentItems) =>
                            currentItems.map(
                              (currentItem) =>
                                currentItem.id === item.id
                                  ? {
                                      ...currentItem,
                                      value,
                                    }
                                  : currentItem
                            )
                          );
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
                              setItems((currentItems) =>
                                currentItems.filter(
                                  (currentItem) =>
                                    currentItem.id !==
                                    item.id
                                )
                              );
                            }

                            setEditingItemId(null);
                          }, 0);
                        }}
                      onPointerDown={(event) => {
  event.stopPropagation();

  pendingDragRef.current = null;
  setDraggingItemId(null);
  setSelectedItemId(item.id);
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

                          pendingDragRef.current = {
                            itemId: item.id,
                            startX: event.clientX,
                            startY: event.clientY,
                            moved: false,
                          };

                          setSelectedItemId(item.id);
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
              </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
