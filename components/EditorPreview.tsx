export default function EditorPreview() {
  return (
    <div className="mt-16 w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-white">
          YourDesign Editor
        </p>

        <button className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white">
          Export
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
          Templates
          <br />
          Text
          <br />
          Images
          <br />
          AI Tools
        </div>

        <div className="col-span-3 flex h-64 items-center justify-center rounded-xl bg-white text-slate-900">
          <div className="text-center">
            <h3 className="text-2xl font-bold">
              Your Design
            </h3>
            <p>Create something amazing</p>
          </div>
        </div>
      </div>
    </div>
  );
}