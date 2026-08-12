"use client";

import { StickyNote } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import type { PatientClientDTO } from "../../dto/patient.dto";

export function PatientNotesTab({ patient }: { patient: PatientClientDTO }) {
  if (patient.observations || patient.medicalNotes || patient.allergies) {
    return (
      <div className="space-y-3 text-sm">
        {patient.allergies && (
          <NoteCard title="Alergias" body={patient.allergies} tone="rose" />
        )}
        {patient.medicalNotes && (
          <NoteCard title="Notas médicas" body={patient.medicalNotes} />
        )}
        {patient.observations && (
          <NoteCard title="Observações" body={patient.observations} />
        )}
      </div>
    );
  }

  return (
    <EmptyState
      icon={StickyNote}
      title="Sem anotações"
      description="Observações clínicas e administrativas do paciente aparecerão nesta aba."
    />
  );
}

function NoteCard({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone?: "rose";
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === "rose" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-border bg-muted/30"
      }`}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] opacity-70">{title}</p>
      <p className="mt-2 whitespace-pre-wrap leading-6">{body}</p>
    </div>
  );
}
