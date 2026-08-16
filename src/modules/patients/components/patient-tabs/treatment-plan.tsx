"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FilePlus2, Printer, Smile } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { listTreatmentPlansAction } from "@/modules/treatment-plans/actions/treatment-plan.actions";
import type { TreatmentPlanDTO, TreatmentPlanItemDTO } from "@/modules/treatment-plans/dto/treatment-plan.dto";
import { formatToothRefs } from "@/modules/odontogram/utils/tooth-surfaces";
import type { PatientClientDTO } from "../../dto/patient.dto";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function itemValue(item: TreatmentPlanItemDTO) {
  return Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1);
}

function groupOf(status: TreatmentPlanItemDTO["status"]) {
  if (status === "COMPLETED") return "REALIZADO";
  if (status === "IN_PROGRESS" || status === "SCHEDULED") return "EM ANDAMENTO";
  if (status === "CANCELLED") return "CANCELADO";
  return "PENDENTE";
}

function groupClass(group: string) {
  if (group === "REALIZADO") return "text-success";
  if (group === "EM ANDAMENTO") return "text-primary";
  if (group === "CANCELADO") return "text-muted-foreground";
  return "text-warning";
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
  const totals = useMemo(() => {
    const items = active?.items ?? [];
    const open = items.filter((item) => item.status !== "CANCELLED");
    const done = open.filter((item) => item.status === "COMPLETED");
    const running = open.filter((item) => item.status === "IN_PROGRESS" || item.status === "SCHEDULED");
    const pending = open.filter((item) => item.status === "PLANNED");
    return {
      total: open.reduce((sum, item) => sum + itemValue(item), 0),
      done: done.reduce((sum, item) => sum + itemValue(item), 0),
      running: running.reduce((sum, item) => sum + itemValue(item), 0),
      pending: pending.reduce((sum, item) => sum + itemValue(item), 0),
    };
  }, [active]);

  const grouped = useMemo(() => {
    const map = new Map<string, TreatmentPlanItemDTO[]>();
    for (const item of active?.items ?? []) {
      const key = groupOf(item.status);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return ["REALIZADO", "EM ANDAMENTO", "PENDENTE", "CANCELADO"]
      .filter((key) => map.has(key))
      .map((key) => [key, map.get(key)!] as const);
  }, [active]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando planos...</p>;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-lg font-semibold">Plano de tratamento</p>
            <p className="text-sm text-muted-foreground">Procedimentos, situação e valores do plano ativo.</p>
          </div>
          <div className="flex gap-2">
            {canManage ? (
              <Button asChild size="sm" variant="outline" className="rounded-lg">
                <Link href={`/app/treatment-plans?patientId=${patient.id}`}>
                  <FilePlus2 className="size-3.5" />
                  Novo procedimento
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline" className="rounded-lg">
              <Link href={`/app/treatment-plans?patientId=${patient.id}`}>
                <Printer className="size-3.5" />
                Imprimir plano
              </Link>
            </Button>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-4">
          <Metric label="Total do plano" value={money.format(totals.total)} className="text-primary" />
          <Metric label="Já realizado" value={money.format(totals.done)} className="text-success" />
          <Metric label="Em andamento" value={money.format(totals.running)} className="text-primary" />
          <Metric label="Pendente" value={money.format(totals.pending)} className="text-warning" />
        </section>

        {!active ? (
          <div className="surface-card p-6 text-sm text-muted-foreground">
            Nenhum plano de tratamento registrado.
          </div>
        ) : (
          <div className="surface-card divide-y divide-border">
            {grouped.map(([group, items]) => (
              <div key={group} className="p-4">
                <p className={`mb-3 text-xs font-semibold tracking-[0.12em] ${groupClass(group)}`}>
                  {group}
                </p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.teeth.length ? formatToothRefs(item.teeth) : "Região não informada"}
                          {item.professionalName ? ` · ${item.professionalName}` : ""}
                        </p>
                      </div>
                      <p className="shrink-0 font-medium">
                        {item.unitPrice ? money.format(itemValue(item)) : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="surface-card p-4">
          <div className="flex items-center gap-2">
            <Smile className="size-4 text-primary" />
            <p className="font-medium">Odontograma</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Visualize dentes e procedimentos clínicos deste paciente.
          </p>
          <Button asChild className="mt-4 w-full rounded-lg">
            <Link href={`/app/patients/${patient.id}?tab=odontograma`}>Visualizar odontograma completo</Link>
          </Button>
        </div>
        {active ? (
          <div className="surface-card p-4 text-sm">
            <p className="font-medium">Resumo do plano</p>
            <dl className="mt-3 space-y-2">
              <Row label="Procedimentos" value={String(active.summary.total)} />
              <Row label="Realizados" value={String(active.summary.completed)} />
              <Row label="Em andamento" value={String(active.summary.inProgress)} />
              <Row label="Pendentes" value={String(active.summary.planned)} />
              <Row label="Total do plano" value={money.format(totals.total)} />
            </dl>
          </div>
        ) : null}
        <div className="surface-card p-4">
          <p className="font-medium">Observações do tratamento</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {active?.notes?.trim() || "Nenhuma observação registrada neste plano."}
          </p>
        </div>
      </aside>
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className="surface-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${className}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
