import { redirect } from "next/navigation";
import { OdontogramView } from "@/modules/odontogram/components/odontogram-view";
import { hasPermission } from "@/shared/lib/rbac";
import { requirePermission } from "@/shared/lib/session";
import { getFeatureFlags } from "@/shared/services/feature-flags.service";

export default async function OdontogramPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const user = await requirePermission("odontogram:view");
  const flags = await getFeatureFlags(user.companyId);
  if (!flags.odontogram) redirect("/app");
  const params = await searchParams;

  return <OdontogramView patientId={params.patientId} canManage={hasPermission(user.role, "odontogram:manage")} />;
}
