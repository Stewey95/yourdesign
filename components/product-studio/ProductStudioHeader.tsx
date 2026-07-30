"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

type ProductStudioHeaderProps = {
  backHref?: string;
  backLabel?: string;
  action?: boolean;
};

export default function ProductStudioHeader({
  backHref,
  backLabel = "Back",
  action = false,
}: ProductStudioHeaderProps) {
  return (
    <header className="platform-header">
      <div className="platform-container flex min-h-18 items-center justify-between gap-4 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Image
              src="/brand/genvilo-icon-master.png"
              alt=""
              width={1536}
              height={1024}
              className="h-auto w-10 object-contain"
            />
            <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              Gripix
            </span>
            <span className="sr-only">Gripix home</span>
          </Link>

          <span className="hidden h-6 w-px bg-slate-200 sm:block" />
          <span className="hidden text-sm font-semibold text-slate-500 sm:block">
            Product Studio
          </span>
        </div>

        <div className="flex items-center gap-2">
          {backHref && (
            <Link
              href={backHref}
              className="studio-button studio-button-quiet min-h-10 px-3"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Link>
          )}
          {action && (
            <Link
              href="/studio/new"
              className="studio-button studio-button-primary min-h-10 px-4"
            >
              <Plus size={16} aria-hidden="true" />
              New Product
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
