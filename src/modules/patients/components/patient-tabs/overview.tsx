"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "@/shared/components/section-card";
import { listBudgetsAction } from "@/modules/budgets/actions/budget.actions";
import type { BudgetDTO } from "@/modules/budgets/dto/budget.dto";
import { getFinanceDashboardAction } from "@/modules/finance/actions/finance.actions";
import { listTreatmentPlansAction } from "@/modules/treatment-plans/actions/treatment-plan.actions";
import type { TreatmentPlanDTO } from "@/modules/treatment-plans/dto/treatment-plan.dto";
import type { PatientAppointmentHistoryDTO, PatientClientDTO } from "../../dto/patient.dto";
import { MARITAL_LABELS, formatCep, formatCpf, formatPhone } from "../../utils/patient.utils";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const APPOINTMENT_STATUS: Record<PatientAppointmentHistoryDTO["status"], { label: string; tone: string }> = {
  SCHEDULED: { label: "Agendada", tone: "status-info" },
  CONFIRMED: { label: "Confirmada", tone: "status-success" },
  WAITING: { label: "Aguardando", tone: "status-warning" },
  IN_PROGRESS: { label: "Em atendimento", tone: "status-info" },
  COMPLETED: { label: "Concluída", tone: "status-success" },
  CANCELED: { label: "Cancelada", tone: "status-danger" },
  NO_SHOW: { label: "Não compareceu", tone: "status-neutral" },
};

const BUDGET_STATUS: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "Rascunho", tone: "status-neutral" },
  SENT: { label: "Pendente", tone: "status-warning" },
  APPROVED: { label: "Aprovado", tone: "status-success" },
  PARTIALLY_APPROVED: { label: "Parcial", tone: "status-warning" },
  REJECTED: { label: "Recusado", tone: "status-danger" },
  CANCELED: { label: "Cancelado", tone: "status-danger" },
  COMPLETED: { label: "Concluído", tone: "status-success" },
};

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(new Date(iso));
}

