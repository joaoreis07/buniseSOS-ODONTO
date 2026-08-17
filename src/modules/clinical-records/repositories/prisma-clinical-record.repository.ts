import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export const evolutionDetailInclude = {
  professional: { select: { id: true, name: true } },
  appointment: { select: { id: true, startsAt: true, procedure: true, status: true } },
  treatmentPlanItem: {
    select: {
      id: true,
      title: true,
      plan: { select: { code: true } },
    },
  },
  procedure: { select: { id: true, name: true, code: true } },
  teeth: { select: { toothNumber: true, surfaces: true } },
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
} satisfies Prisma.ClinicalEvolutionInclude;

export type EvolutionDetailRow = Prisma.ClinicalEvolutionGetPayload<{
  include: typeof evolutionDetailInclude;
}>;

export class PrismaClinicalRecordRepository {
  constructor(private readonly db: DbClient) {}

  findPatient(companyId: string, patientId: string) {
    return this.db.patient.findFirst({
      where: { id: patientId, companyId, deletedAt: null },
      select: { id: true, name: true, preferredName: true },
    });
  }

  findAnamnesis(companyId: string, patientId: string) {
    return this.db.patientAnamnesis.findFirst({
      where: { companyId, patientId },
      include: { updatedBy: { select: { name: true } } },
    });
  }

  listAnamnesisRevisions(companyId: string, anamnesisId: string, limit = 20) {
    return this.db.anamnesisRevision.findMany({
      where: { companyId, anamnesisId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { actor: { select: { name: true } } },
    });
  }

  listEvolutions(companyId: string, patientId: string) {
    return this.db.clinicalEvolution.findMany({
      where: { companyId, patientId, deletedAt: null },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      include: evolutionDetailInclude,
    });
  }

  findEvolutionById(companyId: string, id: string) {
    return this.db.clinicalEvolution.findFirst({
      where: { id, companyId, deletedAt: null },
      include: evolutionDetailInclude,
    });
  }

  listAttachments(
    companyId: string,
    patientId: string,
    type?: "DOCUMENT" | "EXAM" | "OTHER",
  ) {
    return this.db.clinicalAttachment.findMany({
      where: { companyId, patientId, deletedAt: null, ...(type ? { type } : {}) },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      include: {
        professional: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    });
  }

  findAttachmentById(companyId: string, id: string) {
    return this.db.clinicalAttachment.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        professional: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    });
  }

  listEditorAppointments(companyId: string, patientId: string) {
    return this.db.appointment.findMany({
      where: { companyId, patientId, deletedAt: null },
      orderBy: { startsAt: "desc" },
      take: 30,
      select: { id: true, startsAt: true, procedure: true, status: true },
    });
  }

  listEditorPlanItems(companyId: string, patientId: string) {
    return this.db.treatmentPlanItem.findMany({
      where: {
        companyId,
        deletedAt: null,
        plan: { patientId, companyId, deletedAt: null, status: { not: "CANCELLED" } },
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        plan: { select: { code: true } },
        teeth: { select: { toothNumber: true, surfaces: true } },
      },
    });
  }

  listEditorProfessionals(companyId: string) {
    return this.db.professional.findMany({
      where: { companyId, deletedAt: null, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  }

  listEditorProcedures(companyId: string) {
    return this.db.procedureCatalog.findMany({
      where: { companyId, deletedAt: null, active: true },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    });
  }
}
