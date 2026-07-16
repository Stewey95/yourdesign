import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full border-b border-white/10 bg-slate-950 text-white">
      <nav className="relative mx-auto flex min-h-[112px] max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Genvilo logo and company name */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/brand/genvilo-icon-master.png"
            alt="Genvilo"
            width={1536}
            height={1024}
            priority
            className="h-auto w-[90px] object-contain sm:w-[115px]"
          />

          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent sm:text-3xl">
            Genvilo
          </span>
        </Link>

        {/* Centrally positioned desktop navigation */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>

          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>

          <a href="#pricing" className="transition hover:text-white">
            Pricing
          </a>
        </div>

        {/* Account buttons */}
        <div className="flex items-center gap-3">
          <button className="hidden rounded-lg px-4 py-2 text-sm text-slate-300 transition hover:text-white lg:block">
            Log in
          </button>

          <Link
            href="/create"
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 sm:px-4 sm:text-sm"
          >
            Start creating
          </Link>
        </div>
      </nav>
    </header>
  );
}