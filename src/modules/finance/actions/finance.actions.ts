"use server";

import { ZodError } from "zod";
import { requirePermission } from "@/shared/lib/session";
import {
  financeDashboardSchema,
  generateFromBudgetSchema,
  patientReceiptsSchema,
  paymentIdSchema,
  registerPaymentSchema,
} from "../schemas/finance.schemas";
import {
  generateFromBudget,
  getFinanceDashboard,
  getPaymentReceipt,
  listPatientReceipts,
  listReceivables,
  registerPayment,
  type PatientReceiptDTO,
  type PaymentReceiptDTO,
} from "../services/finance.service";

export type FinanceActionResult<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Dados inválidos";
  return error instanceof Error ? error.message : fallback;
}

export async function generateFinanceFromBudgetAction(input: unknown): Promise<FinanceActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("finance:manage");
    const receivable = await generateFromBudget(user.companyId, user.id, generateFromBudgetSchema.parse(input));
    return { success: true, data: { id: receivable.id }, message: "Financeiro gerado" };
  } catch (error) {
    return { success: false, error: errorMessage(error, "Não foi possível gerar o financeiro") };
  }
}

export async function registerPaymentAction(input: unknown): Promise<FinanceActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("finance:receive");
    const payment = await registerPayment(user.companyId, user.id, registerPaymentSchema.parse(input));
    return { success: true, data: { id: payment.id }, message: "Pagamento registrado" };
  } catch (error) {
    return { success: false, error: errorMessage(error, "Não foi possível registrar o pagamento") };
  }
}

export async function getFinanceDashboardAction(input?: unknown): Promise<FinanceActionResult<Awaited<ReturnType<typeof getFinanceDashboard>>>> {
  try {
    const user = await requirePermission("finance:view");
    const filters = financeDashboardSchema.parse(input);
    return { success: true, data: await getFinanceDashboard(user.companyId, filters) };
  } catch (error) { return { success: false, error: errorMessage(error, "Não foi possível carregar o financeiro") }; }
}

export async function listReceivablesAction(input?: { patientId?: string; status?: string; query?: string }): Promise<FinanceActionResult<Awaited<ReturnType<typeof listReceivables>>>> {
  try {
    const user = await requirePermission("finance:view");
    return { success: true, data: await listReceivables(user.companyId, input) };
  } catch (error) { return { success: false, error: errorMessage(error, "Não foi possível listar recebíveis") }; }
}

export async function listPatientReceiptsAction(
  input: unknown,
): Promise<FinanceActionResult<PatientReceiptDTO[]>> {
  try {
    const user = await requirePermission("finance:view");
    const { patientId } = patientReceiptsSchema.parse(input);
    return { success: true, data: await listPatientReceipts(user.companyId, patientId) };
  } catch (error) {
    return { success: false, error: errorMessage(error, "Não foi possível listar recibos") };
  }
}

export async function getPaymentReceiptAction(
  input: unknown,
): Promise<FinanceActionResult<PaymentReceiptDTO>> {
  try {
    const user = await requirePermission("finance:view");
    const { paymentId } = paymentIdSchema.parse(input);
    return { success: true, data: await getPaymentReceipt(user.companyId, paymentId) };
  } catch (error) {
    return { success: false, error: errorMessage(error, "Não foi possível carregar o recibo") };
  }
}
