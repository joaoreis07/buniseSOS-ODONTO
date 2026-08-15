"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList, FilePlus2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { listTreatmentPlansAction } from "@/modules/treatment-plans/actions/treatment-plan.actions";
import type { TreatmentPlanDTO } from "@/modules/treatment-plans/dto/treatment-plan.dto";
import { formatToothRefs } from "@/modules/odontogram/utils/tooth-surfaces";
import type { PatientClientDTO } from "../../dto/patient.dto";

function planStatusLabel(status: TreatmentPlanDTO["status"]) {
  return ({ ACTIVE: "Ativo", COMPLETED: "Concluído", CANCELLED: "Cancelado" })[status];
}

export function PatientTreatmentPlanTab({
  patient,
  canManage,
}: {
  patient: PatientClientDTO;
  canManage: boolean;
}) {
  const [plans, setPlans] = useState<TreatmentPlanDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listTreatmentPlansAction({ patientId: patient.id }).then((result) => {
      if (result.success) setPlans(result.data);
      setLoading(false);
    });
  }, [patient.id]);

  const active = plans.find((plan) => plan.status === "ACTIVE") ?? plans[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Plano de Tratamento</p>
          <p className="text-sm text-muted-foreground">Planejamento clínico e progresso.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-lg">
            <Link href={`/app/treatment-plans?patientId=${patient.id}`}>
              <ClipboardList className="mr-1 size-3.5" />
              Abrir plano
            </Link>
          </Button>
          {canManage && (
            <Button asChild size="sm" className="rounded-lg">
              <Link href={`/app/treatment-plans?patientId=${patient.id}`}>
                <FilePlus2 className="mr-1 size-3.5" />
                Novo plano
              </Link>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando planos...</p>
      ) : !active ? (
        <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          Nenhum plano de tratamento registrado.
        </div>
      ) : (
        <>
          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{active.title}</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{planStatusLabel(active.status)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {active.code} · {active.summary.progressPercent}% concluído
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-muted-foreground">Planejados</p>
                <p className="font-semibold">{active.summary.planned}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-muted-foreground">Em andamento</p>
                <p className="font-semibold">{active.summary.inProgress}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-muted-foreground">Concluídos</p>
                <p className="font-semibold">{active.summary.completed}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {active.items.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-lg border px-3 py-2 text-sm">
                <p className="font-medium">
                  {item.title}
                  {item.teeth.length ? ` · ${formatToothRefs(item.teeth)}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{item.status.replaceAll("_", " ").toLowerCase()}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
