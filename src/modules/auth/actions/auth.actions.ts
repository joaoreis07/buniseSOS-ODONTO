"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/shared/lib/auth";
import { loginSchema, registerSchema } from "../schemas/auth.schemas";
import { registerClinic } from "../services/auth.service";

export type AuthActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

export async function loginAction(input: unknown): Promise<AuthActionResult> {
  try {
    const data = loginSchema.parse(input);
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "E-mail ou senha inválidos" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível entrar",
    };
  }
}

export async function registerAction(input: unknown): Promise<AuthActionResult> {
  try {
    const data = registerSchema.parse(input);
    await registerClinic(data);
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    return { success: true, message: "Clínica criada com sucesso" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível criar a conta",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
