import { revalidateTag } from "next/cache";
import type { Plan, Prisma } from "@prisma/client";
import { assertTenantId } from "@/shared/lib/tenant";
import { prisma } from "@/shared/lib/prisma";
import {
  assertPatientLimit,
  patientLimitForPlan,
} from "@/modules/billing/plan-limits";
import type {
  PatientClientDTO,
  PatientFormInput,
  PatientAppointmentHistoryDTO,
  PatientListParams,
  PatientListResultDTO,
  PatientTimelineEntryDTO,
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
    lastAppointmentAt: row.appointments[0]?.startsAt.toISOString() ?? null,
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

export async function getPatientTimeline(
  companyId: string,
  patientId: string,
  options?: { includeFinance?: boolean; includeBudgets?: boolean },
): Promise<PatientTimelineEntryDTO[]> {
  assertTenantId(companyId);
  const patient = await repo.findById(companyId, patientId);
  if (!patient) throw new Error("Paciente não encontrado");

  const entries: PatientTimelineEntryDTO[] = [];

  const [appointments, evolutions, attachments, notes, anamnesis, plans] = await Promise.all([
    prisma.appointment.findMany({
      where: { companyId, patientId, deletedAt: null },
      select: {
        id: true,
        title: true,
        procedure: true,
        status: true,
        startsAt: true,
        professional: { select: { name: true } },
      },
    }),
    prisma.clinicalEvolution.findMany({
      where: { companyId, patientId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        occurredAt: true,
        professional: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.clinicalAttachment.findMany({
      where: { companyId, patientId, deletedAt: null },
      select: {
        id: true,
        title: true,
        type: true,
        category: true,
        occurredAt: true,
        createdAt: true,
        createdBy: { select: { name: true } },
        professional: { select: { name: true } },
      },
    }),
    prisma.patientNote.findMany({
      where: { companyId, patientId, deletedAt: null },
      select: {
        id: true,
        type: true,
        body: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    }),
    prisma.patientAnamnesis.findFirst({
      where: { companyId, patientId },
      select: {
        id: true,
        updatedAt: true,
        createdAt: true,
        updatedBy: { select: { name: true } },
      },
    }),
    prisma.treatmentPlan.findMany({
      where: { companyId, patientId, deletedAt: null },
      select: {
        id: true,
        title: true,
        code: true,
        createdAt: true,
        responsibleProfessional: { select: { name: true } },
      },
    }),
  ]);

  for (const row of appointments) {
    entries.push({
      id: `appt-${row.id}`,
      kind: "appointment",
      at: row.startsAt.toISOString(),
      title: row.procedure || row.title || "Consulta",
      description: row.status,
      actorName: row.professional.name,
    });
  }

  for (const row of evolutions) {
    entries.push({
      id: `evo-${row.id}`,
      kind: "clinical",
      at: row.occurredAt.toISOString(),
      title: row.title,
      description: row.description,
      actorName: row.professional?.name ?? row.createdBy?.name ?? null,
    });
  }

  for (const row of attachments) {
    entries.push({
      id: `file-${row.id}`,
      kind: "document",
      at: (row.occurredAt ?? row.createdAt).toISOString(),
      title: row.title,
      description: row.type === "EXAM" ? "Exame" : "Documento",
      actorName: row.professional?.name ?? row.createdBy?.name ?? null,
    });
  }

  for (const row of notes) {
    entries.push({
      id: `note-${row.id}`,
      kind: "note",
      at: row.createdAt.toISOString(),
      title: "Anotação",
      description: row.body.slice(0, 180),
      actorName: row.author?.name ?? null,
    });
  }

  if (anamnesis) {
    entries.push({
      id: `anam-${anamnesis.id}`,
      kind: "anamnesis",
      at: anamnesis.updatedAt.toISOString(),
      title: "Anamnese atualizada",
      description: null,
      actorName: anamnesis.updatedBy?.name ?? null,
    });
  }

  for (const row of plans) {
    entries.push({
      id: `plan-${row.id}`,
      kind: "treatment",
      at: row.createdAt.toISOString(),
      title: row.title,
      description: row.code,
      actorName: row.responsibleProfessional?.name ?? null,
    });
  }

  if (options?.includeBudgets !== false) {
    const budgets = await prisma.treatmentBudget.findMany({
      where: { companyId, patientId, deletedAt: null },
      select: {
        id: true,
        code: true,
        title: true,
        createdAt: true,
        events: {
          select: {
            id: true,
            type: true,
            createdAt: true,
            actor: { select: { name: true } },
          },
        },
      },
    });
    for (const budget of budgets) {
      if (budget.events.length === 0) {
        entries.push({
          id: `budget-${budget.id}`,
          kind: "budget",
          at: budget.createdAt.toISOString(),
          title: `Orçamento ${budget.code}`,
          description: budget.title,
          actorName: null,
        });
      }
      for (const event of budget.events) {
        entries.push({
          id: `budget-event-${event.id}`,
          kind: event.type === "APPROVED" || event.type === "PARTIALLY_APPROVED" ? "approval" : "budget",
          at: event.createdAt.toISOString(),
          title: `Orçamento ${budget.code}`,
          description: event.type,
          actorName: event.actor?.name ?? null,
        });
      }
    }
  }

  if (options?.includeFinance) {
    const payments = await prisma.payment.findMany({
      where: { companyId, patientId, deletedAt: null },
      select: {
        id: true,
        amount: true,
        method: true,
        paidAt: true,
        registeredBy: { select: { name: true } },
      },
    });
    for (const payment of payments) {
      entries.push({
        id: `pay-${payment.id}`,
        kind: "payment",
        at: payment.paidAt.toISOString(),
        title: "Pagamento recebido",
        description: `${payment.method} · ${payment.amount.toFixed(2)}`,
        actorName: payment.registeredBy?.name ?? null,
      });
    }
  }

  return entries.sort((a, b) => b.at.localeCompare(a.at));
}

export async function assertCompanyCanCreatePatient(companyId: string) {
  assertTenantId(companyId);
  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: { plan: true },
  });
  if (!company) throw new Error("Clínica não encontrada");
  const currentCount = await prisma.patient.count({
    where: { companyId, deletedAt: null },
  });
  assertPatientLimit(company.plan, currentCount);
}

export async function createPatient(input: {
  companyId: string;
  userId: string;
  data: PatientFormInput;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<PatientClientDTO> {
  await assertCompanyCanCreatePatient(input.companyId);
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

export type PatientQuotaDTO = {
  plan: Plan;
  count: number;
  limit: number | null;
  reached: boolean;
};

export type PatientListKpisDTO = {
  all: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  newLastMonth: number;
  birthdaysThisMonth: number;
  returnAlert: number;
};

export async function getPatientListKpis(companyId: string): Promise<PatientListKpisDTO> {
  assertTenantId(companyId);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const tenant = { companyId, deletedAt: null };

  const [all, active, inactive, newThisMonth, newLastMonth, birthdayRows, returnAlert] =
    await Promise.all([
      prisma.patient.count({ where: tenant }),
      prisma.patient.count({ where: { ...tenant, isActive: true, status: "ACTIVE" } }),
      prisma.patient.count({
        where: { ...tenant, OR: [{ isActive: false }, { status: "INACTIVE" }] },
      }),
      prisma.patient.count({ where: { ...tenant, createdAt: { gte: monthStart } } }),
      prisma.patient.count({
        where: { ...tenant, createdAt: { gte: lastMonthStart, lt: monthStart } },
      }),
      prisma.patient.findMany({
        where: { ...tenant, birthDate: { not: null } },
        select: { birthDate: true },
      }),
      prisma.patient.count({
        where: {
          ...tenant,
          returnAlerts: { some: { deletedAt: null, completedAt: null } },
        },
      }),
    ]);

  const month = now.getMonth();
  return {
    all,
    active,
    inactive,
    newThisMonth,
    newLastMonth,
    birthdaysThisMonth: birthdayRows.filter(
      (row) => row.birthDate != null && row.birthDate.getMonth() === month,
    ).length,
    returnAlert,
  };
}

export async function getPatientQuota(companyId: string): Promise<PatientQuotaDTO> {
  assertTenantId(companyId);
  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: { plan: true },
  });
  if (!company) throw new Error("Clínica não encontrada");
  const count = await prisma.patient.count({
    where: { companyId, deletedAt: null },
  });
  const limit = patientLimitForPlan(company.plan);
  return {
    plan: company.plan,
    count,
    limit,
    reached: limit != null && count >= limit,
  };
}
