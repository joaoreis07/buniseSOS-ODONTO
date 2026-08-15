"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NotebookPen } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { getClinicalRecordAction } from "@/modules/clinical-records/actions/clinical-record.actions";
import type { AnamnesisDTO } from "@/modules/clinical-records/dto/clinical-record.dto";
import type { PatientClientDTO } from "../../dto/patient.dto";

const FIELDS: [keyof AnamnesisDTO, string][] = [
  ["allergies", "Alergias"],
  ["medications", "Medicamentos"],
  ["diseases", "Doenças / condições"],
  ["surgeries", "Cirurgias"],
  ["medicalHistory", "Histórico médico"],
  ["dentalHistory", "Histórico odontológico"],
  ["smoking", "Tabagismo"],
  ["alcoholUse", "Álcool"],
  ["oralHygiene", "Higiene oral"],
  ["observations", "Observações"],
];

export function PatientAnamnesisTab({ patient }: { patient: PatientClientDTO }) {
  const [anamnesis, setAnamnesis] = useState<AnamnesisDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void getClinicalRecordAction({ patientId: patient.id }).then((result) => {
      setAnamnesis(result.success ? result.data.anamnesis : null);
      setLoading(false);
    });
  }, [patient.id]);

  if (loading) return <Skeleton className="h-48 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Anamnese</p>
          <p className="text-sm text-muted-foreground">Registro clínico opcional do paciente.</p>
        </div>
        <Button asChild size="sm" variant="outline" className="rounded-lg">
          <Link href={`/app/clinical-records?patientId=${patient.id}`}>
            <NotebookPen className="mr-1 size-3.5" />
            Abrir prontuário
          </Link>
        </Button>
      </div>
      {!anamnesis ? (
        <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          Anamnese ainda não preenchida. O preenchimento é opcional e não bloqueia os demais módulos.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map(([key, label]) => {
            const value = anamnesis[key];
            if (typeof value !== "string" || !value.trim()) return null;
            return (
              <div key={key} className="rounded-xl border border-border p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm">{value}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
