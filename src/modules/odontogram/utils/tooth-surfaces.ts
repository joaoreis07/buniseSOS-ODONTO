import type { ToothSurface, OdontogramRecordStatus } from "@prisma/client";
import type { OdontogramMutation, OdontogramToothDTO } from "../dto/odontogram.dto";
import { CONDITION_CATALOG, type ConditionCode } from "./fdi-notation";

export type ToothSelection = {
  toothNumber: number;
  surfaces: ToothSurface[];
};

export const SURFACE_LABELS: Record<ToothSurface, string> = {
  MESIAL: "Mesial",
  DISTAL: "Distal",
  OCCLUSAL: "Oclusal",
  VESTIBULAR: "Vestibular",
  LINGUAL: "Lingual / Palatina",
  INCISAL: "Incisal",
  CERVICAL: "Cervical",
  WHOLE: "Dente inteiro",
};

/** Posição FDI 1–3 = incisivos/caninos (face incisal). */
export function isAnteriorTooth(toothNumber: number): boolean {
  const position = toothNumber % 10;
  return position >= 1 && position <= 3;
}

/** Faces exibidas no canvas para o dente. */
export function canvasSurfacesForTooth(toothNumber: number): ToothSurface[] {
  const occlusalOrIncisal = isAnteriorTooth(toothNumber) ? "INCISAL" : "OCCLUSAL";
  return ["MESIAL", "DISTAL", occlusalOrIncisal, "VESTIBULAR", "LINGUAL"];
}

export function mesialOnLeft(toothNumber: number): boolean {
  const quadrant = Math.floor(toothNumber / 10);
  return quadrant === 2 || quadrant === 3 || quadrant === 6 || quadrant === 7;
}

export function vestibularOnTop(toothNumber: number): boolean {
  const quadrant = Math.floor(toothNumber / 10);
  return quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
}

export function surfaceMatchesRecord(surfaces: ToothSurface[], surface: ToothSurface): boolean {
  if (surfaces.length === 0) return false;
  if (surfaces.includes("WHOLE")) return true;
  return surfaces.includes(surface);
}

export function selectedToothNumbers(selected: ToothSelection[]): number[] {
  return selected.map((item) => item.toothNumber);
}

export type FaceClinicalHint = {
  kind: "condition" | "procedure" | "draft";
  code: string;
  phase: "CURRENT" | "PLANNED";
  status: string;
};

const FILL = {
  selected: "rgba(0, 102, 255, 0.42)",
  done: "rgba(22, 163, 74, 0.55)",
  progress: "rgba(0, 102, 255, 0.45)",
  pending: "rgba(245, 158, 11, 0.5)",
  danger: "rgba(244, 63, 94, 0.55)",
  missing: "rgba(148, 163, 184, 0.5)",
} as const;

function clinicalFill(hint: FaceClinicalHint): string {
  if (hint.kind === "draft") return FILL.pending;
  if (hint.kind === "procedure") {
    if (hint.status === "COMPLETED" || hint.status === "RESOLVED") return FILL.done;
    if (hint.status === "IN_PROGRESS") return FILL.progress;
    if (hint.status === "CANCELLED") return FILL.missing;
    return FILL.pending;
  }
  if (hint.code === "HEALTHY") return "transparent";
  if (hint.code === "CARIES" || hint.code === "FRACTURE") return FILL.danger;
  if (hint.code === "MISSING" || hint.code === "EXTRACTED") return FILL.missing;
  if (hint.status === "COMPLETED" || hint.status === "RESOLVED") return FILL.done;
  if (hint.status === "IN_PROGRESS") return FILL.progress;
  if (hint.phase === "PLANNED") return FILL.pending;
  if (hint.code === "RESTORATION" || hint.code === "CROWN" || hint.code === "IMPLANT") return FILL.progress;
  return CONDITION_CATALOG[hint.code as ConditionCode] ? FILL.pending : FILL.progress;
}

export function faceClinicalFill(hint: FaceClinicalHint | null, selected: boolean): string {
  if (!hint) return selected ? FILL.selected : "transparent";
  return clinicalFill(hint);
}

type MutableCondition = OdontogramToothDTO["conditions"][number];
type MutableProcedure = OdontogramToothDTO["procedures"][number];

