import { z } from "zod";

const anamnesisFieldsSchema = z.object({
  allergies: z.string().max(5000).nullable().optional(),
  medications: z.string().max(5000).nullable().optional(),
  diseases: z.string().max(5000).nullable().optional(),
  surgeries: z.string().max(5000).nullable().optional(),
  medicalHistory: z.string().max(5000).nullable().optional(),
  dentalHistory: z.string().max(5000).nullable().optional(),
  observations: z.string().max(5000).nullable().optional(),
  smoking: z.string().max(500).nullable().optional(),
  alcoholUse: z.string().max(500).nullable().optional(),
  oralHygiene: z.string().max(500).nullable().optional(),
  parafunctionalHabits: z.string().max(2000).nullable().optional(),
  otherHabits: z.string().max(2000).nullable().optional(),
});

const toothSurface = z.enum([
  "MESIAL",
  "DISTAL",
  "OCCLUSAL",
  "VESTIBULAR",
  "LINGUAL",
  "INCISAL",
  "CERVICAL",
  "WHOLE",
]);

const toothRef = z.object({
  toothNumber: z.coerce.number().int().min(11).max(85),
  surfaces: z.array(toothSurface).max(8).default([]),
});

export const patientClinicalRecordSchema = z.object({
  patientId: z.string().cuid(),
});

export const upsertAnamnesisSchema = anamnesisFieldsSchema.extend({
  patientId: z.string().cuid(),
  expectedUpdatedAt: z.string().datetime().optional(),
});

export const createEvolutionSchema = z.object({
  patientId: z.string().cuid(),
  professionalId: z.string().cuid().nullable().optional(),
  appointmentId: z.string().cuid().nullable().optional(),
  treatmentPlanItemId: z.string().cuid().nullable().optional(),
  procedureId: z.string().cuid().nullable().optional(),
  title: z.string().min(1, "Informe o título").max(200),
  description: z.string().min(1, "Descreva a evolução").max(10000),
  notes: z.string().max(5000).nullable().optional(),
  occurredAt: z.string().datetime().optional(),
  teeth: z.array(toothRef).max(32).default([]),
});

export const updateEvolutionSchema = createEvolutionSchema
  .omit({ patientId: true })
  .extend({
    id: z.string().cuid(),
    expectedUpdatedAt: z.string().datetime(),
  });

export const evolutionIdSchema = z.object({
  id: z.string().cuid(),
  expectedUpdatedAt: z.string().datetime().optional(),
});

export const attachmentTypeSchema = z.enum(["DOCUMENT", "EXAM", "OTHER"]);

export const attachmentCategorySchema = z.enum([
  "document",
  "exam",
  "radiography",
  "panoramic",
  "tomography",
  "photo",
  "contract",
  "budget",
  "receipt",
  "other",
]);

export const createAttachmentSchema = z.object({
  patientId: z.string().cuid(),
  evolutionId: z.string().cuid().nullable().optional(),
  professionalId: z.string().cuid().nullable().optional(),
  type: attachmentTypeSchema.default("DOCUMENT"),
  category: attachmentCategorySchema.optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  occurredAt: z.string().datetime().nullable().optional(),
  fileKey: z.string().max(500).nullable().optional(),
  fileName: z.string().max(255).nullable().optional(),
  contentType: z.string().max(120).nullable().optional(),
  fileSize: z.number().int().positive().nullable().optional(),
});

export const listAttachmentsSchema = z.object({
  patientId: z.string().cuid(),
  type: attachmentTypeSchema.optional(),
});

export const attachmentIdSchema = z.object({
  id: z.string().cuid(),
});

export function parseTeethInput(input: string): number[] {
  return input
    .split(/[,;\s]+/)
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 11 && n <= 85);
}
