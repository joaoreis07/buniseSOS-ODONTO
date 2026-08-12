import { redirect } from "next/navigation";
import { TreatmentPlansView } from "@/modules/treatment-plans/components/treatment-plans-view";
import { getFeatureFlags } from "@/shared/services/feature-flags.service";
import { hasPermission } from "@/shared/lib/rbac";
import { requirePermission } from "@/shared/lib/session";

export default async function TreatmentPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; planId?: string; procedureIds?: string }>;
}) {
  const user = await requirePermission("treatment_plans:view");
  const flags = await getFeatureFlags(user.companyId);
  if (!flags.treatments) redirect("/app");
  const { patientId, planId, procedureIds } = await searchParams;
  return (
    <TreatmentPlansView
      patientId={patientId}
      planId={planId}
      prefilledProcedureIds={procedureIds}
      canManage={hasPermission(user.role, "treatment_plans:manage")}
      canDelete={hasPermission(user.role, "treatment_plans:delete")}
      canCreateBudget={hasPermission(user.role, "budgets:manage")}
    />
  );
}
