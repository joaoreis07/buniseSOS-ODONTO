import { prisma } from "@/shared/lib/prisma";
import type {
  AppointmentListParams,
  AppointmentWithRelations,
  CreateAppointmentData,
  IAgendaRepository,
  ReturnAlertWithRelations,
  UpdateAppointmentData,
  WaitingListWithRelations,
} from "./agenda.repository";

const appointmentInclude = {
  patient: { select: { id: true, name: true, phone: true, email: true } },
  professional: { select: { id: true, name: true, color: true } },
  room: { select: { id: true, name: true } },
  chair: { select: { id: true, name: true } },
} as const;

export class PrismaAgendaRepository implements IAgendaRepository {
  listProfessionals(companyId: string) {
    return prisma.professional.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  listRooms(companyId: string) {
    return prisma.room.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  listChairs(companyId: string) {
    return prisma.chair.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  listAppointments(companyId: string, params: AppointmentListParams) {
    const statusFilter = params.includeCanceled
      ? params.status
      : (params.status ?? []).filter((s) => s !== "CANCELED");

    return prisma.appointment.findMany({
      where: {
        companyId,
        deletedAt: null,
        startsAt: { lt: params.to },
        endsAt: { gt: params.from },
        ...(params.professionalIds?.length
          ? { professionalId: { in: params.professionalIds } }
          : {}),
        ...(params.roomIds?.length ? { roomId: { in: params.roomIds } } : {}),
        ...(params.chairIds?.length ? { chairId: { in: params.chairIds } } : {}),
        ...(statusFilter?.length
          ? { status: { in: statusFilter } }
          : params.includeCanceled
            ? {}
            : { status: { not: "CANCELED" } }),
        ...(params.search
          ? {
              OR: [
                { patient: { name: { contains: params.search, mode: "insensitive" } } },
                { procedure: { contains: params.search, mode: "insensitive" } },
                { notes: { contains: params.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: appointmentInclude,
      orderBy: { startsAt: "asc" },
    }) as Promise<AppointmentWithRelations[]>;
  }

  listBlocks(companyId: string, from: Date, to: Date) {
    return prisma.scheduleBlock.findMany({
      where: {
        companyId,
        deletedAt: null,
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
      orderBy: { startsAt: "asc" },
    });
  }

  listWaiting(companyId: string) {
    return prisma.waitingListEntry.findMany({
      where: { companyId, deletedAt: null, status: "WAITING" },
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 50,
    }) as Promise<WaitingListWithRelations[]>;
  }

  listReturnAlerts(companyId: string) {
    return prisma.returnAlert.findMany({
      where: {
        companyId,
        deletedAt: null,
        completedAt: null,
        dueDate: { lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60) },
      },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
      take: 40,
    }) as Promise<ReturnAlertWithRelations[]>;
  }

  findAppointment(companyId: string, id: string) {
    return prisma.appointment.findFirst({
      where: { id, companyId, deletedAt: null },
      include: appointmentInclude,
    }) as Promise<AppointmentWithRelations | null>;
  }

  createAppointment(companyId: string, data: CreateAppointmentData) {
    return prisma.appointment.create({
      data: {
        companyId,
        patientId: data.patientId,
        professionalId: data.professionalId,
        roomId: data.roomId ?? null,
        chairId: data.chairId ?? null,
        status: data.status ?? "SCHEDULED",
        title: data.title ?? null,
        procedure: data.procedure ?? null,
        notes: data.notes ?? null,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        recurrenceRule: data.recurrenceRule ?? null,
        recurrenceGroupId: data.recurrenceGroupId ?? null,
      },
      include: appointmentInclude,
    }) as Promise<AppointmentWithRelations>;
  }

  async createAppointmentsMany(companyId: string, data: CreateAppointmentData[]) {
    const created: AppointmentWithRelations[] = [];
    for (const item of data) {
      created.push(await this.createAppointment(companyId, item));
    }
    return created;
  }

  updateAppointment(companyId: string, id: string, data: UpdateAppointmentData) {
    return prisma.appointment
      .updateMany({
        where: { id, companyId, deletedAt: null },
        data,
      })
      .then(async (result) => {
        if (result.count === 0) throw new Error("Consulta não encontrada");
        const row = await prisma.appointment.findFirst({
          where: { id, companyId },
          include: appointmentInclude,
        });
        if (!row) throw new Error("Consulta não encontrada");
        return row as AppointmentWithRelations;
      });
  }

  async softDeleteAppointment(companyId: string, id: string) {
    const existing = await prisma.appointment.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) throw new Error("Consulta não encontrada");
    await prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date(), status: "CANCELED", canceledAt: new Date() },
    });
  }

  async findOrCreatePatient(
    companyId: string,
    input: { id?: string; name?: string; phone?: string; email?: string },
  ) {
    if (input.id) {
      const existing = await prisma.patient.findFirst({
        where: { id: input.id, companyId, deletedAt: null },
      });
      if (!existing) throw new Error("Paciente não encontrado");
      return existing;
    }
    if (!input.name) throw new Error("Informe o nome do paciente");
    return prisma.patient.create({
      data: {
        companyId,
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
      },
    });
  }

  createBlock(companyId: string, data: {
    type: "LUNCH" | "UNAVAILABLE" | "BLOCK" | "HOLIDAY";
    title?: string | null;
    professionalId?: string | null;
    roomId?: string | null;
    startsAt: Date;
    endsAt: Date;
    allDay?: boolean;
  }) {
    return prisma.scheduleBlock.create({
      data: {
        companyId,
        type: data.type,
        title: data.title ?? null,
        professionalId: data.professionalId ?? null,
        roomId: data.roomId ?? null,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        allDay: data.allDay ?? false,
      },
    });
  }

  createWaitingEntry(
    companyId: string,
    data: {
      patientId: string;
      professionalId?: string | null;
      preferredDate?: Date | null;
      notes?: string | null;
      priority?: number;
    },
  ) {
    return prisma.waitingListEntry.create({
      data: {
        companyId,
        patientId: data.patientId,
        professionalId: data.professionalId ?? null,
        preferredDate: data.preferredDate ?? null,
        notes: data.notes ?? null,
        priority: data.priority ?? 0,
      },
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
      },
    }) as Promise<WaitingListWithRelations>;
  }

  createReturnAlert(
    companyId: string,
    data: {
      patientId: string;
      dueDate: Date;
      reason?: string | null;
      notes?: string | null;
    },
  ) {
    return prisma.returnAlert.create({
      data: {
        companyId,
        patientId: data.patientId,
        dueDate: data.dueDate,
        reason: data.reason ?? null,
        notes: data.notes ?? null,
      },
      include: { patient: { select: { id: true, name: true } } },
    }) as Promise<ReturnAlertWithRelations>;
  }

  async completeReturnAlert(companyId: string, id: string) {
    const row = await prisma.returnAlert.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!row) throw new Error("Alerta não encontrado");
    await prisma.returnAlert.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  }

  searchPatients(companyId: string, query: string) {
    return prisma.patient.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { document: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 12,
      orderBy: { name: "asc" },
    });
  }
}
