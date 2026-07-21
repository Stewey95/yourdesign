import type { Metadata } from "next";
import EditorPreview from "../../components/EditorPreview";

export const metadata: Metadata = {
  title: "Gripix Editor",
  description: "Create and export designs in the Gripix editor.",
};

export default function CreatePage() {
  return (
    <main className="min-h-dvh bg-slate-950 text-white md:h-dvh md:overflow-hidden">
      <EditorPreview fullScreen />
    </main>
  );
}
