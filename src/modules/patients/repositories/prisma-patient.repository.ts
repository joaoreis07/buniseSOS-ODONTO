import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import type { PatientListParams } from "../dto/patient.dto";
import type {
  IPatientRepository,
  PatientCreateData,
  PatientAppointmentHistoryRow,
  PatientListResult,
  PatientListRow,
  PatientWriteData,
} from "./patient.repository";

function patientInclude(now: Date) {
  return {
    _count: {
      select: {
        appointments: {
          where: {
            deletedAt: null,
            status: { notIn: ["CANCELED", "COMPLETED", "NO_SHOW"] },
            startsAt: { gt: now },
          },
        },
      },
    },
    returnAlerts: {
      where: { deletedAt: null, completedAt: null },
      select: { id: true },
      take: 1,
    },
    appointments: {
      where: { deletedAt: null, status: { not: "CANCELED" } },
      orderBy: { startsAt: "desc" },
      take: 1,
      select: { startsAt: true },
    },
  } satisfies Prisma.PatientInclude;
}

function sortToOrder(sort: PatientListParams["sort"]): Prisma.PatientOrderByWithRelationInput {
  switch (sort) {
    case "name_desc":
      return { name: "desc" };
    case "created_asc":
      return { createdAt: "asc" };
    case "created_desc":
      return { createdAt: "desc" };
    case "city_asc":
      return { city: "asc" };
    case "name_asc":
    default:
      return { name: "asc" };
  }
}

export class PrismaPatientRepository implements IPatientRepository {
  async list(companyId: string, params: PatientListParams): Promise<PatientListResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const search = params.search?.trim();
    const now = new Date();

