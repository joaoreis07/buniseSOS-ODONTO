import type { ReactNode } from "react";

type BrandProps = {
  light?: boolean;
  logoOnly?: boolean;
  className?: string;
};

export function Brand({ light = false, logoOnly = false, className = "" }: BrandProps) {
  return (
    <div
      className={`flex items-center gap-2.5 font-semibold tracking-[-0.04em] ${
        light ? "text-white" : "text-slate-950"
      } ${className}`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold tracking-tight ${
          light
            ? "bg-white/10 text-white ring-1 ring-white/15"
            : "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
        }`}
        aria-hidden
      >
        B
      </span>
      {!logoOnly && (
        <span className="min-w-0 leading-tight">
          <span className="block text-[15px] tracking-[-0.03em]">BusinessOS</span>
          <span
            className={`block text-[10px] font-medium uppercase tracking-[0.16em] ${
              light ? "text-white/45" : "text-slate-400"
            }`}
          >
            Odonto
          </span>
        </span>
      )}
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-medium tracking-wide text-brand-700">
      {children}
    </span>
  );
}
