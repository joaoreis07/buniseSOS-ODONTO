import type { Plan, Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gestor",
  EMPLOYEE: "Colaborador",
};

export const PLAN_LABELS: Record<Plan, string> = {
  STARTER: "Gratuito",
  PROFESSIONAL: "Premium",
  BUSINESS: "Business",
  ENTERPRISE: "Enterprise",
};
