"use client";

import {
  Check,
  Cloud,
  Download,
  FileImage,
  Gauge,
  History,
  LayoutTemplate,
  MonitorSmartphone,
  MousePointer2,
  Plus,
  RotateCcw,
  Shapes,
  Sparkles,
  Type,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect } from "react";
import Navbar from "../components/ui/Navbar";

const LANDING_SCROLL_RESET_SCRIPT = `
  (() => {
    try {
      const entry = performance.getEntriesByType("navigation")[0];
      const navigationType = entry?.type;

      if (navigationType === "back_forward") return;

      const root = document.documentElement;
      root.dataset.landingScrollResetActive = "true";
      root.dataset.landingPreviousScrollRestoration =
        history.scrollRestoration;
      history.scrollRestoration = "manual";

      scrollTo(0, 0);
      addEventListener(
        "pageshow",
        (event) => {
          if (
            event.persisted ||
            root.dataset.landingScrollResetActive !== "true"
          ) {
            return;
          }

          scrollTo(0, 0);
        },
        { once: true }
      );
    } catch {}
  })();
`;

const benefits = [
  { icon: Zap, title: "Fast Editing", text: "Create without a steep learning curve." },
  { icon: MonitorSmartphone, title: "Mobile & Desktop", text: "Design wherever your ideas happen." },
  { icon: Download, title: "High-Quality Export", text: "Download polished PNG, JPG and PDF files." },
  { icon: Cloud, title: "Automatic Draft Saving", text: "Your latest design is protected locally." },
];

const features = [
  { icon: LayoutTemplate, title: "Canvas Presets", text: "Start with landscape, portrait or square dimensions." },
  { icon: FileImage, title: "PNG, JPG & PDF", text: "Export in the format and quality your project needs." },
  { icon: Cloud, title: "Auto Draft Recovery", text: "Return after a refresh and carry on where you left off." },
  { icon: History, title: "Undo & Redo", text: "Explore ideas freely with reliable editing history." },
  { icon: Plus, title: "New Design", text: "Clear your canvas safely whenever inspiration strikes." },
  { icon: MonitorSmartphone, title: "Made for Every Screen", text: "A thoughtful editing experience on mobile and desktop." },
];

const completed = ["Export", "Draft Recovery", "Mobile Editor", "Canvas Presets"];
const comingNext = ["Duplicate", "Layers", "Lock and Unlock", "Universal Search", "Templates", "Saved Projects"];

