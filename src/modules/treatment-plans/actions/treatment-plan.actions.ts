"use server";

import { ZodError, z } from "zod";
import type { ToothSurface } from "@prisma/client";
import { requirePermission } from "@/shared/lib/session";
import type { TreatmentPlanDTO, TreatmentPlanEditorDataDTO } from "../dto/treatment-plan.dto";
import {
  addOdontogramToPlanSchema,
  addTreatmentPlanItemSchema,
  changeTreatmentPlanItemStatusSchema,
  createBudgetFromPlanSchema,
  createTreatmentPlanSchema,
  odontogramPlanPrefillSchema,
  patientTreatmentPlanSchema,
  removeTreatmentPlanItemSchema,
  treatmentPlanIdSchema,
  updateTreatmentPlanItemSchema,
  updateTreatmentPlanSchema,
} from "../schemas/treatment-plan.schemas";
import {
  addOdontogramProceduresToPlan,
  addTreatmentPlanItem,
  cancelTreatmentPlan,
  changeTreatmentPlanItemStatus,
  createBudgetFromPlan,
  createTreatmentPlan,
  deleteTreatmentPlan,
  getOdontogramPlanPrefill,
  getTreatmentPlan,
  getTreatmentPlanEditorData,
  listTreatmentPlans,
  removeTreatmentPlanItem,
  updateTreatmentPlan,
  updateTreatmentPlanItem,
} from "../services/treatment-plan.service";

export type TreatmentPlanActionResult<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

const message = (error: unknown, fallback: string) =>
  error instanceof ZodError
    ? (error.issues[0]?.message ?? "Dados inválidos")
    : error instanceof Error
      ? error.message
      : fallback;

const editorQuerySchema = z.object({
  id: z.string().cuid().optional(),
  patientId: z.string().cuid().optional(),
});

export async function listTreatmentPlansAction(
  input?: unknown,
): Promise<TreatmentPlanActionResult<TreatmentPlanDTO[]>> {
  try {
    const user = await requirePermission("treatment_plans:view");
    const patientId = input ? patientTreatmentPlanSchema.parse(input).patientId : undefined;
    return { success: true, data: await listTreatmentPlans(user.companyId, patientId) };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível listar os planos") };
  }
}

export async function getTreatmentPlanAction(
  input: unknown,
): Promise<TreatmentPlanActionResult<TreatmentPlanDTO>> {
  try {
    const user = await requirePermission("treatment_plans:view");
    return { success: true, data: await getTreatmentPlan(user.companyId, treatmentPlanIdSchema.parse(input).id) };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível carregar o plano") };
  }
}

export async function getTreatmentPlanEditorDataAction(
  input?: unknown,
): Promise<TreatmentPlanActionResult<TreatmentPlanEditorDataDTO>> {
  try {
    const user = await requirePermission("treatment_plans:view");
    const parsed = input ? editorQuerySchema.parse(input) : {};
    return {
      success: true,
      data: await getTreatmentPlanEditorData(user.companyId, parsed.id, parsed.patientId),
    };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível carregar o editor") };
  }
}

export async function getOdontogramPlanPrefillAction(
  input: unknown,
): Promise<
  TreatmentPlanActionResult<
    {
      id: string;
      code: string;
      title: string;
      toothNumber: number;
      surfaces: ToothSurface[];
      professionalId: string | null;
      defaultPrice: string | null;
    }[]
  >
> {
  try {
    const user = await requirePermission("treatment_plans:manage");
    const data = odontogramPlanPrefillSchema.parse(input);
    return { success: true, data: await getOdontogramPlanPrefill(user.companyId, data.patientId, data.procedureIds) };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível importar procedimentos clínicos") };
  }
}

