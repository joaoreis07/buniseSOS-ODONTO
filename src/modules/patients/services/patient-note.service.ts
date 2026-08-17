import { prisma } from "@/shared/lib/prisma";
import { assertTenantId } from "@/shared/lib/tenant";
import type { z } from "zod";
import type {
  createPatientNoteSchema,
  updatePatientNoteSchema,
} from "../schemas/patient-note.schemas";

export type PatientNoteDTO = {
  id: string;
  patientId: string;
  type: "CLINICAL" | "ADMIN" | "ALERT";
  body: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

type CreateInput = z.infer<typeof createPatientNoteSchema>;
type UpdateInput = z.infer<typeof updatePatientNoteSchema>;

function noteDto(row: {
  id: string;
  patientId: string;
  type: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  author: { name: string | null } | null;
}): PatientNoteDTO {
  return {
    id: row.id,
    patientId: row.patientId,
    type: (row.type as PatientNoteDTO["type"]) || "CLINICAL",
    body: row.body,
    authorName: row.author?.name ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

async function assertPatient(companyId: string, patientId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, companyId, deletedAt: null },
    select: { id: true },
  });
  if (!patient) throw new Error("Paciente não encontrado");
}

async function audit(companyId: string, userId: string, action: string, entityId: string) {
  await prisma.auditLog.create({
    data: {
      companyId,
      userId,
      module: "patients",
      action,
      entity: "PatientNote",
      entityId,
    },
  });
}

export async function listPatientNotes(
  companyId: string,
  patientId: string,
  includeArchived = false,
): Promise<PatientNoteDTO[]> {
  assertTenantId(companyId);
  await assertPatient(companyId, patientId);
  const rows = await prisma.patientNote.findMany({
    where: {
      companyId,
      patientId,
      deletedAt: null,
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });
  return rows.map(noteDto);
}

export async function createPatientNote(
  companyId: string,
  userId: string,
  input: CreateInput,
): Promise<PatientNoteDTO> {
  assertTenantId(companyId);
  await assertPatient(companyId, input.patientId);
  const row = await prisma.patientNote.create({
    data: {
      companyId,
      patientId: input.patientId,
      authorId: userId,
      type: input.type,
      body: input.body,
    },
    include: { author: { select: { name: true } } },
  });
  await audit(companyId, userId, "create", row.id);
  return noteDto(row);
}

export async function updatePatientNote(
  companyId: string,
  userId: string,
  input: UpdateInput,
): Promise<PatientNoteDTO> {
  assertTenantId(companyId);
  const current = await prisma.patientNote.findFirst({
    where: { id: input.id, companyId, deletedAt: null },
  });
  if (!current) throw new Error("Anotação não encontrada");
  if (current.archivedAt) throw new Error("Anotação arquivada não pode ser editada");
  const row = await prisma.patientNote.update({
    where: { id: current.id },
    data: {
      ...(input.type ? { type: input.type } : {}),
      ...(input.body ? { body: input.body } : {}),
    },
    include: { author: { select: { name: true } } },
  });
  await audit(companyId, userId, "update", row.id);
  return noteDto(row);
}

export async function archivePatientNote(companyId: string, userId: string, id: string) {
  assertTenantId(companyId);
  const current = await prisma.patientNote.findFirst({
    where: { id, companyId, deletedAt: null },
  });
  if (!current) throw new Error("Anotação não encontrada");
  await prisma.patientNote.update({
    where: { id },
    data: { archivedAt: current.archivedAt ? null : new Date() },
  });
  await audit(companyId, userId, current.archivedAt ? "restore" : "archive", id);
}

export async function deletePatientNote(companyId: string, userId: string, id: string) {
  assertTenantId(companyId);
  const current = await prisma.patientNote.findFirst({
    where: { id, companyId, deletedAt: null },
  });
  if (!current) throw new Error("Anotação não encontrada");
  await prisma.patientNote.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await audit(companyId, userId, "delete", id);
}
