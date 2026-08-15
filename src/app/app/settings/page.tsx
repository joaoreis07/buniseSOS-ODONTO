import { SettingsView } from "@/modules/settings/components/settings-view";
import { prisma } from "@/shared/lib/prisma";
import { hasPermission } from "@/shared/lib/rbac";
import { requirePermission } from "@/shared/lib/session";

export default async function SettingsPage() {
  const user = await requirePermission("settings:view");
  const company = await prisma.company.findFirst({
    where: { id: user.companyId, deletedAt: null },
    select: { name: true, plan: true },
  });

  return (
    <SettingsView
      companyName={company?.name ?? "Clínica"}
      plan={company?.plan ?? "STARTER"}
      canManage={hasPermission(user.role, "settings:manage")}
    />
  );
}
