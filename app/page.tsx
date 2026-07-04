import Navbar from "../components/ui/Navbar";
import FeatureCard from "../components/FeatureCard";
import EditorPreview from "../components/EditorPreview";
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
        <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
          Create. Package. Sell.
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-slate-300">
          Design beautiful digital products and prepare them for sale from one
          simple platform.
        </p>

        <div className="flex gap-4">
  <a href="#editor" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500">
    Start Creating
  </a>

  <button className="rounded-xl border border-slate-600 px-6 py-3 font-semibold hover:border-white">
    Learn More
  </button>
</div>
        
      </section>
      <section id="features" className="mx-auto max-w-7xl px-6 pb-24">
  <div className="mb-10 text-center">
    <h2 className="text-3xl font-bold md:text-4xl">
      Why Genvilo?
    </h2>
    <p className="mt-3 text-slate-300">
      Everything creators need to design, export and prepare digital products for sale.
    </p>
  </div>

  <div className="grid gap-6 md:grid-cols-3">
    <FeatureCard
      icon="🎨"
      title="Design Faster"
      description="Create beautiful digital products with a simple, creator-friendly design workspace."
    />

    <FeatureCard
      icon="📦"
      title="Export Ready"
      description="Prepare print-ready files, product downloads and multiple formats from one place."
    />

    <FeatureCard
      icon="🛍️"
      title="Sell Anywhere"
      description="Get your digital products ready for Etsy and other marketplaces without the extra stress."
    />
  </div>
</section>

<section id="editor" className="mx-auto flex max-w-7xl justify-center px-6 pb-24">
  <EditorPreview />
</section>

</main>
  );
}