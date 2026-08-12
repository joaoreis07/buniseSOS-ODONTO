import type {
  Appointment,
  AppointmentStatus,
  Chair,
  Patient,
  Professional,
  ReturnAlert,
  Room,
  ScheduleBlock,
  WaitingListEntry,
} from "@prisma/client";

export type AppointmentWithRelations = Appointment & {
  patient: Pick<Patient, "id" | "name" | "phone" | "email">;
  professional: Pick<Professional, "id" | "name" | "color">;
  room: Pick<Room, "id" | "name"> | null;
  chair: Pick<Chair, "id" | "name"> | null;
};

export type WaitingListWithRelations = WaitingListEntry & {
  patient: Pick<Patient, "id" | "name">;
  professional: Pick<Professional, "id" | "name"> | null;
};

export type ReturnAlertWithRelations = ReturnAlert & {
  patient: Pick<Patient, "id" | "name">;
};

export type CreateAppointmentData = {
  patientId: string;
  professionalId: string;
  roomId?: string | null;
  chairId?: string | null;
  status?: AppointmentStatus;
  title?: string | null;
  procedure?: string | null;
  notes?: string | null;
  startsAt: Date;
  endsAt: Date;
  recurrenceRule?: string | null;
  recurrenceGroupId?: string | null;
};

export type UpdateAppointmentData = Partial<{
  professionalId: string;
  roomId: string | null;
  chairId: string | null;
  status: AppointmentStatus;
  title: string | null;
  procedure: string | null;
  notes: string | null;
  startsAt: Date;
  endsAt: Date;
  confirmedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  canceledAt: Date | null;
  cancelReason: string | null;
}>;

export type AppointmentListParams = {
  from: Date;
  to: Date;
  professionalIds?: string[];
  roomIds?: string[];
  chairIds?: string[];
  status?: AppointmentStatus[];
  search?: string;
  includeCanceled?: boolean;
};

export interface IAgendaRepository {
  listProfessionals(companyId: string): Promise<Professional[]>;
  listRooms(companyId: string): Promise<Room[]>;
  listChairs(companyId: string): Promise<Chair[]>;
  listAppointments(
    companyId: string,
    params: AppointmentListParams,
  ): Promise<AppointmentWithRelations[]>;
  listBlocks(companyId: string, from: Date, to: Date): Promise<ScheduleBlock[]>;
  listWaiting(companyId: string): Promise<WaitingListWithRelations[]>;
  listReturnAlerts(companyId: string): Promise<ReturnAlertWithRelations[]>;
  findAppointment(
    companyId: string,
    id: string,
  ): Promise<AppointmentWithRelations | null>;
  createAppointment(
    companyId: string,
    data: CreateAppointmentData,
  ): Promise<AppointmentWithRelations>;
  createAppointmentsMany(
    companyId: string,
    data: CreateAppointmentData[],
  ): Promise<AppointmentWithRelations[]>;
  updateAppointment(
    companyId: string,
    id: string,
    data: UpdateAppointmentData,
  ): Promise<AppointmentWithRelations>;
  softDeleteAppointment(companyId: string, id: string): Promise<void>;
  findOrCreatePatient(
    companyId: string,
    input: { id?: string; name?: string; phone?: string; email?: string },
  ): Promise<Patient>;
  createBlock(
    companyId: string,
    data: {
      type: ScheduleBlock["type"];
      title?: string | null;
      professionalId?: string | null;
      roomId?: string | null;
      startsAt: Date;
      endsAt: Date;
      allDay?: boolean;
    },
  ): Promise<ScheduleBlock>;
  createWaitingEntry(
    companyId: string,
    data: {
      patientId: string;
      professionalId?: string | null;
      preferredDate?: Date | null;
      notes?: string | null;
      priority?: number;
    },
  ): Promise<WaitingListWithRelations>;
  createReturnAlert(
    companyId: string,
    data: {
      patientId: string;
      dueDate: Date;
      reason?: string | null;
      notes?: string | null;
    },
  ): Promise<ReturnAlertWithRelations>;
  completeReturnAlert(companyId: string, id: string): Promise<void>;
  searchPatients(companyId: string, query: string): Promise<Patient[]>;
}
