import type { Role } from "@prisma/client";

export const PERMISSIONS = [
  "dashboard:view",
  "agenda:view",
  "agenda:manage",
  "patients:view",
  "patients:manage",
  "odontogram:view",
  "odontogram:manage",
  "treatments:view",
  "treatments:manage",
  "treatment_plans:view",
  "treatment_plans:manage",
  "treatment_plans:delete",
  "clinical_records:view",
  "clinical_records:manage",
  "clinical_records:delete",
  "anamnesis:view",
  "anamnesis:manage",
  "budgets:view",
  "budgets:manage",
  "budgets:approve",
  "budgets:delete",
  "finance:view",
  "finance:manage",
  "finance:receive",
  "finance:cancel",
  "documents:view",
  "documents:manage",
  "reports:view",
  "settings:view",
  "settings:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, ReadonlyArray<Permission | "*">> = {
  ADMIN: ["*"],
  MANAGER: [
    "dashboard:view",
    "agenda:view",
    "agenda:manage",
    "patients:view",
    "patients:manage",
    "odontogram:view",
    "odontogram:manage",
    "treatments:view",
    "treatments:manage",
    "treatment_plans:view",
    "treatment_plans:manage",
    "treatment_plans:delete",
    "clinical_records:view",
    "clinical_records:manage",
    "clinical_records:delete",
    "anamnesis:view",
    "anamnesis:manage",
    "budgets:view",
    "budgets:manage",
    "budgets:approve",
    "budgets:delete",
    "finance:view",
    "finance:manage",
    "finance:receive",
    "finance:cancel",
    "documents:view",
    "documents:manage",
    "reports:view",
    "settings:view",
    "settings:manage",
  ],
  EMPLOYEE: [
    "dashboard:view",
    "agenda:view",
    "patients:view",
    "odontogram:view",
    "treatments:view",
    "treatment_plans:view",
    "clinical_records:view",
    "anamnesis:view",
    "budgets:view",
    "documents:view",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const granted = ROLE_PERMISSIONS[role];
  return granted.includes("*") || granted.includes(permission);
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error("Você não tem permissão para esta ação");
  }
}

export function listPermissions(role: Role): Permission[] {
  if (ROLE_PERMISSIONS[role].includes("*")) {
    return [...PERMISSIONS];
  }
  return ROLE_PERMISSIONS[role].filter(
    (permission): permission is Permission => permission !== "*",
  );
}
