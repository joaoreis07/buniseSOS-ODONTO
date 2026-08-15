import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { assertTenantId } from "@/shared/lib/tenant";
import type { OdontogramDTO, OdontogramMutation, ProcedureCatalogItemDTO } from "../dto/odontogram.dto";
import { type OdontogramWithDetails } from "../repositories/odontogram.repository";
import { PrismaOdontogramRepository } from "../repositories/prisma-odontogram.repository";

function dto(row: OdontogramWithDetails): OdontogramDTO {
  return {
    id: row.id,
    patient: {
      id: row.patient.id,
      name: row.patient.name,
      preferredName: row.patient.preferredName,
      birthDate: row.patient.birthDate?.toISOString() ?? null,
    },
    notation: row.notation,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
    teeth: row.teeth.map((tooth) => ({
      id: tooth.id,
      number: tooth.toothNumber,
      conditions: tooth.conditions.map((condition) => ({
        id: condition.id,
        code: condition.code,
        title: condition.title,
        phase: condition.phase,
        status: condition.status,
        notes: condition.notes,
        surfaces: condition.surfaces.map((surface) => surface.surface),
        createdAt: condition.createdAt.toISOString(),
        updatedAt: condition.updatedAt.toISOString(),
      })),
      procedures: tooth.procedures.map((procedure) => ({
        id: procedure.id,
        conditionId: procedure.conditionId,
        code: procedure.code,
        title: procedure.title,
        phase: procedure.phase,
        status: procedure.status,
        surfaces: procedure.surfaces,
        notes: procedure.notes,
        plannedAt: procedure.plannedAt?.toISOString() ?? null,
        completedAt: procedure.completedAt?.toISOString() ?? null,
        createdAt: procedure.createdAt.toISOString(),
        updatedAt: procedure.updatedAt.toISOString(),
      })),
      observations: tooth.observations.map((observation) => ({
        id: observation.id,
        body: observation.body,
        createdAt: observation.createdAt.toISOString(),
        updatedAt: observation.updatedAt.toISOString(),
      })),
    })),
    events: row.events.map((event) => ({
      id: event.id,
      toothNumber: event.tooth?.toothNumber ?? null,
      batchId: event.batchId,
      type: event.type,
      before: event.before,
      after: event.after,
      actorName: event.actor?.name ?? null,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

async function writeAudit(input: {
  companyId: string;
  userId: string;
  action: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      module: "odontogram",
      action: input.action,
      entity: "Odontogram",
      entityId: input.entityId,
      metadata: input.metadata,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

function stringMoney(value: Prisma.Decimal) {
  return value.toFixed(2);
}

export async function listProcedureCatalog(companyId: string): Promise<ProcedureCatalogItemDTO[]> {
  assertTenantId(companyId);
  const rows = await prisma.procedureCatalog.findMany({
    where: { companyId, active: true, deletedAt: null },
    select: { id: true, code: true, name: true, defaultPrice: true },
    orderBy: { name: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    defaultPrice: stringMoney(row.defaultPrice),
  }));
}

export async function getOrCreateOdontogram(input: {
  companyId: string;
  patientId: string;
  userId: string;
}): Promise<OdontogramDTO> {
  assertTenantId(input.companyId);
  const repo = new PrismaOdontogramRepository();
  const patient = await repo.findPatient(input.companyId, input.patientId);
  if (!patient) throw new Error("Paciente não encontrado");

  let chart = await repo.findByPatient(input.companyId, input.patientId);
  if (!chart) {
    chart = await repo.create(input.companyId, input.patientId, input.userId);
    await writeAudit({
      companyId: input.companyId,
      userId: input.userId,
      action: "bootstrap",
      entityId: chart.id,
      metadata: { patientId: input.patientId, toothCount: 52 },
    });
  }
  return dto(chart);
}

export async function applyOdontogramChanges(input: {
  companyId: string;
  userId: string;
  patientId: string;
  expectedUpdatedAt: string;
  changes: OdontogramMutation[];
  ip?: string | null;
  userAgent?: string | null;
}): Promise<OdontogramDTO> {
  assertTenantId(input.companyId);
  const expectedUpdatedAt = new Date(input.expectedUpdatedAt);
  if (Number.isNaN(expectedUpdatedAt.getTime())) throw new Error("Versão do odontograma inválida");

  const updated = await prisma.$transaction(async (tx) => {
    const repo = new PrismaOdontogramRepository(tx);
    const chart = await repo.findByPatient(input.companyId, input.patientId);
    if (!chart) throw new Error("Odontograma não encontrado");

    const procedureCodes = [
      ...new Set(
        input.changes.flatMap((change) => (change.type === "procedure" ? [change.code] : [])),
      ),
    ];
    const catalogRows =
      procedureCodes.length === 0
        ? []
        : await tx.procedureCatalog.findMany({
            where: {
              companyId: input.companyId,
              code: { in: procedureCodes },
              active: true,
              deletedAt: null,
            },
            select: { code: true, name: true },
          });
    const catalogByCode = new Map(catalogRows.map((row) => [row.code, row]));

    const canUpdate = await repo.optimisticUpdate(input.companyId, chart.id, expectedUpdatedAt, input.userId);
    if (!canUpdate) {
      throw new Error("Este odontograma foi alterado por outra pessoa. Recarregue a página antes de salvar.");
    }

    const teeth = new Map(chart.teeth.map((tooth) => [tooth.toothNumber, tooth]));
    const batchId = randomUUID();

    for (const change of input.changes) {
      if (change.type === "remove") {
        const result = await repo.softDelete(change.target, change.id, input.companyId, chart.id, input.userId);
        if (result.count !== 1) throw new Error("Registro clínico não encontrado");
        await repo.createEvent({
          company: { connect: { id: input.companyId } },
          odontogram: { connect: { id: chart.id } },
          tooth: result.toothId ? { connect: { id: result.toothId } } : undefined,
          batchId,
          type:
            change.target === "condition"
              ? "CONDITION_REMOVED"
              : change.target === "procedure"
                ? "PROCEDURE_REMOVED"
                : "OBSERVATION_REMOVED",
          before: { id: change.id, target: change.target },
          actor: { connect: { id: input.userId } },
        });
        continue;
      }

      for (const toothNumber of change.toothNumbers) {
        const tooth = teeth.get(toothNumber);
        if (!tooth) throw new Error(`Dente ${toothNumber} não pertence ao odontograma`);

        if (change.type === "condition") {
          const conditionData = {
            code: change.code,
            title: change.title,
            phase: change.phase,
            status: change.status,
            notes: change.notes?.trim() || null,
            updatedBy: { connect: { id: input.userId } },
          };
          const saved = change.id
            ? await repo.updateCondition(change.id, input.companyId, chart.id, {
                ...conditionData,
                surfaces: {
                  deleteMany: {},
                  create: change.surfaces.map((surface) => ({ surface })),
                },
              })
            : await repo.createCondition({
                company: { connect: { id: input.companyId } },
                odontogram: { connect: { id: chart.id } },
                tooth: { connect: { id: tooth.id } },
                createdBy: { connect: { id: input.userId } },
                ...conditionData,
                surfaces: { create: change.surfaces.map((surface) => ({ surface })) },
              });
          await repo.createEvent({
            company: { connect: { id: input.companyId } },
            odontogram: { connect: { id: chart.id } },
            tooth: { connect: { id: tooth.id } },
            batchId,
            type: change.id ? "CONDITION_UPDATED" : "CONDITION_CREATED",
            after: { id: saved.id, code: saved.code, phase: saved.phase, status: saved.status },
            actor: { connect: { id: input.userId } },
          });
        }

        if (change.type === "procedure") {
          const catalog = catalogByCode.get(change.code);
          if (!catalog) {
            throw new Error(
              `Procedimento "${change.code}" não encontrado no catálogo da clínica. Selecione um procedimento cadastrado.`,
            );
          }
          const data = {
            code: catalog.code,
            title: catalog.name,
            phase: change.phase,
            status: change.status,
            surfaces: change.surfaces,
            notes: change.notes?.trim() || null,
            updatedBy: { connect: { id: input.userId } },
            completedAt: change.status === "COMPLETED" ? new Date() : null,
          };
          const saved = change.id
            ? await repo.updateProcedure(change.id, input.companyId, chart.id, data)
            : await repo.createProcedure({
                company: { connect: { id: input.companyId } },
                odontogram: { connect: { id: chart.id } },
                tooth: { connect: { id: tooth.id } },
                condition: change.conditionId ? { connect: { id: change.conditionId } } : undefined,
                createdBy: { connect: { id: input.userId } },
                ...data,
              });
          await repo.createEvent({
            company: { connect: { id: input.companyId } },
            odontogram: { connect: { id: chart.id } },
            tooth: { connect: { id: tooth.id } },
            batchId,
            type: change.id ? "PROCEDURE_UPDATED" : "PROCEDURE_CREATED",
            after: { id: saved.id, code: saved.code, phase: saved.phase, status: saved.status },
            actor: { connect: { id: input.userId } },
          });
        }

        if (change.type === "observation") {
          const data = { body: change.body.trim(), updatedBy: { connect: { id: input.userId } } };
          const saved = change.id
            ? await repo.updateObservation(change.id, input.companyId, chart.id, data)
            : await repo.createObservation({
                company: { connect: { id: input.companyId } },
                odontogram: { connect: { id: chart.id } },
                tooth: { connect: { id: tooth.id } },
                createdBy: { connect: { id: input.userId } },
                ...data,
              });
          await repo.createEvent({
            company: { connect: { id: input.companyId } },
            odontogram: { connect: { id: chart.id } },
            tooth: { connect: { id: tooth.id } },
            batchId,
            type: change.id ? "OBSERVATION_UPDATED" : "OBSERVATION_CREATED",
            after: { id: saved.id },
            actor: { connect: { id: input.userId } },
          });
        }
      }
    }

    const result = await repo.findByPatient(input.companyId, input.patientId);
    if (!result) throw new Error("Não foi possível recarregar o odontograma");
    return result;
  });

  await writeAudit({
    companyId: input.companyId,
    userId: input.userId,
    action: "apply_batch",
    entityId: updated.id,
    metadata: { patientId: input.patientId, changeCount: input.changes.length },
    ip: input.ip,
    userAgent: input.userAgent,
  });
  revalidatePath(`/app/odontogram`);
  return dto(updated);
}
