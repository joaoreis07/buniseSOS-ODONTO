"use server";

import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/shared/lib/auth";
import { loginSchema, registerSchema } from "../schemas/auth.schemas";
import { registerClinic } from "../services/auth.service";

export type AuthActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

async function signInWithCredentials(
  email: string,
  password: string,
  invalidMessage: string,
): Promise<AuthActionResult> {
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    const session = await auth();
    if (!session?.user?.id) {
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

/** Acesso demo em um clique (conta do seed). */
export async function demoLoginAction(): Promise<AuthActionResult> {
  const result = await signInWithCredentials(
    "admin@odonto.demo",
    "Demo@123456",
    "Conta demo indisponível. Rode pnpm db:seed e tente de novo.",
  );

  if (result.success) {
    return { success: true, message: "Demonstração iniciada" };
  }

  return result;
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
