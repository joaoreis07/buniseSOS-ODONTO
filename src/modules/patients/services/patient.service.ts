import { revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { assertTenantId } from "@/shared/lib/tenant";
import { prisma } from "@/shared/lib/prisma";
import type {
  PatientClientDTO,
  PatientFormInput,
  PatientAppointmentHistoryDTO,
  PatientListParams,
  PatientListResultDTO,
} from "../dto/patient.dto";
import type { PatientListRow } from "../repositories/patient.repository";
import { PrismaPatientRepository } from "../repositories/prisma-patient.repository";
import { onlyDigits } from "../schemas/patient.schemas";
import { calcAge } from "../utils/patient.utils";

const repo = new PrismaPatientRepository();

export function getPatientsCacheTag(companyId: string): string {
  return `patients:${companyId}`;
}

function invalidatePatients(companyId: string) {
  try {
    revalidateTag(getPatientsCacheTag(companyId));
  } catch {
    // ignore outside Next
  }
}

function emptyToNull(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toPatientClientDTO(row: PatientListRow): PatientClientDTO {
  return {
    id: row.id,
    companyId: row.companyId,
    fullName: row.name,
    preferredName: row.preferredName,
    birthDate: row.birthDate ? row.birthDate.toISOString() : null,
    age: calcAge(row.birthDate),
    gender: row.gender,
    cpf: row.cpf ?? row.document,
    rg: row.rg,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    maritalStatus: row.maritalStatus,
    profession: row.profession,
    address: row.address,
    number: row.addressNumber,
    district: row.district,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode,
    responsibleName: row.responsibleName,
    responsiblePhone: row.responsiblePhone,
    insurance: row.insurance,
    insuranceNumber: row.insuranceNumber,
    bloodType: row.bloodType,
    allergies: row.allergies,
    medicalNotes: row.medicalNotes,
    observations: row.observations ?? row.notes,
    photoUrl: row.photoUrl,
    isActive: row.isActive,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    upcomingAppointmentsCount: row._count.appointments,
    hasReturnAlert: row.returnAlerts.length > 0,
  };
}

function formToWrite(
  input: PatientFormInput,
  userId: string,
  mode: "create" | "update",
) {
  const cpf = input.cpf ? onlyDigits(input.cpf) : null;
  const isActive = input.isActive ?? true;
  return {
    name: input.fullName.trim(),
    preferredName: emptyToNull(input.preferredName),
    birthDate: input.birthDate ? new Date(`${input.birthDate}T12:00:00`) : null,
    gender: input.gender ?? "UNSPECIFIED",
    cpf,
    document: cpf,
    rg: emptyToNull(input.rg),
    email: emptyToNull(input.email)?.toLowerCase() ?? null,
    phone: emptyToNull(input.phone),
    whatsapp: emptyToNull(input.whatsapp),
    maritalStatus: input.maritalStatus ? input.maritalStatus : null,
    profession: emptyToNull(input.profession),
    address: emptyToNull(input.address),
    addressNumber: emptyToNull(input.number),
    district: emptyToNull(input.district),
    city: emptyToNull(input.city),
    state: emptyToNull(input.state)?.toUpperCase() ?? null,
    zipCode: input.zipCode ? onlyDigits(input.zipCode) : null,
    responsibleName: emptyToNull(input.responsibleName),
    responsiblePhone: emptyToNull(input.responsiblePhone),
    insurance: emptyToNull(input.insurance),
    insuranceNumber: emptyToNull(input.insuranceNumber),
    bloodType: input.bloodType ?? "UNKNOWN",
    allergies: emptyToNull(input.allergies),
    medicalNotes: emptyToNull(input.medicalNotes),
    observations: emptyToNull(input.observations),
    notes: emptyToNull(input.observations),
    photoUrl: emptyToNull(input.photoUrl),
    isActive,
    status: isActive ? ("ACTIVE" as const) : ("INACTIVE" as const),
    ...(mode === "create" ? { createdById: userId } : {}),
    updatedById: userId,
  };
}

async function writeAudit(input: {
  companyId: string;
  userId: string;
  action: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      module: "patients",
      action: input.action,
      entity: "Patient",
      entityId: input.entityId,
      metadata: input.metadata,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

export async function listPatients(
  companyId: string,
  params: PatientListParams,
): Promise<PatientListResultDTO> {
  assertTenantId(companyId);
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const result = await repo.list(companyId, { ...params, page, pageSize });
  return {
    items: result.items.map(toPatientClientDTO),
    total: result.total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
    cities: result.cities,
    insurances: result.insurances,
  };
}

export async function getPatient(
  companyId: string,
  id: string,
): Promise<PatientClientDTO | null> {
  assertTenantId(companyId);
  const row = await repo.findById(companyId, id);
  return row ? toPatientClientDTO(row) : null;
}

export async function listPatientAppointmentHistory(
  companyId: string,
  patientId: string,
): Promise<PatientAppointmentHistoryDTO[]> {
  assertTenantId(companyId);
  const patient = await repo.findById(companyId, patientId);
  if (!patient) throw new Error("Paciente não encontrado");

  const rows = await repo.listAppointmentHistory(companyId, patientId);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    procedure: row.procedure,
    notes: row.notes,
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    professionalName: row.professional.name,
    roomName: row.room?.name ?? null,
  }));
}

export async function createPatient(input: {
  companyId: string;
  userId: string;
  data: PatientFormInput;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<PatientClientDTO> {
  assertTenantId(input.companyId);
  const write = formToWrite(input.data, input.userId, "create");
  if (write.cpf) {
    const exists = await repo.findByCpf(input.companyId, write.cpf);
    if (exists) throw new Error("Já existe um paciente com este CPF");
  }
  const created = await repo.create(input.companyId, write);
  await writeAudit({
    companyId: input.companyId,
    userId: input.userId,
    action: "create",
    entityId: created.id,
    ip: input.ip,
    userAgent: input.userAgent,
  });
  invalidatePatients(input.companyId);
  return toPatientClientDTO(created);
}

export async function updatePatient(input: {
  companyId: string;
  userId: string;
  id: string;
  data: Partial<PatientFormInput>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<PatientClientDTO> {
  assertTenantId(input.companyId);
  const d = input.data;
  const cpf = d.cpf !== undefined ? (d.cpf ? onlyDigits(d.cpf) : null) : undefined;

  if (cpf) {
    const exists = await repo.findByCpf(input.companyId, cpf, input.id);
    if (exists) throw new Error("Já existe um paciente com este CPF");
  }

  const write = {
    ...(d.fullName !== undefined ? { name: d.fullName.trim() } : {}),
    ...(d.preferredName !== undefined ? { preferredName: emptyToNull(d.preferredName) } : {}),
    ...(d.birthDate !== undefined
      ? { birthDate: d.birthDate ? new Date(`${d.birthDate}T12:00:00`) : null }
      : {}),
    ...(d.gender !== undefined ? { gender: d.gender } : {}),
    ...(cpf !== undefined ? { cpf, document: cpf } : {}),
    ...(d.rg !== undefined ? { rg: emptyToNull(d.rg) } : {}),
    ...(d.email !== undefined ? { email: emptyToNull(d.email)?.toLowerCase() ?? null } : {}),
    ...(d.phone !== undefined ? { phone: emptyToNull(d.phone) } : {}),
    ...(d.whatsapp !== undefined ? { whatsapp: emptyToNull(d.whatsapp) } : {}),
    ...(d.maritalStatus !== undefined
      ? { maritalStatus: d.maritalStatus ? d.maritalStatus : null }
      : {}),
    ...(d.profession !== undefined ? { profession: emptyToNull(d.profession) } : {}),
    ...(d.address !== undefined ? { address: emptyToNull(d.address) } : {}),
    ...(d.number !== undefined ? { addressNumber: emptyToNull(d.number) } : {}),
    ...(d.district !== undefined ? { district: emptyToNull(d.district) } : {}),
    ...(d.city !== undefined ? { city: emptyToNull(d.city) } : {}),
    ...(d.state !== undefined ? { state: emptyToNull(d.state)?.toUpperCase() ?? null } : {}),
    ...(d.zipCode !== undefined
      ? { zipCode: d.zipCode ? onlyDigits(d.zipCode) : null }
      : {}),
    ...(d.responsibleName !== undefined
      ? { responsibleName: emptyToNull(d.responsibleName) }
      : {}),
    ...(d.responsiblePhone !== undefined
      ? { responsiblePhone: emptyToNull(d.responsiblePhone) }
      : {}),
    ...(d.insurance !== undefined ? { insurance: emptyToNull(d.insurance) } : {}),
    ...(d.insuranceNumber !== undefined
      ? { insuranceNumber: emptyToNull(d.insuranceNumber) }
      : {}),
    ...(d.bloodType !== undefined ? { bloodType: d.bloodType } : {}),
    ...(d.allergies !== undefined ? { allergies: emptyToNull(d.allergies) } : {}),
    ...(d.medicalNotes !== undefined ? { medicalNotes: emptyToNull(d.medicalNotes) } : {}),
    ...(d.observations !== undefined
      ? {
          observations: emptyToNull(d.observations),
          notes: emptyToNull(d.observations),
        }
      : {}),
    ...(d.photoUrl !== undefined ? { photoUrl: emptyToNull(d.photoUrl) } : {}),
    ...(d.isActive !== undefined
      ? {
          isActive: d.isActive,
          status: d.isActive ? ("ACTIVE" as const) : ("INACTIVE" as const),
        }
      : {}),
    updatedById: input.userId,
  };

  const updated = await repo.update(input.companyId, input.id, write);
  await writeAudit({
    companyId: input.companyId,
    userId: input.userId,
    action: "update",
    entityId: updated.id,
    ip: input.ip,
    userAgent: input.userAgent,
  });
  invalidatePatients(input.companyId);
  return toPatientClientDTO(updated);
}

export async function deletePatient(input: {
  companyId: string;
  userId: string;
  id: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  assertTenantId(input.companyId);
  await repo.softDelete(input.companyId, input.id, input.userId);
  await writeAudit({
    companyId: input.companyId,
    userId: input.userId,
    action: "soft_delete",
    entityId: input.id,
    ip: input.ip,
    userAgent: input.userAgent,
  });
  invalidatePatients(input.companyId);
}
