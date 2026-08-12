import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

const optionalPhone = optionalText.refine(
  (value) => !value || [10, 11].includes(onlyDigits(value).length),
  "Informe um telefone com DDD válido",
);

const optionalCep = optionalText.refine(
  (value) => !value || onlyDigits(value).length === 8,
  "CEP deve ter 8 dígitos",
);

const optionalBirthDate = optionalText.refine((value) => {
  if (!value) return true;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date <= new Date();
}, "Informe uma data de nascimento válida");

const optionalState = optionalText.refine(
  (value) => !value || /^[A-Za-z]{2}$/.test(value),
  "UF deve ter 2 letras",
);

export const patientGenderSchema = z.enum(["MALE", "FEMALE", "OTHER", "UNSPECIFIED"]);
export const maritalStatusSchema = z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"]);
export const bloodTypeSchema = z.enum([
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
  "O_POS",
  "O_NEG",
  "UNKNOWN",
]);

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let dig = (sum * 10) % 11;
  if (dig === 10) dig = 0;
  if (dig !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  dig = (sum * 10) % 11;
  if (dig === 10) dig = 0;
  return dig === Number(cpf[10]);
}

const cpfField = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || isValidCpf(value), "CPF inválido");

export const patientFormSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo"),
  preferredName: optionalText,
  birthDate: optionalBirthDate,
  gender: patientGenderSchema.optional().default("UNSPECIFIED"),
  cpf: cpfField,
  rg: optionalText,
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || z.string().email().safeParse(v).success, "E-mail inválido"),
  phone: optionalPhone,
  whatsapp: optionalPhone,
  maritalStatus: maritalStatusSchema.optional().or(z.literal("")),
  profession: optionalText,
  address: optionalText,
  number: optionalText,
  district: optionalText,
  city: optionalText,
  state: optionalState,
  zipCode: optionalCep,
  responsibleName: optionalText,
  responsiblePhone: optionalPhone,
  insurance: optionalText,
  insuranceNumber: optionalText,
  bloodType: bloodTypeSchema.optional().default("UNKNOWN"),
  allergies: optionalText,
  medicalNotes: optionalText,
  observations: optionalText,
  photoUrl: optionalText,
  isActive: z.boolean().optional().default(true),
});

export const createPatientSchema = patientFormSchema;

export const updatePatientSchema = patientFormSchema.partial().extend({
  id: z.string().min(1),
  fullName: z.string().trim().min(2, "Informe o nome completo").optional(),
});

export const patientListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE", "BLOCKED"]).optional().default("ALL"),
  city: z.string().trim().optional(),
  insurance: z.string().trim().optional(),
  hasUpcoming: z.boolean().optional(),
  missingReturn: z.boolean().optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(5).max(100).optional().default(20),
  sort: z
    .enum(["name_asc", "name_desc", "created_desc", "created_asc", "city_asc"])
    .optional()
    .default("name_asc"),
});

export const patientIdSchema = z.object({
  id: z.string().min(1),
});
