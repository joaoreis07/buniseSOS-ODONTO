"use client";

import { PatientExamsTab as FilesExamsTab } from "./documents";
import type { PatientClientDTO } from "../../dto/patient.dto";

export function PatientExamsTab({
  patient,
  canManage,
}: {
  patient: PatientClientDTO;
  canManage: boolean;
}) {
  return <FilesExamsTab patient={patient} canManage={canManage} />;
}
