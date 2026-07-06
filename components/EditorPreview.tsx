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

    if (!file) return;

    const newImage: DesignItem = {
      id: crypto.randomUUID(),
      type: "image",
      src: URL.createObjectURL(file),
      position: { x: 180, y: 120 },
    };

    setItems((items) => [...items, newImage]);
    setSelectedItemId(newImage.id);

    event.target.value = "";
  };

  const addText = () => {
    const newText: DesignItem = {
      id: crypto.randomUUID(),
      type: "text",
      value: "Your text here",
      position: { x: 180, y: 120 },
    };

    setItems((items) => [...items, newText]);
    setSelectedItemId(newText.id);
  };

  const deleteSelected = () => {
    setItems((items) =>
      items.filter((item) => item.id !== selectedItemId)
    );

    setSelectedItemId(null);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingItemId) return;

    const box = event.currentTarget.getBoundingClientRect();

    setItems((items) =>
      items.map((item) =>
        item.id === draggingItemId
          ? {
              ...item,
              position: {
                x: event.clientX - box.left,
                y: event.clientY - box.top,
              },
            }
          : item
      )
    );
  };

  return (
    <div className="mt-16 w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">

      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-white">
          Genvilo Editor
        </p>

        <button className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white">
          Export
        </button>
      </div>


      <div className="grid gap-4 md:grid-cols-4">

        <div className="rounded-xl bg-slate-900 p-4 text-sm">

          <label className="flex h-10 cursor-pointer items-center justify-center rounded-lg bg-blue-600 text-white">
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
            className="mt-3 w-full rounded-lg bg-slate-700 px-4 py-2 text-white"
          >
            Add Text
          </button>


          <button
            onClick={deleteSelected}
            className="mt-3 w-full rounded-lg bg-red-600 px-4 py-2 text-white"
          >
            Delete Selected
          </button>

        </div>


        <div
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDraggingItemId(null)}
          onPointerDown={() => setSelectedItemId(null)}
          className="relative col-span-3 h-64 overflow-hidden rounded-xl bg-white touch-none"
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
                  draggable={false}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDraggingItemId(item.id);
                    setSelectedItemId(item.id);
                  }}
                  className={`absolute max-h-40 max-w-40 cursor-move ${
                    selectedItemId === item.id
                      ? "ring-2 ring-blue-500"
                      : ""
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
              <div
                key={item.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedItemId(item.id);
                }}
                className={`absolute cursor-move ${
                  selectedItemId === item.id
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
                style={{
                  left: item.position.x,
                  top: item.position.y,
                  transform: "translate(-50%, -50%)",
                  width: `${Math.max(
                    item.value.length + 6,
                    12
                  )}ch`,
                }}
              >

                <input
                  value={item.value}

                  onPointerDown={(e) => {
                    e.stopPropagation();

                    if (
                      document.activeElement !== e.currentTarget
                    ) {
                      setDraggingItemId(item.id);
                    }

                    setSelectedItemId(item.id);
                  }}

                  onChange={(e) => {
                    const value = e.target.value;

                    setItems((items) =>
                      items.map((currentItem) =>
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
                    setDraggingItemId(null);
                  }}

                  className="w-full bg-transparent text-center text-3xl font-bold text-slate-900 outline-none"

                />

              </div>
            );

          })}

        </div>
      </div>
    </div>
  );
}