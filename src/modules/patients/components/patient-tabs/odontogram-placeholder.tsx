"use client";

import { OdontogramView } from "@/modules/odontogram/components/odontogram-view";
import type { PatientClientDTO } from "../../dto/patient.dto";

export function PatientOdontogramTab({
  patient,
  canManage,
}: {
  patient: PatientClientDTO;
  canManage: boolean;
}) {
  return <OdontogramView patientId={patient.id} canManage={canManage} embedded />;
}
