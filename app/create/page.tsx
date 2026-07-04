import EditorPreview from "../../components/EditorPreview";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <section className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-extrabold mb-4">
          Genvilo Studio
        </h1>

        <p className="text-xl text-slate-300 mb-12">
          Create your digital product below.
        </p>

        <div className="bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-800">
          <EditorPreview />
        </div>
      </section>
    </main>
  );
}