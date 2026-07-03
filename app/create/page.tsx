export default function CreatePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-5xl font-bold mb-4">
        YourDesign Studio
      </h1>

      <p className="text-slate-300 mb-10">
        Create your digital product below.
      </p>

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-slate-900 rounded-xl p-5">
          <h2 className="font-bold mb-4">
            Tools
          </h2>

          <button className="bg-blue-600 rounded-xl px-4 py-2 w-full mb-3">
            Upload Image
          </button>

          <button className="bg-slate-700 rounded-xl px-4 py-2 w-full">
            Add Text
          </button>
        </div>


        <div className="col-span-3 bg-white rounded-xl h-[500px] flex items-center justify-center text-slate-500">

          Your design canvas

        </div>

      </div>
    </main>
  );
}