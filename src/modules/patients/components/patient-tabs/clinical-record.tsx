"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NotebookPen, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { getClinicalRecordAction } from "@/modules/clinical-records/actions/clinical-record.actions";
import type { ClinicalRecordDTO } from "@/modules/clinical-records/dto/clinical-record.dto";
import type { PatientClientDTO } from "../../dto/patient.dto";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function PatientClinicalRecordTab({
  patient,
  canManage,
}: {
  patient: PatientClientDTO;
  canManage: boolean;
}) {
  const [record, setRecord] = useState<ClinicalRecordDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getClinicalRecordAction({ patientId: patient.id }).then((result) => {
      if (result.success) setRecord(result.data);
      setLoading(false);
    });
  }, [patient.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Prontuário Clínico</p>
          <p className="text-sm text-muted-foreground">Anamnese, evoluções e histórico.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-lg">
            <Link href={`/app/clinical-records?patientId=${patient.id}`}>
              <NotebookPen className="mr-1 size-3.5" />
              Abrir prontuário
            </Link>
          </Button>
          {canManage && (
            <Button asChild size="sm" className="rounded-lg">
              <Link href={`/app/clinical-records?patientId=${patient.id}&newEvolution=1`}>
                <Plus className="mr-1 size-3.5" />
                Nova evolução
              </Link>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando prontuário...</p>
      ) : !record ? (
        <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          Prontuário ainda não iniciado para este paciente.
        </div>
      ) : (
        <>
          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Anamnese</p>
            {record.anamnesis ? (
              <div className="mt-2 space-y-1 text-sm">
                {record.anamnesis.allergies && <p>Alergias: {record.anamnesis.allergies}</p>}
                {record.anamnesis.medications && <p>Medicamentos: {record.anamnesis.medications}</p>}
                {record.anamnesis.diseases && <p>Condições: {record.anamnesis.diseases}</p>}
                {!record.anamnesis.allergies &&
                  !record.anamnesis.medications &&
                  !record.anamnesis.diseases && (
                    <p className="text-muted-foreground">Anamnese registrada — abra o prontuário para detalhes.</p>
                  )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Anamnese não preenchida.</p>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Últimas evoluções
            </p>
            {record.evolutions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhuma evolução registrada.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {record.evolutions.slice(0, 3).map((evolution) => (
                  <li key={evolution.id} className="text-sm">
                    <p className="font-medium">{evolution.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(evolution.occurredAt)}
                      {evolution.teeth.length ? ` · dente ${evolution.teeth.join(", ")}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
