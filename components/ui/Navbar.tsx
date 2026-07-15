import Image from "next/image";
export default function Navbar() {
  return (
    <header className="w-full border-b border-white/10 bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
       <div className="flex items-center">
  <Image
  src="/brand/genvilo-icon-master.png"
  alt="Genvilo"
  width={1536}
  height={1024}
  priority
  className="h-auto w-[245px] object-contain sm:w-[375px]"
/>
</div>

        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how-it-works" className="hover:text-white">How it works</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white sm:block">
            Log in
          </button>

          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            Start creating
          </button>
        </div>
      </nav>
    </header>
  );
}