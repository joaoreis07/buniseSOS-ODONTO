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

/** Acesso demo em um clique (conta do seed). */
export async function demoLoginAction(): Promise<AuthActionResult> {
  try {
    await signIn("credentials", {
      email: "admin@odonto.demo",
      password: "Demo@123456",
      redirect: false,
    });
    return { success: true, message: "Demonstração iniciada" };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Conta demo indisponível. Rode pnpm db:seed e tente de novo.",
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível abrir a demonstração",
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
