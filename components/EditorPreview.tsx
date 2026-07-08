"use client";

import { useRef, useState } from "react";

type Position = { x: number; y: number };
type Size = { width: number; height: number };

type DesignItem =
  | { id: string; type: "image"; src: string; position: Position; size: Size }
  | {
      id: string;
      type: "text";
      value: string;
      position: Position;
      fontSize: number;
      color: string;
    };

const textColors = [
  "#0f172a",
  "#ffffff",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
];

export default function EditorPreview() {
  const [items, setItems] = useState<DesignItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

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

  const changeTextSize = (id: string, amount: number) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "text"
          ? { ...item, fontSize: Math.max(12, Math.min(140, item.fontSize + amount)) }
          : item
      )
    );
  };

  const changeTextColor = (id: string, color: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "text" ? { ...item, color } : item
      )
    );
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
    };

    setItems((currentItems) => [...currentItems, newText]);
    setSelectedItemId(newText.id);
    setEditingItemId(newText.id);
  };

  const deleteSelected = () => {
    if (!selectedItemId) return;

    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== selectedItemId)
    );

    setSelectedItemId(null);
    setEditingItemId(null);
  };

  const moveItem = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pinchRef.current) return;

    const pending = pendingDragRef.current;
    const canvas = event.currentTarget.getBoundingClientRect();

    if (pending) {
      const movedEnough =
        Math.abs(event.clientX - pending.startX) > 5 ||
        Math.abs(event.clientY - pending.startY) > 5;

      if (movedEnough || pending.moved) {
        pending.moved = true;
        setDraggingItemId(pending.itemId);

        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === pending.itemId
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
      }

      return;
    }

    if (!draggingItemId) return;

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
    if (pendingDragRef.current && !pendingDragRef.current.moved) {
      setEditingItemId(pendingDragRef.current.itemId);
      setSelectedItemId(pendingDragRef.current.itemId);
    }

    pendingDragRef.current = null;
    setDraggingItemId(null);
  };

  const handlePinchStart = (event: React.TouchEvent<HTMLDivElement>, item: DesignItem) => {
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
    setEditingItemId(null);
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
      const change = Math.max(moveEvent.clientX - startX, moveEvent.clientY - startY);

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id && currentItem.type === "image"
            ? {
                ...currentItem,
                size: {
                  width: Math.max(60, startWidth + change),
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
          ref={canvasRef}
          onPointerMove={moveItem}
          onPointerUp={stopDragging}
          onPointerDown={() => {
            setSelectedItemId(null);
            setEditingItemId(null);
          }}
          className="relative col-span-3 h-64 overflow-hidden rounded-xl bg-white text-slate-500 touch-none"
        >
          {items.length === 0 && (
            <p className="flex h-full items-center justify-center">Your design canvas</p>
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
                <div style={{ width: item.size.width, height: item.size.height }}>
                  <img
                    src={item.src}
                    alt="Uploaded design"
                    draggable={false}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDraggingItemId(item.id);
                      setSelectedItemId(item.id);
                      setEditingItemId(null);
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
                <div className="relative">
                  {selectedItemId === item.id && (
                    <div className="absolute -top-20 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => changeTextSize(item.id, -4)}
                          className="rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-white"
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => changeTextSize(item.id, 4)}
                          className="rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-white"
                        >
                          A+
                        </button>
                      </div>

                      <div className="flex gap-1 rounded-full bg-slate-900 px-2 py-1">
                        {textColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => changeTextColor(item.id, color)}
                            className="h-5 w-5 rounded-full border border-white/40"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {editingItemId === item.id ? (
                    <textarea
                      autoFocus
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
                        if (item.value.trim() === "") {
                          setItems((currentItems) =>
                            currentItems.filter(
                              (currentItem) => currentItem.id !== item.id
                            )
                          );
                        }

                        setEditingItemId(null);
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setSelectedItemId(item.id);
                      }}
                      placeholder="Type here"
                      rows={1}
                      className="min-h-[1.2em] w-auto resize-none overflow-visible whitespace-pre-wrap bg-transparent text-center font-bold outline-none touch-none"
                      style={{
                        fontSize: item.fontSize,
                        color: item.color,
                        lineHeight: 1.15,
                        touchAction: "none",
                        width: `${Math.max((item.value || "Type here").length + 1, 9)}ch`,
                      }}
                    />
                  ) : (
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();

                        pendingDragRef.current = {
                          itemId: item.id,
                          startX: e.clientX,
                          startY: e.clientY,
                          moved: false,
                        };

                        setSelectedItemId(item.id);
                      }}
                      className="cursor-move select-none whitespace-pre-wrap text-center font-bold touch-none"
                      style={{
                        fontSize: item.fontSize,
                        color: item.color,
                        lineHeight: 1.15,
                        touchAction: "none",
                      }}
                    >
                      {item.value}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}