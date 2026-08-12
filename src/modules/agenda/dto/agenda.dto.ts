export type AgendaViewMode = "day" | "week" | "month" | "timeline" | "list";

export type AppointmentStatusDTO =
  | "SCHEDULED"
  | "CONFIRMED"
  | "WAITING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "NO_SHOW";

export type ProfessionalDTO = {
  id: string;
  name: string;
  color: string;
  specialty: string | null;
  active: boolean;
};

export type RoomDTO = {
  id: string;
  name: string;
  color: string | null;
  active: boolean;
};

export type ChairDTO = {
  id: string;
  name: string;
  roomId: string | null;
  active: boolean;
};

export type PatientLiteDTO = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type AppointmentClientDTO = {
  id: string;
  companyId: string;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  professionalId: string;
  professionalName: string;
  professionalColor: string;
  roomId: string | null;
  roomName: string | null;
  chairId: string | null;
  chairName: string | null;
  status: AppointmentStatusDTO;
  title: string | null;
  procedure: string | null;
  notes: string | null;
  startsAt: string;
  endsAt: string;
  recurrenceRule: string | null;
  recurrenceGroupId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleBlockClientDTO = {
  id: string;
  type: "LUNCH" | "UNAVAILABLE" | "BLOCK" | "HOLIDAY";
  title: string | null;
  professionalId: string | null;
  roomId: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
};

export type WaitingListClientDTO = {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string | null;
  professionalName: string | null;
  preferredDate: string | null;
  notes: string | null;
  status: "WAITING" | "SCHEDULED" | "CANCELED" | "EXPIRED";
  priority: number;
  createdAt: string;
};

export type ReturnAlertClientDTO = {
  id: string;
  patientId: string;
  patientName: string;
  dueDate: string;
  reason: string | null;
  notes: string | null;
  completedAt: string | null;
};

export type AgendaBootstrapDTO = {
  professionals: ProfessionalDTO[];
  rooms: RoomDTO[];
  chairs: ChairDTO[];
  waitingList: WaitingListClientDTO[];
  returnAlerts: ReturnAlertClientDTO[];
  clinicHours: { startHour: number; endHour: number; slotMinutes: number };
};

export type AgendaRangeDTO = {
  appointments: AppointmentClientDTO[];
  blocks: ScheduleBlockClientDTO[];
};
