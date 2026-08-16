import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/prisma";
import { assertTenantId } from "@/shared/lib/tenant";
import type { z } from "zod";
import type { generateFromBudgetSchema, registerPaymentSchema } from "../schemas/finance.schemas";

type GenerateInput = z.infer<typeof generateFromBudgetSchema>;
type PaymentInput = z.infer<typeof registerPaymentSchema>;
const dec = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(value);

function split(total: Prisma.Decimal, count: number) {
  const cents = total.mul(100).toNumber();
  const base = Math.floor(cents / count), remainder = cents % count;
  return Array.from({ length: count }, (_, index) => new Prisma.Decimal(base + (index === count - 1 ? remainder : 0)).div(100));
}

async function audit(companyId: string, userId: string, action: string, entity: string, entityId: string, metadata?: Prisma.InputJsonValue) {
  await prisma.auditLog.create({ data: { companyId, userId, module: "finance", action, entity, entityId, metadata } });
}

export async function generateFromBudget(companyId: string, userId: string, input: GenerateInput) {
  assertTenantId(companyId);
  const result = await prisma.$transaction(async (tx) => {
    const budget = await tx.treatmentBudget.findFirst({ where: { id: input.budgetId, companyId, deletedAt: null }, include: { patient: true, items: { where: { deletedAt: null, status: "APPROVED" }, include: { teeth: true } } } });
    if (!budget) throw new Error("Orçamento não encontrado");
    if (!["APPROVED", "PARTIALLY_APPROVED"].includes(budget.status)) throw new Error("Apenas orçamentos aprovados podem gerar financeiro");
    if (!budget.items.length) throw new Error("O orçamento não possui itens aprovados");
    if (await tx.receivable.findFirst({ where: { budgetId: budget.id, deletedAt: null } })) throw new Error("Este orçamento já possui um financeiro gerado.");
    const subtotal = budget.items.reduce((sum, item) => sum.plus(item.total), dec(0));
    const entry = dec(input.entryAmount);
    if (entry.gt(subtotal)) throw new Error("A entrada não pode exceder o valor financeiro");
    const portions = entry.gt(0) ? [entry, ...split(subtotal.minus(entry), input.installmentCount - 1)] : split(subtotal, input.installmentCount);
    if (portions.some((value) => value.lte(0))) throw new Error("A entrada exige pelo menos duas parcelas");
    const code = `REC-${new Date().getFullYear()}-${String((await tx.receivable.count({ where: { companyId } })) + 1).padStart(4, "0")}`;
    const receivable = await tx.receivable.create({ data: { companyId, patientId: budget.patientId, budgetId: budget.id, code, title: budget.title, notes: input.notes ?? budget.notes, subtotal, discount: 0, total: subtotal, receivedAmount: 0, balance: subtotal, createdById: userId, updatedById: userId, items: { create: budget.items.map((item) => ({ companyId, budgetItemId: item.id, description: item.description, code: item.code, professionalId: item.professionalId, quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount, total: item.total, teeth: { create: item.teeth.map((tooth) => ({ toothNumber: tooth.toothNumber, surfaces: tooth.surfaces })) } })) }, installments: { create: portions.map((amount, index) => { const dueDate = new Date(input.firstDueDate); dueDate.setMonth(dueDate.getMonth() + index); return { companyId, patientId: budget.patientId, sequence: index + 1, dueDate, amount, balance: amount }; }) } } });
    await tx.financeEvent.createMany({ data: [{ companyId, receivableId: receivable.id, actorId: userId, type: "RECEIVABLE_CREATED", after: { budgetId: budget.id, total: subtotal.toFixed(2) } }, { companyId, receivableId: receivable.id, actorId: userId, type: "INSTALLMENTS_CREATED", after: { count: portions.length, method: input.paymentMethod } }] });
    return receivable;
  });
  await audit(companyId, userId, "generated_from_budget", "Receivable", result.id, { budgetId: input.budgetId });
  revalidatePath("/app/finance"); revalidatePath("/app/budgets"); revalidatePath("/app/patients");
  return result;
}

