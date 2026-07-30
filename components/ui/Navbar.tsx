"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "What’s Coming", href: "#roadmap" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoClick = (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    setMobileMenuOpen(false);

    if (pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="platform-header sticky top-0 z-50 w-full">
      <nav
        aria-label="Main navigation"
        className="platform-container relative flex h-18 items-center justify-between"
      >
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Image
            src="/brand/genvilo-icon-master.png"
            alt=""
            width={1536}
            height={1024}
            priority
            className="h-auto w-10 object-contain"
          />
          <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Gripix
          </span>
          <span className="sr-only">Gripix home</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-950 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {item.label}
              <span className="absolute inset-x-0 bottom-0 h-0.5 origin-center scale-x-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-transform duration-200 group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none" />
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <Link
            href="/studio/new"
            className="studio-button studio-button-primary"
          >
            New Product
          </Link>
        </div>

        <button
          type="button"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="studio-button studio-button-secondary h-11 w-11 p-0 md:hidden"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="animate-in fade-in slide-in-from-top-2 studio-card absolute left-4 right-4 top-[calc(100%+0.5rem)] p-3 shadow-[var(--studio-shadow-popover)] duration-200 motion-reduce:animate-none md:hidden"
          >
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-50 hover:text-slate-950 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 motion-reduce:transition-none"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/studio/new"
              onClick={() => setMobileMenuOpen(false)}
              className="studio-button studio-button-primary mt-2 w-full"
            >
              New Product
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
