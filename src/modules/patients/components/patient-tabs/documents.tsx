"use client";

import { FileUp } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { toast } from "sonner";
import type { PatientClientDTO } from "../../dto/patient.dto";

export function PatientDocumentsTab({ patient }: { patient: PatientClientDTO }) {
  return (
    <EmptyState
      icon={FileUp}
      title="Documentos"
      description={`Upload preparado via StorageProvider. Arquivos de ${patient.fullName} serão vinculados por patientId.`}
      actionLabel="Enviar arquivo"
      onAction={() => toast.message("Upload de documentos será liberado no módulo Documentos.")}
    />
  );
}
