"use client";

import Link from "next/link";
import { Smile } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { PatientClientDTO } from "../../dto/patient.dto";

export function PatientOdontogramTab({ patient }: { patient: PatientClientDTO }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-brand-50 p-2 text-brand-700"><Smile className="size-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Odontograma clínico</p>
          <p className="mt-1 text-sm text-muted-foreground">Visualize condições, procedimentos e evolução dos dentes de {patient.fullName}.</p>
        </div>
      </div>
      <Button asChild className="mt-4 w-full rounded-xl">
        <Link href={`/app/odontogram?patientId=${patient.id}`}>Abrir Odontograma</Link>
      </Button>
    </div>
  );
}
