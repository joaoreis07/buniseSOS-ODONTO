"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NotebookPen, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatToothRefs } from "@/modules/odontogram/utils/tooth-surfaces";
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
    setLoading(true);
    void getClinicalRecordAction({ patientId: patient.id }).then((result) => {
      if (result.success) setRecord(result.data);
      else setRecord(null);
      setLoading(false);
    });
  }, [patient.id]);

  const lastEvolution = record?.evolutions[0] ?? null;
  const recentProcedures = (record?.evolutions ?? []).filter((evolution) => evolution.procedure).slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Prontuário clínico</p>
          <p className="text-sm text-muted-foreground">Resumo, anamnese e histórico do atendimento.</p>
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
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : !record ? (
        <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          Não foi possível carregar o prontuário deste paciente.
        </div>
      ) : (
        <>
          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resumo clínico</p>
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
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Última evolução</p>
            {lastEvolution ? (
              <div className="mt-2 text-sm">
                <p className="font-medium">{lastEvolution.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(lastEvolution.occurredAt)}
                  {lastEvolution.professional ? ` · ${lastEvolution.professional.name}` : ""}
                  {lastEvolution.teeth.length ? ` · ${formatToothRefs(lastEvolution.teeth)}` : ""}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Nenhuma evolução registrada.</p>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Histórico recente</p>
            {record.timeline.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Ainda não há eventos clínicos.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {record.timeline.slice(0, 4).map((entry) => (
                  <li key={`${entry.kind}-${entry.id}`} className="text-sm">
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.occurredAt)}
                      {entry.subtitle ? ` · ${entry.subtitle}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {recentProcedures.length > 0 && (
            <div className="rounded-xl border p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Procedimentos recentes
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {recentProcedures.map((evolution) => (
                  <li key={evolution.id}>
                    {evolution.procedure?.name}
                    {evolution.teeth.length ? ` · ${formatToothRefs(evolution.teeth)}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