    const where: Prisma.PatientWhereInput = {
      companyId,
      deletedAt: null,
      ...(params.status && params.status !== "ALL"
        ? params.status === "ACTIVE"
          ? { isActive: true, status: "ACTIVE" }
          : params.status === "INACTIVE"
            ? { OR: [{ isActive: false }, { status: "INACTIVE" }] }
            : { status: "BLOCKED" }
        : {}),
      ...(params.city ? { city: { equals: params.city, mode: "insensitive" } } : {}),
      ...(params.insurance
        ? params.insurance === "__none__"
          ? { OR: [{ insurance: null }, { insurance: "" }] }
          : { insurance: { equals: params.insurance, mode: "insensitive" } }
        : {}),
      ...(params.hasUpcoming
        ? {
            appointments: {
              some: {
                deletedAt: null,
                status: { notIn: ["CANCELED", "COMPLETED", "NO_SHOW"] },
                startsAt: { gt: now },
              },
            },
          }
        : {}),
      ...(params.missingReturn
        ? {
            returnAlerts: {
              none: { deletedAt: null, completedAt: null },
            },
          }
        : {}),
      ...(params.createdThisMonth
        ? { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { preferredName: { contains: search, mode: "insensitive" as const } },
              ...(search.replace(/\D/g, "")
                ? [
                    { cpf: { contains: search.replace(/\D/g, ""), mode: "insensitive" as const } },
                    { document: { contains: search.replace(/\D/g, ""), mode: "insensitive" as const } },
                    { phone: { contains: search.replace(/\D/g, ""), mode: "insensitive" as const } },
                    { whatsapp: { contains: search.replace(/\D/g, ""), mode: "insensitive" as const } },
                  ]
                : [
                    { document: { contains: search, mode: "insensitive" as const } },
                    { phone: { contains: search, mode: "insensitive" as const } },
                    { whatsapp: { contains: search, mode: "insensitive" as const } },
                  ]),
              { email: { contains: search, mode: "insensitive" as const } },
              { responsibleName: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    if (params.birthdayThisMonth) {
      const month = now.getMonth();
      const candidates = await prisma.patient.findMany({
        where: { ...where, birthDate: { not: null } },
        select: { id: true, birthDate: true },
      });
      const ids = candidates
        .filter((row) => row.birthDate != null && row.birthDate.getMonth() === month)
        .map((row) => row.id);
      where.id = { in: ids.length > 0 ? ids : ["__none__"] };
    }

    const [items, total, cityRows, insuranceRows] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: patientInclude(now),
        orderBy: sortToOrder(params.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }) as Promise<PatientListRow[]>,
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where: { companyId, deletedAt: null, city: { not: null } },
        distinct: ["city"],
        select: { city: true },
        orderBy: { city: "asc" },
        take: 100,
      }),
      prisma.patient.findMany({
        where: { companyId, deletedAt: null, insurance: { not: null } },
        distinct: ["insurance"],
        select: { insurance: true },
        orderBy: { insurance: "asc" },
        take: 100,
      }),
    ]);

    return {
      items,
      total,
      cities: cityRows.map((r) => r.city!).filter(Boolean),
      insurances: insuranceRows.map((r) => r.insurance!).filter(Boolean),
    };
  }

  findById(companyId: string, id: string) {
    return prisma.patient.findFirst({
      where: { id, companyId, deletedAt: null },
      include: patientInclude(new Date()),
    }) as Promise<PatientListRow | null>;
  }

  create(companyId: string, data: PatientCreateData) {
    return prisma.patient.create({
      data: {
        companyId,
        name: data.name,
        preferredName: data.preferredName ?? null,
        birthDate: data.birthDate ?? null,
        gender: data.gender ?? "UNSPECIFIED",
        cpf: data.cpf ?? null,
        document: data.document ?? data.cpf ?? null,
        rg: data.rg ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        whatsapp: data.whatsapp ?? null,
        maritalStatus: data.maritalStatus ?? null,
        profession: data.profession ?? null,
        address: data.address ?? null,
        addressNumber: data.addressNumber ?? null,
        district: data.district ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        zipCode: data.zipCode ?? null,
        responsibleName: data.responsibleName ?? null,
        responsiblePhone: data.responsiblePhone ?? null,
        insurance: data.insurance ?? null,
        insuranceNumber: data.insuranceNumber ?? null,
        bloodType: data.bloodType ?? "UNKNOWN",
        allergies: data.allergies ?? null,
        medicalNotes: data.medicalNotes ?? null,
        observations: data.observations ?? null,
        notes: data.notes ?? data.observations ?? null,
        photoUrl: data.photoUrl ?? null,
        isActive: data.isActive ?? true,
        status: data.status ?? (data.isActive === false ? "INACTIVE" : "ACTIVE"),
        createdById: data.createdById ?? null,
        updatedById: data.updatedById ?? null,
      },
      include: patientInclude(new Date()),
    }) as Promise<PatientListRow>;
  }

  async update(companyId: string, id: string, data: PatientWriteData) {
    const existing = await prisma.patient.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) throw new Error("Paciente não encontrado");

    return prisma.patient.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.preferredName !== undefined ? { preferredName: data.preferredName } : {}),
        ...(data.birthDate !== undefined ? { birthDate: data.birthDate } : {}),
        ...(data.gender !== undefined ? { gender: data.gender } : {}),
        ...(data.cpf !== undefined
          ? { cpf: data.cpf, document: data.cpf }
          : {}),
        ...(data.rg !== undefined ? { rg: data.rg } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp } : {}),
        ...(data.maritalStatus !== undefined ? { maritalStatus: data.maritalStatus } : {}),
        ...(data.profession !== undefined ? { profession: data.profession } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.addressNumber !== undefined ? { addressNumber: data.addressNumber } : {}),
        ...(data.district !== undefined ? { district: data.district } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.state !== undefined ? { state: data.state } : {}),
        ...(data.zipCode !== undefined ? { zipCode: data.zipCode } : {}),
        ...(data.responsibleName !== undefined ? { responsibleName: data.responsibleName } : {}),
        ...(data.responsiblePhone !== undefined
          ? { responsiblePhone: data.responsiblePhone }
          : {}),
        ...(data.insurance !== undefined ? { insurance: data.insurance } : {}),
        ...(data.insuranceNumber !== undefined ? { insuranceNumber: data.insuranceNumber } : {}),
        ...(data.bloodType !== undefined ? { bloodType: data.bloodType } : {}),
        ...(data.allergies !== undefined ? { allergies: data.allergies } : {}),
        ...(data.medicalNotes !== undefined ? { medicalNotes: data.medicalNotes } : {}),
        ...(data.observations !== undefined
          ? { observations: data.observations, notes: data.observations }
          : {}),
        ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl } : {}),
        ...(data.isActive !== undefined
          ? {
              isActive: data.isActive,
              status: data.isActive ? "ACTIVE" : "INACTIVE",
            }
          : {}),
        ...(data.updatedById !== undefined ? { updatedById: data.updatedById } : {}),
      },
      include: patientInclude(new Date()),
    }) as Promise<PatientListRow>;
  }

  async softDelete(companyId: string, id: string, userId: string) {
    const existing = await prisma.patient.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) throw new Error("Paciente não encontrado");
    await prisma.patient.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        status: "INACTIVE",
        updatedById: userId,
      },
    });
  }

  findByCpf(companyId: string, cpf: string, excludeId?: string) {
    return prisma.patient.findFirst({
      where: {
        companyId,
        deletedAt: null,
        OR: [{ cpf }, { document: cpf }],
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  listAppointmentHistory(companyId: string, patientId: string) {
    return prisma.appointment.findMany({
      where: { companyId, patientId, deletedAt: null },
      select: {
        id: true,
        title: true,
        procedure: true,
        notes: true,
        status: true,
        startsAt: true,
        endsAt: true,
        professional: { select: { name: true } },
        room: { select: { name: true } },
      },
      orderBy: { startsAt: "desc" },
      take: 100,
    }) as Promise<PatientAppointmentHistoryRow[]>;
  }
}
