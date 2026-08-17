export type DentitionFilter = "PERMANENT" | "DECIDUOUS" | "BOTH";

export const PERMANENT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const PERMANENT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
export const DECIDUOUS_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
export const DECIDUOUS_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

export const ALL_FDI_TEETH = [
  ...PERMANENT_UPPER,
  ...PERMANENT_LOWER,
  ...DECIDUOUS_UPPER,
  ...DECIDUOUS_LOWER,
] as const;

export function isDeciduousTooth(toothNumber: number): boolean {
  return toothNumber >= 51 && toothNumber <= 85;
}

export function teethForDentition(filter: DentitionFilter): number[] {
  if (filter === "PERMANENT") return [...PERMANENT_UPPER, ...PERMANENT_LOWER];
  if (filter === "DECIDUOUS") return [...DECIDUOUS_UPPER, ...DECIDUOUS_LOWER];
  return [...ALL_FDI_TEETH];
}

export const CONDITION_CATALOG = {
  HEALTHY: { title: "Hígido", color: "emerald" },
  CARIES: { title: "Cárie", color: "rose" },
  FRACTURE: { title: "Fratura", color: "amber" },
  RESTORATION: { title: "Restauração", color: "sky" },
  MISSING: { title: "Ausente", color: "slate" },
  EXTRACTED: { title: "Extraído", color: "slate" },
  IMPLANT: { title: "Implante", color: "sky" },
  CROWN: { title: "Coroa", color: "sky" },
  ROOT_CANAL: { title: "Canal", color: "orange" },
  OTHER: { title: "Outro", color: "zinc" },
} as const;

export type ConditionCode = keyof typeof CONDITION_CATALOG;

export function conditionTitle(code: string): string {
  return CONDITION_CATALOG[code as ConditionCode]?.title ?? code;
}
