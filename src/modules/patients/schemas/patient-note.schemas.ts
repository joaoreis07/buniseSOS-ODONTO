import { z } from "zod";

export const patientNoteTypeSchema = z.enum(["CLINICAL", "ADMIN", "ALERT"]);

export const listPatientNotesSchema = z.object({
  patientId: z.string().cuid(),
  includeArchived: z.boolean().optional(),
});

export const createPatientNoteSchema = z.object({
  patientId: z.string().cuid(),
  type: patientNoteTypeSchema.default("CLINICAL"),
  body: z.string().trim().min(1, "Informe a anotação").max(8000),
});

export const updatePatientNoteSchema = z.object({
  id: z.string().cuid(),
  type: patientNoteTypeSchema.optional(),
  body: z.string().trim().min(1, "Informe a anotação").max(8000).optional(),
});

export const patientNoteIdSchema = z.object({
  id: z.string().cuid(),
});
