"use client";

import { useRef, useState } from "react";

type Position = { x: number; y: number };
type Size = { width: number; height: number };

type DesignItem =
  | { id: string; type: "image"; src: string; position: Position; size: Size }
  | { id: string; type: "text"; value: string; position: Position; fontSize: number };

export default function EditorPreview() {
  const [items, setItems] = useState<DesignItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newImage: DesignItem = {
      id: crypto.randomUUID(),
      type: "image",
      src: URL.createObjectURL(file),
      position: { x: 180, y: 120 },
      size: { width: 160, height: 160 },
    };

    setItems((currentItems) => [...currentItems, newImage]);
    setSelectedItemId(newImage.id);
    event.target.value = "";
  };

  const addText = () => {
    const newText: DesignItem = {
      id: crypto.randomUUID(),
      type: "text",
      value: "",
      position: { x: 180, y: 120 },
      fontSize: 32,
    };

    setItems((currentItems) => [...currentItems, newText]);
    setSelectedItemId(newText.id);
  };

  const deleteSelected = () => {
    if (!selectedItemId) return;

    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== selectedItemId)
    );

    setSelectedItemId(null);
  };

  const moveItem = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingItemId || pinchRef.current) return;

    const canvas = event.currentTarget.getBoundingClientRect();

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === draggingItemId
          ? {
              ...item,
              position: {
                x: event.clientX - canvas.left,
                y: event.clientY - canvas.top,
              },
            }
          : item
      )
    );
  };

  const stopDragging = () => {
    setDraggingItemId(null);
  };

  const handlePinchStart = (
    event: React.TouchEvent<HTMLDivElement>,
    item: DesignItem
  ) => {
    if (event.touches.length !== 2) return;

    event.preventDefault();
    event.stopPropagation();

    pinchRef.current = {
      itemId: item.id,
      itemType: item.type,
      startDistance: getTouchDistance(event.touches),
      startWidth: item.type === "image" ? item.size.width : undefined,
      startHeight: item.type === "image" ? item.size.height : undefined,
      startFontSize: item.type === "text" ? item.fontSize : undefined,
    };

    setDraggingItemId(null);
    setSelectedItemId(item.id);
  };

  const handlePinchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !pinchRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    const newDistance = getTouchDistance(event.touches);
    const scale = newDistance / pinchRef.current.startDistance;

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== pinchRef.current?.itemId) return item;

        if (item.type === "image") {
          return {
            ...item,
            size: {
              width: Math.max(60, (pinchRef.current.startWidth || 160) * scale),
              height: Math.max(60, (pinchRef.current.startHeight || 160) * scale),
            },
          };
        }

        return {
          ...item,
          fontSize: Math.max(
            12,
            Math.min(140, (pinchRef.current.startFontSize || 32) * scale)
          ),
        };
      })
    );
  };

  const handlePinchEnd = () => {
    pinchRef.current = null;
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
      const changeX = moveEvent.clientX - startX;
      const changeY = moveEvent.clientY - startY;
      const change = Math.max(changeX, changeY);

      const newSize = Math.max(60, startWidth + change);

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id && currentItem.type === "image"
            ? {
                ...currentItem,
                size: {
                  width: newSize,
                  height: Math.max(60, startHeight + change),
                },
              }
            : currentItem
        )
      );
    };

    const stopResize = () => {
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stopResize);
    };

    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stopResize);
  };

  return (
    <div className="mt-16 w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-white">Genvilo Editor</p>

        <button className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1 text-sm text-white">
          Export
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
          <label className="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 font-semibold text-white">
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={addText}
            className="mt-3 w-full cursor-pointer rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white"
          >
            Add Text
          </button>

          <button
            onClick={deleteSelected}
            className="mt-3 w-full cursor-pointer rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
          >
            Delete Selected
          </button>
        </div>

        <div
          onPointerMove={moveItem}
          onPointerUp={stopDragging}
          onPointerDown={() => setSelectedItemId(null)}
          className="relative col-span-3 h-64 overflow-hidden rounded-xl bg-white text-slate-500 touch-none"
        >
          {items.length === 0 && (
            <p className="flex h-full items-center justify-center">
              Your design canvas
            </p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              onTouchStart={(e) => handlePinchStart(e, item)}
              onTouchMove={handlePinchMove}
              onTouchEnd={handlePinchEnd}
              className={`absolute ${
  selectedItemId === item.id && item.type === "image"
    ? "ring-2 ring-blue-500"
    : ""
}`}
              style={{
                left: item.position.x,
                top: item.position.y,
                transform: "translate(-50%, -50%)",
              }}
            >
              {item.type === "image" && (
                <div
                  style={{
                    width: item.size.width,
                    height: item.size.height,
                  }}
                >
                  <img
                    src={item.src}
                    alt="Uploaded design"
                    draggable={false}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDraggingItemId(item.id);
                      setSelectedItemId(item.id);
                    }}
                    className="h-full w-full cursor-move select-none rounded-lg object-contain"
                  />

                  {selectedItemId === item.id && (
                    <div
                      onPointerDown={(e) => startImageResize(e, item)}
                      className="absolute bottom-0 right-0 hidden h-5 w-5 cursor-se-resize rounded-full bg-blue-500 md:block"
                    />
                  )}
                </div>
              )}

              {item.type === "text" && (
                <textarea
                  value={item.value}
                  onChange={(e) => {
                    const value = e.target.value;

                    setItems((currentItems) =>
                      currentItems.map((currentItem) =>
                        currentItem.id === item.id
                          ? { ...currentItem, value }
                          : currentItem
                      )
                    );
                  }}
                  onBlur={() => {
                    if (item.value === "") {
                      setItems((currentItems) =>
                        currentItems.filter(
                          (currentItem) => currentItem.id !== item.id
                        )
                      );
                    }
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();

                    if (document.activeElement !== e.currentTarget) {
                      setDraggingItemId(item.id);
                    }

                    setSelectedItemId(item.id);
                  }}
                  placeholder="Type here"
                  rows={1}
                  className="min-h-[1.2em] w-auto resize-none overflow-visible whitespace-pre-wrap bg-transparent text-center font-bold text-slate-900 outline-none touch-none cursor-move"
                  style={{
  fontSize: item.fontSize,
  lineHeight: 1.15,
  touchAction: "none",
}}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}