export async function registerPayment(companyId: string, userId: string, input: PaymentInput) {
  assertTenantId(companyId);
  const result = await prisma.$transaction(async (tx) => {
    const installment = await tx.installment.findFirst({ where: { id: input.installmentId, companyId, deletedAt: null, receivable: { deletedAt: null } }, include: { receivable: true } });
    if (!installment || installment.status === "CANCELLED") throw new Error("Parcela não encontrada");
    const amount = dec(input.amount);
    if (amount.gt(installment.balance)) throw new Error("O pagamento excede o saldo da parcela");
    const balance = installment.balance.minus(amount), received = installment.receivedAmount.plus(amount);
    const status = balance.isZero() ? "PAID" : "PARTIALLY_PAID";
    const payment = await tx.payment.create({ data: { companyId, installmentId: installment.id, patientId: installment.patientId, amount, method: input.method, paidAt: new Date(input.paidAt), notes: input.notes ?? null, registeredById: userId } });
    await tx.installment.update({ where: { id: installment.id }, data: { receivedAmount: received, balance, status } });
    const totals = await tx.installment.aggregate({ where: { receivableId: installment.receivableId, deletedAt: null }, _sum: { receivedAmount: true, balance: true } });
    const receivableBalance = totals._sum.balance ?? dec(0), receivableReceived = totals._sum.receivedAmount ?? dec(0);
    await tx.receivable.update({ where: { id: installment.receivableId }, data: { receivedAmount: receivableReceived, balance: receivableBalance, status: receivableBalance.isZero() ? "PAID" : "PARTIALLY_PAID", updatedById: userId } });
    await tx.financeEvent.create({ data: { companyId, receivableId: installment.receivableId, installmentId: installment.id, paymentId: payment.id, actorId: userId, type: "PAYMENT_REGISTERED", after: { amount: amount.toFixed(2), balance: balance.toFixed(2) } } });
    return payment;
  });
  await audit(companyId, userId, "payment_registered", "Payment", result.id);
  revalidatePath("/app/finance"); revalidatePath("/app/patients");
  return result;
}

const receivableInclude = {
  patient: { select: { id: true, name: true, preferredName: true } },
  budget: { select: { id: true, code: true } },
  items: { include: { teeth: true, professional: { select: { name: true } } } },
  installments: { where: { deletedAt: null }, orderBy: { sequence: "asc" }, include: { payments: { where: { deletedAt: null }, orderBy: { paidAt: "desc" } } } },
  events: { include: { actor: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
} satisfies Prisma.ReceivableInclude;

function displayInstallmentStatus(status: string, dueDate: Date, balance: Prisma.Decimal) {
  return balance.gt(0) && dueDate < new Date() && status !== "CANCELLED" ? "OVERDUE" : status;
}

export async function listReceivables(companyId: string, filters?: { patientId?: string; receivableId?: string; status?: string; query?: string }) {
  assertTenantId(companyId);
  const rows = await prisma.receivable.findMany({
    where: { companyId, deletedAt: null, ...(filters?.patientId ? { patientId: filters.patientId } : {}), ...(filters?.receivableId ? { id: filters.receivableId } : {}), ...(filters?.status ? { status: filters.status as never } : {}), ...(filters?.query ? { patient: { name: { contains: filters.query, mode: "insensitive" } } } : {}) },
    include: receivableInclude, orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id, code: row.code, title: row.title, patient: row.patient, budgetId: row.budget?.id ?? null, budgetCode: row.budget?.code ?? null,
    status: row.status, total: row.total.toFixed(2), receivedAmount: row.receivedAmount.toFixed(2), balance: row.balance.toFixed(2),
    updatedAt: row.updatedAt.toISOString(), installments: row.installments.map((i) => ({ id: i.id, sequence: i.sequence, dueDate: i.dueDate.toISOString(), amount: i.amount.toFixed(2), receivedAmount: i.receivedAmount.toFixed(2), balance: i.balance.toFixed(2), status: displayInstallmentStatus(i.status, i.dueDate, i.balance), payments: i.payments.map((p) => ({ id: p.id, amount: p.amount.toFixed(2), method: p.method, paidAt: p.paidAt.toISOString() })) })),
    items: row.items.map((i) => ({ id: i.id, description: i.description, code: i.code, total: i.total.toFixed(2), teeth: i.teeth.map((t) => ({ toothNumber: t.toothNumber, surfaces: t.surfaces ?? [] })), professionalName: i.professional?.name ?? null })),
    events: row.events.map((e) => ({ id: e.id, type: e.type, actorName: e.actor?.name ?? null, createdAt: e.createdAt.toISOString() })),
  }));
}

export async function getFinanceDashboard(companyId: string, filters?: { patientId?: string; receivableId?: string }) {
  const receivables = await listReceivables(companyId, filters);
  if (filters?.receivableId && !receivables.length) throw new Error("Recebível não encontrado");
  const totals = receivables.reduce((acc, item) => ({ total: acc.total.plus(item.total), received: acc.received.plus(item.receivedAmount), balance: acc.balance.plus(item.balance) }), { total: dec(0), received: dec(0), balance: dec(0) });
  const installments = receivables.flatMap((row) => row.installments);
  const overdue = installments.filter((i) => i.status === "OVERDUE").reduce((sum, i) => sum.plus(i.balance), dec(0));
  return { receivables, summary: { total: totals.total.toFixed(2), received: totals.received.toFixed(2), balance: totals.balance.toFixed(2), overdue: overdue.toFixed(2), nextDue: installments.filter((i) => i.balance !== "0.00" && i.status !== "OVERDUE").sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null } };
}
