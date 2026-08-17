"use server";

import { ZodError } from "zod";
import { requirePermission } from "@/shared/lib/session";
import type {
  AnamnesisDTO,
  AnamnesisRevisionDTO,
  ClinicalAttachmentDTO,
  ClinicalEvolutionDTO,
  ClinicalRecordDTO,
  ClinicalRecordEditorDataDTO,
} from "../dto/clinical-record.dto";
import {
  attachmentIdSchema,
  createAttachmentSchema,
  createEvolutionSchema,
  evolutionIdSchema,
  listAttachmentsSchema,
  patientClinicalRecordSchema,
  updateEvolutionSchema,
  upsertAnamnesisSchema,
} from "../schemas/clinical-record.schemas";
import {
  createAttachment,
  createEvolution,
  deleteAttachment,
  deleteEvolution,
  getClinicalRecord,
  getClinicalRecordEditorData,
  listAnamnesisRevisions,
  listPatientAttachments,
  listPatientsForClinicalRecords,
  updateEvolution,
  uploadPatientAttachment,
  upsertAnamnesis,
} from "../services/clinical-record.service";

export type ClinicalRecordActionResult<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

const message = (error: unknown, fallback: string) =>
  error instanceof ZodError
    ? (error.issues[0]?.message ?? "Dados inválidos")
    : error instanceof Error
      ? error.message
      : fallback;

export async function listClinicalRecordPatientsAction(): Promise<
  ClinicalRecordActionResult<{ id: string; name: string; preferredName: string | null }[]>
> {
  try {
    const user = await requirePermission("clinical_records:view");
    return { success: true, data: await listPatientsForClinicalRecords(user.companyId) };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível listar pacientes") };
  }
}

export async function getClinicalRecordAction(
  input: unknown,
): Promise<ClinicalRecordActionResult<ClinicalRecordDTO>> {
  try {
    const user = await requirePermission("clinical_records:view");
    const { patientId } = patientClinicalRecordSchema.parse(input);
    return { success: true, data: await getClinicalRecord(user.companyId, patientId) };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível carregar o prontuário") };
  }
}

export async function getClinicalRecordEditorDataAction(
  input: unknown,
): Promise<ClinicalRecordActionResult<ClinicalRecordEditorDataDTO>> {
  try {
    const user = await requirePermission("clinical_records:view");
    const { patientId } = patientClinicalRecordSchema.parse(input);
    return {
      success: true,
      data: await getClinicalRecordEditorData(user.companyId, patientId),
    };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível carregar dados auxiliares") };
  }
}

export async function upsertAnamnesisAction(
  input: unknown,
): Promise<ClinicalRecordActionResult<AnamnesisDTO>> {
  try {
    const user = await requirePermission("anamnesis:manage");
    const data = upsertAnamnesisSchema.parse(input);
    const result = await upsertAnamnesis(user.companyId, user.id, data);
    return { success: true, data: result, message: "Anamnese salva" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível salvar a anamnese") };
  }
}

export async function listAnamnesisRevisionsAction(
  input: unknown,
): Promise<ClinicalRecordActionResult<AnamnesisRevisionDTO[]>> {
  try {
    const user = await requirePermission("anamnesis:view");
    const { patientId } = patientClinicalRecordSchema.parse(input);
    return { success: true, data: await listAnamnesisRevisions(user.companyId, patientId) };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível carregar histórico") };
  }
}

export async function createEvolutionAction(
  input: unknown,
): Promise<ClinicalRecordActionResult<ClinicalEvolutionDTO>> {
  try {
    const user = await requirePermission("clinical_records:manage");
    const data = createEvolutionSchema.parse(input);
    const result = await createEvolution(user.companyId, user.id, data);
    return { success: true, data: result, message: "Evolução registrada" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível registrar evolução") };
  }
}

export async function updateEvolutionAction(
  input: unknown,
): Promise<ClinicalRecordActionResult<ClinicalEvolutionDTO>> {
  try {
    const user = await requirePermission("clinical_records:manage");
    const data = updateEvolutionSchema.parse(input);
    const result = await updateEvolution(user.companyId, user.id, data);
    return { success: true, data: result, message: "Evolução atualizada" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível atualizar evolução") };
  }
}

export async function deleteEvolutionAction(
  input: unknown,
): Promise<ClinicalRecordActionResult> {
  try {
    const user = await requirePermission("clinical_records:delete");
    const data = evolutionIdSchema.parse(input);
    await deleteEvolution(user.companyId, user.id, data.id, data.expectedUpdatedAt);
    return { success: true, data: undefined, message: "Evolução removida" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível remover evolução") };
  }
}

export async function createAttachmentAction(
  input: unknown,
): Promise<ClinicalRecordActionResult<ClinicalAttachmentDTO>> {
  try {
    const user = await requirePermission("clinical_records:manage");
    const data = createAttachmentSchema.parse(input);
    const result = await createAttachment(user.companyId, user.id, data);
    return { success: true, data: result, message: "Documento registrado" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível registrar documento") };
  }
}

export async function listPatientAttachmentsAction(
  input: unknown,
): Promise<ClinicalRecordActionResult<ClinicalAttachmentDTO[]>> {
  try {
    const user = await requirePermission("documents:view");
    const data = listAttachmentsSchema.parse(input);
    return {
      success: true,
      data: await listPatientAttachments(user.companyId, data.patientId, data.type),
    };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível listar arquivos") };
  }
}

export async function deletePatientAttachmentAction(
  input: unknown,
): Promise<ClinicalRecordActionResult> {
  try {
    const user = await requirePermission("documents:manage");
    const { id } = attachmentIdSchema.parse(input);
    await deleteAttachment(user.companyId, user.id, id);
    return { success: true, data: undefined, message: "Arquivo removido" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível remover o arquivo") };
  }
}

export async function uploadPatientAttachmentAction(
  formData: FormData,
): Promise<ClinicalRecordActionResult<ClinicalAttachmentDTO>> {
  try {
    const user = await requirePermission("documents:manage");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Selecione um arquivo para enviar" };
    }

    const parsed = createAttachmentSchema.parse({
      patientId: String(formData.get("patientId") ?? ""),
      type: formData.get("type") || "DOCUMENT",
      category: formData.get("category") || undefined,
      title: String(formData.get("title") ?? file.name),
      description: formData.get("description") ? String(formData.get("description")) : null,
      professionalId: formData.get("professionalId") ? String(formData.get("professionalId")) : null,
      occurredAt: formData.get("occurredAt")
        ? new Date(String(formData.get("occurredAt"))).toISOString()
        : new Date().toISOString(),
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadPatientAttachment(user.companyId, user.id, {
      ...parsed,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      data: buffer,
    });
    return { success: true, data: result, message: "Arquivo enviado" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível enviar o arquivo") };
  }
}
