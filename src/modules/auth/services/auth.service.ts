import bcrypt from "bcryptjs";
import { prisma } from "@/shared/lib/prisma";
import type { RegisterInput } from "../schemas/auth.schemas";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getPrimaryMembership(userId: string) {
  return prisma.membership.findFirst({
    where: { userId, deletedAt: null, company: { deletedAt: null } },
    orderBy: { createdAt: "asc" },
  });
}

export async function registerClinic(input: RegisterInput) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (existing) {
    throw new Error("Este e-mail já está em uso");
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: input.companyName,
        settings: { create: {} },
        featureFlags: {
          create: [
            { feature: "agenda", enabled: true },
            { feature: "patients", enabled: true },
            { feature: "odontogram", enabled: true },
            { feature: "treatments", enabled: true },
            { feature: "budgets", enabled: true },
            { feature: "finance", enabled: true },
            { feature: "documents", enabled: true },
            { feature: "reports", enabled: false },
            { feature: "inventory", enabled: false },
            { feature: "admin", enabled: true },
          ],
        },
      },
    });

    const user = await tx.user.create({
      data: {
        name: input.name,
        email,
        passwordHash,
        emailVerified: new Date(),
        memberships: {
          create: {
            companyId: company.id,
            role: "ADMIN",
          },
        },
      },
    });

    return { user, company };
  });
}