function applyDraftToTooth(tooth: OdontogramToothDTO, draft: OdontogramMutation[]): OdontogramToothDTO {
  let conditions: MutableCondition[] = tooth.conditions.map((item) => ({
    ...item,
    surfaces: [...item.surfaces],
  }));
  let procedures: MutableProcedure[] = tooth.procedures.map((item) => ({
    ...item,
    surfaces: [...item.surfaces],
  }));
  let observations = [...tooth.observations];

  for (const change of draft) {
    if (change.type === "remove") {
      if (change.target === "condition") conditions = conditions.filter((item) => item.id !== change.id);
      if (change.target === "procedure") procedures = procedures.filter((item) => item.id !== change.id);
      if (change.target === "observation") observations = observations.filter((item) => item.id !== change.id);
      continue;
    }
    if (!change.toothNumbers.includes(tooth.number)) continue;

    if (change.type === "condition") {
      const payload = {
        code: change.code,
        title: change.title,
        phase: change.phase,
        status: change.status as OdontogramRecordStatus,
        surfaces: [...change.surfaces],
        notes: change.notes ?? null,
      };
      if (change.id) {
        conditions = conditions.map((item) =>
          item.id === change.id
            ? { ...item, ...payload, updatedAt: new Date().toISOString() }
            : item,
        );
      } else {
        conditions.unshift({
          id: `draft-condition-${conditions.length}-${tooth.number}`,
          ...payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (change.type === "procedure") {
      const payload = {
        conditionId: change.conditionId ?? null,
        code: change.code,
        title: change.title,
        phase: change.phase,
        status: change.status as OdontogramRecordStatus,
        surfaces: [...change.surfaces],
        notes: change.notes ?? null,
      };
      if (change.id) {
        procedures = procedures.map((item) =>
          item.id === change.id
            ? { ...item, ...payload, updatedAt: new Date().toISOString() }
            : item,
        );
      } else {
        procedures.unshift({
          id: `draft-procedure-${procedures.length}-${tooth.number}`,
          ...payload,
          plannedAt: null,
          completedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  return { ...tooth, conditions, procedures, observations };
}

export function buildDisplayTeeth(
  teeth: OdontogramToothDTO[],
  draft: OdontogramMutation[],
): OdontogramToothDTO[] {
  return teeth.map((tooth) => applyDraftToTooth(tooth, draft));
}

export function faceClinicalHint(
  tooth: OdontogramToothDTO,
  surface: ToothSurface,
): FaceClinicalHint | null {
  for (const condition of tooth.conditions) {
    if (surfaceMatchesRecord(condition.surfaces, surface)) {
      return {
        kind: condition.id.startsWith("draft-") ? "draft" : "condition",
        code: condition.code,
        phase: condition.phase,
        status: condition.status,
      };
    }
  }

  for (const procedure of tooth.procedures) {
    if (surfaceMatchesRecord(procedure.surfaces, surface)) {
      return {
        kind: procedure.id.startsWith("draft-") ? "draft" : "procedure",
        code: procedure.code,
        phase: procedure.phase,
        status: procedure.status,
      };
    }
  }

  return null;
}

export function formatSelectedSurfaces(surfaces: ToothSurface[]): string {
  if (surfaces.includes("WHOLE")) return SURFACE_LABELS.WHOLE;
  if (surfaces.length === 0) return "Nenhuma face específica";
  return surfaces.map((surface) => SURFACE_LABELS[surface]).join(", ");
}

export function formatSurfacesShort(surfaces: ToothSurface[]): string {
  if (surfaces.length === 0) return "";
  if (surfaces.includes("WHOLE") && surfaces.length === 1) return SURFACE_LABELS.WHOLE;
  const named = surfaces.filter((surface) => surface !== "WHOLE").map((surface) => SURFACE_LABELS[surface]);
  return named.length > 0 ? named.join(" + ") : SURFACE_LABELS.WHOLE;
}

export function formatToothRefs(
  teeth: ReadonlyArray<{ toothNumber: number; surfaces: ToothSurface[] }>,
): string {
  return teeth
    .map((tooth) => {
      const faces = formatSurfacesShort(tooth.surfaces);
      return faces ? `${tooth.toothNumber} · ${faces}` : String(tooth.toothNumber);
    })
    .join("; ");
}

const SURFACE_LETTER: Record<ToothSurface, string> = {
  MESIAL: "M",
  DISTAL: "D",
  OCCLUSAL: "O",
  VESTIBULAR: "V",
  LINGUAL: "L",
  INCISAL: "I",
  CERVICAL: "C",
  WHOLE: "",
};

/** FDI + faces curtas (16 (O), 26 (OM)) para tabelas clínicas. */
export function formatToothRefsCompact(
  teeth: ReadonlyArray<{ toothNumber: number; surfaces: ToothSurface[] }>,
): string {
  return teeth
    .map((tooth) => {
      if (tooth.surfaces.length === 0 || tooth.surfaces.includes("WHOLE")) {
        return String(tooth.toothNumber);
      }
      const letters = tooth.surfaces
        .filter((surface) => surface !== "WHOLE")
        .map((surface) =>
          surface === "LINGUAL"
            ? vestibularOnTop(tooth.toothNumber)
              ? "P"
              : "L"
            : SURFACE_LETTER[surface],
        )
        .join("");
      return letters ? `${tooth.toothNumber} (${letters})` : String(tooth.toothNumber);
    })
    .join(", ");
}

export function parseToothNumbers(value: string): number[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((number) => Number.isInteger(number) && number >= 11 && number <= 88),
    ),
  ];
}

export function toothRefsFromInput(value: string, surfaces: ToothSurface[] = []) {
  return parseToothNumbers(value).map((toothNumber) => ({ toothNumber, surfaces }));
}

export function toothRefsToNumbersInput(refs: ReadonlyArray<{ toothNumber: number }>): string {
  return refs.map((ref) => ref.toothNumber).join(", ");
}

/** Preserva faces existentes por dente ao editar a lista FDI no formulário. */
export function mergeToothRefsFromInput(
  value: string,
  existing: ReadonlyArray<ToothSelection>,
): ToothSelection[] {
  const existingByNumber = new Map(existing.map((ref) => [ref.toothNumber, [...ref.surfaces]]));
  return parseToothNumbers(value).map((toothNumber) => ({
    toothNumber,
    surfaces: existingByNumber.get(toothNumber) ?? [],
  }));
}
