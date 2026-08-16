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
  { label: "Em andamento", color: "#0ea5e9" },
  { label: "Pendente", color: "#f59e0b" },
  { label: "Cárie / fratura", color: "#f43f5e" },
  { label: "Ausente", color: "#94a3b8" },
] as const;

function Row({
  teeth,
  teethByNumber,
  selected,
  onSelectFace,
  onSelectWhole,
  compact = false,
  mini = false,
  composer = false,
}: {
  teeth: number[];
  teethByNumber: Map<number, OdontogramToothDTO>;
  selected: ToothSelection[];
  onSelectFace: (toothNumber: number, surface: ToothSurface, additive: boolean) => void;
  onSelectWhole: (toothNumber: number, additive: boolean) => void;
  compact?: boolean;
  mini?: boolean;
  composer?: boolean;
}) {
  return (
    <div
      className={
        mini
          ? "grid grid-cols-8 gap-1"
          : composer
            ? "grid grid-cols-8 gap-1.5"
            : "grid grid-cols-8 gap-2 sm:gap-3"
      }
    >
      {teeth.map((number) => {
        const tooth = teethByNumber.get(number)!;
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
      className={embedded || composer ? "p-0" : "surface-card p-4 sm:p-6"}
    >
      <div
        className={
          compactChart
            ? "mb-2 flex flex-wrap items-center gap-x-3 gap-y-1"
            : "mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"
        }
      >
        {compactChart ? null : (
          <p className="text-xs text-muted-foreground">
            Clique em uma face do dente para selecioná-la. Clique no número do dente para selecionar o
            dente inteiro. Use Shift ou Ctrl para seleção múltipla.
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
      <div className={compactChart ? "space-y-2" : "space-y-8"}>
        {permanent && (
          <div className={compactChart ? "space-y-1.5" : "space-y-3"}>
            {compactChart ? null : (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Dentição permanente
              </p>
            )}
            <Row
              teeth={PERMANENT_UPPER}
              teethByNumber={teethByNumber}
              selected={selected}
              mini={embedded}
              composer={composer}
              onSelectFace={onSelectFace}
              onSelectWhole={onSelectWhole}
            />
            <div className="mx-auto h-px w-[94%] bg-border" />
            <Row
              teeth={PERMANENT_LOWER}
              teethByNumber={teethByNumber}
              selected={selected}
              mini={embedded}
              composer={composer}
              onSelectFace={onSelectFace}
              onSelectWhole={onSelectWhole}
            />
          </div>
        )}
        {deciduous && (
          <div className="space-y-2">
            {composer ? null : (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Dentição decídua
              </p>
            )}
            <div className="mx-auto max-w-[68%]">
              <div className={compactChart ? "grid grid-cols-5 gap-1" : "grid grid-cols-5 gap-2 sm:gap-3"}>
                {DECIDUOUS_UPPER.map((number) => {
                  const tooth = teethByNumber.get(number)!;
                  return (
                    <InteractiveTooth
                      key={number}
                      tooth={tooth}
                      selected={selected}
                      compact
                      mini={embedded}
                      onSelectFace={onSelectFace}
                      onSelectWhole={onSelectWhole}
                    />
                  );
                })}
              </div>
              <div className="my-2 h-px bg-border" />
              <div className={compactChart ? "grid grid-cols-5 gap-1" : "grid grid-cols-5 gap-2 sm:gap-3"}>
                {DECIDUOUS_LOWER.map((number) => {
                  const tooth = teethByNumber.get(number)!;
                  return (
                    <InteractiveTooth
                      key={number}
                      tooth={tooth}
                      selected={selected}
                      compact
                      mini={embedded}
                      onSelectFace={onSelectFace}
                      onSelectWhole={onSelectWhole}
                    />
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
