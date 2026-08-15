import type {
  Appointment,
  BloodType,
  MaritalStatus,
  Patient,
  PatientGender,
  PatientStatus,
  Professional,
  Room,
} from "@prisma/client";
import type { PatientListParams, PatientListSort } from "../dto/patient.dto";

export type PatientWriteData = {
  name?: string;
  preferredName?: string | null;
  birthDate?: Date | null;
  gender?: PatientGender;
  cpf?: string | null;
  document?: string | null;
  rg?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  maritalStatus?: MaritalStatus | null;
  profession?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  responsibleName?: string | null;
  responsiblePhone?: string | null;
  insurance?: string | null;
  insuranceNumber?: string | null;
  bloodType?: BloodType;
  allergies?: string | null;
  medicalNotes?: string | null;
  observations?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  isActive?: boolean;
  status?: PatientStatus;
  createdById?: string | null;
  updatedById?: string | null;
};

export type PatientCreateData = PatientWriteData & {
  name: string;
};

export type PatientListRow = Patient & {
  _count: { appointments: number };
  returnAlerts: { id: string }[];
  appointments: { startsAt: Date }[];
};

export type PatientAppointmentHistoryRow = Appointment & {
  professional: Pick<Professional, "name">;
  room: Pick<Room, "name"> | null;
};

export type PatientListResult = {
  items: PatientListRow[];
  total: number;
  cities: string[];
  insurances: string[];
};

export interface IPatientRepository {
  list(companyId: string, params: PatientListParams): Promise<PatientListResult>;
  findById(companyId: string, id: string): Promise<PatientListRow | null>;
  create(companyId: string, data: PatientCreateData): Promise<PatientListRow>;
  update(companyId: string, id: string, data: PatientWriteData): Promise<PatientListRow>;
  softDelete(companyId: string, id: string, userId: string): Promise<void>;
  findByCpf(companyId: string, cpf: string, excludeId?: string): Promise<Patient | null>;
  listAppointmentHistory(
    companyId: string,
    patientId: string,
  ): Promise<PatientAppointmentHistoryRow[]>;
}

export type { PatientListSort };
