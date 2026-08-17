"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  CheckCircle2,
  Clock,
  FilePlus2,
  Printer,
  Smile,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { listTreatmentPlansAction } from "@/modules/treatment-plans/actions/treatment-plan.actions";
import type { TreatmentPlanDTO, TreatmentPlanItemDTO } from "@/modules/treatment-plans/dto/treatment-plan.dto";
import { formatToothRefsCompact } from "@/modules/odontogram/utils/tooth-surfaces";
import { budgetStatusLabel, budgetStatusTone } from "@/modules/budgets/utils/budget-status";
import type { PatientClientDTO } from "../../dto/patient.dto";
import { PatientOdontogramPreview } from "./odontogram-preview";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR");

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

function planStatusPill(status: TreatmentPlanDTO["status"]) {
  if (status === "COMPLETED") return "status-success";
  if (status === "CANCELLED") return "status-neutral";
  return "status-info";
}

function planStatusText(status: TreatmentPlanDTO["status"]) {
  if (status === "COMPLETED") return "Realizado";
  if (status === "CANCELLED") return "Cancelado";
  return "Em andamento";
}

function itemDate(item: TreatmentPlanItemDTO) {
  const raw = item.completedAt ?? item.startedAt ?? item.scheduledAt;
  return raw ? dateFmt.format(new Date(raw)) : null;
}

export function PatientTreatmentPlanTab({
  patient,
  canManage,
}: {
  patient: PatientClientDTO;
  canManage: boolean;
}) {
  const [plans, setPlans] = useState<TreatmentPlanDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listTreatmentPlansAction({ patientId: patient.id }).then((result) => {
      if (result.success) {
        setPlans(result.data);
        const active = result.data.find((plan) => plan.status === "ACTIVE") ?? result.data[0];
        setSelectedId(active?.id ?? null);
      }
      setLoading(false);
    });
  }, [patient.id]);

  const active = plans.find((plan) => plan.id === selectedId) ?? plans[0];
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
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                Plano de tratamento
              </p>
              {active ? (
                <span className={`status-pill ${planStatusPill(active.status)}`}>
                  {planStatusText(active.status)}
                </span>
              ) : null}
            </div>
            {active ? (
              <>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {active.code} · {active.title}
                  {active.responsibleProfessional ? ` · ${active.responsibleProfessional.name}` : ""}
                  {` · ${dateFmt.format(new Date(active.createdAt))}`}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${active.summary.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                    {active.summary.completed}/{active.summary.total} · {active.summary.progressPercent}%
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Acompanhe procedimentos, dentes e progresso do plano.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {plans.length > 1 ? (
              <select
                className="h-8 rounded-lg border border-input bg-input-background px-2 text-sm"
                value={active?.id ?? ""}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.code} · {plan.title}
                  </option>
                ))}
              </select>
            ) : null}
            {canManage ? (
              <Button asChild size="sm">
                <Link href={`/app/treatment-plans?patientId=${patient.id}`}>
                  <FilePlus2 className="size-3.5" />
                  Novo procedimento
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href={`/app/patients/${patient.id}?tab=odontograma`}>
                <Smile className="size-3.5" />
                Odontograma
              </Link>
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="size-3.5" />
              Imprimir
            </Button>
          </div>
        </div>

        <section className="grid gap-2 border-b border-border px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total do plano" value={money.format(totals.total)} tone="neutral" icon={Wallet} />
          <Metric label="Já realizado" value={money.format(totals.done)} tone="success" icon={CheckCircle2} />
          <Metric label="Em andamento" value={money.format(totals.running)} tone="info" icon={Clock} />
          <Metric label="Pendente" value={money.format(totals.pending)} tone="warning" icon={Bookmark} />
        </section>

        {!active ? (
          <p className="p-5 text-sm text-muted-foreground">Nenhum plano de tratamento registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="surface-subtle text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Procedimento</th>
                  <th className="px-3 py-2 font-medium">Dente/Face</th>
                  <th className="px-3 py-2 font-medium">Situação</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(([group, items]) => (
                  <Fragment key={group}>
                    <tr>
                      <td colSpan={4} className="border-t border-border px-4 pb-1 pt-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${groupClass(group)}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {group}
                        </span>
                      </td>
                    </tr>
                    {items.map((item) => {
                      const when = itemDate(item);
                      return (
                        <tr key={item.id} className="border-t border-border/60">
                          <td className="px-4 py-2">
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {[item.code, item.professionalName, when].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {item.teeth.length ? formatToothRefsCompact(item.teeth) : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`status-pill ${statusPill(item.status)}`}>
                              {statusText(item.status)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-foreground">
                            {item.unitPrice ? money.format(itemValue(item)) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <PatientOdontogramPreview patientId={patient.id} variant="composer" />
        {active ? (
          <div className="surface-card p-3.5 text-sm">
            <p className="font-medium">Resumo do plano</p>
            <dl className="mt-2 space-y-1.5">
              <Row label="Procedimentos" value={String(active.summary.total)} />
              <Row label="Realizados" value={`${active.summary.completed} · ${money.format(totals.done)}`} />
              <Row label="Em andamento" value={`${active.summary.inProgress} · ${money.format(totals.running)}`} />
              <Row label="Pendentes" value={`${active.summary.planned} · ${money.format(totals.pending)}`} />
              <Row label="Progresso" value={`${active.summary.progressPercent}%`} />
              <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                <dt className="text-muted-foreground">Total do plano</dt>
                <dd className="text-base font-semibold tracking-[-0.02em] text-foreground">
                  {money.format(totals.total)}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
        {active?.budgets.length ? (
          <div className="surface-card p-3.5 text-sm">
            <p className="font-medium">Orçamentos vinculados</p>
            <ul className="mt-2 space-y-1.5">
              {active.budgets.map((budget) => (
                <li key={budget.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/app/patients/${patient.id}?tab=orcamentos&budgetId=${budget.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {budget.code}
                  </Link>
                  <span className={`status-pill ${budgetStatusTone(budget.status)}`}>
                    {budgetStatusLabel(budget.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="surface-card p-3.5">
          <p className="font-medium">Observações do tratamento</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {active?.notes?.trim() || "Nenhuma observação registrada neste plano."}
          </p>
        </div>
      </aside>
    </div>
  );
}

const METRIC_TONE = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-[var(--success-surface)] text-[var(--success-foreground)]",
  info: "bg-[var(--info-surface)] text-[var(--info-foreground)]",
  warning: "bg-[var(--warning-surface)] text-[var(--warning-foreground)]",
} as const;

const METRIC_VALUE_TONE = {
  neutral: "text-foreground",
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
    <div className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${METRIC_TONE[tone]}`}>
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`truncate text-[15px] font-semibold tracking-[-0.02em] ${METRIC_VALUE_TONE[tone]}`}>
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
