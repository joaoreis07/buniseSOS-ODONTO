import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { encode } from "next-auth/jwt";
import { prisma } from "@/shared/lib/prisma";
import {
  getPrimaryMembership,
  verifyPassword,
} from "@/modules/auth/services/auth.service";

export const runtime = "nodejs";

const DEMO_EMAIL = "admin@odonto.demo";
const DEMO_PASSWORD = "Demo@123456";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

export async function GET() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("[demo] AUTH_SECRET ausente");
    redirect("/login?error=DemoUnavailable");
  }

  const user = await prisma.user.findFirst({
    where: { email: DEMO_EMAIL, deletedAt: null },
  });

  if (!user?.passwordHash) {
    console.error("[demo] conta demo não encontrada no banco");
    redirect("/login?error=DemoUnavailable");
  }

  const valid = await verifyPassword(DEMO_PASSWORD, user.passwordHash);
  if (!valid) {
    console.error("[demo] senha demo inválida no banco");
    redirect("/login?error=DemoUnavailable");
  }

  const membership = await getPrimaryMembership(user.id);
  if (!membership) {
    console.error("[demo] membership demo ausente");
    redirect("/login?error=DemoUnavailable");
  }

  const cookieName = sessionCookieName();
  const sessionToken = await encode({
    token: {
      sub: user.id,
      name: user.name,
      email: user.email,
      companyId: membership.companyId,
      role: membership.role,
      emailVerified: user.emailVerified,
    },
    secret,
    salt: cookieName,
    maxAge: SESSION_MAX_AGE,
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/app");
}
