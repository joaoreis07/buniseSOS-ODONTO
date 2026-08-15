"use server";

import { ZodError } from "zod";
import type { ToothSurface } from "@prisma/client";
import { requirePermission } from "@/shared/lib/session";
import type { BudgetDTO, BudgetEditorDataDTO } from "../dto/budget.dto";
import { budgetIdSchema, odontogramBudgetPrefillSchema, partialApprovalSchema, patientBudgetSchema, saveBudgetSchema } from "../schemas/budget.schemas";
import { changeBudgetStatus, deleteBudget, getBudget, getBudgetEditorData, getOdontogramBudgetPrefill, listBudgets, partiallyApproveBudget, saveBudget } from "../services/budget.service";

export type BudgetActionResult<T = undefined> = { success: true; data: T; message?: string } | { success: false; error: string };
const message = (error: unknown, fallback: string) => error instanceof ZodError ? error.issues[0]?.message ?? "Dados inválidos" : error instanceof Error ? error.message : fallback;

export async function listBudgetsAction(input?: unknown): Promise<BudgetActionResult<BudgetDTO[]>> {
  try {
    const user = await requirePermission("budgets:view");
    const patientId = input ? patientBudgetSchema.parse(input).patientId : undefined;
    return { success: true, data: await listBudgets(user.companyId, patientId) };
  } catch (error) { return { success: false, error: message(error, "Não foi possível listar os orçamentos") }; }
}

export async function getBudgetAction(input: unknown): Promise<BudgetActionResult<BudgetDTO>> {
  try {
    const user = await requirePermission("budgets:view");
    return { success: true, data: await getBudget(user.companyId, budgetIdSchema.parse(input).id) };
  } catch (error) { return { success: false, error: message(error, "Não foi possível carregar o orçamento") }; }
}

export async function getBudgetEditorDataAction(input?: unknown): Promise<BudgetActionResult<BudgetEditorDataDTO>> {
  try {
    const user = await requirePermission("budgets:view");
    const id = input ? budgetIdSchema.parse(input).id : undefined;
    return { success: true, data: await getBudgetEditorData(user.companyId, id) };
  } catch (error) { return { success: false, error: message(error, "Não foi possível carregar o editor") }; }
}

export async function getOdontogramBudgetPrefillAction(input: unknown): Promise<BudgetActionResult<{ id: string; code: string; title: string; toothNumber: number; surfaces: ToothSurface[]; defaultPrice: string | null }[]>> {
  try {
    const user = await requirePermission("budgets:manage");
    const data = odontogramBudgetPrefillSchema.parse(input);
    return { success: true, data: await getOdontogramBudgetPrefill(user.companyId, data.patientId, data.procedureIds) };
  } catch (error) { return { success: false, error: message(error, "Não foi possível importar os procedimentos clínicos") }; }
}

export async function saveBudgetAction(input: unknown): Promise<BudgetActionResult<BudgetDTO>> {
  try {
    const user = await requirePermission("budgets:manage");
    const data = await saveBudget(user.companyId, user.id, saveBudgetSchema.parse(input));
    return { success: true, data, message: "Orçamento salvo" };
  } catch (error) { return { success: false, error: message(error, "Não foi possível salvar o orçamento") }; }
}

async function transition(input: unknown, status: "SENT" | "APPROVED" | "REJECTED" | "CANCELED" | "COMPLETED", permission: "budgets:manage" | "budgets:approve") {
  const user = await requirePermission(permission);
  const data = budgetIdSchema.parse(input);
  return changeBudgetStatus(user.companyId, user.id, data.id, status, data.expectedUpdatedAt);
}

export async function sendBudgetAction(input: unknown): Promise<BudgetActionResult<BudgetDTO>> {
  try { return { success: true, data: await transition(input, "SENT", "budgets:manage"), message: "Orçamento enviado" }; } catch (error) { return { success: false, error: message(error, "Não foi possível enviar") }; }
}
export async function approveBudgetAction(input: unknown): Promise<BudgetActionResult<BudgetDTO>> {
  try { return { success: true, data: await transition(input, "APPROVED", "budgets:approve"), message: "Orçamento aprovado" }; } catch (error) { return { success: false, error: message(error, "Não foi possível aprovar") }; }
}
export async function rejectBudgetAction(input: unknown): Promise<BudgetActionResult<BudgetDTO>> {
  try { return { success: true, data: await transition(input, "REJECTED", "budgets:approve"), message: "Orçamento recusado" }; } catch (error) { return { success: false, error: message(error, "Não foi possível recusar") }; }
}
export async function cancelBudgetAction(input: unknown): Promise<BudgetActionResult<BudgetDTO>> {
  try { return { success: true, data: await transition(input, "CANCELED", "budgets:manage"), message: "Orçamento cancelado" }; } catch (error) { return { success: false, error: message(error, "Não foi possível cancelar") }; }
}
export async function completeBudgetAction(input: unknown): Promise<BudgetActionResult<BudgetDTO>> {
  try { return { success: true, data: await transition(input, "COMPLETED", "budgets:manage"), message: "Orçamento concluído" }; } catch (error) { return { success: false, error: message(error, "Não foi possível concluir") }; }
}
export async function partiallyApproveBudgetAction(input: unknown): Promise<BudgetActionResult<BudgetDTO>> {
  try {
    const user = await requirePermission("budgets:approve");
    return { success: true, data: await partiallyApproveBudget(user.companyId, user.id, partialApprovalSchema.parse(input)), message: "Decisões registradas" };
  } catch (error) { return { success: false, error: message(error, "Não foi possível registrar as decisões") }; }
}

export async function deleteBudgetAction(input: unknown): Promise<BudgetActionResult> {
  try {
    const user = await requirePermission("budgets:delete");
    const data = budgetIdSchema.parse(input);
    await deleteBudget(user.companyId, user.id, data.id, data.expectedUpdatedAt);
    return { success: true, data: undefined, message: "Orçamento excluído" };
  } catch (error) { return { success: false, error: message(error, "Não foi possível excluir o orçamento") }; }
}
