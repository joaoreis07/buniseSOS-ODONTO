import { z } from "zod";

export const clinicProfileSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da clínica").max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z
    .string()
    .trim()
    .max(180)
    .optional()
    .nullable()
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "E-mail inválido"),
  cnpj: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  zipCode: z.string().trim().max(12).optional().nullable(),
});

export const clinicPreferencesSchema = z.object({
  language: z.string().min(2).max(12),
  timezone: z.string().min(3).max(60),
  dateFormat: z.string().min(4).max(20),
  currency: z.string().min(3).max(8),
  notifications: z.boolean(),
});
