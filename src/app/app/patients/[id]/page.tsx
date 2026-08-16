import { Suspense } from "react";
import { PatientRecord } from "@/modules/patients/components/patient-record";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { hasPermission } from "@/shared/lib/rbac";
import { requirePermission } from "@/shared/lib/session";

export default async function PatientRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("patients:view");
  const { id } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <PatientRecord
        patientId={id}
        canManage={hasPermission(user.role, "patients:manage")}
        canManageClinical={hasPermission(user.role, "clinical_records:manage")}
        canManageOdontogram={hasPermission(user.role, "odontogram:manage")}
        canApprove={hasPermission(user.role, "budgets:approve")}
        canManageFinance={hasPermission(user.role, "finance:manage")}
      />
    </Suspense>
  );
}
