"use server";

import { ZodError } from "zod";
import { requirePermission } from "@/shared/lib/session";
import { clinicPreferencesSchema, clinicProfileSchema } from "../schemas/settings.schemas";
import {
  getClinicSettings,
  updateClinicPreferences,
  updateClinicProfile,
  uploadClinicLogo,
} from "../services/settings.service";

export type SettingsActionResult<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

function message(error: unknown, fallback: string) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Dados inválidos";
  return error instanceof Error ? error.message : fallback;
}

export async function getClinicSettingsAction() {
  try {
    const user = await requirePermission("settings:view");
    const company = await getClinicSettings(user.companyId);
    return {
      success: true as const,
      data: {
        name: company.name,
        plan: company.plan,
        logo: company.logo,
        phone: company.phone,
        email: company.email,
        cnpj: company.cnpj,
        address: company.address,
        city: company.city,
        state: company.state,
        zipCode: company.zipCode,
        language: company.settings?.language ?? "pt-BR",
        timezone: company.settings?.timezone ?? "America/Sao_Paulo",
        dateFormat: company.settings?.dateFormat ?? "dd/MM/yyyy",
        currency: company.settings?.currency ?? "BRL",
        notifications: company.settings?.notifications ?? true,
      },
    };
  } catch (error) {
    return { success: false as const, error: message(error, "Não foi possível carregar as configurações") };
  }
}

export async function updateClinicProfileAction(input: unknown): Promise<SettingsActionResult> {
  try {
    const user = await requirePermission("settings:manage");
    await updateClinicProfile(user.companyId, clinicProfileSchema.parse(input));
    return { success: true, data: undefined, message: "Dados da clínica salvos" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível salvar os dados da clínica") };
  }
}

export async function updateClinicPreferencesAction(input: unknown): Promise<SettingsActionResult> {
  try {
    const user = await requirePermission("settings:manage");
    await updateClinicPreferences(user.companyId, clinicPreferencesSchema.parse(input));
    return { success: true, data: undefined, message: "Preferências salvas" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível salvar as preferências") };
  }
}

export async function uploadClinicLogoAction(formData: FormData): Promise<SettingsActionResult> {
  try {
    const user = await requirePermission("settings:manage");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Selecione uma imagem de logo" };
    }
    await uploadClinicLogo(user.companyId, {
      fileName: file.name,
      contentType: file.type || "image/png",
      data: Buffer.from(await file.arrayBuffer()),
    });
    return { success: true, data: undefined, message: "Logo atualizada" };
  } catch (error) {
    return { success: false, error: message(error, "Não foi possível enviar a logo") };
  }
}
