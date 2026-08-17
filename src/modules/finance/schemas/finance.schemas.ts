import { z } from "zod";

const money = z.coerce.number().positive().max(9_999_999);

export const generateFromBudgetSchema = z.object({
  budgetId: z.string().cuid(),
  installmentCount: z.coerce.number().int().min(1).max(120),
  firstDueDate: z.string().datetime(),
  paymentMethod: z.enum(["PIX", "CASH", "CARD_CREDIT", "CARD_DEBIT", "BOLETO", "TRANSFER", "OTHER"]),
  entryAmount: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(5000).nullable().optional(),
});

export const registerPaymentSchema = z.object({
  installmentId: z.string().cuid(),
  amount: money,
  method: z.enum(["PIX", "CASH", "CARD_CREDIT", "CARD_DEBIT", "BOLETO", "TRANSFER", "OTHER"]),
  paidAt: z.string().datetime(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const financeIdSchema = z.object({ id: z.string().cuid(), expectedUpdatedAt: z.string().datetime().optional() });
export const paymentIdSchema = z.object({ paymentId: z.string().cuid() });
export const patientReceiptsSchema = z.object({ patientId: z.string().cuid() });
export const financeDashboardSchema = z.object({
  patientId: z.string().cuid().optional(),
  receivableId: z.string().cuid().optional(),
}).optional();
