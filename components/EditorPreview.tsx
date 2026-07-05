"use client";

import { useState } from "react";

type Position = {
  x: number;
  y: number;
};

export default function EditorPreview() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);

  const [imagePosition, setImagePosition] = useState<Position>({ x: 80, y: 60 });
  const [textPosition, setTextPosition] = useState<Position>({ x: 120, y: 120 });

  const [dragging, setDragging] = useState<"image" | "text" | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const canvas = event.currentTarget.getBoundingClientRect();

    const newPosition = {
      x: event.clientX - canvas.left,
      y: event.clientY - canvas.top,
    };

    if (dragging === "image") {
      setImagePosition(newPosition);
    }

    if (dragging === "text") {
      setTextPosition(newPosition);
    }
  };

  const stopDragging = () => {
    setDragging(null);
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
            onClick={() => setText("Your text here")}
            className="mt-3 w-full cursor-pointer rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white"
          >
            Add Text
          </button>
        </div>

        <div
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerLeave={stopDragging}
          className="relative col-span-3 h-64 overflow-hidden rounded-xl bg-white text-slate-500 touch-none"
        >
          {!image && text === null && (
            <p className="flex h-full items-center justify-center">
              Your design canvas
            </p>
          )}

          {image && (
            <img
  src={image}
  alt="Uploaded design"
  draggable={false}
  onPointerDown={() => setDragging("image")}
  className="absolute max-h-40 max-w-40 cursor-move select-none rounded-lg"
              style={{
                left: imagePosition.x,
                top: imagePosition.y,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}

          {text !== null && (
            <input
              value={text}
            onChange={(e) => setText(e.target.value)}
onBlur={() => {
  if (text === "") {
    setText(null);
  }
}}
              onPointerDown={() => setDragging("text")}
              placeholder="Type here"
              className="absolute cursor-move bg-transparent text-center text-3xl font-bold text-slate-900 outline-none"
              style={{
                left: textPosition.x,
                top: textPosition.y,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}