"use client";

import type { ReactNode } from "react";

type MobileStylePanelProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
};

export default function MobileStylePanel({
  title,
  description,
  icon,
  children,
}: MobileStylePanelProps) {
  return (
    <section
      aria-label={title}
      className="animate-in fade-in slide-in-from-bottom-4 max-h-[44vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-white shadow-2xl backdrop-blur-xl duration-200 motion-reduce:animate-none"
    >
      {(title || description || icon) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            {title && <p className="text-sm font-bold text-white">{title}</p>}
            {description && (
              <p className="text-[11px] text-slate-400">{description}</p>
            )}
          </div>
          {icon}
        </div>
      )}

      {children}
    </section>
  );
}
