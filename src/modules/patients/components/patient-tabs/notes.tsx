"use client";

import { AlertTriangle, StickyNote } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { SectionCard } from "@/shared/components/section-card";
import type { PatientClientDTO } from "../../dto/patient.dto";

export function PatientNotesTab({ patient }: { patient: PatientClientDTO }) {
  if (!patient.observations && !patient.medicalNotes && !patient.allergies) {
    return (
      <EmptyState
        icon={StickyNote}
        title="Sem anotações"
        description="Observações clínicas e administrativas do paciente aparecerão nesta aba."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {patient.allergies ? (
        <SectionCard title="Alergias">
          <div className="flex gap-3 rounded-lg border border-[var(--danger-surface)] bg-[var(--danger-surface)]/70 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--danger-foreground)]" />
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{patient.allergies}</p>
          </div>
        </SectionCard>
      ) : null}
      {patient.medicalNotes ? (
        <SectionCard title="Notas médicas">
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{patient.medicalNotes}</p>
        </SectionCard>
      ) : null}
      {patient.observations ? (
        <SectionCard title="Observações">
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{patient.observations}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}
