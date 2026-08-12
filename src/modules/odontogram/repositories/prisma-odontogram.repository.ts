import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { ALL_FDI_TEETH } from "../utils/fdi-notation";
import { odontogramInclude, type OdontogramWithDetails } from "./odontogram.repository";

type DbClient = typeof prisma | Prisma.TransactionClient;

export class PrismaOdontogramRepository {
  constructor(private readonly db: DbClient = prisma) {}

  async findPatient(companyId: string, patientId: string) {
    return this.db.patient.findFirst({
      where: { id: patientId, companyId, deletedAt: null },
      select: { id: true, name: true },
    });
  }

  async findByPatient(companyId: string, patientId: string): Promise<OdontogramWithDetails | null> {
    return this.db.odontogram.findFirst({
      where: { companyId, patientId, deletedAt: null },
      include: odontogramInclude,
    });
  }

  async create(companyId: string, patientId: string, userId: string): Promise<OdontogramWithDetails> {
    return this.db.odontogram.create({
      data: {
        companyId,
        patientId,
        createdById: userId,
        updatedById: userId,
        teeth: {
          create: ALL_FDI_TEETH.map((toothNumber) => ({ companyId, toothNumber })),
        },
      },
      include: odontogramInclude,
    });
  }

  async optimisticUpdate(
    companyId: string,
    odontogramId: string,
    expectedUpdatedAt: Date,
    userId: string,
  ): Promise<boolean> {
    const result = await this.db.odontogram.updateMany({
      where: { id: odontogramId, companyId, deletedAt: null, updatedAt: expectedUpdatedAt },
      data: { version: { increment: 1 }, updatedById: userId },
    });
    return result.count === 1;
  }

  async findTooth(companyId: string, odontogramId: string, toothNumber: number) {
    return this.db.odontogramTooth.findFirst({
      where: { companyId, odontogramId, toothNumber },
      select: { id: true, toothNumber: true },
    });
  }

  async createCondition(data: Prisma.ToothConditionCreateInput) {
    return this.db.toothCondition.create({ data, include: { surfaces: true } });
  }

  async updateCondition(id: string, companyId: string, odontogramId: string, data: Prisma.ToothConditionUpdateInput) {
    const existing = await this.db.toothCondition.findFirst({ where: { id, companyId, odontogramId, deletedAt: null } });
    if (!existing) throw new Error("Condição não encontrada");
    return this.db.toothCondition.update({
      where: { id },
      data,
      include: { surfaces: true },
    });
  }

  async createProcedure(data: Prisma.OdontogramProcedureCreateInput) {
    return this.db.odontogramProcedure.create({ data });
  }

  async updateProcedure(id: string, companyId: string, odontogramId: string, data: Prisma.OdontogramProcedureUpdateInput) {
    const existing = await this.db.odontogramProcedure.findFirst({ where: { id, companyId, odontogramId, deletedAt: null } });
    if (!existing) throw new Error("Procedimento não encontrado");
    return this.db.odontogramProcedure.update({ where: { id }, data });
  }

  async createObservation(data: Prisma.ToothObservationCreateInput) {
    return this.db.toothObservation.create({ data });
  }

  async updateObservation(id: string, companyId: string, odontogramId: string, data: Prisma.ToothObservationUpdateInput) {
    const existing = await this.db.toothObservation.findFirst({ where: { id, companyId, odontogramId, deletedAt: null } });
    if (!existing) throw new Error("Observação não encontrada");
    return this.db.toothObservation.update({ where: { id }, data });
  }

  async softDelete(target: "condition" | "procedure" | "observation", id: string, companyId: string, odontogramId: string, userId: string) {
    const deletedAt = new Date();
    if (target === "condition") {
      const record = await this.db.toothCondition.findFirst({ where: { id, companyId, odontogramId, deletedAt: null }, select: { toothId: true } });
      if (!record) return { count: 0, toothId: null };
      const result = await this.db.toothCondition.updateMany({ where: { id, companyId, odontogramId, deletedAt: null }, data: { deletedAt, updatedById: userId } });
      return { count: result.count, toothId: record.toothId };
    }
    if (target === "procedure") {
      const record = await this.db.odontogramProcedure.findFirst({ where: { id, companyId, odontogramId, deletedAt: null }, select: { toothId: true } });
      if (!record) return { count: 0, toothId: null };
      const result = await this.db.odontogramProcedure.updateMany({ where: { id, companyId, odontogramId, deletedAt: null }, data: { deletedAt, updatedById: userId } });
      return { count: result.count, toothId: record.toothId };
    }
    const record = await this.db.toothObservation.findFirst({ where: { id, companyId, odontogramId, deletedAt: null }, select: { toothId: true } });
    if (!record) return { count: 0, toothId: null };
    const result = await this.db.toothObservation.updateMany({ where: { id, companyId, odontogramId, deletedAt: null }, data: { deletedAt, updatedById: userId } });
    return { count: result.count, toothId: record.toothId };
  }

  async createEvent(data: Prisma.OdontogramEventCreateInput) {
    return this.db.odontogramEvent.create({ data });
  }
}
