"use client";

import { useState } from "react";

export default function EditorPreview() {
  const [image, setImage] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="mt-16 w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-white">YourDesign Editor</p>

        <button className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white">
          Export
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
<label className="flex h-10 items-center justify-center w-full cursor-pointer rounded-lg bg-blue-600 px-4 font-semibold text-white">
  Upload Image
  <input
    type="file"
    accept="image/*"
    onChange={handleImageUpload}
    className="hidden"
  />
</label>

         <button className="w-full rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white">
            Add Text
          </button>
          </div>
        

        <div className="col-span-3 flex h-64 items-center justify-center rounded-xl bg-white text-slate-500">
          {image ? (
            <img
              src={image}
              alt="Uploaded design"
              className="max-h-full max-w-full rounded-lg"
            />
          ) : (
            <p>Your design canvas</p>
          )}
        </div>
      </div>
    
  );
}