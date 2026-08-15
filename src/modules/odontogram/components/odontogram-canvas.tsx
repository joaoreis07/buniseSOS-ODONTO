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

function Row({
  teeth,
  teethByNumber,
  selected,
  onSelectFace,
  onSelectWhole,
}: {
  teeth: number[];
  teethByNumber: Map<number, OdontogramToothDTO>;
  selected: ToothSelection[];
  onSelectFace: (toothNumber: number, surface: ToothSurface, additive: boolean) => void;
  onSelectWhole: (toothNumber: number, additive: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-2 sm:gap-3">
      {teeth.map((number) => {
        const tooth = teethByNumber.get(number)!;
        return (
          <InteractiveTooth
            key={number}
            tooth={tooth}
            selected={selected}
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
}: {
  teeth: OdontogramToothDTO[];
  dentition: DentitionFilter;
  selected: ToothSelection[];
  onSelectFace: (toothNumber: number, surface: ToothSurface, additive: boolean) => void;
  onSelectWhole: (toothNumber: number, additive: boolean) => void;
}) {
  const teethByNumber = new Map(teeth.map((tooth) => [tooth.number, tooth]));
  const permanent = dentition === "PERMANENT" || dentition === "BOTH";
  const deciduous = dentition === "DECIDUOUS" || dentition === "BOTH";

  return (
    <section aria-label="Odontograma interativo" className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <p className="mb-4 text-xs text-muted-foreground">
        Clique em uma face do dente para selecioná-la. Clique no número do dente para selecionar o dente inteiro.
        Use Shift ou Ctrl para seleção múltipla.
      </p>
      <div className="space-y-8">
        {permanent && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Dentição permanente
            </p>
            <Row
              teeth={PERMANENT_UPPER}
              teethByNumber={teethByNumber}
              selected={selected}
              onSelectFace={onSelectFace}
              onSelectWhole={onSelectWhole}
            />
            <div className="mx-auto h-px w-[94%] bg-border" />
            <Row
              teeth={PERMANENT_LOWER}
              teethByNumber={teethByNumber}
              selected={selected}
              onSelectFace={onSelectFace}
              onSelectWhole={onSelectWhole}
            />
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
                  return (
                    <InteractiveTooth
                      key={number}
                      tooth={tooth}
                      selected={selected}
                      compact
                      onSelectFace={onSelectFace}
                      onSelectWhole={onSelectWhole}
                    />
                  );
                })}
              </div>
              <div className="my-3 h-px bg-border" />
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {DECIDUOUS_LOWER.map((number) => {
                  const tooth = teethByNumber.get(number)!;
                  return (
                    <InteractiveTooth
                      key={number}
                      tooth={tooth}
                      selected={selected}
                      compact
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
