"use server";

import { headers } from "next/headers";
import { ZodError } from "zod";
import { requirePermission } from "@/shared/lib/session";
import type { OdontogramDTO } from "../dto/odontogram.dto";
import { applyOdontogramChangesSchema, patientIdSchema } from "../schemas/odontogram.schemas";
import { applyOdontogramChanges, getOrCreateOdontogram } from "../services/odontogram.service";

export type OdontogramActionResult<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

async function requestMeta() {
  const headerStore = await headers();
  return {
    ip:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      null,
    userAgent: headerStore.get("user-agent"),
  };
}

function zodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos";
}

export async function getOdontogramAction(
  input: unknown,
): Promise<OdontogramActionResult<OdontogramDTO>> {
  try {
    const user = await requirePermission("odontogram:view");
    const { patientId } = patientIdSchema.parse(input);
    const data = await getOrCreateOdontogram({ companyId: user.companyId, patientId, userId: user.id });
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível carregar o odontograma",
    };
  }
}

export async function applyOdontogramChangesAction(
  input: unknown,
): Promise<OdontogramActionResult<OdontogramDTO>> {
  try {
    const user = await requirePermission("odontogram:manage");
    const data = applyOdontogramChangesSchema.parse(input);
    const meta = await requestMeta();
    const updated = await applyOdontogramChanges({
      companyId: user.companyId,
      userId: user.id,
      ...data,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { success: true, data: updated, message: "Alterações do odontograma salvas" };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, error: zodMessage(error) };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível salvar o odontograma",
    };
  }
}
