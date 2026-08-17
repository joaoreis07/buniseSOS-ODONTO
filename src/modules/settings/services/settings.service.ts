import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/prisma";
import { assertTenantId } from "@/shared/lib/tenant";
import { getStorage } from "@/shared/lib/storage";
import type { z } from "zod";
import type { clinicPreferencesSchema, clinicProfileSchema } from "../schemas/settings.schemas";

type ClinicProfileInput = z.infer<typeof clinicProfileSchema>;
type ClinicPreferencesInput = z.infer<typeof clinicPreferencesSchema>;

function emptyToNull(value?: string | null) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function getClinicSettings(companyId: string) {
  assertTenantId(companyId);
  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    include: { settings: true },
  });
  if (!company) throw new Error("Clínica não encontrada");
  if (!company.settings) {
    const settings = await prisma.companySettings.create({ data: { companyId } });
    return { ...company, settings };
  }
  return company;
}

export async function updateClinicProfile(
  companyId: string,
  input: ClinicProfileInput,
) {
  assertTenantId(companyId);
  const updated = await prisma.company.updateMany({
    where: { id: companyId, deletedAt: null },
    data: {
      name: input.name.trim(),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email)?.toLowerCase() ?? null,
      cnpj: emptyToNull(input.cnpj),
      address: emptyToNull(input.address),
      city: emptyToNull(input.city),
      state: emptyToNull(input.state)?.toUpperCase() ?? null,
      zipCode: emptyToNull(input.zipCode),
    },
  });
  if (!updated.count) throw new Error("Clínica não encontrada");
  await prisma.auditLog.create({
    data: { companyId, module: "settings", action: "update_profile", entity: "Company", entityId: companyId },
  });
  revalidatePath("/app/settings");
  revalidatePath("/app");
  return getClinicSettings(companyId);
}

export async function updateClinicPreferences(
  companyId: string,
  input: ClinicPreferencesInput,
) {
  assertTenantId(companyId);
  await prisma.companySettings.upsert({
    where: { companyId },
    update: {
      language: input.language,
      timezone: input.timezone,
      dateFormat: input.dateFormat,
      currency: input.currency,
      notifications: input.notifications,
    },
    create: {
      companyId,
      language: input.language,
      timezone: input.timezone,
      dateFormat: input.dateFormat,
      currency: input.currency,
      notifications: input.notifications,
    },
  });
  await prisma.auditLog.create({
    data: { companyId, module: "settings", action: "update_preferences", entity: "CompanySettings", entityId: companyId },
  });
  revalidatePath("/app/settings");
  return getClinicSettings(companyId);
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]);

export async function uploadClinicLogo(
  companyId: string,
  file: { fileName: string; contentType: string; data: Buffer },
) {
  assertTenantId(companyId);
  if (file.data.byteLength > MAX_LOGO_BYTES) {
    throw new Error("A logo deve ter no máximo 2 MB");
  }
  if (!LOGO_TYPES.has(file.contentType) && !file.contentType.startsWith("image/")) {
    throw new Error("Envie uma imagem PNG, JPG ou WEBP");
  }
  const stored = await getStorage().upload({
    fileName: file.fileName,
    contentType: file.contentType,
    data: file.data,
    folder: `${companyId}/branding`,
  });
  const current = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: { logo: true },
  });
  await prisma.company.updateMany({
    where: { id: companyId, deletedAt: null },
    data: { logo: stored.key },
  });
  await prisma.auditLog.create({
    data: { companyId, module: "settings", action: "update_logo", entity: "Company", entityId: companyId },
  });
  revalidatePath("/app/settings");
  revalidatePath("/app");
  return { key: stored.key, previousKey: current?.logo ?? null };
}

export async function getClinicLogo(companyId: string) {
  assertTenantId(companyId);
  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: { logo: true },
  });
  return company?.logo ?? null;
}
