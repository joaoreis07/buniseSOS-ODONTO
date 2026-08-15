import { ReportsView } from "@/modules/reports/components/reports-view";
import { getDashboardOverview } from "@/modules/dashboard/services/dashboard.service";
import { hasPermission } from "@/shared/lib/rbac";
import { requirePermission } from "@/shared/lib/session";
import { getFeatureFlags } from "@/shared/services/feature-flags.service";

export default async function ReportsPage() {
  const user = await requirePermission("reports:view");
  const flags = await getFeatureFlags(user.companyId);
  const data = await getDashboardOverview(user.companyId, {
    patients: flags.patients && hasPermission(user.role, "patients:view"),
    agenda: flags.agenda && hasPermission(user.role, "agenda:view"),
    budgets: flags.budgets && hasPermission(user.role, "budgets:view"),
    finance: flags.finance && hasPermission(user.role, "finance:view"),
  });

  return <ReportsView data={data} />;
}
