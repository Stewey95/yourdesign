"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import Navbar from "../components/ui/Navbar";
import FeatureCard from "../components/FeatureCard";
import EditorPreview from "../components/EditorPreview";

export default function Home() {
  const cancelLandingResetRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const navigationEntry = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming | undefined;
    const navigationType = navigationEntry?.type;

    if (navigationType === "back_forward") return;

    const previousScrollRestoration = history.scrollRestoration;
    let firstFrame: number | null = null;
    let secondFrame: number | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    const restoreScrollRestoration = () => {
      history.scrollRestoration = previousScrollRestoration;
    };
    const resetScroll = () => {
      if (!active) return;

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };
    const cancelScheduledReset = () => {
      if (firstFrame !== null) {
        cancelAnimationFrame(firstFrame);
        firstFrame = null;
      }

      if (secondFrame !== null) {
        cancelAnimationFrame(secondFrame);
        secondFrame = null;
      }

      if (settleTimer !== null) {
        clearTimeout(settleTimer);
        settleTimer = null;
      }
    };
    const removeListeners = () => {
      window.removeEventListener("load", handleLifecycleRestore);
      window.removeEventListener("pageshow", handleLifecycleRestore);
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

      if (cancelLandingResetRef.current === cancelLandingReset) {
        cancelLandingResetRef.current = null;
      }
    };
    const scheduleReset = (finishAfterward: boolean) => {
      if (!active) return;

      cancelScheduledReset();
      resetScroll();
      firstFrame = requestAnimationFrame(() => {
        firstFrame = null;
        resetScroll();
        secondFrame = requestAnimationFrame(() => {
          secondFrame = null;
          resetScroll();
        });
      });

      if (finishAfterward) {
        settleTimer = setTimeout(() => {
          settleTimer = null;
          resetScroll();
          finishInitialization();
        }, 250);
      }
    };

    function handleLifecycleRestore() {
      scheduleReset(true);
    }

    function cancelLandingReset() {
      finishInitialization();
    }

    history.scrollRestoration = "manual";

    if (window.location.hash === "#editor") {
      history.replaceState(
        history.state,
        "",
        `${window.location.pathname}${window.location.search}`
      );
    }

    cancelLandingResetRef.current = cancelLandingReset;
    window.addEventListener("load", handleLifecycleRestore);
    window.addEventListener("pageshow", handleLifecycleRestore);
    window.addEventListener("pointerdown", cancelLandingReset, true);
    window.addEventListener("touchstart", cancelLandingReset, true);
    window.addEventListener("wheel", cancelLandingReset, {
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", cancelLandingReset, true);

    scheduleReset(document.readyState === "complete");

    return () => {
      finishInitialization();
    };
  }, []);

  const openEditor = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    cancelLandingResetRef.current?.();
    document.getElementById("editor")?.scrollIntoView({
      block: "start",
      inline: "nearest",
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
  <div className="relative mb-10">
   <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-500/20 blur-2xl" />

    <Image
      src="/brand/genvilo-icon-master.png"
      alt="Genvilo"
      width={1536}
      height={1024}
      priority
      className="relative h-auto w-[120px] object-contain sm:w-[150px]"
    />
  </div>

  <h1 className="mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
    Create Without Limits
  </h1>

        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-300">
          Design, customise and export beautiful creations from one powerful,
          creator-friendly platform.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href="#editor"
            onClick={openEditor}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Start Creating
          </a>

          <a
            href="#features"
            className="rounded-xl border border-slate-600 px-6 py-3 font-semibold text-white transition hover:border-white"
          >
            Learn More
          </a>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-7xl px-6 pb-24"
      >
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Why Genvilo?
          </h2>

          <p className="mt-3 text-slate-300">
            Everything creators need to design, export and prepare digital
            products for sale.
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

      <section
        id="editor"
        className="mx-auto flex max-w-[1600px] justify-center px-3 pb-24 md:px-6"
      >
        <EditorPreview />
      </section>
    </main>
  );
}
