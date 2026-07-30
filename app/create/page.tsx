import type { Metadata } from "next";
import EditorPreview from "../../components/EditorPreview";

export const metadata: Metadata = {
  title: "Gripix Editor",
  description: "Create and refine product assets in the Gripix editor.",
};

type CreatePageProps = {
  searchParams: Promise<{
    product?: string;
    asset?: string;
  }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const { product, asset } = await searchParams;

  return (
    <main className="min-h-dvh w-full max-w-full overflow-x-hidden bg-[var(--editor-workspace)] text-white md:h-dvh md:overflow-hidden">
      <EditorPreview
        fullScreen
        productId={product}
        productAssetId={asset}
      />
    </main>
  );
}
