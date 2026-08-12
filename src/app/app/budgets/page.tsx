import { redirect } from "next/navigation";
import { BudgetsView } from "@/modules/budgets/components/budgets-view";
import { getFeatureFlags } from "@/shared/services/feature-flags.service";
import { hasPermission } from "@/shared/lib/rbac";
import { requirePermission } from "@/shared/lib/session";

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ patientId?: string; teeth?: string; procedureIds?: string }> }) {
  const user = await requirePermission("budgets:view");
  const flags = await getFeatureFlags(user.companyId);
  if (!flags.budgets) redirect("/app");
  const { patientId, teeth, procedureIds } = await searchParams;
  return <BudgetsView patientId={patientId} prefilledTeeth={teeth} prefilledProcedureIds={procedureIds} canManage={hasPermission(user.role, "budgets:manage")} canApprove={hasPermission(user.role, "budgets:approve")} canManageFinance={hasPermission(user.role, "finance:manage")} />;
}
