import type { Metadata } from "next";
import EditorPreview from "../../components/EditorPreview";

export const metadata: Metadata = {
  title: "Genvilo Editor",
  description: "Create and export designs in the Genvilo editor.",
};

export default function CreatePage() {
  return (
    <main className="min-h-dvh bg-slate-950 text-white md:h-dvh md:overflow-hidden">
      <EditorPreview fullScreen />
    </main>
  );
}
