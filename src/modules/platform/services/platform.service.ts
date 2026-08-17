import { prisma } from "@/shared/lib/prisma";
import { isPlatformAdmin } from "@/shared/lib/session";

export async function getPlatformOverview(userId: string) {
  if (!(await isPlatformAdmin(userId))) {
    throw new Error("Acesso restrito à administração da plataforma");
  }

  const [clinics, users, memberships] = await Promise.all([
    prisma.company.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        city: true,
        state: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            memberships: { where: { deletedAt: null } },
            patients: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        isPlatformAdmin: true,
        createdAt: true,
        memberships: {
          where: { deletedAt: null },
          select: {
            role: true,
            company: { select: { id: true, name: true, plan: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membership.count({ where: { deletedAt: null } }),
  ]);

  return {
    summary: {
      clinics: clinics.length,
      users: users.length,
      memberships,
      starterClinics: clinics.filter((item) => item.plan === "STARTER").length,
    },
    clinics,
    users,
  };
}
