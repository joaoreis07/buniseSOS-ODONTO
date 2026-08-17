import { AppShell } from "@/modules/app-shell/components/app-shell";
import { getShellAlerts } from "@/modules/dashboard/services/dashboard.service";
import { prisma } from "@/shared/lib/prisma";
import { hasPermission } from "@/shared/lib/rbac";
import { getFeatureFlags } from "@/shared/services/feature-flags.service";
import { getUserInitials, isPlatformAdmin, requireSession } from "@/shared/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();
  const [flags, company, platformAdmin] = await Promise.all([
    getFeatureFlags(user.companyId),
    prisma.company.findFirst({
      where: { id: user.companyId, deletedAt: null },
      select: { plan: true, name: true },
    }),
    isPlatformAdmin(user.id),
  ]);

  const alerts = await getShellAlerts(user.companyId, {
    patients: Boolean(flags.patients) && hasPermission(user.role, "patients:view"),
    finance: Boolean(flags.finance) && hasPermission(user.role, "finance:view"),
  });

  return (
    <AppShell
      role={user.role}
      flags={flags}
      userInitials={getUserInitials(user.name, user.email)}
      userName={user.name}
      plan={company?.plan ?? "STARTER"}
      companyName={company?.name ?? "Clínica"}
      isPlatformAdmin={platformAdmin}
      alerts={alerts}
    >
      {children}
    </AppShell>
  );
}
