import { z } from "zod";

const tooth = z.coerce.number().int().min(11).max(88);
const money = z.coerce.number().min(0).max(9_999_999);

export const treatmentPlanItemInputSchema = z.object({
  id: z.string().cuid().optional(),
  procedureId: z.string().cuid().nullable().optional(),
  odontogramProcedureId: z.string().cuid().nullable().optional(),
  professionalId: z.string().cuid().nullable().optional(),
  code: z.string().trim().max(50).nullable().optional(),
  title: z.string().trim().min(2, "Informe o procedimento").max(200),
  teeth: z.array(tooth).max(52).default([]),
  quantity: z.coerce.number().positive().max(999).default(1),
  unitPrice: money.nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export const createTreatmentPlanSchema = z.object({
  patientId: z.string().cuid(),
  title: z.string().trim().min(2, "Informe um título").max(150),
  notes: z.string().trim().max(5000).nullable().optional(),
  responsibleProfessionalId: z.string().cuid().nullable().optional(),
  items: z.array(treatmentPlanItemInputSchema).min(1, "Adicione pelo menos um procedimento"),
});

export const updateTreatmentPlanSchema = z.object({
  id: z.string().cuid(),
  title: z.string().trim().min(2).max(150),
  notes: z.string().trim().max(5000).nullable().optional(),
  responsibleProfessionalId: z.string().cuid().nullable().optional(),
  expectedUpdatedAt: z.string().datetime(),
});

export const treatmentPlanIdSchema = z.object({
  id: z.string().cuid(),
  expectedUpdatedAt: z.string().datetime().optional(),
});

export const patientTreatmentPlanSchema = z.object({
  patientId: z.string().cuid(),
});

export const addTreatmentPlanItemSchema = z.object({
  id: z.string().cuid(),
  expectedUpdatedAt: z.string().datetime(),
  item: treatmentPlanItemInputSchema,
});

export const updateTreatmentPlanItemSchema = z.object({
  planId: z.string().cuid(),
  itemId: z.string().cuid(),
  expectedUpdatedAt: z.string().datetime(),
  item: treatmentPlanItemInputSchema,
});

export const changeTreatmentPlanItemStatusSchema = z.object({
  planId: z.string().cuid(),
  itemId: z.string().cuid(),
  status: z.enum(["PLANNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  expectedUpdatedAt: z.string().datetime(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export const removeTreatmentPlanItemSchema = z.object({
  planId: z.string().cuid(),
  itemId: z.string().cuid(),
  expectedUpdatedAt: z.string().datetime(),
});

export const odontogramPlanPrefillSchema = z.object({
  patientId: z.string().cuid(),
  procedureIds: z.array(z.string().cuid()).min(1),
  planId: z.string().cuid().optional(),
});

export const addOdontogramToPlanSchema = odontogramPlanPrefillSchema;

export const createBudgetFromPlanSchema = z.object({
  planId: z.string().cuid(),
  itemIds: z.array(z.string().cuid()).min(1),
  title: z.string().trim().min(2).max(150).optional(),
  priceTableId: z.string().cuid().nullable().optional(),
  expectedUpdatedAt: z.string().datetime(),
});
