import { Prisma, type BudgetEventType, type BudgetItemStatus, type BudgetStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/prisma";
import { assertTenantId } from "@/shared/lib/tenant";
import type { BudgetDTO, BudgetEditorDataDTO } from "../dto/budget.dto";
import { budgetDetailInclude, PrismaBudgetRepository } from "../repositories/prisma-budget.repository";
import type { z } from "zod";
import type { partialApprovalSchema, saveBudgetSchema } from "../schemas/budget.schemas";

type SaveInput = z.infer<typeof saveBudgetSchema>;
type PartialInput = z.infer<typeof partialApprovalSchema>;

type BudgetRow = Prisma.TreatmentBudgetGetPayload<{ include: typeof budgetDetailInclude }>;

const decimal = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(value);
const stringMoney = (value: Prisma.Decimal) => value.toFixed(2);

function budgetDto(row: BudgetRow): BudgetDTO {
  return {
    id: row.id, code: row.code, title: row.title, notes: row.notes, status: row.status,
    patient: row.patient, priceTable: row.priceTable,
    subtotal: stringMoney(row.subtotal), discount: stringMoney(row.discount), total: stringMoney(row.total),
    updatedAt: row.updatedAt.toISOString(), createdAt: row.createdAt.toISOString(),
    receivableId: row.receivable?.id ?? null,
    items: row.items.map((item) => ({
      id: item.id, procedureId: item.procedureId, odontogramProcedureId: item.odontogramProcedureId,
      professionalId: item.professionalId, description: item.description, code: item.code,
      teeth: item.teeth.map((tooth) => tooth.toothNumber), quantity: stringMoney(item.quantity),
      unitPrice: stringMoney(item.unitPrice), discount: stringMoney(item.discount), total: stringMoney(item.total),
      status: item.status, notes: item.notes,
    })),
    events: row.events.map((event) => ({ id: event.id, type: event.type, actorName: event.actor?.name ?? null, createdAt: event.createdAt.toISOString() })),
  };
}

function totals(input: SaveInput) {
  const items = input.items.map((item) => {
    const gross = decimal(item.quantity).mul(decimal(item.unitPrice));
    const discount = decimal(item.discount);
    if (discount.gt(gross)) throw new Error(`O desconto de "${item.description}" excede o valor do item`);
    return { ...item, total: gross.minus(discount) };
  });
  const subtotal = items.reduce((sum, item) => sum.plus(item.total), decimal(0));
  const discount = decimal(input.discount);
  if (discount.gt(subtotal)) throw new Error("O desconto geral excede o subtotal");
  return { items, subtotal, discount, total: subtotal.minus(discount) };
}

async function assertReferences(tx: Prisma.TransactionClient, companyId: string, input: SaveInput) {
  const patient = await tx.patient.findFirst({ where: { id: input.patientId, companyId, deletedAt: null } });
  if (!patient) throw new Error("Paciente não encontrado");
  if (input.priceTableId) {
    const table = await tx.priceTable.findFirst({ where: { id: input.priceTableId, companyId, active: true, deletedAt: null } });
    if (!table) throw new Error("Tabela de preços não encontrada");
  }
  for (const item of input.items) {
    if (item.procedureId && !await tx.procedureCatalog.findFirst({ where: { id: item.procedureId, companyId, deletedAt: null } })) throw new Error("Procedimento não encontrado");
    if (item.professionalId && !await tx.professional.findFirst({ where: { id: item.professionalId, companyId, active: true, deletedAt: null } })) throw new Error("Profissional não encontrado");
    if (item.odontogramProcedureId && !await tx.odontogramProcedure.findFirst({ where: { id: item.odontogramProcedureId, companyId, deletedAt: null, odontogram: { patientId: input.patientId, deletedAt: null } } })) throw new Error("Procedimento clínico inválido para este paciente");
  }
}

async function nextCode(tx: Prisma.TransactionClient, companyId: string) {
  const year = new Date().getFullYear();
  const count = await tx.treatmentBudget.count({ where: { companyId, createdAt: { gte: new Date(year, 0, 1) } } });
  return `ORC-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function event(tx: Prisma.TransactionClient, companyId: string, budgetId: string, actorId: string, type: BudgetEventType, after?: Prisma.InputJsonValue) {
  await tx.budgetEvent.create({ data: { companyId, budgetId, actorId, type, after } });
}

export async function listBudgets(companyId: string, patientId?: string): Promise<BudgetDTO[]> {
  assertTenantId(companyId);
  const rows = await new PrismaBudgetRepository().listDetails(companyId, patientId);
  return rows.map(budgetDto);
}

export async function getBudget(companyId: string, id: string): Promise<BudgetDTO> {
  assertTenantId(companyId);
  const row = await new PrismaBudgetRepository().findDetailById(companyId, id);
  if (!row) throw new Error("Orçamento não encontrado");
  return budgetDto(row);
}

export async function getBudgetEditorData(companyId: string, id?: string): Promise<BudgetEditorDataDTO> {
  assertTenantId(companyId);
  const [budget, patients, procedures, priceTables, professionals] = await Promise.all([
    id ? getBudget(companyId, id) : Promise.resolve(null),
    prisma.patient.findMany({ where: { companyId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.procedureCatalog.findMany({ where: { companyId, active: true, deletedAt: null }, select: { id: true, code: true, name: true, defaultPrice: true }, orderBy: { name: "asc" } }),
    prisma.priceTable.findMany({ where: { companyId, active: true, deletedAt: null }, select: { id: true, name: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" }] }),
    prisma.professional.findMany({ where: { companyId, active: true, deletedAt: null }, select: { id: true, name: true, specialty: true }, orderBy: { name: "asc" } }),
  ]);
  return { budget, patients, procedures: procedures.map((p) => ({ ...p, defaultPrice: stringMoney(p.defaultPrice) })), priceTables, professionals };
}

export async function getOdontogramBudgetPrefill(companyId: string, patientId: string, procedureIds: string[]) {
  assertTenantId(companyId);
  const procedures = await prisma.odontogramProcedure.findMany({
    where: { id: { in: procedureIds }, companyId, deletedAt: null, odontogram: { patientId, deletedAt: null } },
    include: { tooth: { select: { toothNumber: true } } },
  });
  if (procedures.length !== procedureIds.length) throw new Error("Um ou mais procedimentos clínicos não pertencem ao paciente");
  return procedures.map((procedure) => ({ id: procedure.id, code: procedure.code, title: procedure.title, toothNumber: procedure.tooth.toothNumber }));
}

export async function saveBudget(companyId: string, userId: string, input: SaveInput): Promise<BudgetDTO> {
  assertTenantId(companyId);
  const calculated = totals(input);
  const saved = await prisma.$transaction(async (tx) => {
    await assertReferences(tx, companyId, input);
    const base = { patientId: input.patientId, priceTableId: input.priceTableId ?? null, title: input.title, notes: input.notes?.trim() || null, subtotal: calculated.subtotal, discount: calculated.discount, total: calculated.total, updatedById: userId };
    let budgetId = input.id;
    if (budgetId) {
      const current = await tx.treatmentBudget.findFirst({ where: { id: budgetId, companyId, deletedAt: null } });
      if (!current) throw new Error("Orçamento não encontrado");
      if (current.status !== "DRAFT") throw new Error("Somente orçamentos em rascunho podem ser editados");
      if (!input.expectedUpdatedAt || current.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime()) throw new Error("Este orçamento foi alterado por outra pessoa. Recarregue antes de salvar.");
      await tx.treatmentBudget.update({ where: { id: budgetId }, data: base });
      await tx.treatmentBudgetItem.updateMany({ where: { budgetId, companyId, deletedAt: null }, data: { deletedAt: new Date() } });
      await event(tx, companyId, budgetId, userId, "UPDATED", { itemCount: input.items.length });
    } else {
      const created = await tx.treatmentBudget.create({ data: { ...base, companyId, code: await nextCode(tx, companyId), createdById: userId } });
      budgetId = created.id;
      await event(tx, companyId, budgetId, userId, "CREATED", { itemCount: input.items.length });
    }
    for (const item of calculated.items) {
      await tx.treatmentBudgetItem.create({ data: { companyId, budgetId, procedureId: item.procedureId ?? null, odontogramProcedureId: item.odontogramProcedureId ?? null, professionalId: item.professionalId ?? null, code: item.code ?? null, description: item.description, quantity: decimal(item.quantity), unitPrice: decimal(item.unitPrice), discount: decimal(item.discount), total: item.total, notes: item.notes?.trim() || null, teeth: { create: [...new Set(item.teeth)].map((toothNumber) => ({ toothNumber })) } } });
    }
    const row = await tx.treatmentBudget.findUniqueOrThrow({ where: { id: budgetId }, include: budgetDetailInclude });
    return row;
  });
  revalidatePath("/app/budgets"); revalidatePath("/app/patients");
  return budgetDto(saved);
}

const transitions: Record<BudgetStatus, BudgetStatus[]> = { DRAFT: ["SENT", "CANCELED"], SENT: ["APPROVED", "PARTIALLY_APPROVED", "REJECTED", "CANCELED"], APPROVED: ["COMPLETED", "CANCELED"], PARTIALLY_APPROVED: ["COMPLETED", "CANCELED"], REJECTED: [], CANCELED: [], COMPLETED: [] };

export async function changeBudgetStatus(companyId: string, userId: string, id: string, target: BudgetStatus, expectedUpdatedAt?: string): Promise<BudgetDTO> {
  assertTenantId(companyId);
  const row = await prisma.$transaction(async (tx) => {
    const current = await tx.treatmentBudget.findFirst({ where: { id, companyId, deletedAt: null }, include: { items: { where: { deletedAt: null } } } });
    if (!current) throw new Error("Orçamento não encontrado");
    if (expectedUpdatedAt && current.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) throw new Error("Este orçamento foi alterado por outra pessoa. Recarregue a página.");
    if (!transitions[current.status].includes(target)) throw new Error("Transição de status inválida");
    if (target === "APPROVED" && current.items.some((item) => item.status === "REJECTED")) throw new Error("Use aprovação parcial quando houver itens recusados");
    if (target === "APPROVED") await tx.treatmentBudgetItem.updateMany({ where: { budgetId: id, status: "PENDING", deletedAt: null }, data: { status: "APPROVED" } });
    const data: Prisma.TreatmentBudgetUpdateInput = { status: target, updatedBy: { connect: { id: userId } } };
    if (target === "SENT") data.sentAt = new Date();
    if (target === "APPROVED") { data.approvedAt = new Date(); data.approvedBy = { connect: { id: userId } }; }
    if (target === "COMPLETED") data.completedAt = new Date();
    if (target === "CANCELED") data.canceledAt = new Date();
    await tx.treatmentBudget.update({ where: { id }, data });
    await event(tx, companyId, id, userId, target as BudgetEventType);
    return tx.treatmentBudget.findUniqueOrThrow({ where: { id }, include: budgetDetailInclude });
  });
  revalidatePath("/app/budgets"); revalidatePath("/app/patients");
  return budgetDto(row);
}

export async function partiallyApproveBudget(companyId: string, userId: string, input: PartialInput): Promise<BudgetDTO> {
  assertTenantId(companyId);
  const row = await prisma.$transaction(async (tx) => {
    const budget = await tx.treatmentBudget.findFirst({ where: { id: input.id, companyId, deletedAt: null } });
    if (!budget || budget.status !== "SENT") throw new Error("Somente orçamentos enviados podem receber aprovação parcial");
    if (input.expectedUpdatedAt && budget.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime()) throw new Error("Este orçamento foi alterado por outra pessoa. Recarregue a página.");
    for (const item of input.items) {
      const result = await tx.treatmentBudgetItem.updateMany({ where: { id: item.id, budgetId: input.id, companyId, deletedAt: null }, data: { status: item.status as BudgetItemStatus } });
      if (result.count !== 1) throw new Error("Item de orçamento não encontrado");
    }
    const items = await tx.treatmentBudgetItem.findMany({ where: { budgetId: input.id, deletedAt: null } });
    const status: BudgetStatus = items.every((item) => item.status === "APPROVED") ? "APPROVED" : items.every((item) => item.status === "REJECTED") ? "REJECTED" : "PARTIALLY_APPROVED";
    await tx.treatmentBudget.update({ where: { id: input.id }, data: { status, approvedAt: new Date(), approvedById: userId, updatedById: userId } });
    await event(tx, companyId, input.id, userId, status === "APPROVED" ? "APPROVED" : status === "REJECTED" ? "REJECTED" : "PARTIALLY_APPROVED", { decisions: input.items });
    return tx.treatmentBudget.findUniqueOrThrow({ where: { id: input.id }, include: budgetDetailInclude });
  });
  revalidatePath("/app/budgets"); revalidatePath("/app/patients");
  return budgetDto(row);
}

export async function deleteBudget(companyId: string, userId: string, id: string, expectedUpdatedAt?: string): Promise<void> {
  assertTenantId(companyId);
  await prisma.$transaction(async (tx) => {
    const budget = await tx.treatmentBudget.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!budget) throw new Error("Orçamento não encontrado");
    if (budget.status !== "DRAFT") throw new Error("Somente orçamentos em rascunho podem ser excluídos");
    if (expectedUpdatedAt && budget.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) {
      throw new Error("Este orçamento foi alterado por outra pessoa. Recarregue a página.");
    }
    await tx.treatmentBudget.update({ where: { id }, data: { deletedAt: new Date(), updatedById: userId } });
    await event(tx, companyId, id, userId, "UPDATED", { deleted: true });
  });
  revalidatePath("/app/budgets"); revalidatePath("/app/patients");
}
