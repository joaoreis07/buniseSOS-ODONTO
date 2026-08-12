import { createId } from "@/modules/agenda/utils/create-id";
import { revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { assertTenantId } from "@/shared/lib/tenant";
import { prisma } from "@/shared/lib/prisma";
import type {
  AgendaBootstrapDTO,
  AgendaRangeDTO,
  AppointmentClientDTO,
  ReturnAlertClientDTO,
  ScheduleBlockClientDTO,
  WaitingListClientDTO,
} from "../dto/agenda.dto";
import type {
  AppointmentWithRelations,
  ReturnAlertWithRelations,
  WaitingListWithRelations,
} from "../repositories/agenda.repository";
import { PrismaAgendaRepository } from "../repositories/prisma-agenda.repository";
import { addDays, CLINIC_END_HOUR, CLINIC_START_HOUR, SLOT_MINUTES } from "../utils/agenda.utils";

const repo = new PrismaAgendaRepository();

export function getAgendaCacheTag(companyId: string): string {
  return `agenda:${companyId}`;
}

function invalidateAgenda(companyId: string) {
  try {
    revalidateTag(getAgendaCacheTag(companyId));
  } catch {
    // ignore outside Next request
  }
}

export function toAppointmentClientDTO(row: AppointmentWithRelations): AppointmentClientDTO {
  return {
    id: row.id,
    companyId: row.companyId,
    patientId: row.patientId,
    patientName: row.patient.name,
    patientPhone: row.patient.phone,
    professionalId: row.professionalId,
    professionalName: row.professional.name,
    professionalColor: row.professional.color,
    roomId: row.roomId,
    roomName: row.room?.name ?? null,
    chairId: row.chairId,
    chairName: row.chair?.name ?? null,
    status: row.status,
    title: row.title,
    procedure: row.procedure,
    notes: row.notes,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    recurrenceRule: row.recurrenceRule,
    recurrenceGroupId: row.recurrenceGroupId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toWaitingDTO(row: WaitingListWithRelations): WaitingListClientDTO {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.patient.name,
    professionalId: row.professionalId,
    professionalName: row.professional?.name ?? null,
    preferredDate: row.preferredDate?.toISOString() ?? null,
    notes: row.notes,
    status: row.status,
    priority: row.priority,
    createdAt: row.createdAt.toISOString(),
  };
}

function toReturnDTO(row: ReturnAlertWithRelations): ReturnAlertClientDTO {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.patient.name,
    dueDate: row.dueDate.toISOString(),
    reason: row.reason,
    notes: row.notes,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

function toBlockDTO(row: {
  id: string;
  type: ScheduleBlockClientDTO["type"];
  title: string | null;
  professionalId: string | null;
  roomId: string | null;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
}): ScheduleBlockClientDTO {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    professionalId: row.professionalId,
    roomId: row.roomId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    allDay: row.allDay,
  };
}

async function writeAudit(input: {
  companyId: string;
  userId: string;
  action: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      module: "agenda",
      action: input.action,
      entity: "Appointment",
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

export async function getAgendaBootstrap(companyId: string): Promise<AgendaBootstrapDTO> {
  assertTenantId(companyId);
  const [professionals, rooms, chairs, waitingList, returnAlerts] = await Promise.all([
    repo.listProfessionals(companyId),
    repo.listRooms(companyId),
    repo.listChairs(companyId),
    repo.listWaiting(companyId),
    repo.listReturnAlerts(companyId),
  ]);

  return {
    professionals: professionals.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      specialty: p.specialty,
      active: p.active,
    })),
    rooms: rooms.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      active: r.active,
    })),
    chairs: chairs.map((c) => ({
      id: c.id,
      name: c.name,
      roomId: c.roomId,
      active: c.active,
    })),
    waitingList: waitingList.map(toWaitingDTO),
    returnAlerts: returnAlerts.map(toReturnDTO),
    clinicHours: {
      startHour: CLINIC_START_HOUR,
      endHour: CLINIC_END_HOUR,
      slotMinutes: SLOT_MINUTES,
    },
  };
}

export async function getAgendaRange(
  companyId: string,
  params: {
    from: Date;
    to: Date;
    professionalIds?: string[];
    roomIds?: string[];
    chairIds?: string[];
    status?: AppointmentClientDTO["status"][];
    search?: string;
    includeCanceled?: boolean;
  },
): Promise<AgendaRangeDTO> {
  assertTenantId(companyId);
  const [appointments, blocks] = await Promise.all([
    repo.listAppointments(companyId, params),
    repo.listBlocks(companyId, params.from, params.to),
  ]);
  return {
    appointments: appointments.map(toAppointmentClientDTO),
    blocks: blocks.map(toBlockDTO),
  };
}