function EditorPreviewMockup() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-r from-blue-200/50 via-cyan-100/40 to-purple-200/50 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 p-2 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.55)] sm:rounded-3xl sm:p-3">
        <div className="flex items-center justify-between border-b border-white/10 px-2 pb-2 sm:px-3 sm:pb-3">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/genvilo-icon-master.png"
              alt=""
              width={1536}
              height={1024}
              className="h-auto w-8 object-contain"
            />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-sm font-bold text-transparent">
              Editor
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-7 w-7 rounded-full bg-slate-800 text-center text-sm leading-7 text-slate-400">↶</span>
            <span className="h-7 w-7 rounded-full bg-slate-800 text-center text-sm leading-7 text-slate-400">↷</span>
            <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white sm:text-xs">Export</span>
          </div>
        </div>

        <div className="grid min-h-[270px] grid-cols-[64px_minmax(0,1fr)] gap-2 pt-2 sm:min-h-[420px] sm:grid-cols-[150px_minmax(0,1fr)_135px] sm:gap-3 sm:pt-3">
          <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900 p-2 sm:p-3">
            {[
              [FileImage, "Media"],
              [Type, "Text"],
              [Shapes, "Arrange"],
              [Sparkles, "Effects"],
            ].map(([Icon, label]) => {
              const ToolIcon = Icon as typeof FileImage;
              return (
                <div key={label as string} className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 p-2 text-slate-300 sm:px-3 sm:py-2.5">
                  <ToolIcon size={15} />
                  <span className="hidden text-xs font-medium sm:inline">{label as string}</span>
                </div>
              );
            })}
          </div>

          <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-slate-900/60 p-3 sm:p-6">
            <div className="relative aspect-[360/256] w-full max-w-[580px] overflow-hidden rounded-lg bg-white shadow-2xl">
              <div className="absolute left-[11%] top-[13%] h-[74%] w-[36%] rounded-[999px_999px_32px_32px] bg-gradient-to-b from-blue-500 to-purple-600" />
              <div className="absolute right-[9%] top-[20%] max-w-[48%] text-left">
                <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-blue-600 sm:text-xs">Create your way</p>
                <p className="mt-2 text-base font-black leading-tight text-slate-900 sm:text-3xl">Ideas look better in Gripix.</p>
                <div className="mt-3 h-1.5 w-14 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 sm:mt-5 sm:w-24" />
              </div>
              <MousePointer2 className="absolute bottom-[18%] right-[18%] h-4 w-4 fill-slate-900 text-white drop-shadow-md sm:h-6 sm:w-6" />
            </div>
          </div>

          <div className="hidden rounded-xl border border-white/10 bg-slate-900 p-3 sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">Properties</p>
            <div className="mt-4 space-y-3">
              <div className="h-8 rounded-lg border border-white/10 bg-slate-800" />
              <div className="h-2 rounded-full bg-slate-800"><div className="h-full w-2/3 rounded-full bg-blue-500" /></div>
              <div className="grid grid-cols-2 gap-2"><div className="h-8 rounded-lg bg-slate-800" /><div className="h-8 rounded-lg bg-slate-800" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  useLayoutEffect(() => {
    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const navigationType = navigationEntry?.type;

    if (navigationType === "back_forward") return;

    const root = document.documentElement;
    const previousScrollRestoration = root.dataset.landingPreviousScrollRestoration === "manual" ? "manual" : "auto";
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    const restoreScrollRestoration = () => { history.scrollRestoration = previousScrollRestoration; };
    const resetScroll = () => { if (active) window.scrollTo({ top: 0, left: 0, behavior: "auto" }); };
    const cancelScheduledReset = () => { if (settleTimer !== null) { clearTimeout(settleTimer); settleTimer = null; } };
    const removeListeners = () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("pointerdown", cancelLandingReset, true);
      window.removeEventListener("touchstart", cancelLandingReset, true);
      window.removeEventListener("wheel", cancelLandingReset, true);
      window.removeEventListener("keydown", cancelLandingReset, true);
    };
    const finishInitialization = () => {
      if (!active) return;
      active = false;
      cancelScheduledReset();
      removeListeners();
      restoreScrollRestoration();
      delete root.dataset.landingScrollResetActive;
      delete root.dataset.landingPreviousScrollRestoration;
    };
    const scheduleFinalCorrection = () => {
      if (!active) return;
      cancelScheduledReset();
      settleTimer = setTimeout(() => { settleTimer = null; resetScroll(); finishInitialization(); }, 250);
    };
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) { finishInitialization(); return; }
      if (Math.abs(window.scrollY) > 1) resetScroll();
      scheduleFinalCorrection();
    }
    function cancelLandingReset() { finishInitialization(); }

    history.scrollRestoration = "manual";
    root.dataset.landingScrollResetActive = "true";
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("pointerdown", cancelLandingReset, true);
    window.addEventListener("touchstart", cancelLandingReset, true);
    window.addEventListener("wheel", cancelLandingReset, { capture: true, passive: true });
    window.addEventListener("keydown", cancelLandingReset, true);
    resetScroll();
    if (document.readyState === "complete") scheduleFinalCorrection();

    return () => finishInitialization();
  }, []);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: LANDING_SCROLL_RESET_SCRIPT }} />
      <main className="min-h-screen overflow-x-clip bg-white font-[family-name:var(--font-geist-sans)] text-slate-950">
        <Navbar />

        <section id="home" className="relative px-5 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28 lg:px-8">
          <div className="absolute left-1/2 top-0 -z-10 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-100/70 via-blue-100/70 to-purple-100/70 blur-3xl" />
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm sm:text-sm">
              <Sparkles size={15} aria-hidden="true" />
              Creative design, made refreshingly simple
            </div>
            <h1 className="text-balance text-5xl font-black tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
              Professional designs.
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">Created in minutes.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Create beautiful graphics with Gripix. Built for creators, businesses and Etsy sellers. Design anywhere and export in high quality.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/create" className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transform-none sm:w-auto">
                Start Creating
              </Link>
              <a href="#features" className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transform-none sm:w-auto">
                Explore Features
              </a>
            </div>
          </div>
          <div className="mx-auto mt-16 max-w-6xl sm:mt-20"><EditorPreviewMockup /></div>
        </section>

        <section aria-label="Core benefits" className="border-y border-slate-200 bg-slate-50/80 px-5 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm"><Icon size={19} aria-hidden="true" /></span>
                <div><h2 className="text-sm font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{text}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-8">
              <div className="absolute right-8 top-8 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-300/40 to-purple-300/40 blur-2xl" />
              <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-7">
                <div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-900">Your design</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Draft saved</span></div>
                <div className="mt-5 aspect-[360/256] rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 p-6 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Made with Gripix</p>
                  <p className="mt-3 max-w-xs text-2xl font-black leading-tight sm:text-4xl">Create with confidence.</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">{["PNG", "JPG", "PDF"].map((format) => <span key={format} className="rounded-lg bg-slate-100 py-2 text-center text-xs font-bold text-slate-600">{format}</span>)}</div>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Why Gripix</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Everything you need to create with confidence.</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">A focused design workspace that keeps powerful essentials close and unnecessary complexity out of your way.</p>
              <ul className="mt-8 space-y-4">
                {["Professional PNG, JPG and PDF exports", "Smooth desktop and mobile editing", "Automatic draft recovery", "Simple canvas presets", "Designed for speed and ease of use"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Check size={14} aria-hidden="true" /></span>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-slate-950 px-5 py-24 text-white sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-400">How it works</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">From blank canvas to finished design.</h2></div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                ["01", "Choose your canvas", "Pick a landscape, portrait or square preset to match your idea."],
                ["02", "Create your design", "Add images and text, then arrange every detail in the editor."],
                ["03", "Export it anywhere", "Download a high-quality PNG, JPG or PDF when you’re ready."],
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-blue-400/40 motion-reduce:transform-none sm:p-8">
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-sm font-black text-transparent">{number}</span>
                  <h3 className="mt-8 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-5 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Built-in essentials</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Everything you need. Nothing you don’t.</h2><p className="mt-5 text-lg leading-8 text-slate-600">Thoughtful tools that help you move from idea to finished file without friction.</p></div>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/60 motion-reduce:transform-none">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-cyan-300"><Icon size={20} aria-hidden="true" /></span>
                  <h3 className="mt-6 text-lg font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="roadmap" className="scroll-mt-24 bg-slate-50 px-5 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-600">Early access roadmap</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Gripix is growing every week.</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">The creative essentials are ready today, with more focused tools on the way.</p></div>
            <div className="mt-14 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-emerald-200 bg-white p-7 shadow-sm sm:p-8"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Check size={20} /></span><h3 className="text-xl font-bold">Available now</h3></div><div className="mt-6 grid grid-cols-2 gap-3">{completed.map((item) => <span key={item} className="rounded-xl bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800">{item}</span>)}</div></div>
              <div className="rounded-3xl border border-purple-200 bg-white p-7 shadow-sm sm:p-8"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><Gauge size={20} /></span><h3 className="text-xl font-bold">Coming next</h3></div><div className="mt-6 grid grid-cols-2 gap-3">{comingNext.map((item) => <span key={item} className="rounded-xl bg-purple-50 px-3 py-3 text-sm font-semibold text-purple-800">{item}</span>)}</div></div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 text-center text-white shadow-2xl sm:px-12 sm:py-20">
            <div className="mx-auto max-w-2xl"><RotateCcw className="mx-auto text-cyan-300" size={28} aria-hidden="true" /><h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Ready to create something brilliant?</h2><p className="mt-5 text-lg text-slate-300">Start designing with Gripix today.</p><Link href="/create" className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-blue-400 hover:to-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transform-none">Start Creating</Link></div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white px-5 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div><Link href="#home" className="inline-flex items-center gap-2 focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><Image src="/brand/genvilo-icon-master.png" alt="" width={1536} height={1024} className="h-auto w-12 object-contain" /><span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-xl font-extrabold text-transparent">Gripix</span><span className="sr-only">Back to top</span></Link><p className="mt-4 max-w-md text-sm leading-6 text-slate-500">A simple, powerful design workspace for creators, businesses and digital sellers.</p><p className="mt-5 text-xs text-slate-400">Early access · © {new Date().getFullYear()} Gripix</p></div>
            <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600"><a href="#features" className="hover:text-slate-950">Features</a><a href="#how-it-works" className="hover:text-slate-950">How It Works</a><a href="#roadmap" className="hover:text-slate-950">What’s Coming</a><Link href="/create" className="text-blue-600 hover:text-blue-700">Start Creating</Link></nav>
          </div>
        </footer>
      </main>
    </>
  );
}
