export type PatientGenderDTO = "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED";
export type MaritalStatusDTO = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | "OTHER";
export type BloodTypeDTO =
  | "A_POS"
  | "A_NEG"
  | "B_POS"
  | "B_NEG"
  | "AB_POS"
  | "AB_NEG"
  | "O_POS"
  | "O_NEG"
  | "UNKNOWN";

export type PatientStatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "BLOCKED";

export type PatientListSort =
  | "name_asc"
  | "name_desc"
  | "created_desc"
  | "created_asc"
  | "city_asc";

export type PatientClientDTO = {
  id: string;
  companyId: string;
  fullName: string;
  preferredName: string | null;
  birthDate: string | null;
  age: number | null;
  gender: PatientGenderDTO;
  cpf: string | null;
  rg: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  maritalStatus: MaritalStatusDTO | null;
  profession: string | null;
  address: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  responsibleName: string | null;
  responsiblePhone: string | null;
  insurance: string | null;
  insuranceNumber: string | null;
  bloodType: BloodTypeDTO;
  allergies: string | null;
  medicalNotes: string | null;
  observations: string | null;
  photoUrl: string | null;
  isActive: boolean;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  createdAt: string;
  updatedAt: string;
  upcomingAppointmentsCount: number;
  lastAppointmentAt: string | null;
  hasReturnAlert: boolean;
};

export type PatientListParams = {
  search?: string;
  status?: PatientStatusFilter;
  city?: string;
  insurance?: string;
  hasUpcoming?: boolean;
  missingReturn?: boolean;
  createdThisMonth?: boolean;
  birthdayThisMonth?: boolean;
  page?: number;
  pageSize?: number;
  sort?: PatientListSort;
};

export type PatientListResultDTO = {
  items: PatientClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  cities: string[];
  insurances: string[];
};

export type PatientAppointmentHistoryDTO = {
  id: string;
  title: string | null;
  procedure: string | null;
  notes: string | null;
  status:
    | "SCHEDULED"
    | "CONFIRMED"
    | "WAITING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELED"
    | "NO_SHOW";
  startsAt: string;
  endsAt: string;
  professionalName: string;
  roomName: string | null;
};

export type PatientTimelineKind =
  | "appointment"
  | "treatment"
  | "procedure"
  | "budget"
  | "approval"
  | "payment"
  | "document"
  | "note"
  | "clinical"
  | "anamnesis";

export type PatientTimelineEntryDTO = {
  id: string;
  kind: PatientTimelineKind;
  at: string;
  title: string;
  description: string | null;
  actorName: string | null;
};

export type PatientFormInput = {
  fullName: string;
  preferredName?: string;
  birthDate?: string;
  gender?: PatientGenderDTO;
  cpf?: string;
  rg?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  maritalStatus?: MaritalStatusDTO | "";
  profession?: string;
  address?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  responsibleName?: string;
  responsiblePhone?: string;
  insurance?: string;
  insuranceNumber?: string;
  bloodType?: BloodTypeDTO;
  allergies?: string;
  medicalNotes?: string;
  observations?: string;
  photoUrl?: string;
  isActive?: boolean;
};
