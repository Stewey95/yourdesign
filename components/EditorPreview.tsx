"use client";

import { useState } from "react";

export default function EditorPreview() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const addText = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        type: "text",
        value: "Your text here",
        position: { x: 250, y: 250 },
      },
    ]);
  };

  const deleteSelected = () => {
    setItems(items.filter((item) => item.id !== selectedItemId));
    setSelectedItemId(null);
  };

  const startDrag = (id: string) => {
    setDraggingItemId(id);
    setSelectedItemId(id);
  };

  const moveItem = (e: any) => {
    if (!draggingItemId) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x =
      (e.clientX || e.touches?.[0]?.clientX) - rect.left;

    const y =
      (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === draggingItemId
          ? { ...item, position: { x, y } }
          : item
      )
    );
  };

  const stopDrag = () => {
    setDraggingItemId(null);
  };

  return (
    <div className="mt-16 w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-8">

      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-white">
          Genvilo Editor
        </p>

        <button className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white">
          Export
        </button>
      </div>

      <div className="grid gap-4">
        <button className="rounded-lg bg-blue-600 px-3 py-3 text-white">
          Upload Image
        </button>

        <button
          onClick={addText}
          className="rounded-lg bg-slate-600 px-3 py-3 text-white"
        >
          Add Text
        </button>

        <button
          onClick={deleteSelected}
          className="rounded-lg bg-red-600 px-3 py-3 text-white"
        >
          Delete Selected
        </button>
      </div>


      <div
        onMouseMove={moveItem}
        onTouchMove={moveItem}
        onMouseUp={stopDrag}
        onTouchEnd={stopDrag}
        className="relative mt-8 h-[500px] overflow-hidden rounded-xl bg-white"
      >

        {items.map((item) => (
          <div key={item.id}>

            {item.type === "text" && (
              <input
                value={item.value}

                onChange={(e) => {
                  const value = e.target.value;

                  if (value === "") {
                    setItems((currentItems) =>
                      currentItems.filter(
                        (currentItem) =>
                          currentItem.id !== item.id
                      )
                    );
                    return;
                  }

                  setItems((currentItems) =>
                    currentItems.map((currentItem) =>
                      currentItem.id === item.id
                        ? { ...currentItem, value }
                        : currentItem
                    )
                  );
                }}

                onMouseDown={() => startDrag(item.id)}

                onTouchStart={(e) => {
                  if (
                    document.activeElement === e.currentTarget
                  ) {
                    return;
                  }

                  startDrag(item.id);
                }}

                onFocus={() =>
                  setSelectedItemId(item.id)
                }

                className={`absolute bg-transparent text-center text-3xl font-bold text-slate-900 outline-none ${
                  selectedItemId === item.id
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}

                style={{
                  left: item.position.x,
                  top: item.position.y,
                  transform:
                    "translate(-50%, -50%)",
                  width: "320px",
                  maxWidth: "90vw",
                }}
              />
            )}

          </div>
        ))}

      </div>
    </div>
  );
}