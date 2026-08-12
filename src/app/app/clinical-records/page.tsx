import { redirect } from "next/navigation";
import { ClinicalRecordsView } from "@/modules/clinical-records/components/clinical-records-view";
import { getFeatureFlags } from "@/shared/services/feature-flags.service";
import { hasPermission } from "@/shared/lib/rbac";
import { requirePermission } from "@/shared/lib/session";

export default async function ClinicalRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{
    patientId?: string;
    appointmentId?: string;
    planItemId?: string;
    newEvolution?: string;
  }>;
}) {
  const user = await requirePermission("clinical_records:view");
  const flags = await getFeatureFlags(user.companyId);
  if (!flags.clinical_records) redirect("/app");
  const params = await searchParams;
  return (
    <ClinicalRecordsView
      initialPatientId={params.patientId}
      initialAppointmentId={params.appointmentId}
      initialPlanItemId={params.planItemId}
      openEvolutionForm={params.newEvolution === "1"}
      canManageRecords={hasPermission(user.role, "clinical_records:manage")}
      canDeleteRecords={hasPermission(user.role, "clinical_records:delete")}
      canManageAnamnesis={hasPermission(user.role, "anamnesis:manage")}
    />
  );
}
