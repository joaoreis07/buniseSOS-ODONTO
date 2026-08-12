import { prisma } from "@/shared/lib/prisma";
import { requirePermission } from "@/shared/lib/session";
import { DashboardOverview } from "@/modules/dashboard/components/dashboard-overview";

export default async function AppHomePage() {
  const user = await requirePermission("dashboard:view");
  const company = await prisma.company.findFirst({
    where: { id: user.companyId, deletedAt: null },
    select: { name: true },
  });

  return (
    <DashboardOverview
      userName={user.name}
      companyName={company?.name ?? "sua clínica"}
      role={user.role}
    />
  );
}
