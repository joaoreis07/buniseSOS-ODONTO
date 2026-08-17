import type { Plan } from "@prisma/client";

export const STARTER_PATIENT_LIMIT = 100;

export class PatientLimitError extends Error {
  readonly code = "PATIENT_LIMIT_REACHED" as const;
  readonly limit: number;

  constructor(limit: number) {
    super(
      `O plano Gratuito permite até ${limit} pacientes. Faça upgrade para cadastrar mais.`,
    );
    this.name = "PatientLimitError";
    this.limit = limit;
  }
}

export function patientLimitForPlan(plan: Plan): number | null {
  return plan === "STARTER" ? STARTER_PATIENT_LIMIT : null;
}

export function assertPatientLimit(plan: Plan, currentCount: number) {
  const limit = patientLimitForPlan(plan);
  if (limit != null && currentCount >= limit) {
    throw new PatientLimitError(limit);
  }
}
