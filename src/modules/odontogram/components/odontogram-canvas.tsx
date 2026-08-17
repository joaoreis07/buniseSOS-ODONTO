"use client";

import type { OdontogramToothDTO } from "../dto/odontogram.dto";
import {
  DECIDUOUS_LOWER,
  DECIDUOUS_UPPER,
  PERMANENT_LOWER,
  PERMANENT_UPPER,
  type DentitionFilter,
} from "../utils/fdi-notation";
import type { ToothSelection } from "../utils/tooth-surfaces";
import { InteractiveTooth } from "./interactive-tooth";
import type { ToothSurface } from "@prisma/client";

const LEGEND = [
  { label: "Realizado", color: "#16a34a" },
  { label: "Em andamento", color: "#0066ff" },
  { label: "Pendente", color: "#f59e0b" },
  { label: "Cárie / fratura", color: "#f43f5e" },
  { label: "Ausente", color: "#94a3b8" },
] as const;

function ArchRow({
  teeth,
  teethByNumber,
  selected,
  onSelectFace,
  onSelectWhole,
  compact = false,
  mini = false,
}: {
  teeth: number[];
  teethByNumber: Map<number, OdontogramToothDTO>;
  selected: ToothSelection[];
  onSelectFace: (toothNumber: number, surface: ToothSurface, additive: boolean) => void;
  onSelectWhole: (toothNumber: number, additive: boolean) => void;
  compact?: boolean;
  mini?: boolean;
}) {
  const split = Math.ceil(teeth.length / 2);
  const left = teeth.slice(0, split);
  const right = teeth.slice(split);

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3">
      <div className="flex min-w-0 flex-1 justify-end gap-px sm:gap-0.5">
        {left.map((number) => {
          const tooth = teethByNumber.get(number);
          if (!tooth) return null;
          return (
            <InteractiveTooth
              key={number}
              tooth={tooth}
              selected={selected}
              compact={compact}
              mini={mini}
              onSelectFace={onSelectFace}
              onSelectWhole={onSelectWhole}
            />
          );
        })}
      </div>
      <span className="mb-5 hidden h-8 w-px shrink-0 bg-border sm:block" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 justify-start gap-px sm:gap-0.5">
        {right.map((number) => {
          const tooth = teethByNumber.get(number);
          if (!tooth) return null;
          return (
            <InteractiveTooth
              key={number}
              tooth={tooth}
              selected={selected}
              compact={compact}
              mini={mini}
              onSelectFace={onSelectFace}
              onSelectWhole={onSelectWhole}
            />
          );
        })}
      </div>
    </div>
  );
}

export function OdontogramCanvas({
  teeth,
  dentition,
  selected,
  onSelectFace,
  onSelectWhole,
  variant = "full",
}: {
  teeth: OdontogramToothDTO[];
  dentition: DentitionFilter;
  selected: ToothSelection[];
  onSelectFace: (toothNumber: number, surface: ToothSurface, additive: boolean) => void;
  onSelectWhole: (toothNumber: number, additive: boolean) => void;
  variant?: "full" | "embedded" | "composer";
}) {
  const teethByNumber = new Map(teeth.map((tooth) => [tooth.number, tooth]));
  const permanent = dentition === "PERMANENT" || dentition === "BOTH";
  const deciduous = dentition === "DECIDUOUS" || dentition === "BOTH";
  const embedded = variant === "embedded";
  const composer = variant === "composer";
  const compactChart = embedded || composer;

  return (
    <section
      aria-label="Odontograma interativo"
      className={embedded || composer ? "p-0" : "surface-card overflow-hidden p-4 sm:p-5"}
    >
      <div
        className={
          compactChart
            ? "mb-2 flex flex-wrap items-center gap-x-3 gap-y-1"
            : "mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3"
        }
      >
        {compactChart ? null : (
          <p className="text-xs text-muted-foreground">
            Clique na face para selecioná-la. Clique no número FDI para o dente inteiro. Shift ou Ctrl
            para múltiplos.
          </p>
        )}
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground">
          {LEGEND.map(({ label, color }) => (
            <li key={label} className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto">
        <div className={compactChart ? "min-w-[520px] space-y-2" : "min-w-[680px] space-y-3"}>
          {permanent ? (
            <div className="space-y-1.5">
              {compactChart ? null : (
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Arcada superior
                </p>
              )}
              <ArchRow
                teeth={PERMANENT_UPPER}
                teethByNumber={teethByNumber}
                selected={selected}
                mini={embedded}
                compact={composer}
                onSelectFace={onSelectFace}
                onSelectWhole={onSelectWhole}
              />
              <div className="mx-auto h-px w-[96%] bg-border" />
              <ArchRow
                teeth={PERMANENT_LOWER}
                teethByNumber={teethByNumber}
                selected={selected}
                mini={embedded}
                compact={composer}
                onSelectFace={onSelectFace}
                onSelectWhole={onSelectWhole}
              />
              {compactChart ? null : (
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Arcada inferior
                </p>
              )}
            </div>
          ) : null}

          {deciduous ? (
            <div className="space-y-1.5">
              {composer ? null : (
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Dentição decídua
                </p>
              )}
              <div className="mx-auto max-w-[72%]">
                <ArchRow
                  teeth={DECIDUOUS_UPPER}
                  teethByNumber={teethByNumber}
                  selected={selected}
                  compact
                  mini={embedded}
                  onSelectFace={onSelectFace}
                  onSelectWhole={onSelectWhole}
                />
                <div className="my-1.5 h-px bg-border" />
                <ArchRow
                  teeth={DECIDUOUS_LOWER}
                  teethByNumber={teethByNumber}
                  selected={selected}
                  compact
                  mini={embedded}
                  onSelectFace={onSelectFace}
                  onSelectWhole={onSelectWhole}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