function formatMonth(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(iso)).replace(".", "").toUpperCase();
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function PatientOverviewTab({
  patient,
  appointments = [],
}: {
  patient: PatientClientDTO;
  appointments?: PatientAppointmentHistoryDTO[];
}) {
  const [plans, setPlans] = useState<TreatmentPlanDTO[]>([]);
  const [budgets, setBudgets] = useState<BudgetDTO[]>([]);
  const [openBalance, setOpenBalance] = useState<string | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const [nextDue, setNextDue] = useState<string | null>(null);

  useEffect(() => {
    void listTreatmentPlansAction({ patientId: patient.id }).then((result) => {
      if (result.success) setPlans(result.data);
    });
    void listBudgetsAction({ patientId: patient.id }).then((result) => {
      if (result.success) setBudgets(result.data);
    });
    void getFinanceDashboardAction({ patientId: patient.id }).then((result) => {
      if (!result.success) return;
      setOpenBalance(result.data.summary.balance);
      const open = result.data.receivables.flatMap((row) =>
        row.installments.filter((item) => item.balance !== "0.00" && item.status !== "CANCELLED"),
      );
      setOpenCount(open.length);
      setNextDue(result.data.summary.nextDue?.dueDate ?? null);
    });
  }, [patient.id]);

  const upcoming = useMemo(
    () =>
      appointments
        .filter((item) => new Date(item.startsAt).getTime() >= Date.now() && item.status !== "CANCELED")
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .slice(0, 3),
    [appointments],
  );

  const recent = useMemo(
    () =>
      appointments
        .filter((item) => item.status === "COMPLETED")
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
        .slice(0, 4),
    [appointments],
  );

  const ongoing = useMemo(() => {
    const active = plans.find((plan) => plan.status === "ACTIVE") ?? plans[0];
    return (active?.items ?? []).filter(
      (item) => item.status === "IN_PROGRESS" || item.status === "SCHEDULED",
    );
  }, [plans]);

  const timeline = useMemo(
    () =>
      [...appointments]
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
        .slice(0, 6),
    [appointments],
  );

  const address = [
    [patient.address, patient.number].filter(Boolean).join(", "),
    patient.district,
    [patient.city, patient.state].filter(Boolean).join("-"),
    formatCep(patient.zipCode),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.4fr)_minmax(260px,0.95fr)]">
        <div className="space-y-4">
          <SectionCard title="Dados do paciente">
            <dl className="space-y-0">
              <Row label="CPF" value={formatCpf(patient.cpf)} />
              <Row
                label="Estado civil"
                value={patient.maritalStatus ? MARITAL_LABELS[patient.maritalStatus] : null}
              />
              <Row label="Profissão" value={patient.profession} />
              <Row label="Convênio" value={patient.insurance || "Não possui"} />
              <Row label="Alergias" value={patient.allergies} />
              <Row label="Observações" value={patient.observations} />
            </dl>
          </SectionCard>
          <SectionCard title="Contato">
            <dl>
              <Row
                label="Telefone"
                value={patient.phone ? `${formatPhone(patient.phone)} · Principal` : null}
              />
              <Row label="WhatsApp" value={formatPhone(patient.whatsapp)} />
              <Row label="E-mail" value={patient.email} />
              <Row label="Endereço" value={address} />
            </dl>
          </SectionCard>
          <SectionCard title="Responsável financeiro">
            <dl>
              <Row label="Nome" value={patient.responsibleName || patient.fullName} />
              <Row
                label="Telefone"
                value={formatPhone(patient.responsiblePhone || patient.phone)}
              />
            </dl>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Próximas consultas">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma consulta futura vinculada.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-50 text-center">
                      <span className="text-base font-semibold leading-none text-primary">
                        {formatDay(item.startsAt)}
                      </span>
                      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                        {formatMonth(item.startsAt)}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-foreground">
                          {item.procedure || item.title || "Consulta odontológica"}
                        </p>
                        <span className={`status-pill ${APPOINTMENT_STATUS[item.status].tone}`}>
                          {APPOINTMENT_STATUS[item.status].label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatTime(item.startsAt)} · {item.professionalName}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Tratamentos em andamento">
            {ongoing.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum tratamento em andamento.</p>
            ) : (
              <ul className="space-y-4">
                {ongoing.map((item) => (
                  <li key={item.id}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <span className="status-pill status-info">
                        {item.status === "IN_PROGRESS" ? "Em andamento" : "Agendado"}
                      </span>
                    </div>
                    {item.professionalName ? (
                      <p className="mt-1 text-xs text-muted-foreground">{item.professionalName}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Últimos atendimentos" bodyPadding={false}>
            {recent.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">Nenhum atendimento concluído.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="surface-subtle text-left text-xs text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Data</th>
                    <th className="px-3 py-2.5 font-medium">Procedimento</th>
                    <th className="px-5 py-2.5 font-medium">Profissional</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-5 py-2.5 text-muted-foreground">
                        {new Intl.DateTimeFormat("pt-BR").format(new Date(item.startsAt))}
                      </td>
                      <td className="px-3 py-2.5 font-medium">
                        {item.procedure || item.title || "Consulta"}
                      </td>
                      <td className="px-5 py-2.5 text-muted-foreground">{item.professionalName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            title="Financeiro em aberto"
            footerHref={`/app/patients/${patient.id}?tab=financeiro`}
            footerLabel="Ver financeiro completo"
          >
            <p className="text-3xl font-semibold tracking-[-0.04em] text-success">
              {openBalance == null ? "—" : money.format(Number(openBalance))}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {openCount} parcela{openCount === 1 ? "" : "s"} em aberto
              {nextDue
                ? ` · próximo vencimento ${new Intl.DateTimeFormat("pt-BR").format(new Date(nextDue))}`
                : ""}
            </p>
          </SectionCard>

          <SectionCard
            title="Últimos orçamentos"
            footerHref={`/app/patients/${patient.id}?tab=orcamentos`}
            footerLabel="Ver orçamentos"
          >
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum orçamento registrado.</p>
            ) : (
              <ul className="space-y-3">
                {budgets.slice(0, 3).map((budget) => {
                  const status = BUDGET_STATUS[budget.status] ?? BUDGET_STATUS.DRAFT;
                  return (
                    <li key={budget.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{budget.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{budget.code}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`status-pill ${status.tone}`}>{status.label}</span>
                        <p className="mt-1 text-sm font-semibold">{money.format(Number(budget.total))}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Documentos"
            footerHref={`/app/patients/${patient.id}?tab=documentos`}
            footerLabel="Ver documentos"
          >
            <p className="text-sm text-muted-foreground">
              O upload de arquivos deste paciente será vinculado por ficha. Nenhum arquivo enviado ainda.
            </p>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Linha do tempo">
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há eventos registrados nesta ficha.</p>
        ) : (
          <ol className="space-y-4">
            {timeline.map((item, index) => (
              <li key={item.id} className="relative flex gap-3 pl-2">
                {index < timeline.length - 1 ? (
                  <span className="absolute left-[11px] top-6 bottom-[-16px] w-px bg-border" />
                ) : null}
                <span className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.procedure || item.title || "Consulta odontológica"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(item.startsAt))}
                    {` · ${item.professionalName}`}
                  </p>
                  {item.notes ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="max-w-[65%] text-right font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
