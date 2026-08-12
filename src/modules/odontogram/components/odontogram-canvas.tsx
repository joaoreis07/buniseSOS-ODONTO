"use client";

import type { OdontogramToothDTO } from "../dto/odontogram.dto";
import {
  DECIDUOUS_LOWER,
  DECIDUOUS_UPPER,
  PERMANENT_LOWER,
  PERMANENT_UPPER,
  type DentitionFilter,
} from "../utils/fdi-notation";

function toothTone(tooth: OdontogramToothDTO): string {
  const condition = tooth.conditions[0];
  if (!condition) return "fill-emerald-50 stroke-emerald-200 text-emerald-800";
  if (condition.phase === "PLANNED") return "fill-violet-50 stroke-violet-300 text-violet-800";
  if (condition.status === "COMPLETED") return "fill-sky-50 stroke-sky-300 text-sky-800";
  if (condition.code === "CARIES" || condition.code === "FRACTURE") {
    return "fill-rose-50 stroke-rose-300 text-rose-800";
  }
  if (condition.code === "MISSING" || condition.code === "EXTRACTED") {
    return "fill-slate-100 stroke-slate-300 text-slate-600";
  }
  return "fill-amber-50 stroke-amber-300 text-amber-800";
}

function Row({
  teeth,
  teethByNumber,
  selected,
  onSelect,
}: {
  teeth: number[];
  teethByNumber: Map<number, OdontogramToothDTO>;
  selected: Set<number>;
  onSelect: (tooth: number, additive: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-2 sm:gap-3">
      {teeth.map((number) => {
        const tooth = teethByNumber.get(number)!;
        const isSelected = selected.has(number);
        return (
          <button
            key={number}
            type="button"
            aria-label={`Dente ${number}${isSelected ? ", selecionado" : ""}`}
            aria-pressed={isSelected}
            className={`group relative flex aspect-[4/5] min-w-0 flex-col items-center justify-center rounded-2xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              toothTone(tooth)
            } ${isSelected ? "scale-105 border-brand-600 ring-4 ring-brand-100" : "hover:-translate-y-0.5 hover:shadow-sm"}`}
            onClick={(event) => onSelect(number, event.shiftKey || event.metaKey || event.ctrlKey)}
          >
            <svg viewBox="0 0 48 58" className="h-10 w-9 sm:h-12 sm:w-10" aria-hidden="true">
              <path
                d="M12 5c6-5 18-5 24 0 5 5 6 12 4 19l-4 23c-1 5-5 7-8 2l-4-7-4 7c-3 5-7 3-8-2L8 24C6 17 7 10 12 5Z"
                fill="currentColor"
                fillOpacity="0.2"
                stroke="currentColor"
                strokeWidth="2"
              />
              {tooth.conditions.length > 0 && (
                <circle cx="24" cy="25" r="6" fill="currentColor" fillOpacity="0.8" />
              )}
            </svg>
            <span className="mt-0.5 text-[10px] font-bold sm:text-xs">{number}</span>
            {tooth.conditions.some((condition) => condition.phase === "PLANNED") && (
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-violet-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function OdontogramCanvas({
  teeth,
  dentition,
  selected,
  onSelect,
}: {
  teeth: OdontogramToothDTO[];
  dentition: DentitionFilter;
  selected: Set<number>;
  onSelect: (tooth: number, additive: boolean) => void;
}) {
  const teethByNumber = new Map(teeth.map((tooth) => [tooth.number, tooth]));
  const permanent = dentition === "PERMANENT" || dentition === "BOTH";
  const deciduous = dentition === "DECIDUOUS" || dentition === "BOTH";

  return (
    <section aria-label="Odontograma interativo" className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="space-y-8">
        {permanent && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Dentição permanente
            </p>
            <Row teeth={PERMANENT_UPPER} teethByNumber={teethByNumber} selected={selected} onSelect={onSelect} />
            <div className="mx-auto h-px w-[94%] bg-border" />
            <Row teeth={PERMANENT_LOWER} teethByNumber={teethByNumber} selected={selected} onSelect={onSelect} />
          </div>
        )}
        {deciduous && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Dentição decídua
            </p>
            <div className="mx-auto max-w-[68%]">
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {DECIDUOUS_UPPER.map((number) => {
                  const tooth = teethByNumber.get(number)!;
                  const isSelected = selected.has(number);
                  return (
                    <button
                      key={number}
                      type="button"
                      aria-label={`Dente decíduo ${number}`}
                      aria-pressed={isSelected}
                      onClick={(event) => onSelect(number, event.shiftKey || event.metaKey || event.ctrlKey)}
                      className={`flex aspect-[4/5] flex-col items-center justify-center rounded-2xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        toothTone(tooth)
                      } ${isSelected ? "border-brand-600 ring-4 ring-brand-100" : "hover:-translate-y-0.5"}`}
                    >
                      <span className="text-sm font-bold">{number}</span>
                    </button>
                  );
                })}
              </div>
              <div className="my-3 h-px bg-border" />
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {DECIDUOUS_LOWER.map((number) => {
                  const tooth = teethByNumber.get(number)!;
                  const isSelected = selected.has(number);
                  return (
                    <button
                      key={number}
                      type="button"
                      aria-label={`Dente decíduo ${number}`}
                      aria-pressed={isSelected}
                      onClick={(event) => onSelect(number, event.shiftKey || event.metaKey || event.ctrlKey)}
                      className={`flex aspect-[4/5] flex-col items-center justify-center rounded-2xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        toothTone(tooth)
                      } ${isSelected ? "border-brand-600 ring-4 ring-brand-100" : "hover:-translate-y-0.5"}`}
                    >
                      <span className="text-sm font-bold">{number}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
