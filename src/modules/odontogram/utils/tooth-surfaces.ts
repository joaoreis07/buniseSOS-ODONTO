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
  LINGUAL: "Lingual",
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

function conditionColor(code: string): string {
  if (code === "CARIES" || code === "FRACTURE") return "rgba(244, 63, 94, 0.55)";
  if (code === "MISSING" || code === "EXTRACTED") return "rgba(100, 116, 139, 0.45)";
  if (code === "RESTORATION") return "rgba(14, 165, 233, 0.5)";
  return CONDITION_CATALOG[code as ConditionCode]?.color === "violet"
    ? "rgba(37, 99, 235, 0.5)"
    : "rgba(245, 158, 11, 0.45)";
}

export function faceClinicalFill(hint: FaceClinicalHint | null, selected: boolean): string {
  if (selected) return "rgba(37, 99, 235, 0.35)";
  if (!hint) return "transparent";
  if (hint.kind === "draft") return "rgba(245, 158, 11, 0.4)";
  if (hint.phase === "PLANNED") return "rgba(245, 158, 11, 0.45)";
  return conditionColor(hint.code);
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
