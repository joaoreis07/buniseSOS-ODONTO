"use client";

import { FileUp } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { SectionCard } from "@/shared/components/section-card";
import { toast } from "sonner";
import type { PatientClientDTO } from "../../dto/patient.dto";

export function PatientDocumentsTab({ patient }: { patient: PatientClientDTO }) {
  return (
    <SectionCard title="Documentos" description={`Arquivos clínicos de ${patient.fullName}.`}>
      <EmptyState
        icon={FileUp}
        title="Nenhum documento enviado"
        description="O upload será vinculado por patientId quando o módulo de arquivos for liberado."
        actionLabel="Enviar arquivo"
        onAction={() => toast.message("Upload de documentos será liberado no módulo Documentos.")}
      />
    </SectionCard>
  );
}
