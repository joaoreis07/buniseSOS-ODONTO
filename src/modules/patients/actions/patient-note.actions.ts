"use server";

import { ZodError } from "zod";
import { requirePermission } from "@/shared/lib/session";
import {
  createPatientNoteSchema,
  listPatientNotesSchema,
  patientNoteIdSchema,
  updatePatientNoteSchema,
} from "../schemas/patient-note.schemas";
import {
  archivePatientNote,
  createPatientNote,
  deletePatientNote,
  listPatientNotes,
  updatePatientNote,
  type PatientNoteDTO,
} from "../services/patient-note.service";

export type PatientNoteActionResult<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

const message = (error: unknown, fallback: string) =>
  error instanceof ZodError
    ? (error.issues[0]?.message ?? "Dados inválidos")
    : error instanceof Error
      ? error.message
      : fallback;

export async function listPatientNotesAction(
  input: unknown,
): Promise<PatientNoteActionResult<PatientNoteDTO[]>> {
  try {
    const user = await requirePermission("patients:view");
    const data = listPatientNotesSchema.parse(input);
    return {
      success: true,
      data: await listPatientNotes(user.companyId, data.patientId, data.includeArchived),
    };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível listar anotações") };
  }
}

export async function createPatientNoteAction(
  input: unknown,
): Promise<PatientNoteActionResult<PatientNoteDTO>> {
  try {
    const user = await requirePermission("patients:manage");
    const data = createPatientNoteSchema.parse(input);
    const result = await createPatientNote(user.companyId, user.id, data);
    return { success: true, data: result, message: "Anotação registrada" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível criar a anotação") };
  }
}

export async function updatePatientNoteAction(
  input: unknown,
): Promise<PatientNoteActionResult<PatientNoteDTO>> {
  try {
    const user = await requirePermission("patients:manage");
    const data = updatePatientNoteSchema.parse(input);
    const result = await updatePatientNote(user.companyId, user.id, data);
    return { success: true, data: result, message: "Anotação atualizada" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível atualizar a anotação") };
  }
}

export async function archivePatientNoteAction(
  input: unknown,
): Promise<PatientNoteActionResult> {
  try {
    const user = await requirePermission("patients:manage");
    const { id } = patientNoteIdSchema.parse(input);
    await archivePatientNote(user.companyId, user.id, id);
    return { success: true, data: undefined, message: "Anotação atualizada" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível arquivar a anotação") };
  }
}

export async function deletePatientNoteAction(
  input: unknown,
): Promise<PatientNoteActionResult> {
  try {
    const user = await requirePermission("patients:manage");
    const { id } = patientNoteIdSchema.parse(input);
    await deletePatientNote(user.companyId, user.id, id);
    return { success: true, data: undefined, message: "Anotação removida" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível remover a anotação") };
  }
}
