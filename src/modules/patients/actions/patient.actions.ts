"use server";

import { headers } from "next/headers";
import { ZodError } from "zod";
import { requirePermission } from "@/shared/lib/session";
import { hasPermission } from "@/shared/lib/rbac";
import type {
  PatientAppointmentHistoryDTO,
  PatientClientDTO,
  PatientListResultDTO,
  PatientTimelineEntryDTO,
} from "../dto/patient.dto";
import {
  createPatientSchema,
  patientIdSchema,
  patientListQuerySchema,
  updatePatientSchema,
} from "../schemas/patient.schemas";
import {
  createPatient,
  deletePatient,
  getPatient,
  getPatientListKpis,
  getPatientQuota,
  getPatientTimeline,
  listPatientAppointmentHistory,
  listPatients,
  updatePatient,
  type PatientListKpisDTO,
  type PatientQuotaDTO,
} from "../services/patient.service";
import { PatientLimitError } from "@/modules/billing/plan-limits";
import { lookupAddressByCep, type AddressByCepResult } from "../utils/patient.utils";

export type PatientActionResult<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code?: "PATIENT_LIMIT_REACHED" };

async function requestMeta() {
  const headerStore = await headers();
  return {
    ip:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      null,
    userAgent: headerStore.get("user-agent"),
  };
}

function zodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos";
}

export async function listPatientsAction(
  input: unknown = {},
): Promise<PatientActionResult<PatientListResultDTO>> {
  try {
    const user = await requirePermission("patients:view");
    const query = patientListQuerySchema.parse(input ?? {});
    const data = await listPatients(user.companyId, query);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível listar pacientes",
    };
  }
}

export async function getPatientAction(
  id: string,
): Promise<PatientActionResult<PatientClientDTO>> {
  try {
    const user = await requirePermission("patients:view");
    const data = await getPatient(user.companyId, id);
    if (!data) return { success: false, error: "Paciente não encontrado" };
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível carregar o paciente",
    };
  }
}

export async function listPatientAppointmentHistoryAction(
  id: string,
): Promise<PatientActionResult<PatientAppointmentHistoryDTO[]>> {
  try {
    const user = await requirePermission("patients:view");
    const { id: patientId } = patientIdSchema.parse({ id });
    const data = await listPatientAppointmentHistory(user.companyId, patientId);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível carregar o histórico",
    };
  }
}

export async function getPatientTimelineAction(
  id: string,
): Promise<PatientActionResult<PatientTimelineEntryDTO[]>> {
  try {
    const user = await requirePermission("patients:view");
    const { id: patientId } = patientIdSchema.parse({ id });
    const data = await getPatientTimeline(user.companyId, patientId, {
      includeFinance: hasPermission(user.role, "finance:view"),
      includeBudgets: hasPermission(user.role, "budgets:view"),
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível carregar a linha do tempo",
    };
  }
}

export async function createPatientAction(
  input: unknown,
): Promise<PatientActionResult<PatientClientDTO>> {
  try {
    const user = await requirePermission("patients:manage");
    const data = createPatientSchema.parse(input);
    const meta = await requestMeta();
    const created = await createPatient({
      companyId: user.companyId,
      userId: user.id,
      data,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { success: true, data: created, message: "Paciente cadastrado" };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    if (error instanceof PatientLimitError) {
      return { success: false, error: error.message, code: error.code };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível cadastrar o paciente",
    };
  }
}

export async function getPatientQuotaAction(): Promise<PatientActionResult<PatientQuotaDTO>> {
  try {
    const user = await requirePermission("patients:view");
    return { success: true, data: await getPatientQuota(user.companyId) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível carregar o limite do plano",
    };
  }
}

export async function getPatientListKpisAction(): Promise<PatientActionResult<PatientListKpisDTO>> {
  try {
    const user = await requirePermission("patients:view");
    return { success: true, data: await getPatientListKpis(user.companyId) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível carregar os indicadores",
    };
  }
}

export async function updatePatientAction(
  input: unknown,
): Promise<PatientActionResult<PatientClientDTO>> {
  try {
    const user = await requirePermission("patients:manage");
    const parsed = updatePatientSchema.parse(input);
    const { id, ...data } = parsed;
    const meta = await requestMeta();
    const updated = await updatePatient({
      companyId: user.companyId,
      userId: user.id,
      id,
      data,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { success: true, data: updated, message: "Paciente atualizado" };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível atualizar o paciente",
    };
  }
}

export async function deletePatientAction(
  input: unknown,
): Promise<PatientActionResult> {
  try {
    const user = await requirePermission("patients:manage");
    const { id } = patientIdSchema.parse(input);
    const meta = await requestMeta();
    await deletePatient({
      companyId: user.companyId,
      userId: user.id,
      id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { success: true, data: undefined, message: "Paciente removido" };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível remover o paciente",
    };
  }
}

export async function lookupCepAction(
  cep: string,
): Promise<PatientActionResult<AddressByCepResult>> {
  try {
    await requirePermission("patients:view");
    const data = await lookupAddressByCep(cep);
    if (!data) return { success: false, error: "CEP não encontrado" };
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha ao consultar CEP",
    };
  }
}
