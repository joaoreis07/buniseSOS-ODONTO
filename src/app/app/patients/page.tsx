import { Suspense } from "react";
import { PatientsView } from "@/modules/patients/components/patients-view";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { hasPermission } from "@/shared/lib/rbac";
import { requirePermission } from "@/shared/lib/session";

export default async function PatientsPage() {
  const user = await requirePermission("patients:view");
  const canManage = hasPermission(user.role, "patients:manage");
  const canManageClinical = hasPermission(user.role, "clinical_records:manage");

  return (
    <Suspense fallback={<PageSkeleton />}>
      <PatientsView canManage={canManage} canManageClinical={canManageClinical} />
    </Suspense>
  );
}
