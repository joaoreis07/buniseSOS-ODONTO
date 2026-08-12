import { redirect } from "next/navigation";
import { FinanceView } from "@/modules/finance/components/finance-view";
import { requirePermission } from "@/shared/lib/session";
import { getFeatureFlags } from "@/shared/services/feature-flags.service";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ patientId?: string; receivableId?: string }> }) {
  const user = await requirePermission("finance:view");
  if (!(await getFeatureFlags(user.companyId)).finance) redirect("/app");
  const { patientId, receivableId } = await searchParams;
  return <FinanceView patientId={patientId} receivableId={receivableId} />;
}