export async function createAppointment(input: {
  companyId: string;
  userId: string;
  data: {
    patientId?: string;
    patientName?: string;
    patientPhone?: string;
    professionalId: string;
    roomId?: string;
    chairId?: string;
    procedure?: string;
    notes?: string;
    startsAt: string;
    endsAt: string;
    status?: AppointmentClientDTO["status"];
    recurrenceRule?: string;
    recurrenceCount?: number;
  };
  ip?: string | null;
  userAgent?: string | null;
}): Promise<AppointmentClientDTO[]> {
  assertTenantId(input.companyId);
  const patient = await repo.findOrCreatePatient(input.companyId, {
    id: input.data.patientId,
    name: input.data.patientName,
    phone: input.data.patientPhone,
  });

  const startsAt = new Date(input.data.startsAt);
  const endsAt = new Date(input.data.endsAt);
  const duration = endsAt.getTime() - startsAt.getTime();
  const count = input.data.recurrenceRule ? (input.data.recurrenceCount ?? 4) : 1;
  const groupId = count > 1 ? createId() : null;

  const payloads = Array.from({ length: count }, (_, index) => {
    const start = addDays(startsAt, index * 7);
    const end = new Date(start.getTime() + duration);
    return {
      patientId: patient.id,
      professionalId: input.data.professionalId,
      roomId: input.data.roomId ?? null,
      chairId: input.data.chairId ?? null,
      status: input.data.status ?? "SCHEDULED",
      procedure: input.data.procedure ?? null,
      notes: input.data.notes ?? null,
      startsAt: start,
      endsAt: end,
      recurrenceRule: input.data.recurrenceRule ?? null,
      recurrenceGroupId: groupId,
    };
  });

  const created = await repo.createAppointmentsMany(input.companyId, payloads);
  await writeAudit({
    companyId: input.companyId,
    userId: input.userId,
    action: "create",
    entityId: created[0]?.id,
    metadata: { count: created.length },
    ip: input.ip,
    userAgent: input.userAgent,
  });
  invalidateAgenda(input.companyId);
  return created.map(toAppointmentClientDTO);
}

export async function updateAppointment(input: {
  companyId: string;
  userId: string;
  data: {
    id: string;
    professionalId?: string;
    roomId?: string | null;
    chairId?: string | null;
    procedure?: string | null;
    notes?: string | null;
    startsAt?: string;
    endsAt?: string;
    status?: AppointmentClientDTO["status"];
    cancelReason?: string;
  };
  ip?: string | null;
  userAgent?: string | null;
}): Promise<AppointmentClientDTO> {
  assertTenantId(input.companyId);
  const existing = await repo.findAppointment(input.companyId, input.data.id);
  if (!existing) throw new Error("Consulta não encontrada");

  const status = input.data.status;
  const patch = {
    professionalId: input.data.professionalId,
    roomId: input.data.roomId,
    chairId: input.data.chairId,
    procedure: input.data.procedure,
    notes: input.data.notes,
    startsAt: input.data.startsAt ? new Date(input.data.startsAt) : undefined,
    endsAt: input.data.endsAt ? new Date(input.data.endsAt) : undefined,
    status,
    confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
    startedAt: status === "IN_PROGRESS" ? new Date() : undefined,
    completedAt: status === "COMPLETED" ? new Date() : undefined,
    canceledAt: status === "CANCELED" ? new Date() : undefined,
    cancelReason: status === "CANCELED" ? (input.data.cancelReason ?? null) : undefined,
  };

  const updated = await repo.updateAppointment(input.companyId, input.data.id, patch);
  await writeAudit({
    companyId: input.companyId,
    userId: input.userId,
    action: "update",
    entityId: updated.id,
    metadata: { status: updated.status },
    ip: input.ip,
    userAgent: input.userAgent,
  });
  invalidateAgenda(input.companyId);
  return toAppointmentClientDTO(updated);
}

export async function rescheduleAppointment(input: {
  companyId: string;
  userId: string;
  id: string;
  startsAt: string;
  endsAt: string;
  professionalId?: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<AppointmentClientDTO> {
  return updateAppointment({
    companyId: input.companyId,
    userId: input.userId,
    data: {
      id: input.id,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      professionalId: input.professionalId,
    },
    ip: input.ip,
    userAgent: input.userAgent,
  });
}

export async function createScheduleBlock(input: {
  companyId: string;
  userId: string;
  data: {
    type: ScheduleBlockClientDTO["type"];
    title?: string;
    professionalId?: string;
    roomId?: string;
    startsAt: string;
    endsAt: string;
    allDay?: boolean;
  };
}) {
  assertTenantId(input.companyId);
  const block = await repo.createBlock(input.companyId, {
    type: input.data.type,
    title: input.data.title,
    professionalId: input.data.professionalId,
    roomId: input.data.roomId,
    startsAt: new Date(input.data.startsAt),
    endsAt: new Date(input.data.endsAt),
    allDay: input.data.allDay,
  });
  invalidateAgenda(input.companyId);
  return toBlockDTO(block);
}

export async function createWaitingListEntry(input: {
  companyId: string;
  data: {
    patientId?: string;
    patientName?: string;
    professionalId?: string;
    preferredDate?: string;
    notes?: string;
    priority?: number;
  };
}) {
  assertTenantId(input.companyId);
  const patient = await repo.findOrCreatePatient(input.companyId, {
    id: input.data.patientId,
    name: input.data.patientName,
  });
  const entry = await repo.createWaitingEntry(input.companyId, {
    patientId: patient.id,
    professionalId: input.data.professionalId,
    preferredDate: input.data.preferredDate ? new Date(input.data.preferredDate) : null,
    notes: input.data.notes,
    priority: input.data.priority,
  });
  invalidateAgenda(input.companyId);
  return toWaitingDTO(entry);
}

export async function createReturnAlert(input: {
  companyId: string;
  data: {
    patientId: string;
    dueDate: string;
    reason?: string;
    notes?: string;
  };
}) {
  assertTenantId(input.companyId);
  const alert = await repo.createReturnAlert(input.companyId, {
    patientId: input.data.patientId,
    dueDate: new Date(input.data.dueDate),
    reason: input.data.reason,
    notes: input.data.notes,
  });
  invalidateAgenda(input.companyId);
  return toReturnDTO(alert);
}

export async function completeReturnAlert(companyId: string, id: string) {
  assertTenantId(companyId);
  await repo.completeReturnAlert(companyId, id);
  invalidateAgenda(companyId);
}

export async function searchPatients(companyId: string, query: string) {
  assertTenantId(companyId);
  if (!query.trim()) return [];
  const rows = await repo.searchPatients(companyId, query.trim());
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
  }));
}
