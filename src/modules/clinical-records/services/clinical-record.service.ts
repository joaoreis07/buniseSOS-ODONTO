import { Prisma, type ClinicalEvolutionEventType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/prisma";
import { assertTenantId } from "@/shared/lib/tenant";
import type {
  AnamnesisDTO,
  AnamnesisRevisionDTO,
  ClinicalAttachmentDTO,
  ClinicalEvolutionDTO,
  ClinicalRecordDTO,
  ClinicalRecordEditorDataDTO,
  TimelineEntryDTO,
} from "../dto/clinical-record.dto";
import {
  PrismaClinicalRecordRepository,
  evolutionDetailInclude,
  type EvolutionDetailRow,
} from "../repositories/prisma-clinical-record.repository";
import type { z } from "zod";
import type {
  createAttachmentSchema,
  createEvolutionSchema,
  updateEvolutionSchema,
  upsertAnamnesisSchema,
} from "../schemas/clinical-record.schemas";

type UpsertAnamnesisInput = z.infer<typeof upsertAnamnesisSchema>;
type CreateEvolutionInput = z.infer<typeof createEvolutionSchema>;
type UpdateEvolutionInput = z.infer<typeof updateEvolutionSchema>;
type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;

const repo = new PrismaClinicalRecordRepository(prisma);

function anamnesisDto(row: NonNullable<Awaited<ReturnType<typeof repo.findAnamnesis>>>): AnamnesisDTO {
  return {
    id: row.id,
    patientId: row.patientId,
    allergies: row.allergies,
    medications: row.medications,
    diseases: row.diseases,
    surgeries: row.surgeries,
    medicalHistory: row.medicalHistory,
    dentalHistory: row.dentalHistory,
    observations: row.observations,
    smoking: row.smoking,
    alcoholUse: row.alcoholUse,
    oralHygiene: row.oralHygiene,
    parafunctionalHabits: row.parafunctionalHabits,
    otherHabits: row.otherHabits,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function evolutionDto(row: EvolutionDetailRow): ClinicalEvolutionDTO {
  return {
    id: row.id,
    patientId: row.patientId,
    title: row.title,
    description: row.description,
    notes: row.notes,
    occurredAt: row.occurredAt.toISOString(),
    teeth: row.teeth.map((t) => t.toothNumber),
    professional: row.professional,
    appointment: row.appointment
      ? {
          id: row.appointment.id,
          startsAt: row.appointment.startsAt.toISOString(),
          procedure: row.appointment.procedure,
        }
      : null,
    treatmentPlanItem: row.treatmentPlanItem
      ? {
          id: row.treatmentPlanItem.id,
          title: row.treatmentPlanItem.title,
          planCode: row.treatmentPlanItem.plan.code,
        }
      : null,
    procedure: row.procedure,
    authorName: row.createdBy?.name ?? row.updatedBy?.name ?? null,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function buildTimeline(
  anamnesis: AnamnesisDTO | null,
  evolutions: ClinicalEvolutionDTO[],
  attachments: ClinicalAttachmentDTO[],
  revisions: AnamnesisRevisionDTO[],
): TimelineEntryDTO[] {
  const entries: TimelineEntryDTO[] = [];

  for (const evolution of evolutions) {
    entries.push({
      id: evolution.id,
      kind: "evolution",
      occurredAt: evolution.occurredAt,
      title: evolution.title,
      subtitle: evolution.teeth.length ? `Dente(s) ${evolution.teeth.join(", ")}` : evolution.description.slice(0, 120),
      professionalName: evolution.professional?.name ?? evolution.authorName,
      teeth: evolution.teeth,
    });
  }

  for (const revision of revisions) {
    entries.push({
      id: revision.id,
      kind: "anamnesis",
      occurredAt: revision.createdAt,
      title: "Anamnese atualizada",
      subtitle: revision.actorName ? `Por ${revision.actorName}` : null,
      professionalName: revision.actorName,
      teeth: [],
    });
  }

  for (const attachment of attachments) {
    if (!attachment.occurredAt) continue;
    entries.push({
      id: attachment.id,
      kind: "attachment",
      occurredAt: attachment.occurredAt,
      title: attachment.title,
      subtitle: attachment.type === "EXAM" ? "Exame" : "Documento",
      professionalName: attachment.professionalName,
      teeth: [],
    });
  }

  if (anamnesis && revisions.length === 0) {
    entries.push({
      id: `anamnesis-${anamnesis.id}`,
      kind: "anamnesis",
      occurredAt: anamnesis.createdAt,
      title: "Anamnese registrada",
      subtitle: null,
      professionalName: null,
      teeth: [],
    });
  }

  return entries.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

async function auditLog(
  companyId: string,
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata?: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({
    data: { companyId, userId, module: "clinical_records", action, entity, entityId, metadata },
  });
}

async function evolutionEvent(
  tx: Prisma.TransactionClient,
  companyId: string,
  evolutionId: string,
  actorId: string,
  type: ClinicalEvolutionEventType,
  after?: Prisma.InputJsonValue,
  before?: Prisma.InputJsonValue,
) {
  await tx.clinicalEvolutionEvent.create({
    data: { companyId, evolutionId, actorId, type, before, after },
  });
}

async function assertPatient(companyId: string, patientId: string) {
  const patient = await repo.findPatient(companyId, patientId);
  if (!patient) throw new Error("Paciente não encontrado");
  return patient;
}

async function assertEvolutionConcurrency(
  tx: Prisma.TransactionClient,
  companyId: string,
  id: string,
  expectedUpdatedAt: string,
) {
  const current = await tx.clinicalEvolution.findFirst({
    where: { id, companyId, deletedAt: null },
  });
  if (!current) throw new Error("Evolução clínica não encontrada");
  if (current.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) {
    throw new Error("Este registro foi alterado por outra pessoa. Recarregue antes de salvar.");
  }
  return current;
}

async function assertReferences(
  tx: Prisma.TransactionClient,
  companyId: string,
  patientId: string,
  input: {
    professionalId?: string | null;
    appointmentId?: string | null;
    treatmentPlanItemId?: string | null;
    procedureId?: string | null;
  },
) {
  if (input.professionalId) {
    const pro = await tx.professional.findFirst({
      where: { id: input.professionalId, companyId, deletedAt: null },
    });
    if (!pro) throw new Error("Profissional não encontrado");
  }
  if (input.appointmentId) {
    const appt = await tx.appointment.findFirst({
      where: { id: input.appointmentId, companyId, patientId, deletedAt: null },
    });
    if (!appt) throw new Error("Consulta não encontrada para este paciente");
  }
  if (input.treatmentPlanItemId) {
    const item = await tx.treatmentPlanItem.findFirst({
      where: {
        id: input.treatmentPlanItemId,
        companyId,
        deletedAt: null,
        plan: { patientId, companyId, deletedAt: null },
      },
    });
    if (!item) throw new Error("Item do plano não encontrado para este paciente");
  }
  if (input.procedureId) {
    const proc = await tx.procedureCatalog.findFirst({
      where: { id: input.procedureId, companyId, deletedAt: null },
    });
    if (!proc) throw new Error("Procedimento não encontrado");
  }
}

function revalidateClinical(patientId: string) {
  revalidatePath("/app/clinical-records");
  revalidatePath("/app/patients");
  revalidatePath(`/app/patients?patientId=${patientId}`);
}

export async function getClinicalRecord(
  companyId: string,
  patientId: string,
): Promise<ClinicalRecordDTO> {
  assertTenantId(companyId);
  const patient = await assertPatient(companyId, patientId);
  const anamnesisRow = await repo.findAnamnesis(companyId, patientId);
  const anamnesis = anamnesisRow ? anamnesisDto(anamnesisRow) : null;
  const revisions = anamnesisRow
    ? (await repo.listAnamnesisRevisions(companyId, anamnesisRow.id)).map((row) => ({
        id: row.id,
        actorName: row.actor?.name ?? null,
        createdAt: row.createdAt.toISOString(),
      }))
    : [];
  const evolutions = (await repo.listEvolutions(companyId, patientId)).map(evolutionDto);
  const attachments = (await repo.listAttachments(companyId, patientId)).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    fileName: row.fileName,
    fileKey: row.fileKey,
    contentType: row.contentType,
    occurredAt: row.occurredAt?.toISOString() ?? null,
    professionalName: row.professional?.name ?? null,
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    patient,
    anamnesis,
    evolutions,
    attachments,
    timeline: buildTimeline(anamnesis, evolutions, attachments, revisions),
  };
}

export async function getClinicalRecordEditorData(
  companyId: string,
  patientId: string,
): Promise<ClinicalRecordEditorDataDTO> {
  assertTenantId(companyId);
  await assertPatient(companyId, patientId);
  const [professionals, appointments, planItems, procedures] = await Promise.all([
    repo.listEditorProfessionals(companyId),
    repo.listEditorAppointments(companyId, patientId),
    repo.listEditorPlanItems(companyId, patientId),
    repo.listEditorProcedures(companyId),
  ]);
  return {
    professionals,
    appointments: appointments.map((a) => ({
      id: a.id,
      startsAt: a.startsAt.toISOString(),
      procedure: a.procedure,
      status: a.status,
    })),
    planItems: planItems.map((item) => ({
      id: item.id,
      title: item.title,
      planCode: item.plan.code,
      teeth: item.teeth.map((t) => t.toothNumber),
    })),
    procedures,
  };
}

export async function listAnamnesisRevisions(
  companyId: string,
  patientId: string,
): Promise<AnamnesisRevisionDTO[]> {
  assertTenantId(companyId);
  const anamnesis = await repo.findAnamnesis(companyId, patientId);
  if (!anamnesis) return [];
  return (await repo.listAnamnesisRevisions(companyId, anamnesis.id)).map((row) => ({
    id: row.id,
    actorName: row.actor?.name ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function upsertAnamnesis(
  companyId: string,
  userId: string,
  input: UpsertAnamnesisInput,
): Promise<AnamnesisDTO> {
  assertTenantId(companyId);
  await assertPatient(companyId, input.patientId);

  const data = {
    allergies: input.allergies ?? null,
    medications: input.medications ?? null,
    diseases: input.diseases ?? null,
    surgeries: input.surgeries ?? null,
    medicalHistory: input.medicalHistory ?? null,
    dentalHistory: input.dentalHistory ?? null,
    observations: input.observations ?? null,
    smoking: input.smoking ?? null,
    alcoholUse: input.alcoholUse ?? null,
    oralHygiene: input.oralHygiene ?? null,
    parafunctionalHabits: input.parafunctionalHabits ?? null,
    otherHabits: input.otherHabits ?? null,
  };

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.patientAnamnesis.findFirst({
      where: { companyId, patientId: input.patientId },
    });

    if (existing && input.expectedUpdatedAt) {
      if (existing.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime()) {
        throw new Error("A anamnese foi alterada por outra pessoa. Recarregue antes de salvar.");
      }
    }

    let row;
    if (existing) {
      await tx.anamnesisRevision.create({
        data: {
          companyId,
          anamnesisId: existing.id,
          actorId: userId,
          snapshot: existing as unknown as Prisma.InputJsonValue,
        },
      });
      row = await tx.patientAnamnesis.update({
        where: { id: existing.id },
        data: { ...data, updatedById: userId },
      });
    } else {
      row = await tx.patientAnamnesis.create({
        data: {
          companyId,
          patientId: input.patientId,
          ...data,
          createdById: userId,
          updatedById: userId,
        },
      });
    }

    return { row, isUpdate: !!existing };
  });

  await auditLog(
    companyId,
    userId,
    result.isUpdate ? "update" : "create",
    "PatientAnamnesis",
    result.row.id,
  );
  revalidateClinical(input.patientId);
  return anamnesisDto(result.row);
}

export async function createEvolution(
  companyId: string,
  userId: string,
  input: CreateEvolutionInput,
): Promise<ClinicalEvolutionDTO> {
  assertTenantId(companyId);
  await assertPatient(companyId, input.patientId);

  const row = await prisma.$transaction(async (tx) => {
    await assertReferences(tx, companyId, input.patientId, input);
    const created = await tx.clinicalEvolution.create({
      data: {
        companyId,
        patientId: input.patientId,
        professionalId: input.professionalId ?? null,
        appointmentId: input.appointmentId ?? null,
        treatmentPlanItemId: input.treatmentPlanItemId ?? null,
        procedureId: input.procedureId ?? null,
        title: input.title,
        description: input.description,
        notes: input.notes ?? null,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
        createdById: userId,
        updatedById: userId,
        teeth: {
          create: input.teeth.map((toothNumber) => ({ toothNumber })),
        },
      },
      include: evolutionDetailInclude,
    });
    await evolutionEvent(tx, companyId, created.id, userId, "CREATED", {
      title: created.title,
      description: created.description,
    });
    return created;
  });

  await auditLog(companyId, userId, "create", "ClinicalEvolution", row.id);
  revalidateClinical(input.patientId);
  return evolutionDto(row);
}

export async function updateEvolution(
  companyId: string,
  userId: string,
  input: UpdateEvolutionInput,
): Promise<ClinicalEvolutionDTO> {
  assertTenantId(companyId);

  const row = await prisma.$transaction(async (tx) => {
    const current = await assertEvolutionConcurrency(tx, companyId, input.id, input.expectedUpdatedAt);
    await assertReferences(tx, companyId, current.patientId, input);

    await tx.clinicalEvolutionTooth.deleteMany({ where: { evolutionId: input.id } });

    const updated = await tx.clinicalEvolution.update({
      where: { id: input.id },
      data: {
        professionalId: input.professionalId ?? null,
        appointmentId: input.appointmentId ?? null,
        treatmentPlanItemId: input.treatmentPlanItemId ?? null,
        procedureId: input.procedureId ?? null,
        title: input.title,
        description: input.description,
        notes: input.notes ?? null,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : current.occurredAt,
        updatedById: userId,
        teeth: {
          create: input.teeth.map((toothNumber) => ({ toothNumber })),
        },
      },
      include: evolutionDetailInclude,
    });

    await evolutionEvent(
      tx,
      companyId,
      input.id,
      userId,
      "UPDATED",
      { title: updated.title, description: updated.description },
      { title: current.title, description: current.description },
    );

    return updated;
  });

  await auditLog(companyId, userId, "update", "ClinicalEvolution", row.id);
  revalidateClinical(row.patientId);
  return evolutionDto(row);
}

export async function deleteEvolution(
  companyId: string,
  userId: string,
  id: string,
  expectedUpdatedAt?: string,
): Promise<void> {
  assertTenantId(companyId);

  await prisma.$transaction(async (tx) => {
    const current = expectedUpdatedAt
      ? await assertEvolutionConcurrency(tx, companyId, id, expectedUpdatedAt)
      : await tx.clinicalEvolution.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!current) throw new Error("Evolução clínica não encontrada");

    await tx.clinicalEvolution.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    await evolutionEvent(tx, companyId, id, userId, "DELETED", undefined, {
      title: current.title,
    });

    return current.patientId;
  }).then(async (patientId) => {
    await auditLog(companyId, userId, "delete", "ClinicalEvolution", id);
    revalidateClinical(patientId);
  });
}

export async function createAttachment(
  companyId: string,
  userId: string,
  input: CreateAttachmentInput,
): Promise<ClinicalAttachmentDTO> {
  assertTenantId(companyId);
  await assertPatient(companyId, input.patientId);

  const row = await prisma.clinicalAttachment.create({
    data: {
      companyId,
      patientId: input.patientId,
      evolutionId: input.evolutionId ?? null,
      professionalId: input.professionalId ?? null,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      fileKey: input.fileKey ?? null,
      fileName: input.fileName ?? null,
      contentType: input.contentType ?? null,
      fileSize: input.fileSize ?? null,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      createdById: userId,
    },
    include: { professional: { select: { name: true } } },
  });

  await auditLog(companyId, userId, "create", "ClinicalAttachment", row.id);
  revalidateClinical(input.patientId);

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    fileName: row.fileName,
    fileKey: row.fileKey,
    contentType: row.contentType,
    occurredAt: row.occurredAt?.toISOString() ?? null,
    professionalName: row.professional?.name ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listPatientsForClinicalRecords(companyId: string) {
  assertTenantId(companyId);
  return prisma.patient.findMany({
    where: { companyId, deletedAt: null, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, preferredName: true },
  });
}
