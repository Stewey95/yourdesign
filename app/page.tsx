import Navbar from "@/components/ui/Navbar";

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
          <button className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500">
            Start Creating
          </button>

          <button className="rounded-xl border border-slate-600 px-6 py-3 font-semibold hover:border-white">
            Learn More
          </button>
        </div>
      </section>
    </main>
  );
}