"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { listBudgetsAction } from "@/modules/budgets/actions/budget.actions";
import type { BudgetDTO } from "@/modules/budgets/dto/budget.dto";
import { getFinanceDashboardAction } from "@/modules/finance/actions/finance.actions";
import { formatToothRefs } from "@/modules/odontogram/utils/tooth-surfaces";
import { listTreatmentPlansAction } from "@/modules/treatment-plans/actions/treatment-plan.actions";
import type { TreatmentPlanDTO } from "@/modules/treatment-plans/dto/treatment-plan.dto";
import type { PatientAppointmentHistoryDTO, PatientClientDTO } from "../../dto/patient.dto";
import { MARITAL_LABELS, formatCep, formatCpf, formatPhone } from "../../utils/patient.utils";
import { PatientOdontogramPreview } from "./odontogram-preview";

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
    () => [...appointments].sort((a, b) => b.startsAt.localeCompare(a.startsAt)).slice(0, 6),
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
    <div className="grid gap-x-8 gap-y-6 xl:grid-cols-[minmax(220px,0.82fr)_minmax(0,1.18fr)]">
      <aside className="space-y-6">
        <Panel title="Dados do paciente">
          <dl>
            <Field label="CPF" value={formatCpf(patient.cpf)} />
            <Field
              label="Estado civil"
              value={patient.maritalStatus ? MARITAL_LABELS[patient.maritalStatus] : null}
            />
            <Field label="Profissão" value={patient.profession} />
            <Field label="Convênio" value={patient.insurance || "Não possui"} />
            <Field label="Alergias" value={patient.allergies} />
            <Field label="Observações" value={patient.observations} />
          </dl>
        </Panel>

        <Panel title="Contato">
          <dl>
            <Field
              label="Telefone"
              value={patient.phone ? `${formatPhone(patient.phone)} · Principal` : null}
            />
            <Field label="WhatsApp" value={formatPhone(patient.whatsapp)} />
            <Field label="E-mail" value={patient.email} />
            <Field label="Endereço" value={address} />
          </dl>
        </Panel>

        <Panel title="Responsável financeiro">
          <Link
            href={`/app/patients/${patient.id}?tab=financeiro`}
            className="flex items-center justify-between gap-3 py-1.5 text-sm transition hover:text-primary"
          >
            <span>
              <span className="block font-medium text-foreground">
                {patient.responsibleName || patient.fullName}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {formatPhone(patient.responsiblePhone || patient.phone) || "—"}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </Panel>
      </aside>

      <div className="space-y-6">
        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Panel
              title="Próximas consultas"
              action={
                <Link
                  href={`/app/patients/${patient.id}?tab=agenda`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver agenda
                </Link>
              }
            >
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma consulta futura vinculada.</p>
              ) : (
                <ul>
                  {upcoming.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
                      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-brand-50 text-center">
                        <span className="text-base font-semibold leading-none text-primary">
                          {formatDay(item.startsAt)}
                        </span>
                        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                          {formatMonth(item.startsAt)}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {item.procedure || item.title || "Consulta odontológica"}
                          </p>
                          <span className={`status-pill ${APPOINTMENT_STATUS[item.status].tone}`}>
                            {APPOINTMENT_STATUS[item.status].label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatTime(item.startsAt)} · {item.professionalName}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Tratamentos em andamento"
              action={
                <Link
                  href={`/app/patients/${patient.id}?tab=tratamentos`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver todos
                </Link>
              }
            >
              {ongoing.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum tratamento em andamento.</p>
              ) : (
                <ul>
                  {ongoing.map((item) => (
                    <li key={item.id} className="border-b border-border py-2.5 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <span className="status-pill status-info">
                          {item.status === "IN_PROGRESS" ? "Em andamento" : "Agendado"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.teeth.length ? formatToothRefs(item.teeth) : "—"}
                        {item.professionalName ? ` · ${item.professionalName}` : ""}
                        {item.startedAt
                          ? ` · início ${new Intl.DateTimeFormat("pt-BR").format(new Date(item.startedAt))}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Últimos atendimentos"
              action={
                <Link
                  href={`/app/patients/${patient.id}?tab=historico`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver todos
                </Link>
              }
            >
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum atendimento concluído.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                      <th className="pb-2 font-medium">Data</th>
                      <th className="pb-2 font-medium">Procedimento</th>
                      <th className="pb-2 font-medium">Profissional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="py-2 text-muted-foreground">
                          {new Intl.DateTimeFormat("pt-BR").format(new Date(item.startsAt))}
                        </td>
                        <td className="py-2 font-medium">
                          {item.procedure || item.title || "Consulta"}
                        </td>
                        <td className="py-2 text-muted-foreground">{item.professionalName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel
              title="Financeiro em aberto"
              action={
                <Link
                  href={`/app/patients/${patient.id}?tab=financeiro`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver financeiro completo
                </Link>
              }
            >
              <p className="text-[28px] font-semibold tracking-[-0.04em] text-success">
                {openBalance == null ? "—" : money.format(Number(openBalance))}
              </p>
              <div className="mt-2 space-y-0 text-sm">
                <div className="flex justify-between gap-3 border-b border-border py-2">
                  <span className="text-muted-foreground">Parcelas em aberto</span>
                  <span className="font-medium">{openCount}</span>
                </div>
                <div className="flex justify-between gap-3 py-2">
                  <span className="text-muted-foreground">Próximo vencimento</span>
                  <span className="font-medium">
                    {nextDue ? new Intl.DateTimeFormat("pt-BR").format(new Date(nextDue)) : "—"}
                  </span>
                </div>
              </div>
            </Panel>

            <Panel
              title="Últimos orçamentos"
              action={
                <Link
                  href={`/app/patients/${patient.id}?tab=orcamentos`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver orçamentos
                </Link>
              }
            >
              {budgets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum orçamento registrado.</p>
              ) : (
                <ul>
                  {budgets.slice(0, 3).map((budget) => {
                    const status = BUDGET_STATUS[budget.status] ?? BUDGET_STATUS.DRAFT;
                    return (
                      <li
                        key={budget.id}
                        className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{budget.code}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{budget.title}</p>
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
            </Panel>

            <Panel
              title="Documentos"
              action={
                <Link
                  href={`/app/patients/${patient.id}?tab=documentos`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver documentos
                </Link>
              }
            >
              <p className="text-sm text-muted-foreground">
                O upload de arquivos deste paciente será vinculado por ficha. Nenhum arquivo enviado ainda.
              </p>
            </Panel>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <PatientOdontogramPreview patientId={patient.id} framed={false} variant="composer" />
        </div>

        <Panel title="Linha do tempo">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há eventos registrados nesta ficha.</p>
          ) : (
            <ol className="space-y-0">
              {timeline.map((item, index) => (
                <li key={item.id} className="relative flex gap-3 py-2.5 pl-1">
                  {index < timeline.length - 1 ? (
                    <span className="absolute left-[7px] top-7 bottom-0 w-px bg-border" />
                  ) : null}
                  <span className="relative z-10 mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
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
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-border py-2 last:border-0">
      <dt className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
