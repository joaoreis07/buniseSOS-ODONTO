import { redirect } from "next/navigation";
import { signIn } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import {
  getPrimaryMembership,
  verifyPassword,
} from "@/modules/auth/services/auth.service";

export const runtime = "nodejs";

const DEMO_EMAIL = "admin@odonto.demo";
const DEMO_PASSWORD = "Demo@123456";

export async function GET() {
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

  await signIn("credentials", {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    redirectTo: "/app",
  });
}
