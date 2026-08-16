"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  CheckCircle2,
  Clock,
  FilePlus2,
  Printer,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { listTreatmentPlansAction } from "@/modules/treatment-plans/actions/treatment-plan.actions";
import type { TreatmentPlanDTO, TreatmentPlanItemDTO } from "@/modules/treatment-plans/dto/treatment-plan.dto";
import { formatToothRefs } from "@/modules/odontogram/utils/tooth-surfaces";
import type { PatientClientDTO } from "../../dto/patient.dto";
import { PatientOdontogramPreview } from "./odontogram-preview";

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

function statusPill(status: TreatmentPlanItemDTO["status"]) {
  if (status === "COMPLETED") return "status-success";
  if (status === "IN_PROGRESS" || status === "SCHEDULED") return "status-info";
  if (status === "CANCELLED") return "status-neutral";
  return "status-warning";
}

function statusText(status: TreatmentPlanItemDTO["status"]) {
  return (
    {
      COMPLETED: "Realizado",
      IN_PROGRESS: "Em andamento",
      SCHEDULED: "Agendado",
      CANCELLED: "Cancelado",
      PLANNED: "Pendente",
    } as Record<string, string>
  )[status] ?? status;
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
      <div className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
              Plano de tratamento
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Acompanhe todos os procedimentos do plano de tratamento.
            </p>
          </div>
          <div className="flex gap-2">
            {canManage ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/app/treatment-plans?patientId=${patient.id}`}>
                  <FilePlus2 className="size-3.5" />
                  Novo procedimento
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href={`/app/treatment-plans?patientId=${patient.id}`}>
                <Printer className="size-3.5" />
                Imprimir plano
              </Link>
            </Button>
          </div>
        </div>

        <section className="grid gap-3 border-b border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total do plano" value={money.format(totals.total)} tone="primary" icon={Wallet} />
          <Metric label="Já realizado" value={money.format(totals.done)} tone="success" icon={CheckCircle2} />
          <Metric label="Em andamento" value={money.format(totals.running)} tone="info" icon={Clock} />
          <Metric label="Pendente" value={money.format(totals.pending)} tone="warning" icon={Bookmark} />
        </section>

        {!active ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum plano de tratamento registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="surface-subtle text-left text-xs font-medium text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Procedimento</th>
                  <th className="px-3 py-2.5 font-medium">Dente/Região</th>
                  <th className="px-3 py-2.5 font-medium">Situação</th>
                  <th className="px-5 py-2.5 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(([group, items]) => (
                  <Fragment key={group}>
                    <tr>
                      <td colSpan={4} className="border-t border-border px-5 pb-1.5 pt-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${groupClass(group)}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {group}
                        </span>
                      </td>
                    </tr>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-border/60">
                        <td className="px-5 py-3">
                          <p className="font-medium text-foreground">{item.title}</p>
                          {item.professionalName ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.professionalName}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {item.teeth.length ? formatToothRefs(item.teeth) : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`status-pill ${statusPill(item.status)}`}>
                            {statusText(item.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-foreground">
                          {item.unitPrice ? money.format(itemValue(item)) : "—"}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <PatientOdontogramPreview patientId={patient.id} />
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

const METRIC_TONE = {
  primary: "bg-brand-50 text-primary",
  success: "bg-[var(--success-surface)] text-[var(--success-foreground)]",
  info: "bg-[var(--info-surface)] text-[var(--info-foreground)]",
  warning: "bg-[var(--warning-surface)] text-[var(--warning-foreground)]",
} as const;

const METRIC_VALUE_TONE = {
  primary: "text-primary",
  success: "text-[var(--success-foreground)]",
  info: "text-[var(--info-foreground)]",
  warning: "text-[var(--warning-foreground)]",
} as const;

function Metric({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: keyof typeof METRIC_TONE;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3.5">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${METRIC_TONE[tone]}`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-0.5 truncate text-[17px] font-semibold tracking-[-0.02em] ${METRIC_VALUE_TONE[tone]}`}>
          {value}
        </p>
      </div>
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
