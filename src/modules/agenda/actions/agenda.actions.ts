"use server";

import { headers } from "next/headers";
import { ZodError } from "zod";
import { requirePermission } from "@/shared/lib/session";
import type {
  AgendaBootstrapDTO,
  AgendaRangeDTO,
  AppointmentClientDTO,
  PatientLiteDTO,
  ReturnAlertClientDTO,
  ScheduleBlockClientDTO,
  WaitingListClientDTO,
} from "../dto/agenda.dto";
import {
  agendaRangeQuerySchema,
  createAppointmentSchema,
  createReturnAlertSchema,
  createScheduleBlockSchema,
  createWaitingListSchema,
  rescheduleAppointmentSchema,
  updateAppointmentSchema,
} from "../schemas/agenda.schemas";
import {
  completeReturnAlert,
  createAppointment,
  createReturnAlert,
  createScheduleBlock,
  createWaitingListEntry,
  getAgendaBootstrap,
  getAgendaRange,
  rescheduleAppointment,
  searchPatients,
  updateAppointment,
} from "../services/agenda.service";

export type AgendaActionResult<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

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

export async function getAgendaBootstrapAction(): Promise<
  AgendaActionResult<AgendaBootstrapDTO>
> {
  try {
    const user = await requirePermission("agenda:view");
    const data = await getAgendaBootstrap(user.companyId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível carregar a agenda",
    };
  }
}

export async function getAgendaRangeAction(
  input: unknown,
): Promise<AgendaActionResult<AgendaRangeDTO>> {
  try {
    const user = await requirePermission("agenda:view");
    const query = agendaRangeQuerySchema.parse(input);
    const data = await getAgendaRange(user.companyId, {
      from: new Date(query.from),
      to: new Date(query.to),
      professionalIds: query.professionalIds,
      roomIds: query.roomIds,
      chairIds: query.chairIds,
      status: query.status,
      search: query.search,
      includeCanceled: query.includeCanceled,
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível carregar consultas",
    };
  }
}

export async function createAppointmentAction(
  input: unknown,
): Promise<AgendaActionResult<AppointmentClientDTO[]>> {
  try {
    const user = await requirePermission("agenda:manage");
    const data = createAppointmentSchema.parse(input);
    const meta = await requestMeta();
    const created = await createAppointment({
      companyId: user.companyId,
      userId: user.id,
      data,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { success: true, data: created, message: "Consulta criada" };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível criar a consulta",
    };
  }
}

export async function updateAppointmentAction(
  input: unknown,
): Promise<AgendaActionResult<AppointmentClientDTO>> {
  try {
    const user = await requirePermission("agenda:manage");
    const data = updateAppointmentSchema.parse(input);
    const meta = await requestMeta();
    const updated = await updateAppointment({
      companyId: user.companyId,
      userId: user.id,
      data,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { success: true, data: updated, message: "Consulta atualizada" };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível atualizar a consulta",
    };
  }
}

export async function rescheduleAppointmentAction(
  input: unknown,
): Promise<AgendaActionResult<AppointmentClientDTO>> {
  try {
    const user = await requirePermission("agenda:manage");
    const data = rescheduleAppointmentSchema.parse(input);
    const meta = await requestMeta();
    const updated = await rescheduleAppointment({
      companyId: user.companyId,
      userId: user.id,
      ...data,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { success: true, data: updated, message: "Horário atualizado" };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível reagendar",
    };
  }
}

export async function createScheduleBlockAction(
  input: unknown,
): Promise<AgendaActionResult<ScheduleBlockClientDTO>> {
  try {
    const user = await requirePermission("agenda:manage");
    const data = createScheduleBlockSchema.parse(input);
    const block = await createScheduleBlock({
      companyId: user.companyId,
      userId: user.id,
      data,
    });
    return { success: true, data: block, message: "Bloqueio criado" };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível criar o bloqueio",
    };
  }
}

export async function createWaitingListAction(
  input: unknown,
): Promise<AgendaActionResult<WaitingListClientDTO>> {
  try {
    const user = await requirePermission("agenda:manage");
    const data = createWaitingListSchema.parse(input);
    const entry = await createWaitingListEntry({ companyId: user.companyId, data });
    return { success: true, data: entry, message: "Adicionado à lista de espera" };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível adicionar à espera",
    };
  }
}

export async function createReturnAlertAction(
  input: unknown,
): Promise<AgendaActionResult<ReturnAlertClientDTO>> {
  try {
    const user = await requirePermission("agenda:manage");
    const data = createReturnAlertSchema.parse(input);
    const alert = await createReturnAlert({ companyId: user.companyId, data });
    return { success: true, data: alert, message: "Retorno agendado" };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível criar o retorno",
    };
  }
}

export async function completeReturnAlertAction(
  id: string,
): Promise<AgendaActionResult> {
  try {
    const user = await requirePermission("agenda:manage");
    await completeReturnAlert(user.companyId, id);
    return { success: true, data: undefined, message: "Retorno concluído" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível concluir o retorno",
    };
  }
}

export async function searchPatientsAction(
  query: string,
): Promise<AgendaActionResult<PatientLiteDTO[]>> {
  try {
    const user = await requirePermission("agenda:view");
    const data = await searchPatients(user.companyId, query);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha na busca",
    };
  }
}
