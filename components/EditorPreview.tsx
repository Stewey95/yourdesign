"use client";

import { useState } from "react";

type Position = {
  x: number;
  y: number;
};

type DesignItem =
  | {
      id: string;
      type: "image";
      src: string;
      position: Position;
    }
  | {
      id: string;
      type: "text";
      value: string;
      position: Position;
    };

export default function EditorPreview() {
  const [items, setItems] = useState<DesignItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const newImage: DesignItem = {
        id: crypto.randomUUID(),
        type: "image",
        src: URL.createObjectURL(file),
        position: { x: 180, y: 120 },
      };

      setItems((currentItems) => [...currentItems, newImage]);
      setSelectedItemId(newImage.id);
      event.target.value = "";
    }
  };

  const addText = () => {
    const newText: DesignItem = {
      id: crypto.randomUUID(),
      type: "text",
      value: "Your text here",
      position: { x: 180, y: 120 },
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

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingItemId) return;

    const canvas = event.currentTarget.getBoundingClientRect();

    const newPosition = {
      x: event.clientX - canvas.left,
      y: event.clientY - canvas.top,
    };

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === draggingItemId
          ? { ...item, position: newPosition }
          : item
      )
    );
  };

  const stopDragging = () => {
    setDraggingItemId(null);
  };

  return (
    <div className="mt-16 w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-white">Genvilo Editor</p>

        <button className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white">
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
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerLeave={() => {}}
          onPointerDown={() => setSelectedItemId(null)}
          className="relative col-span-3 h-64 overflow-hidden rounded-xl bg-white text-slate-500 touch-none"
        >
          {items.length === 0 && (
            <p className="flex h-full items-center justify-center">
              Your design canvas
            </p>
          )}

          {items.map((item) => {
            if (item.type === "image") {
              return (
                <img
                  key={item.id}
                  src={item.src}
                  alt="Uploaded design"
                  draggable={false}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDraggingItemId(item.id);
                    setSelectedItemId(item.id);
                  }}
                  className={`absolute max-h-40 max-w-40 cursor-move select-none rounded-lg ${
                    selectedItemId === item.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  style={{
                    left: item.position.x,
                    top: item.position.y,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              );
            }

            return (
              <input
                key={item.id}
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
                    setSelectedItemId(null);
                  }
                }}



placeholder="Type here"
className={`absolute w-auto min-w-0 cursor-text bg-transparent text-center text-3xl font-bold text-slate-900 outline-none ${
  selectedItemId === item.id ? "ring-2 ring-blue-500" : ""
}`}
style={{
  left: item.position.x,
  top: item.position.y,
  transform: "translate(-50%, -50%)",
  width: `${Math.max(item.value.length + 3, 6)}ch`,
}}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}