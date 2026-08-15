import {
  Prisma,
  type TreatmentPlanEventType,
  type TreatmentPlanItemStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/prisma";
import { assertTenantId } from "@/shared/lib/tenant";
import type {
  TreatmentPlanDTO,
  TreatmentPlanEditorDataDTO,
  TreatmentPlanItemDTO,
  TreatmentPlanSummaryDTO,
} from "../dto/treatment-plan.dto";
import {
  PrismaTreatmentPlanRepository,
  treatmentPlanDetailInclude,
  type TreatmentPlanDetailRow,
} from "../repositories/prisma-treatment-plan.repository";
import type { z } from "zod";
import type {
  addTreatmentPlanItemSchema,
  changeTreatmentPlanItemStatusSchema,
  createBudgetFromPlanSchema,
  createTreatmentPlanSchema,
  removeTreatmentPlanItemSchema,
  updateTreatmentPlanItemSchema,
  updateTreatmentPlanSchema,
} from "../schemas/treatment-plan.schemas";

type CreateInput = z.infer<typeof createTreatmentPlanSchema>;
type UpdateInput = z.infer<typeof updateTreatmentPlanSchema>;
type AddItemInput = z.infer<typeof addTreatmentPlanItemSchema>;
type UpdateItemInput = z.infer<typeof updateTreatmentPlanItemSchema>;
type ChangeStatusInput = z.infer<typeof changeTreatmentPlanItemStatusSchema>;
type RemoveItemInput = z.infer<typeof removeTreatmentPlanItemSchema>;
type BudgetFromPlanInput = z.infer<typeof createBudgetFromPlanSchema>;
type ItemInput = CreateInput["items"][number];

const ITEM_TRANSITIONS: Record<TreatmentPlanItemStatus, TreatmentPlanItemStatus[]> = {
  PLANNED: ["SCHEDULED", "IN_PROGRESS", "CANCELLED"],
  SCHEDULED: ["PLANNED", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const decimal = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(value);
const stringMoney = (value: Prisma.Decimal | null | undefined) =>
  value == null ? null : value.toFixed(2);

function summary(items: TreatmentPlanDetailRow["items"]): TreatmentPlanSummaryDTO {
  const active = items.filter((item) => item.status !== "CANCELLED");
  const total = active.length;
  const planned = active.filter((item) => item.status === "PLANNED" || item.status === "SCHEDULED").length;
  const inProgress = active.filter((item) => item.status === "IN_PROGRESS").length;
  const completed = active.filter((item) => item.status === "COMPLETED").length;
  const cancelled = items.filter((item) => item.status === "CANCELLED").length;
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, planned, inProgress, completed, cancelled, progressPercent };
}

function itemDto(item: TreatmentPlanDetailRow["items"][number]): TreatmentPlanItemDTO {
  return {
    id: item.id,
    procedureId: item.procedureId,
    odontogramProcedureId: item.odontogramProcedureId,
    professionalId: item.professionalId,
    professionalName: item.professional?.name ?? null,
    appointmentId: item.appointmentId,
    budgetItemId: item.budgetItem?.id ?? null,
    budgetId: item.budgetItem?.budgetId ?? null,
    code: item.code,
    title: item.title,
    teeth: item.teeth.map((tooth) => ({ toothNumber: tooth.toothNumber, surfaces: tooth.surfaces })),
    quantity: decimal(item.quantity).toFixed(2),
    unitPrice: stringMoney(item.unitPrice),
    status: item.status,
    sortOrder: item.sortOrder,
    notes: item.notes,
    scheduledAt: item.scheduledAt?.toISOString() ?? null,
    startedAt: item.startedAt?.toISOString() ?? null,
    completedAt: item.completedAt?.toISOString() ?? null,
    canceledAt: item.canceledAt?.toISOString() ?? null,
  };
}

function planDto(row: TreatmentPlanDetailRow): TreatmentPlanDTO {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    notes: row.notes,
    status: row.status,
    patient: row.patient,
    responsibleProfessional: row.responsibleProfessional,
    summary: summary(row.items),
    items: row.items.map(itemDto),
    budgets: row.budgets,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

async function auditLog(
  companyId: string,
  userId: string,
  action: string,
  entityId: string,
  metadata?: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({
    data: { companyId, userId, module: "treatment_plans", action, entity: "TreatmentPlan", entityId, metadata },
  });
}

async function planEvent(
  tx: Prisma.TransactionClient,
  companyId: string,
  planId: string,
  actorId: string,
  type: TreatmentPlanEventType,
  after?: Prisma.InputJsonValue,
  before?: Prisma.InputJsonValue,
) {
  await tx.treatmentPlanEvent.create({ data: { companyId, planId, actorId, type, before, after } });
}

async function assertPlanConcurrency(
  tx: Prisma.TransactionClient,
  companyId: string,
  planId: string,
  expectedUpdatedAt: string,
) {
  const current = await tx.treatmentPlan.findFirst({ where: { id: planId, companyId, deletedAt: null } });
  if (!current) throw new Error("Plano de tratamento não encontrado");
  if (current.status === "CANCELLED") throw new Error("Plano cancelado não pode ser alterado");
  if (current.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) {
    throw new Error("Este plano foi alterado por outra pessoa. Recarregue antes de salvar.");
  }
  return current;
}

async function assertItemReferences(
  tx: Prisma.TransactionClient,
  companyId: string,
  patientId: string,
  item: ItemInput,
) {
  if (item.procedureId) {
    const procedure = await tx.procedureCatalog.findFirst({
      where: { id: item.procedureId, companyId, deletedAt: null },
    });
    if (!procedure) throw new Error("Procedimento não encontrado");
  }
  if (item.professionalId) {
    const professional = await tx.professional.findFirst({
      where: { id: item.professionalId, companyId, active: true, deletedAt: null },
    });
    if (!professional) throw new Error("Profissional não encontrado");
  }
  if (item.odontogramProcedureId) {
    const clinical = await tx.odontogramProcedure.findFirst({
      where: {
        id: item.odontogramProcedureId,
        companyId,
        deletedAt: null,
        odontogram: { patientId, deletedAt: null },
      },
    });
    if (!clinical) throw new Error("Procedimento clínico inválido para este paciente");
  }
}

async function nextPlanCode(tx: Prisma.TransactionClient, companyId: string) {
  const year = new Date().getFullYear();
  const count = await tx.treatmentPlan.count({
    where: { companyId, createdAt: { gte: new Date(year, 0, 1) } },
  });
  return `PLN-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function nextBudgetCode(tx: Prisma.TransactionClient, companyId: string) {
  const year = new Date().getFullYear();
  const count = await tx.treatmentBudget.count({
    where: { companyId, createdAt: { gte: new Date(year, 0, 1) } },
  });
  return `ORC-${year}-${String(count + 1).padStart(4, "0")}`;
}

function itemCreateData(companyId: string, planId: string, item: ItemInput, sortOrder: number) {
  return {
    companyId,
    planId,
    procedureId: item.procedureId ?? null,
    odontogramProcedureId: item.odontogramProcedureId ?? null,
    professionalId: item.professionalId ?? null,
    code: item.code?.trim() || null,
    title: item.title.trim(),
    quantity: decimal(item.quantity ?? 1),
    unitPrice: item.unitPrice != null ? decimal(item.unitPrice) : null,
    notes: item.notes?.trim() || null,
    sortOrder: item.sortOrder ?? sortOrder,
    teeth: { create: item.teeth.map((tooth) => ({ toothNumber: tooth.toothNumber, surfaces: tooth.surfaces })) },
  };
}

async function syncPlanStatus(tx: Prisma.TransactionClient, planId: string) {
  const plan = await tx.treatmentPlan.findUniqueOrThrow({ where: { id: planId } });
  if (plan.status === "CANCELLED") return;
  const items = await tx.treatmentPlanItem.findMany({ where: { planId, deletedAt: null } });
  if (items.length === 0) return;
  const active = items.filter((item) => item.status !== "CANCELLED");
  if (active.length === 0) {
    await tx.treatmentPlan.update({ where: { id: planId }, data: { status: "CANCELLED" } });
    return;
  }
  const allDone = active.every((item) => item.status === "COMPLETED");
  await tx.treatmentPlan.update({
    where: { id: planId },
    data: { status: allDone ? "COMPLETED" : "ACTIVE" },
  });
}

function assertItemTransition(from: TreatmentPlanItemStatus, to: TreatmentPlanItemStatus) {
  if (from === to) return;
  if (!ITEM_TRANSITIONS[from].includes(to)) {
    throw new Error(`Transição inválida de ${from} para ${to}`);
  }
}

function revalidate() {
  revalidatePath("/app/treatment-plans");
  revalidatePath("/app/patients");
  revalidatePath("/app/budgets");
  revalidatePath("/app/odontogram");
}

async function loadPlan(tx: Prisma.TransactionClient, companyId: string, planId: string) {
  const row = await tx.treatmentPlan.findFirst({
    where: { id: planId, companyId, deletedAt: null },
    include: treatmentPlanDetailInclude,
  });
  if (!row) throw new Error("Plano de tratamento não encontrado");
  return row;
}

export async function listTreatmentPlans(companyId: string, patientId?: string): Promise<TreatmentPlanDTO[]> {
  assertTenantId(companyId);
  return (await new PrismaTreatmentPlanRepository().listDetails(companyId, patientId)).map(planDto);
}

export async function getTreatmentPlan(companyId: string, id: string): Promise<TreatmentPlanDTO> {
  assertTenantId(companyId);
  const row = await new PrismaTreatmentPlanRepository().findDetailById(companyId, id);
  if (!row) throw new Error("Plano de tratamento não encontrado");
  return planDto(row);
}

export async function getTreatmentPlanEditorData(
  companyId: string,
  id?: string,
  patientId?: string,
): Promise<TreatmentPlanEditorDataDTO> {
  assertTenantId(companyId);
  const repo = new PrismaTreatmentPlanRepository();
  const [plan, patients, procedures, professionals, plans] = await Promise.all([
    id ? getTreatmentPlan(companyId, id) : Promise.resolve(null),
    prisma.patient.findMany({
      where: { companyId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.procedureCatalog.findMany({
      where: { companyId, active: true, deletedAt: null },
      select: { id: true, code: true, name: true, defaultPrice: true },
      orderBy: { name: "asc" },
    }),
    prisma.professional.findMany({
      where: { companyId, active: true, deletedAt: null },
      select: { id: true, name: true, specialty: true },
      orderBy: { name: "asc" },
    }),
    repo.listSummaries(companyId, patientId),
  ]);
  return {
    plan,
    patients,
    procedures: procedures.map((p) => ({ ...p, defaultPrice: stringMoney(p.defaultPrice)! })),
    professionals,
    plans,
  };
}

export async function getOdontogramPlanPrefill(
  companyId: string,
  patientId: string,
  procedureIds: string[],
) {
  assertTenantId(companyId);
  const procedures = await prisma.odontogramProcedure.findMany({
    where: { id: { in: procedureIds }, companyId, deletedAt: null, odontogram: { patientId, deletedAt: null } },
    include: { tooth: { select: { toothNumber: true } }, professional: { select: { id: true } } },
  });
  if (procedures.length !== procedureIds.length) {
    throw new Error("Um ou mais procedimentos clínicos não pertencem ao paciente");
  }
  const catalog = await prisma.procedureCatalog.findMany({
    where: { companyId, deletedAt: null, code: { in: procedures.map((procedure) => procedure.code) } },
    select: { code: true, defaultPrice: true },
  });
  return procedures.map((procedure) => ({
    id: procedure.id,
    code: procedure.code,
    title: procedure.title,
    toothNumber: procedure.tooth.toothNumber,
    surfaces: procedure.surfaces,
    professionalId: procedure.professionalId,
    defaultPrice: catalog.find((item) => item.code === procedure.code)?.defaultPrice.toFixed(2) ?? null,
  }));
}

export async function createTreatmentPlan(
  companyId: string,
  userId: string,
  input: CreateInput,
): Promise<TreatmentPlanDTO> {
  assertTenantId(companyId);
  const result = await prisma.$transaction(async (tx) => {
    const patient = await tx.patient.findFirst({
      where: { id: input.patientId, companyId, deletedAt: null },
    });
    if (!patient) throw new Error("Paciente não encontrado");
    if (input.responsibleProfessionalId) {
      const professional = await tx.professional.findFirst({
        where: { id: input.responsibleProfessionalId, companyId, active: true, deletedAt: null },
      });
      if (!professional) throw new Error("Profissional responsável não encontrado");
    }
    for (const item of input.items) await assertItemReferences(tx, companyId, input.patientId, item);

    const plan = await tx.treatmentPlan.create({
      data: {
        companyId,
        patientId: input.patientId,
        responsibleProfessionalId: input.responsibleProfessionalId ?? null,
        code: await nextPlanCode(tx, companyId),
        title: input.title.trim(),
        notes: input.notes?.trim() || null,
        createdById: userId,
        updatedById: userId,
      },
    });

    for (const [index, item] of input.items.entries()) {
      await tx.treatmentPlanItem.create({ data: itemCreateData(companyId, plan.id, item, index) });
    }
    await planEvent(tx, companyId, plan.id, userId, "CREATED", { title: plan.title });
    return loadPlan(tx, companyId, plan.id);
  });
  await auditLog(companyId, userId, "created", result.id, { title: result.title });
  revalidate();
  return planDto(result);
}

export async function updateTreatmentPlan(
  companyId: string,
  userId: string,
  input: UpdateInput,
): Promise<TreatmentPlanDTO> {
  assertTenantId(companyId);
  const result = await prisma.$transaction(async (tx) => {
    await assertPlanConcurrency(tx, companyId, input.id, input.expectedUpdatedAt);
    if (input.responsibleProfessionalId) {
      const professional = await tx.professional.findFirst({
        where: { id: input.responsibleProfessionalId, companyId, active: true, deletedAt: null },
      });
      if (!professional) throw new Error("Profissional responsável não encontrado");
    }
    await tx.treatmentPlan.update({
      where: { id: input.id },
      data: {
        title: input.title.trim(),
        notes: input.notes?.trim() || null,
        responsibleProfessionalId: input.responsibleProfessionalId ?? null,
        updatedById: userId,
      },
    });
    await planEvent(tx, companyId, input.id, userId, "UPDATED", { title: input.title });
    return loadPlan(tx, companyId, input.id);
  });
  await auditLog(companyId, userId, "updated", result.id);
  revalidate();
  return planDto(result);
}

export async function addTreatmentPlanItem(
  companyId: string,
  userId: string,
  input: AddItemInput,
): Promise<TreatmentPlanDTO> {
  assertTenantId(companyId);
  const result = await prisma.$transaction(async (tx) => {
    const plan = await assertPlanConcurrency(tx, companyId, input.id, input.expectedUpdatedAt);
    await assertItemReferences(tx, companyId, plan.patientId, input.item);
    const sortOrder =
      input.item.sortOrder ??
      (await tx.treatmentPlanItem.count({ where: { planId: plan.id, deletedAt: null } }));
    const created = await tx.treatmentPlanItem.create({
      data: itemCreateData(companyId, plan.id, input.item, sortOrder),
    });
    await tx.treatmentPlan.update({ where: { id: plan.id }, data: { updatedById: userId } });
    await planEvent(tx, companyId, plan.id, userId, "ITEM_ADDED", { itemId: created.id, title: created.title });
    await syncPlanStatus(tx, plan.id);
    return loadPlan(tx, companyId, plan.id);
  });
  await auditLog(companyId, userId, "item_added", result.id, { item: input.item.title });
  revalidate();
  return planDto(result);
}

export async function updateTreatmentPlanItem(
  companyId: string,
  userId: string,
  input: UpdateItemInput,
): Promise<TreatmentPlanDTO> {
  assertTenantId(companyId);
  const result = await prisma.$transaction(async (tx) => {
    const plan = await assertPlanConcurrency(tx, companyId, input.planId, input.expectedUpdatedAt);
    const current = await tx.treatmentPlanItem.findFirst({
      where: { id: input.itemId, planId: plan.id, companyId, deletedAt: null },
      include: { budgetItem: true },
    });
    if (!current) throw new Error("Procedimento do plano não encontrado");
    if (current.budgetItem) throw new Error("Itens já enviados ao orçamento não podem ser editados");
    await assertItemReferences(tx, companyId, plan.patientId, input.item);
    await tx.treatmentPlanItemTooth.deleteMany({ where: { itemId: current.id } });
    await tx.treatmentPlanItem.update({
      where: { id: current.id },
      data: {
        procedureId: input.item.procedureId ?? null,
        odontogramProcedureId: input.item.odontogramProcedureId ?? null,
        professionalId: input.item.professionalId ?? null,
        code: input.item.code?.trim() || null,
        title: input.item.title.trim(),
        quantity: decimal(input.item.quantity ?? 1),
        unitPrice: input.item.unitPrice != null ? decimal(input.item.unitPrice) : null,
        notes: input.item.notes?.trim() || null,
        sortOrder: input.item.sortOrder ?? current.sortOrder,
        teeth: { create: input.item.teeth.map((tooth) => ({ toothNumber: tooth.toothNumber, surfaces: tooth.surfaces })) },
      },
    });
    await tx.treatmentPlan.update({ where: { id: plan.id }, data: { updatedById: userId } });
    await planEvent(tx, companyId, plan.id, userId, "ITEM_UPDATED", { itemId: current.id });
    return loadPlan(tx, companyId, plan.id);
  });
  revalidate();
  return planDto(result);
}

export async function changeTreatmentPlanItemStatus(
  companyId: string,
  userId: string,
  input: ChangeStatusInput,
): Promise<TreatmentPlanDTO> {
  assertTenantId(companyId);
  const result = await prisma.$transaction(async (tx) => {
    const plan = await assertPlanConcurrency(tx, companyId, input.planId, input.expectedUpdatedAt);
    const current = await tx.treatmentPlanItem.findFirst({
      where: { id: input.itemId, planId: plan.id, companyId, deletedAt: null },
      include: { budgetItem: true },
    });
    if (!current) throw new Error("Procedimento do plano não encontrado");
    assertItemTransition(current.status, input.status);
    const now = new Date();
    await tx.treatmentPlanItem.update({
      where: { id: current.id },
      data: {
        status: input.status,
        scheduledAt:
          input.status === "SCHEDULED"
            ? input.scheduledAt
              ? new Date(input.scheduledAt)
              : now
            : input.status === "PLANNED"
              ? null
              : current.scheduledAt,
        startedAt: input.status === "IN_PROGRESS" ? now : current.startedAt,
        completedAt: input.status === "COMPLETED" ? now : current.completedAt,
        canceledAt: input.status === "CANCELLED" ? now : current.canceledAt,
      },
    });
    await tx.treatmentPlan.update({ where: { id: plan.id }, data: { updatedById: userId } });
    await planEvent(tx, companyId, plan.id, userId, "ITEM_STATUS_CHANGED", {
      itemId: current.id,
      from: current.status,
      to: input.status,
    });
    await syncPlanStatus(tx, plan.id);
    return loadPlan(tx, companyId, plan.id);
  });
  await auditLog(companyId, userId, "item_status_changed", result.id, {
    itemId: input.itemId,
    status: input.status,
  });
  revalidate();
  return planDto(result);
}

export async function removeTreatmentPlanItem(
  companyId: string,
  userId: string,
  input: RemoveItemInput,
): Promise<TreatmentPlanDTO> {
  assertTenantId(companyId);
  const result = await prisma.$transaction(async (tx) => {
    const plan = await assertPlanConcurrency(tx, companyId, input.planId, input.expectedUpdatedAt);
    const current = await tx.treatmentPlanItem.findFirst({
      where: { id: input.itemId, planId: plan.id, companyId, deletedAt: null },
      include: { budgetItem: true },
    });
    if (!current) throw new Error("Procedimento do plano não encontrado");
    if (current.budgetItem) throw new Error("Itens já enviados ao orçamento não podem ser removidos");
    await tx.treatmentPlanItem.update({ where: { id: current.id }, data: { deletedAt: new Date() } });
    await tx.treatmentPlan.update({ where: { id: plan.id }, data: { updatedById: userId } });
    await planEvent(tx, companyId, plan.id, userId, "ITEM_REMOVED", { itemId: current.id });
    await syncPlanStatus(tx, plan.id);
    return loadPlan(tx, companyId, plan.id);
  });
  revalidate();
  return planDto(result);
}

export async function cancelTreatmentPlan(
  companyId: string,
  userId: string,
  id: string,
  expectedUpdatedAt: string,
): Promise<TreatmentPlanDTO> {
  assertTenantId(companyId);
  const result = await prisma.$transaction(async (tx) => {
    await assertPlanConcurrency(tx, companyId, id, expectedUpdatedAt);
    await tx.treatmentPlan.update({
      where: { id },
      data: { status: "CANCELLED", updatedById: userId },
    });
    await planEvent(tx, companyId, id, userId, "CANCELLED");
    return loadPlan(tx, companyId, id);
  });
  await auditLog(companyId, userId, "cancelled", id);
  revalidate();
  return planDto(result);
}

export async function deleteTreatmentPlan(
  companyId: string,
  userId: string,
  id: string,
  expectedUpdatedAt?: string,
): Promise<void> {
  assertTenantId(companyId);
  await prisma.$transaction(async (tx) => {
    const current = await tx.treatmentPlan.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!current) throw new Error("Plano de tratamento não encontrado");
    if (expectedUpdatedAt && current.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) {
      throw new Error("Este plano foi alterado por outra pessoa. Recarregue antes de excluir.");
    }
    const linked = await tx.treatmentPlanItem.count({
      where: { planId: id, deletedAt: null, budgetItem: { isNot: null } },
    });
    if (linked > 0) throw new Error("Não é possível excluir planos com itens vinculados a orçamentos");
    const now = new Date();
    await tx.treatmentPlanItem.updateMany({ where: { planId: id, deletedAt: null }, data: { deletedAt: now } });
    await tx.treatmentPlan.update({ where: { id }, data: { deletedAt: now, updatedById: userId } });
    await planEvent(tx, companyId, id, userId, "DELETED");
  });
  await auditLog(companyId, userId, "deleted", id);
  revalidate();
}

export async function addOdontogramProceduresToPlan(
  companyId: string,
  userId: string,
  patientId: string,
  procedureIds: string[],
  planId?: string,
): Promise<TreatmentPlanDTO> {
  assertTenantId(companyId);
  const prefill = await getOdontogramPlanPrefill(companyId, patientId, procedureIds);
  const catalog = await prisma.procedureCatalog.findMany({
    where: { companyId, deletedAt: null, code: { in: prefill.map((p) => p.code) } },
  });

  if (planId) {
    const plan = await getTreatmentPlan(companyId, planId);
    let latest = plan;
    for (const clinical of prefill) {
      const match = catalog.find((p) => p.code === clinical.code);
      latest = await addTreatmentPlanItem(companyId, userId, {
        id: latest.id,
        expectedUpdatedAt: latest.updatedAt,
        item: {
          odontogramProcedureId: clinical.id,
          procedureId: match?.id ?? null,
          professionalId: clinical.professionalId,
          code: clinical.code,
          title: clinical.title,
          teeth: [{ toothNumber: clinical.toothNumber, surfaces: clinical.surfaces }],
          quantity: 1,
          unitPrice: match ? Number(match.defaultPrice) : null,
          notes: null,
        },
      });
    }
    return latest;
  }

  return createTreatmentPlan(companyId, userId, {
    patientId,
    title: "Plano clínico",
    items: prefill.map((clinical) => {
      const match = catalog.find((p) => p.code === clinical.code);
      return {
        odontogramProcedureId: clinical.id,
        procedureId: match?.id ?? null,
        professionalId: clinical.professionalId,
        code: clinical.code,
        title: clinical.title,
        teeth: [{ toothNumber: clinical.toothNumber, surfaces: clinical.surfaces }],
        quantity: 1,
        unitPrice: match ? Number(match.defaultPrice) : null,
        notes: null,
      };
    }),
  });
}

export async function createBudgetFromPlan(
  companyId: string,
  userId: string,
  input: BudgetFromPlanInput,
): Promise<{ budgetId: string; plan: TreatmentPlanDTO }> {
  assertTenantId(companyId);
  const result = await prisma.$transaction(async (tx) => {
    const plan = await assertPlanConcurrency(tx, companyId, input.planId, input.expectedUpdatedAt);
    const items = await tx.treatmentPlanItem.findMany({
      where: {
        id: { in: input.itemIds },
        planId: plan.id,
        companyId,
        deletedAt: null,
        budgetItem: null,
        status: { not: "CANCELLED" },
      },
      include: { teeth: true },
    });
    if (items.length !== input.itemIds.length) {
      throw new Error("Selecione apenas itens válidos ainda não enviados ao orçamento");
    }

    let subtotal = decimal(0);
    const budgetItems = items.map((item) => {
      const unitPrice = item.unitPrice ?? decimal(0);
      const total = decimal(item.quantity).mul(unitPrice);
      subtotal = subtotal.plus(total);
      return { item, unitPrice, total };
    });

    const budget = await tx.treatmentBudget.create({
      data: {
        companyId,
        patientId: plan.patientId,
        treatmentPlanId: plan.id,
        priceTableId: input.priceTableId ?? null,
        code: await nextBudgetCode(tx, companyId),
        title: input.title?.trim() || `${plan.title} · Orçamento`,
        status: "DRAFT",
        subtotal,
        discount: 0,
        total: subtotal,
        createdById: userId,
        updatedById: userId,
        events: { create: { companyId, actorId: userId, type: "CREATED" } },
      },
    });

    for (const { item, unitPrice, total } of budgetItems) {
      await tx.treatmentBudgetItem.create({
        data: {
          companyId,
          budgetId: budget.id,
          procedureId: item.procedureId,
          odontogramProcedureId: item.odontogramProcedureId,
          treatmentPlanItemId: item.id,
          professionalId: item.professionalId,
          code: item.code,
          description: item.title,
          quantity: item.quantity,
          unitPrice,
          discount: 0,
          total,
          teeth: { create: item.teeth.map((tooth) => ({ toothNumber: tooth.toothNumber, surfaces: tooth.surfaces })) },
        },
      });
    }

    await tx.treatmentPlan.update({ where: { id: plan.id }, data: { updatedById: userId } });
    await planEvent(tx, companyId, plan.id, userId, "BUDGET_CREATED", { budgetId: budget.id });
    const updatedPlan = await loadPlan(tx, companyId, plan.id);
    return { budgetId: budget.id, plan: updatedPlan };
  });

  await auditLog(companyId, userId, "budget_created", result.plan.id, { budgetId: result.budgetId });
  revalidate();
  return { budgetId: result.budgetId, plan: planDto(result.plan) };
}
