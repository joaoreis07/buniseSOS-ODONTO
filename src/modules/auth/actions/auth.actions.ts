"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/shared/lib/auth";
import { loginSchema, registerSchema } from "../schemas/auth.schemas";
import { registerClinic } from "../services/auth.service";

export type AuthActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

function isFailedSignIn(result: unknown): boolean {
  if (typeof result !== "string") return true;
  return result.includes("/login") || result.includes("error=");
}

async function signInWithCredentials(
  email: string,
  password: string,
  invalidMessage: string,
): Promise<AuthActionResult> {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (isFailedSignIn(result)) {
      return { success: false, error: invalidMessage };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: invalidMessage };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível entrar",
    };
  }
}

export async function loginAction(input: unknown): Promise<AuthActionResult> {
  try {
    const data = loginSchema.parse(input);
    return signInWithCredentials(
      data.email,
      data.password,
      "E-mail ou senha inválidos",
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível entrar",
    };
  }
}

/** Login demo com redirect server-side (sem pedir senha na UI). */
export async function demoLoginAction(): Promise<void> {
  await signIn("credentials", {
    email: "admin@odonto.demo",
    password: "Demo@123456",
    redirectTo: "/app",
  });
}

export async function registerAction(input: unknown): Promise<AuthActionResult> {
  try {
    const data = registerSchema.parse(input);
    await registerClinic(data);
    const signedIn = await signInWithCredentials(
      data.email,
      data.password,
      "Conta criada, mas não foi possível entrar automaticamente.",
    );
    if (!signedIn.success) {
      return signedIn;
    }
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