export async function createTreatmentPlanAction(
  input: unknown,
): Promise<TreatmentPlanActionResult<TreatmentPlanDTO>> {
  try {
    const user = await requirePermission("treatment_plans:manage");
    const data = await createTreatmentPlan(user.companyId, user.id, createTreatmentPlanSchema.parse(input));
    return { success: true, data, message: "Plano de tratamento criado" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível criar o plano") };
  }
}

export async function updateTreatmentPlanAction(
  input: unknown,
): Promise<TreatmentPlanActionResult<TreatmentPlanDTO>> {
  try {
    const user = await requirePermission("treatment_plans:manage");
    const data = await updateTreatmentPlan(user.companyId, user.id, updateTreatmentPlanSchema.parse(input));
    return { success: true, data, message: "Plano atualizado" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível atualizar o plano") };
  }
}

export async function addTreatmentPlanItemAction(
  input: unknown,
): Promise<TreatmentPlanActionResult<TreatmentPlanDTO>> {
  try {
    const user = await requirePermission("treatment_plans:manage");
    const data = await addTreatmentPlanItem(user.companyId, user.id, addTreatmentPlanItemSchema.parse(input));
    return { success: true, data, message: "Procedimento adicionado" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível adicionar o procedimento") };
  }
}

export async function updateTreatmentPlanItemAction(
  input: unknown,
): Promise<TreatmentPlanActionResult<TreatmentPlanDTO>> {
  try {
    const user = await requirePermission("treatment_plans:manage");
    const data = await updateTreatmentPlanItem(user.companyId, user.id, updateTreatmentPlanItemSchema.parse(input));
    return { success: true, data, message: "Procedimento atualizado" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível atualizar o procedimento") };
  }
}

export async function changeTreatmentPlanItemStatusAction(
  input: unknown,
): Promise<TreatmentPlanActionResult<TreatmentPlanDTO>> {
  try {
    const user = await requirePermission("treatment_plans:manage");
    const data = await changeTreatmentPlanItemStatus(
      user.companyId,
      user.id,
      changeTreatmentPlanItemStatusSchema.parse(input),
    );
    return { success: true, data, message: "Status atualizado" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível alterar o status") };
  }
}

export async function removeTreatmentPlanItemAction(
  input: unknown,
): Promise<TreatmentPlanActionResult<TreatmentPlanDTO>> {
  try {
    const user = await requirePermission("treatment_plans:manage");
    const data = await removeTreatmentPlanItem(user.companyId, user.id, removeTreatmentPlanItemSchema.parse(input));
    return { success: true, data, message: "Procedimento removido" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível remover o procedimento") };
  }
}

export async function cancelTreatmentPlanAction(
  input: unknown,
): Promise<TreatmentPlanActionResult<TreatmentPlanDTO>> {
  try {
    const user = await requirePermission("treatment_plans:manage");
    const data = treatmentPlanIdSchema.extend({ expectedUpdatedAt: z.string().datetime() }).parse(input);
    const plan = await cancelTreatmentPlan(user.companyId, user.id, data.id, data.expectedUpdatedAt);
    return { success: true, data: plan, message: "Plano cancelado" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível cancelar o plano") };
  }
}

export async function deleteTreatmentPlanAction(input: unknown): Promise<TreatmentPlanActionResult> {
  try {
    const user = await requirePermission("treatment_plans:delete");
    const data = treatmentPlanIdSchema.parse(input);
    await deleteTreatmentPlan(user.companyId, user.id, data.id, data.expectedUpdatedAt);
    return { success: true, data: undefined, message: "Plano excluído" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível excluir o plano") };
  }
}

export async function addOdontogramToPlanAction(
  input: unknown,
): Promise<TreatmentPlanActionResult<TreatmentPlanDTO>> {
  try {
    const user = await requirePermission("treatment_plans:manage");
    const data = addOdontogramToPlanSchema.parse(input);
    const plan = await addOdontogramProceduresToPlan(
      user.companyId,
      user.id,
      data.patientId,
      data.procedureIds,
      data.planId,
    );
    return { success: true, data: plan, message: "Procedimentos adicionados ao plano" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível adicionar ao plano") };
  }
}

export async function createBudgetFromPlanAction(
  input: unknown,
): Promise<TreatmentPlanActionResult<{ budgetId: string; plan: TreatmentPlanDTO }>> {
  try {
    const user = await requirePermission("treatment_plans:manage");
    const data = await createBudgetFromPlan(user.companyId, user.id, createBudgetFromPlanSchema.parse(input));
    return { success: true, data, message: "Orçamento criado a partir do plano" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível criar o orçamento") };
  }
}
