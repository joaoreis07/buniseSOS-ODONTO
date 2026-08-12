import { z } from "zod";

const money = z.coerce.number().min(0).max(9_999_999);
const tooth = z.coerce.number().int().min(11).max(88);

export const budgetItemSchema = z.object({
  id: z.string().cuid().optional(),
  procedureId: z.string().cuid().nullable().optional(),
  odontogramProcedureId: z.string().cuid().nullable().optional(),
  professionalId: z.string().cuid().nullable().optional(),
  description: z.string().trim().min(2, "Informe o procedimento").max(200),
  code: z.string().trim().max(50).nullable().optional(),
  teeth: z.array(tooth).max(52).default([]),
  quantity: z.coerce.number().positive().max(999),
  unitPrice: money,
  discount: money.default(0),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const saveBudgetSchema = z.object({
  id: z.string().cuid().optional(),
  patientId: z.string().cuid(),
  priceTableId: z.string().cuid().nullable().optional(),
  title: z.string().trim().min(2, "Informe um título").max(150),
  notes: z.string().trim().max(5000).nullable().optional(),
  discount: money.default(0),
  expectedUpdatedAt: z.string().datetime().optional(),
  items: z.array(budgetItemSchema).min(1, "Adicione pelo menos um procedimento"),
});

export const budgetIdSchema = z.object({ id: z.string().cuid(), expectedUpdatedAt: z.string().datetime().optional() });
export const partialApprovalSchema = budgetIdSchema.extend({
  items: z.array(z.object({ id: z.string().cuid(), status: z.enum(["APPROVED", "REJECTED"]) })).min(1),
});
export const patientBudgetSchema = z.object({ patientId: z.string().cuid() });
export const odontogramBudgetPrefillSchema = z.object({
  patientId: z.string().cuid(),
  procedureIds: z.array(z.string().cuid()).min(1),
});
