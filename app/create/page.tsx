import EditorPreview from "../../components/EditorPreview";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-slate-950 p-3 text-white md:p-10">
      <section className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-extrabold mb-4">
          Genvilo Studio
        </h1>

        <p className="text-xl text-slate-300 mb-12">
          Create your digital product below.
        </p>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-0 shadow-xl md:p-8">
          <EditorPreview />
        </div>
      </section>
    </main>
  );
}
