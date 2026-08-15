import { AppShell } from "@/modules/app-shell/components/app-shell";
import { prisma } from "@/shared/lib/prisma";
import { getFeatureFlags } from "@/shared/services/feature-flags.service";
import { getUserInitials, requireSession } from "@/shared/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();
  const [flags, company] = await Promise.all([
    getFeatureFlags(user.companyId),
    prisma.company.findFirst({
      where: { id: user.companyId, deletedAt: null },
      select: { plan: true },
    }),
  ]);

  return (
    <AppShell
      role={user.role}
      flags={flags}
      userInitials={getUserInitials(user.name, user.email)}
      userName={user.name}
      plan={company?.plan ?? "STARTER"}
    >
      {children}
    </AppShell>
  );
}
