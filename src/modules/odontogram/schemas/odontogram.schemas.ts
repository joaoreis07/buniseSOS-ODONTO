import { z } from "zod";
import { ALL_FDI_TEETH, CONDITION_CATALOG } from "../utils/fdi-notation";

const toothNumberSchema = z
  .number()
  .int()
  .refine((value) => (ALL_FDI_TEETH as readonly number[]).includes(value), "Dente FDI inválido");

const toothNumbersSchema = z.array(toothNumberSchema).min(1, "Selecione ao menos um dente").max(52);
const surfaceSchema = z.enum([
  "MESIAL",
  "DISTAL",
  "OCCLUSAL",
  "VESTIBULAR",
  "LINGUAL",
  "INCISAL",
  "CERVICAL",
  "WHOLE",
]);
const phaseSchema = z.enum(["CURRENT", "PLANNED"]);
const statusSchema = z.enum(["ACTIVE", "IN_PROGRESS", "COMPLETED", "RESOLVED", "CANCELLED"]);

export const patientIdSchema = z.object({ patientId: z.string().min(1) });

const conditionMutationSchema = z.object({
  type: z.literal("condition"),
  id: z.string().min(1).optional(),
  toothNumbers: toothNumbersSchema,
  code: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(120),
  phase: phaseSchema,
  status: statusSchema,
  surfaces: z.array(surfaceSchema).max(8),
  notes: z.string().trim().max(4000).optional(),
});

const procedureMutationSchema = z.object({
  type: z.literal("procedure"),
  id: z.string().min(1).optional(),
  toothNumbers: toothNumbersSchema,
  conditionId: z.string().min(1).optional(),
  code: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(120),
  phase: phaseSchema,
  status: statusSchema,
  surfaces: z.array(surfaceSchema).max(8),
  notes: z.string().trim().max(4000).optional(),
});

const observationMutationSchema = z.object({
  type: z.literal("observation"),
  id: z.string().min(1).optional(),
  toothNumbers: toothNumbersSchema,
  body: z.string().trim().min(1, "Informe a observação").max(4000),
});

const removeMutationSchema = z.object({
  type: z.literal("remove"),
  target: z.enum(["condition", "procedure", "observation"]),
  id: z.string().min(1),
});

export const odontogramMutationSchema = z.discriminatedUnion("type", [
  conditionMutationSchema,
  procedureMutationSchema,
  observationMutationSchema,
  removeMutationSchema,
]);

export const applyOdontogramChangesSchema = z.object({
  patientId: z.string().min(1),
  expectedUpdatedAt: z.string().datetime(),
  changes: z.array(odontogramMutationSchema).min(1, "Não há alterações para salvar").max(100),
});

export const conditionCatalog = Object.keys(CONDITION_CATALOG);
