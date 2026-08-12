import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";

export const treatmentPlanDetailInclude = {
  patient: { select: { id: true, name: true, preferredName: true } },
  responsibleProfessional: { select: { id: true, name: true } },
  items: {
    where: { deletedAt: null },
    include: {
      teeth: true,
      professional: { select: { id: true, name: true } },
      budgetItem: { select: { id: true, budgetId: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  },
  budgets: {
    where: { deletedAt: null },
    select: { id: true, code: true, title: true, status: true },
    orderBy: { createdAt: "desc" },
  },
  events: {
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  },
} satisfies Prisma.TreatmentPlanInclude;

export type TreatmentPlanDetailRow = Prisma.TreatmentPlanGetPayload<{ include: typeof treatmentPlanDetailInclude }>;

export class PrismaTreatmentPlanRepository {
  constructor(private readonly db: PrismaClient | Prisma.TransactionClient = prisma) {}

  findDetailById(companyId: string, id: string) {
    return this.db.treatmentPlan.findFirst({
      where: { id, companyId, deletedAt: null },
      include: treatmentPlanDetailInclude,
    });
  }

  listDetails(companyId: string, patientId?: string) {
    return this.db.treatmentPlan.findMany({
      where: { companyId, deletedAt: null, ...(patientId ? { patientId } : {}) },
      include: treatmentPlanDetailInclude,
      orderBy: { updatedAt: "desc" },
    });
  }

  listSummaries(companyId: string, patientId?: string) {
    return this.db.treatmentPlan.findMany({
      where: { companyId, deletedAt: null, ...(patientId ? { patientId } : {}) },
      select: { id: true, code: true, title: true, status: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
  }
}
