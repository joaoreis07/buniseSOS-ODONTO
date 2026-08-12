import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";

export const budgetDetailInclude = {
  patient: { select: { id: true, name: true, preferredName: true } },
  priceTable: { select: { id: true, name: true } },
  receivable: { where: { deletedAt: null }, select: { id: true } },
  items: { where: { deletedAt: null }, include: { teeth: true }, orderBy: { createdAt: "asc" } },
  events: { include: { actor: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
} satisfies Prisma.TreatmentBudgetInclude;

export class PrismaBudgetRepository {
  constructor(private readonly db: PrismaClient | Prisma.TransactionClient = prisma) {}

  findDetailById(companyId: string, id: string) {
    return this.db.treatmentBudget.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { ...budgetDetailInclude, receivable: { where: { companyId, deletedAt: null }, select: { id: true } } },
    });
  }

  listDetails(companyId: string, patientId?: string) {
    return this.db.treatmentBudget.findMany({
      where: { companyId, deletedAt: null, ...(patientId ? { patientId } : {}) },
      include: { ...budgetDetailInclude, receivable: { where: { companyId, deletedAt: null }, select: { id: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }
}
